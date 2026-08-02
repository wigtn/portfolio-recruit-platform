import { NextResponse } from "next/server";
import { ALL_POSTS } from "@/lib/seed/posts";
import { LLM_MODEL, completionParams, withTimeout } from "@/lib/demo/llm";
import { clientIp } from "@/lib/demo/anon";
import { createQuota } from "@/lib/demo/quota";
import { sseToText, TEXT_STREAM_HEADERS } from "@/lib/demo/sse";

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

/* 한도 값. 세는 방식은 lib/demo/quota가 갖고, 여기는 이 라우트의 값만
   정한다. 챗봇보다 좁은 건 글 하나에 한 번 누르는 일회성이라서다.
   값과 화면 표현은 docs/ai-rate-limits.md에 정리돼 있다. */
const PER_IP_MAX = 10;
const DAILY_MAX = 200;

const allow = createQuota(DAILY_MAX);

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
  const gate = allow(
    [{ key: `ip:${ip}`, max: PER_IP_MAX, why: "ip" }],
    Date.now(),
  );
  if (!gate.ok) {
    /* 챗봇(/api/chat)은 한도 초과 시 200 + fallback으로 대화를 잇지만, 여기는
       글 상세의 일회성 생성이라 429로 끊고 클라가 시드 초안 연출로 넘긴다.
       계약이 다른 건 두 기능의 UX가 달라서다(의도된 차이). */
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

  /* 첫 응답까지만 상한을 건다(withTimeout). 업스트림이 늘어지면 이 라우트가
     붙들리고 화면은 생성 중 표시만 띄운 채 멈춘다. */
  let upstream: Response;
  try {
    upstream = await withTimeout((signal) => fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      signal,
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
    }), 15000);
  } catch {
    // 시작조차 못 했으면 폴백 연출로. 데모가 멈추는 것보다 낫다
    return NextResponse.json({ fallback: true });
  }

  if (!upstream.ok || !upstream.body) {
    // 업스트림 장애도 데모를 멈추지 않는다 — 폴백 연출로
    return NextResponse.json({ fallback: true });
  }

  const stream = sseToText(upstream.body);

  return new Response(stream, { headers: TEXT_STREAM_HEADERS });
}
