/**
 * 역할 기반 도구 노출 계약.
 *
 * 게스트에게는 회원 전용 도구를 아예 보여주지 않는다. 토큰을 덜고, 화면 글이
 * 꾀어도 목록에 없는 도구는 부를 수 없게 해 인젝션 표면을 줄인다. 이 필터가
 * 조용히 느슨해지면 게스트에게도 글쓰기 도구가 노출된다.
 */

import { describe, expect, it } from "vitest";
import { CHAT_TOOLS, TOOL_SPECS, toolsForRole, normalizeRole } from "./chat-tools";

const names = (tools: typeof CHAT_TOOLS) => tools.map((t) => t.function.name);

/** needsRole가 걸린 도구들 = 게스트에게 보이면 안 되는 것들 */
const MEMBER_ONLY = Object.entries(TOOL_SPECS)
  .filter(([, spec]) => spec.needsRole)
  .map(([name]) => name);

describe("역할 기반 도구 노출", () => {
  it("게스트에게는 회원 전용 도구를 노출하지 않는다", () => {
    const guest = names(toolsForRole("guest"));
    for (const name of MEMBER_ONLY) {
      expect(guest, `${name}이 게스트에게 노출됐다`).not.toContain(name);
    }
  });

  it("게스트도 무권한 도구와 역할 전환은 쓸 수 있다", () => {
    // switch_role이 막히면 게스트가 회원으로 올라갈 길이 없어진다
    const guest = names(toolsForRole("guest"));
    expect(guest).toContain("open_screen");
    expect(guest).toContain("switch_role");
    expect(guest).toContain("search_site");
  });

  it("회원은 회원 전용 도구를 포함해 모든 도구를 본다", () => {
    const member = names(toolsForRole("member"));
    for (const name of MEMBER_ONLY) {
      expect(member).toContain(name);
    }
    expect(member.length).toBe(CHAT_TOOLS.length);
  });

  it("게스트 목록은 회원 목록보다 좁다", () => {
    expect(toolsForRole("guest").length).toBeLessThan(
      toolsForRole("member").length,
    );
  });
});

describe("역할 정규화", () => {
  it("아는 역할은 그대로, 나머지는 게스트로 강등한다", () => {
    expect(normalizeRole("member")).toBe("member");
    expect(normalizeRole("admin")).toBe("admin");
    expect(normalizeRole("guest")).toBe("guest");
    for (const bad of [undefined, null, "", "root", "hacker", 42, {}]) {
      expect(normalizeRole(bad)).toBe("guest");
    }
  });
});

describe("걸음별 체험 안내(guide_feature)", () => {
  it("모델에게 주는 체험 목록이 실제 대본(GUIDE_TOURS)과 어긋나지 않는다", async () => {
    // chat-tools는 서버가 읽는 모듈이라 "use client"인 feature-guide를
    // 직접 임포트할 수 없다 — 사본이 생겼으니 동기화는 테스트가 잰다
    const { GUIDE_TOURS } = await import("./feature-guide");
    const { GUIDE_FEATURE_IDS } = await import("./chat-tools");
    expect([...GUIDE_FEATURE_IDS].sort()).toEqual(
      Object.keys(GUIDE_TOURS).sort(),
    );
  });
});
