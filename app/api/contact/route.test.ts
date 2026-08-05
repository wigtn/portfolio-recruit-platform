import { describe, expect, it, vi } from "vitest";
import { POST } from "./route";

describe("데모 문의 API 안전장치", () => {
  it("외부 발송 없이 410으로 안내한다", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = POST();

    expect(response.status).toBe(410);
    expect(await response.json()).toMatchObject({ ok: false });
    expect(fetchMock).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});
