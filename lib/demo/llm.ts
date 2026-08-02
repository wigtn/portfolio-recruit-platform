/**
 * LLM 호출 공통 설정. 세 경로(챗봇 툴 판단·답변, AI 참고 답변)가 나눠 쓴다.
 *
 * 모델과 파라미터를 한곳에 모은 이유는 신모델의 파라미터 규칙이 구세대와
 * 다르기 때문이다. gpt-5.6-luna는 GPT-5.6 reasoning 계열이라 예전 챗 파라미터를
 * 그대로 받지 않는다:
 *
 * - `max_tokens`가 아니라 `max_completion_tokens`로 답변 길이를 받는다.
 * - 임의 `temperature`(0, 0.4, 0.7 같은)를 거부하거나 무시한다. 그래서 아예
 *   보내지 않는다. 툴 판단의 결정성은 temperature가 아니라 tool_choice와
 *   parallel_tool_calls:false, 그리고 서버 재검문이 대신 잡는다.
 * - `reasoning_effort`로 추론 지연을 다스린다. 이 챗봇은 첫 바이트 지연이
 *   곧 "멈춘 화면"이라 무추론(none)으로 둔다. Luna가 받는 값은 none, low,
 *   medium, high, xhigh다(minimal은 이 모델에서 400). 추론을 끄면 예전
 *   gpt-4o-mini의 즉답 감각을 유지하면서 모델만 더 똑똑해진다.
 *
 * 셋 중 하나라도 어기면 업스트림이 400을 낸다. 그러면 이 라우트들은 조용히
 * 폴백해서 스크립트만 돌고, 실LLM 경로가 죽은 걸 아무도 눈치채지 못한다.
 * 그래서 값을 흩뿌리지 않고 여기 한 줄에 묶는다.
 */
export const LLM_MODEL = "gpt-5.6-luna";

/** 답변 길이 상한을 신모델 규격(max_completion_tokens)으로 싼다 */
export function completionParams(maxTokens: number) {
  return {
    max_completion_tokens: maxTokens,
    reasoning_effort: "none" as const,
  };
}

/**
 * **첫 응답까지만** 기한을 건다.
 *
 * fetch는 헤더가 오면 resolve하므로 여기 타이머도 그때 풀린다. 본문
 * 스트림에는 상한이 걸리지 않아 긴 답변이 중간에 잘리지 않는다. 막고 싶은
 * 건 "시작조차 못 하는" 경우다 — 그건 답이 긴 게 아니라 고장이다.
 *
 * 두 라우트가 각자 들고 있었다(챗봇은 헬퍼로, AI 답변은 인라인으로). 같은
 * 판단을 두 모양으로 적어 두면 한쪽만 고치게 된다.
 */
export async function withTimeout(
  run: (signal: AbortSignal) => Promise<Response>,
  ms: number,
): Promise<Response> {
  const guard = new AbortController();
  const timer = setTimeout(() => guard.abort(), ms);
  try {
    return await run(guard.signal);
  } finally {
    clearTimeout(timer);
  }
}
