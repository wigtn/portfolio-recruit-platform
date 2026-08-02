/**
 * 거절의 성격이 색으로 옳게 나가는가.
 *
 * 막혔다고 다 실패는 아니다. "본인 확인이 필요해요"를 빨강으로 띄우면
 * 뭔가 고장 난 것으로 읽히고, 진짜 고장과 구분이 사라진다.
 */

import { describe, expect, it } from "vitest";
import { toneOf, type ToolResult } from "./run";

const denied = (code: string): ToolResult => ({
  ok: false,
  code,
  message: "…",
});

describe("게이트 거절의 톤", () => {
  it("성공은 완료다", () => {
    expect(
      toneOf({ ok: true, message: "처리했어요", state: {} as never }),
    ).toBe("success");
  });

  it("사람이 이어서 할 일이면 주의다", () => {
    for (const code of [
      "STEP_UP_REQUIRED",
      "PERMISSION_DENIED",
      "ACTIVE_SESSION_REQUIRED",
      "INPUT_INVALID",
    ]) {
      expect(toneOf(denied(code))).toBe("warn");
    }
  });

  it("우리 쪽 고장이면 실패다", () => {
    for (const code of ["IDEMPOTENCY_KEY_REQUIRED", "TOOL_NOT_FOUND"]) {
      expect(toneOf(denied(code))).toBe("error");
    }
  });

  it("모르는 코드는 실패로 본다", () => {
    /* 모르면 무겁게 다룬다 — 조용히 안내로 넘기면 새 실패가 눈에 안 띈다 */
    expect(toneOf(denied("SOMETHING_NEW"))).toBe("error");
  });
});
