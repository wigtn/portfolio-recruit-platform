import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadState, saveState } from "./overlay";
import { runAdminTool } from "./run";

class MemoryStorage implements Storage {
  private values = new Map<string, string>();

  get length() {
    return this.values.size;
  }

  clear() {
    this.values.clear();
  }

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  key(index: number) {
    return [...this.values.keys()][index] ?? null;
  }

  removeItem(key: string) {
    this.values.delete(key);
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}

describe("관리자 도구 게이트", () => {
  beforeEach(() => {
    vi.stubGlobal("window", {
      localStorage: new MemoryStorage(),
      dispatchEvent: vi.fn(),
    });
  });

  it("권한 정책에서 운영자 권한을 끄면 실제 작업을 거절한다", async () => {
    const state = loadState();
    state.policy = state.policy.map((row) =>
      row.id === "pl-7" ? { ...row, grants: ["no", "no", "no", "yes"] } : row,
    );
    saveState(state);

    const result = await runAdminTool({
      tool: "company.create",
      id: "co-denied",
      isAdmin: true,
      verified: false,
      idempotencyKey: "policy-denied",
      payload: { name: "거절 대상", industry: "IT", region: "서울" },
    });

    expect(result).toMatchObject({ ok: false, code: "PERMISSION_DENIED" });
    expect(loadState().companies.some((row) => row.id === "co-denied")).toBe(
      false,
    );
  });

  it("같은 멱등성 키를 재전송해도 상태와 감사 로그를 한 번만 변경한다", async () => {
    const request = {
      tool: "company.create",
      id: "co-once",
      isAdmin: true,
      verified: false,
      idempotencyKey: "create-company-once",
      payload: { name: "한 번만", industry: "플랫폼", region: "서울" },
    };

    const first = await runAdminTool(request);
    const second = await runAdminTool(request);
    const state = loadState();

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    expect(state.companies.filter((row) => row.id === "co-once")).toHaveLength(
      1,
    );
    expect(state.audit.filter((row) => row.target === "한 번만")).toHaveLength(
      1,
    );
  });
});
