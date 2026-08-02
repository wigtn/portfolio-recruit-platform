/**
 * SSE 파서 계약.
 *
 * 여기서 지키는 건 하나다 — **청크 경계에서 글자를 흘리지 않는다.**
 * 네트워크 청크는 SSE 프레임과 무관하게 잘려 오는데, 걸친 줄을 버리면
 * 그 프레임이 싣고 있던 글자가 통째로 사라진다. 실제로 답변이
 * "전시회와드콜 모두 장단점이요"처럼 음절이 빠진 채 나왔다.
 */

import { describe, expect, it } from "vitest";
import { sseToText } from "./sse";

const frame = (text: string) =>
  `data: ${JSON.stringify({ choices: [{ delta: { content: text } }] })}\n\n`;

/** 주어진 청크들을 그대로 흘려보내는 업스트림 흉내 */
function upstream(chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  let at = 0;
  return new ReadableStream<Uint8Array>({
    pull(controller) {
      if (at >= chunks.length) {
        controller.close();
        return;
      }
      controller.enqueue(encoder.encode(chunks[at++]));
    },
  });
}

async function collect(stream: ReadableStream<Uint8Array>): Promise<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let out = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    out += decoder.decode(value, { stream: true });
  }
  return out;
}

describe("SSE를 평문으로", () => {
  it("프레임을 이어 붙인다", async () => {
    const text = await collect(
      sseToText(upstream([frame("안녕"), frame("하세요")])),
    );
    expect(text).toBe("안녕하세요");
  });

  it("한 줄이 두 청크에 걸쳐도 글자를 흘리지 않는다", async () => {
    /* 이 파서가 존재하는 이유. 프레임 한 줄을 아무 데서나 자른다 */
    const whole = frame("전시회와 콜드콜 모두 장단점이 있어요");
    const cut = Math.floor(whole.length / 2);
    const text = await collect(
      sseToText(upstream([whole.slice(0, cut), whole.slice(cut)])),
    );
    expect(text).toBe("전시회와 콜드콜 모두 장단점이 있어요");
  });

  it("한 글자씩 쪼개 보내도 온전하다", async () => {
    const whole = frame("가나다라") + frame("마바사");
    const text = await collect(sseToText(upstream([...whole])));
    expect(text).toBe("가나다라마바사");
  });

  it("[DONE]과 빈 줄은 흘린다", async () => {
    const text = await collect(
      sseToText(upstream([frame("끝"), "data: [DONE]\n\n", "\n"])),
    );
    expect(text).toBe("끝");
  });

  it("모르는 프레임은 건너뛰고 나머지를 살린다", async () => {
    const text = await collect(
      sseToText(upstream(["data: {망가진JSON\n\n", frame("살아남음")])),
    );
    expect(text).toBe("살아남음");
  });

  it("마지막 줄이 개행 없이 끝나도 처리한다", async () => {
    const whole = frame("마지막").trimEnd();
    expect(await collect(sseToText(upstream([whole])))).toBe("마지막");
  });
});
