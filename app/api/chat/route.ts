import { NextResponse } from "next/server";
import { INTENTS } from "@/lib/demo/chat";

/**
 * 상담 챗봇. OpenAI 프록시. `app/api/ai-answer/route.ts`와 같은 계약이다.
 *
 * 키(WIGTN_OPENAI_API_KEY)가 없거나 한도를 넘으면 { fallback: true }를 돌려주고,
 * 클라이언트는 스크립트 답변(lib/demo/chat.ts)으로 대신 답한다. 키 없이도 완결.
 *
 * 답변 범위를 프롬프트로 좁힌다. 영업용 챗봇이 지어낸 견적·기간은 상담 자리에서
 * 뒤집히고, 그게 첫 신뢰 손실이다. 그래서 아는 것만 말하고 나머지는 사람에게 넘기라고
 * 지시한다. 스크립트 지식을 그대로 컨텍스트로 넣는 이유다.
 */
export const runtime = "nodejs";

const PER_IP_WINDOW_MS = 60 * 60 * 1000;
const PER_IP_MAX = 20;
const DAILY_MAX = 300;
/** 대화 맥락은 최근 것만. 길어질수록 토큰이 선형으로 는다 */
const MAX_TURNS = 6;
const MAX_CHARS = 500;

const ipHits = new Map<string, number[]>();
let daily = { day: "", count: 0 };

function allow(ip: string, now: number) {
  const today = new Date(now).toISOString().slice(0, 10);
  if (daily.day !== today) daily = { day: today, count: 0 };
  if (daily.count >= DAILY_MAX) return { ok: false as const, why: "daily" };

  const hits = (ipHits.get(ip) ?? []).filter(
    (at) => now - at < PER_IP_WINDOW_MS,
  );
  if (hits.length >= PER_IP_MAX) return { ok: false as const, why: "ip" };

  hits.push(now);
  ipHits.set(ip, hits);
  daily.count += 1;
  if (ipHits.size > 2000) {
    for (const [key, list] of ipHits) {
      if (list.every((at) => now - at >= PER_IP_WINDOW_MS)) ipHits.delete(key);
    }
  }
  return { ok: true as const };
}

/** 스크립트 지식을 그대로 컨텍스트로. 모델이 새 숫자를 만들지 못하게 */
const KNOWLEDGE = INTENTS.map(
  (intent) => `[${intent.id}]\n${intent.answer}`,
).join("\n\n");

const SYSTEM =
  "당신은 웹 구축·백오피스·AI 기능을 수주하는 개발팀의 상담 담당자입니다.\n" +
  "말투는 '~해요'체, 3~5문장. 마크다운 헤딩·표는 쓰지 말고 문단과 '· ' 목록만 씁니다.\n\n" +
  "규칙:\n" +
  "1. 아래 자료에 있는 내용만 답하세요. 자료에 없는 견적·기간·기술 사실은 " +
  "절대 만들지 말고, '확실히 답하기 어려워 담당자에게 넘기겠다'고 말하세요.\n" +
  "2. 구체적인 금액은 어떤 경우에도 말하지 마세요. 견적은 요구사항 확인 후 상담에서 드린다고 안내합니다.\n" +
  "   기간은 자료의 범위와 조건을 그대로 유지하세요.\n" +
  "3. 계약·법률 판단, 타사 비교 폄하, 인력 개인정보는 답하지 않습니다.\n" +
  "4. 마지막에 억지로 상담을 권하지 마세요. 상담이 실제로 다음 단계일 때만 권합니다.\n\n" +
  `자료:\n${KNOWLEDGE}`;

type Turn = { role: "user" | "assistant"; content: string };

export async function POST(request: Request) {
  let turns: Turn[] = [];
  try {
    const body = (await request.json()) as { turns?: unknown };
    if (Array.isArray(body.turns)) {
      turns = body.turns
        .filter(
          (turn): turn is Turn =>
            !!turn &&
            typeof (turn as Turn).content === "string" &&
            ((turn as Turn).role === "user" ||
              (turn as Turn).role === "assistant"),
        )
        .slice(-MAX_TURNS)
        .map((turn) => ({
          role: turn.role,
          content: turn.content.slice(0, MAX_CHARS),
        }));
    }
  } catch {
    /* 아래에서 400 */
  }

  if (turns.length === 0 || turns[turns.length - 1].role !== "user") {
    return NextResponse.json(
      { ok: false, error: "질문을 읽지 못했어요." },
      { status: 400 },
    );
  }

  const key = process.env.WIGTN_OPENAI_API_KEY;
  // 정직한 폴백 신호. 성공으로 위장하지 않는다
  if (!key) return NextResponse.json({ fallback: true });

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const gate = allow(ip, Date.now());
  if (!gate.ok) {
    return NextResponse.json({
      fallback: true,
      rateLimited: true,
      why: gate.why,
    });
  }

  let upstream: Response;
  try {
    upstream = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        authorization: `Bearer ${key}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        stream: true,
        temperature: 0.4,
        max_tokens: 320,
        messages: [{ role: "system", content: SYSTEM }, ...turns],
      }),
    });
  } catch {
    return NextResponse.json({ fallback: true });
  }

  // 업스트림 장애도 대화를 멈추지 않는다. 스크립트 답변으로
  if (!upstream.ok || !upstream.body) {
    return NextResponse.json({ fallback: true });
  }

  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  const reader = upstream.body.getReader();

  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      const { done, value } = await reader.read();
      if (done) {
        controller.close();
        return;
      }
      for (const line of decoder.decode(value, { stream: true }).split("\n")) {
        const data = line.trim();
        if (!data.startsWith("data:")) continue;
        const payload = data.slice(5).trim();
        if (payload === "[DONE]") continue;
        try {
          const delta = (
            JSON.parse(payload) as {
              choices?: Array<{ delta?: { content?: string } }>;
            }
          ).choices?.[0]?.delta?.content;
          if (delta) controller.enqueue(encoder.encode(delta));
        } catch {
          /* 파편 프레임은 건너뛴다 */
        }
      }
    },
    cancel() {
      void reader.cancel();
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store",
      "x-ai-source": "openai",
    },
  });
}
