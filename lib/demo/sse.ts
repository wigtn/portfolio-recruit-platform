/**
 * OpenAI SSE 스트림을 평문 텍스트 스트림으로 바꾼다.
 *
 * 챗봇(`/api/chat`)과 AI 참고 답변(`/api/ai-answer`)이 같은 일을 한다.
 * 원래는 각 라우트가 한 벌씩 들고 있었는데, 문자 단위로 비교해 보니
 * **차이가 쉼표 하나뿐**이었다(주석까지 같았다).
 *
 * 그게 왜 문제인가: 이 코드에는 한 번 데인 자국이 있다. 네트워크 청크는
 * SSE 프레임 경계와 무관하게 잘려 오는데, 한 줄이 두 청크에 걸치면 앞
 * 조각은 JSON으로 파싱되지 않는다. 그걸 버리면 그 프레임이 싣고 있던
 * 글자가 통째로 사라져서, 답변이 "전시회와드콜 모두 장단점이요"처럼
 * 음절이 빠진 채로 나왔다. 고칠 때 두 곳을 다 고쳤으니 망정이지, 한쪽을
 * 잊었으면 그 화면만 지금도 글자를 흘리고 있었을 것이다.
 *
 * 같은 버그가 두 번 날 자리를 하나로 줄인다.
 */

/** 완성되지 않은 마지막 줄은 버퍼에 남겨 다음 청크와 이어 붙인다 */
export function sseToText(body: ReadableStream<Uint8Array>): ReadableStream<Uint8Array> {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  const reader = body.getReader();
  let buffer = "";

  /** 내보냈으면 true. pull이 이번 차례에 할 일을 했는지 판단하는 근거다 */
  const emit = (
    line: string,
    controller: ReadableStreamDefaultController<Uint8Array>,
  ): boolean => {
    const data = line.trim();
    if (!data.startsWith("data:")) return false;
    const payload = data.slice(5).trim();
    if (!payload || payload === "[DONE]") return false;
    try {
      const delta = (
        JSON.parse(payload) as {
          choices?: Array<{ delta?: { content?: string } }>;
        }
      ).choices?.[0]?.delta?.content;
      if (!delta) return false;
      controller.enqueue(encoder.encode(delta));
      return true;
    } catch {
      /* 완성된 줄인데도 파싱이 안 되면 우리가 모르는 프레임이다. 건너뛴다 */
      return false;
    }
  };

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      /* **무언가 내보낼 때까지 계속 읽는다.**

         한 번만 읽고 나오면 안 된다. 청크가 완성된 줄을 하나도 안 담고
         있으면(프레임이 경계에 걸린 순간) 이 pull은 아무것도 큐에 넣지
         못하는데, Web Streams는 그 경우 **pull을 다시 부르지 않는다** —
         읽기 요청이 영원히 기다린다. 실측으로 확인했다: pull이 정확히
         한 번 불리고 스트림이 통째로 멈춘다.

         원래 이 코드는 "걸친 줄을 버퍼에 남긴다"까지만 고쳐 두고(그래서
         글자는 안 흘렸다) 그 뒤에 멈춘다는 것은 못 봤다. 버퍼에 남기는
         것과 다시 읽으러 가는 것은 다른 일이다. */
      for (;;) {
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
        let sent = false;
        for (const line of lines) {
          if (emit(line, controller)) sent = true;
        }
        if (sent) return;
      }
    },
    cancel() {
      void reader.cancel();
    },
  });
}

/** 두 라우트가 같은 헤더로 답한다. x-ai-source는 클라가 실호출 여부를 가리는 표식 */
export const TEXT_STREAM_HEADERS = {
  "content-type": "text/plain; charset=utf-8",
  "cache-control": "no-store",
  "x-ai-source": "openai",
} as const;
