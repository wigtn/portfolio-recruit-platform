import { NextResponse } from "next/server";
import { ALL_POSTS } from "@/lib/seed/posts";
import { LLM_MODEL, completionParams } from "@/lib/demo/llm";
import { clientIp } from "@/lib/demo/anon";

/**
 * AI 참고 답변 실생성 — OpenAI 스트리밍 프록시.
 *
 * 키(WIGTN_OPENAI_API_KEY)가 없으면 { fallback: true }를 돌려주고,
 * 클라이언트는 시드 초안 연출로 대신 재생한다 — 데모는 키 없이도 완결.
 *
 * 호출 제한(실비용 보호)은 두 겹:
 * - IP당 시간당 상한 — 한 방문자가 데모를 봇으로 돌리는 것 방지
 * - 전체 일일 상한 — 데모가 공유 링크로 퍼졌을 때의 총액 방어
 * 저장소는 프로세스 메모리다. 서버리스 다중 인스턴스에서는 인스턴스별로
 * 따로 세지만, 상한이 보수적이라 총액 방어 목적에는 충분하다(주석 계약).
 *
 * 위험 표현 원문 포함을 프롬프트로 강제한다 — 클라이언트의 안전 재검사
 * 파이프라인(감지→취소선→치환)이 실생성 텍스트에서도 잡을 게 있어야 한다.
 */
export const runtime = "nodejs";

const PER_IP_WINDOW_MS = 60 * 60 * 1000;
const PER_IP_MAX = 10;
const DAILY_MAX = 200;

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
  // 메모리 누수 방지 — 오래된 IP 엔트리는 접근 시점에 걷어낸다
  if (ipHits.size > 2000) {
    for (const [key, list] of ipHits) {
      if (list.every((at) => now - at >= PER_IP_WINDOW_MS)) ipHits.delete(key);
    }
  }
  return { ok: true as const };
}

export async function POST(request: Request) {
  let postId = "";
  try {
    const body = (await request.json()) as { postId?: unknown };
    if (typeof body.postId === "string") postId = body.postId;
  } catch {
    /* 아래에서 400 */
  }
  const post = ALL_POSTS.find((item) => item.id === postId);
  if (!post) {
    return NextResponse.json(
      { ok: false, error: "글을 찾을 수 없어요." },
      { status: 400 },
    );
  }

  const key = process.env.WIGTN_OPENAI_API_KEY;
  if (!key) {
    // 정직한 폴백 신호 — 성공으로 위장하지 않는다
    return NextResponse.json({ fallback: true });
  }

  /* IP는 신뢰할 수 있는 첫 홉만 본다(clientIp). 챗봇과 달리 세션 쿠키 축은
     붙이지 않는다 — 여기 상한(시간당 10, 하루 200)이 이미 더 보수적이라
     한 축으로 충분하다. 쿠키 발급 부수효과 없이 단순하게 둔다. */
  const ip = clientIp(request);
  const gate = allow(ip, Date.now());
  if (!gate.ok) {
    return NextResponse.json(
      {
        ok: false,
        rateLimited: true,
        error:
          gate.why === "ip"
            ? "실호출 한도(시간당)에 도달했어요, 예시 재생으로 이어가요."
            : "오늘의 데모 생성 총량을 다 썼어요, 예시 재생으로 이어가요.",
      },
      { status: 429 },
    );
  }

  // 위험 표현을 원문 그대로 포함시키라고 지시한다 — 안전 파이프라인의 재료
  const mustInclude = post.guarded.map((term) => `"${term.raw}"`).join(", ");

  /* 첫 응답까지만 상한을 건다. 업스트림이 늘어지면 이 라우트가 붙들리고
     화면은 생성 중 표시만 띄운 채 멈춘다. fetch는 헤더가 오면 resolve하므로
     본문 스트림은 이 상한에 걸리지 않는다. */
  const guard = new AbortController();
  const guardTimer = setTimeout(() => guard.abort(), 15000);
  let upstream: Response;
  try {
    upstream = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      signal: guard.signal,
      headers: {
        authorization: `Bearer ${key}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: LLM_MODEL,
        stream: true,
        ...completionParams(240),
        prompt_cache_key: "wigtn-ai-answer",
        messages: [
          {
            role: "system",
            content:
              "당신은 한국 영업직 커뮤니티의 AI 참고 답변입니다. 질문에 3~4문장, '~해요'체로 실무적으로 답하세요. 마크다운, 목록 없이 문단 하나로만." +
              (mustInclude
                ? ` 답변 안에 다음 표현을 반드시 원문 그대로 자연스럽게 한 번씩 포함하세요: ${mustInclude}.`
                : ""),
          },
          {
            role: "user",
            content: `제목: ${post.title}\n\n본문: ${post.body}`,
          },
        ],
      }),
    });
  } catch {
    // 시작조차 못 했으면 폴백 연출로. 데모가 멈추는 것보다 낫다
    return NextResponse.json({ fallback: true });
  } finally {
    clearTimeout(guardTimer);
  }

  if (!upstream.ok || !upstream.body) {
    // 업스트림 장애도 데모를 멈추지 않는다 — 폴백 연출로
    return NextResponse.json({ fallback: true });
  }

  /* OpenAI SSE → 순수 텍스트 스트림 재방출.

     네트워크 청크는 SSE 프레임 경계와 무관하게 잘려서 온다. 한 줄이 두 청크에
     걸치면 앞 조각은 JSON으로 파싱되지 않는다. 그걸 그냥 버리면 그 프레임이
     싣고 있던 글자가 통째로 사라져, 답변이 "전시회와드콜 모두 장단점이요"처럼
     음절이 빠진 채로 나온다.

     그래서 완성되지 않은 마지막 줄은 버퍼에 남겨 다음 청크와 이어 붙인다.
     스트림이 끝나면 버퍼에 남은 것을 마지막으로 한 번 더 처리한다. */
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  const reader = upstream.body.getReader();
  let buffer = "";

  const emit = (line: string, controller: ReadableStreamDefaultController<Uint8Array>) => {
    const data = line.trim();
    if (!data.startsWith("data:")) return;
    const payload = data.slice(5).trim();
    if (!payload || payload === "[DONE]") return;
    try {
      const delta = (
        JSON.parse(payload) as {
          choices?: Array<{ delta?: { content?: string } }>;
        }
      ).choices?.[0]?.delta?.content;
      if (delta) controller.enqueue(encoder.encode(delta));
    } catch {
      /* 완성된 줄인데도 파싱이 안 되면 우리가 모르는 프레임이다. 건너뛴다 */
    }
  };

  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      const { done, value } = await reader.read();
      if (done) {
        // 마지막 청크가 개행으로 끝나지 않았다면 아직 버퍼에 한 줄이 남아 있다
        buffer += decoder.decode();
        if (buffer.trim()) emit(buffer, controller);
        buffer = "";
        controller.close();
        return;
      }
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      // 마지막 조각은 아직 줄이 안 끝났을 수 있으니 다음 청크까지 들고 간다
      buffer = lines.pop() ?? "";
      for (const line of lines) emit(line, controller);
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
