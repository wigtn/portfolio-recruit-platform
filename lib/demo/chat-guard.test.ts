/**
 * 챗봇 도구 관문 계약.
 *
 * 여기 적힌 것들은 "하면 안 되는 일"이다. 프롬프트로 부탁한 게 아니라 코드가
 * 막는다는 사실 자체가 검증 대상이므로, 관문을 직접 두드려 본다.
 *
 * 모델이 무엇을 하겠다고 하든 통과하는 것만 실행된다. 그 경계가 조용히
 * 느슨해지면 아무도 모른 채 열린 문이 하나 생긴다.
 */

import { describe, expect, it } from "vitest";
import { guard, MAX_CALLS_PER_TURN, REFUSED } from "./chat-guard";
import { SCREEN_ENUM, TOOL_SPECS, repairArgs } from "./chat-tools";
import { TARGET_ENUM } from "./chat-targets";

const ctx = (over: Partial<Parameters<typeof guard>[3]> = {}) => ({
  question: "커뮤니티 보여줘",
  role: "member" as const,
  used: 0,
  ...over,
});

describe("챗봇 도구 관문", () => {
  it("정의된 도구의 올바른 인자는 통과시킨다", () => {
    const verdict = guard(
      "open_screen",
      { screen: "community" },
      TOOL_SPECS.open_screen,
      ctx(),
    );
    expect(verdict.ok).toBe(true);
    if (verdict.ok) expect(verdict.args.screen).toBe("community");
  });

  it("없는 도구는 실행하지 않는다", () => {
    const verdict = guard("drop_database", {}, undefined, ctx());
    expect(verdict.ok).toBe(false);
  });

  it("운영자 조치의 실행은 이름부터 거절하고 이유를 남긴다", () => {
    for (const name of Object.keys(REFUSED)) {
      const verdict = guard(name, {}, TOOL_SPECS[name], ctx());
      expect(verdict.ok, `${name}이 통과했다`).toBe(false);
      // 조용히 실패하면 고장으로 보인다. 왜 안 되는지 말해야 설명이 된다
      if (!verdict.ok) expect(verdict.why.length).toBeGreaterThan(0);
    }
  });

  it("열거값 밖의 화면은 열지 않는다", () => {
    // 모델이 없는 화면 이름을 지어내는 일은 실제로 일어났다
    const verdict = guard(
      "open_screen",
      { screen: "demo" },
      TOOL_SPECS.open_screen,
      ctx(),
    );
    expect(verdict.ok).toBe(false);
  });

  it("경로나 주소를 직접 받지 않는다", () => {
    const verdict = guard(
      "open_screen",
      { screen: "https://example.com/steal" },
      TOOL_SPECS.open_screen,
      ctx(),
    );
    expect(verdict.ok).toBe(false);
  });

  it("정해진 지점 밖은 짚지 않는다", () => {
    const verdict = guard(
      "point_at",
      { target: "button.delete-everything", note: "여기" },
      TOOL_SPECS.point_at,
      ctx(),
    );
    expect(verdict.ok).toBe(false);
  });

  it("색은 16진수 형식만 받는다", () => {
    expect(
      guard("set_brand_color", { hex: "red" }, TOOL_SPECS.set_brand_color, ctx())
        .ok,
    ).toBe(false);
    expect(
      guard(
        "set_brand_color",
        { hex: "#0066ff" },
        TOOL_SPECS.set_brand_color,
        ctx(),
      ).ok,
    ).toBe(true);
  });

  it("게스트는 글을 쓰지 못한다", () => {
    const verdict = guard(
      "write_post",
      { board: "노하우", title: "제목", body: "본문입니다" },
      TOOL_SPECS.write_post,
      ctx({ role: "guest" }),
    );
    expect(verdict.ok).toBe(false);
  });

  it("글에 주소나 태그는 심지 못한다", () => {
    // 챗봇이 쓴 글이 낚시 통로가 되면 안 된다
    const link = guard(
      "write_post",
      { board: "노하우", title: "제목", body: "여기로 오세요 https://evil.example" },
      TOOL_SPECS.write_post,
      ctx(),
    );
    expect(link.ok).toBe(false);
  });

  it("위험한 원문은 살균기를 지나 저장된다", () => {
    const verdict = guard(
      "write_post",
      {
        board: "노하우",
        title: "제목",
        body: '정상 문장입니다 <script>alert("탈취")</script>',
      },
      TOOL_SPECS.write_post,
      ctx(),
    );
    // 살균기가 태그를 걷어내므로 통과하되, 스크립트는 남지 않는다
    if (verdict.ok) {
      expect(String(verdict.args.body)).not.toContain("<script");
      expect(String(verdict.args.body)).not.toContain("alert(");
    }
  });

  it("초기화는 방문자가 자기 입으로 말해야 열린다", () => {
    expect(
      guard("reset_demo", {}, TOOL_SPECS.reset_demo, ctx({ question: "안녕" }))
        .ok,
    ).toBe(false);
    expect(
      guard(
        "reset_demo",
        {},
        TOOL_SPECS.reset_demo,
        ctx({ question: "처음부터 다시 볼래" }),
      ).ok,
    ).toBe(true);
  });

  it("한 요청에서 조작 횟수를 넘기면 멈춘다", () => {
    const verdict = guard(
      "open_screen",
      { screen: "community" },
      TOOL_SPECS.open_screen,
      ctx({ used: MAX_CALLS_PER_TURN }),
    );
    expect(verdict.ok).toBe(false);
  });

  it("명세에 없는 인자는 실행부로 넘기지 않는다", () => {
    const verdict = guard(
      "open_screen",
      { screen: "community", onclick: "steal()", __proto__: {} },
      TOOL_SPECS.open_screen,
      ctx(),
    );
    expect(verdict.ok).toBe(true);
    if (verdict.ok) expect(Object.keys(verdict.args)).toEqual(["screen"]);
  });
});

/**
 * 화면 이름과 지점 이름을 가르는 계약.
 *
 * 둘은 형태가 같아서 모델이 섞어 썼다. "백오피스 화면 열어줘"에 지점
 * 이름인 demo_guide를 화면 자리에 넣는 일이 세 번 다 재현됐다. 표식(@)으로
 * 갈랐고, 그래도 새어 들어오면 제자리로 접는다. 둘 다 고정해 둔다.
 */
describe("화면 이름과 지점 이름", () => {
  it("지점 이름은 모두 표식으로 시작한다", () => {
    expect(TARGET_ENUM.every((id) => id.startsWith("@"))).toBe(true);
  });

  it("화면 이름과 지점 이름은 겹치지 않는다", () => {
    const screens = new Set<string>(SCREEN_ENUM);
    expect(TARGET_ENUM.filter((id) => screens.has(id))).toEqual([]);
  });

  it("화면 자리에 온 지점 이름은 그 지점이 사는 화면으로 접힌다", () => {
    // 표식이 붙은 것과 안 붙은 것 둘 다 알아듣는다
    expect(repairArgs("open_screen", { screen: "@admin_sidebar" })).toEqual({
      screen: "admin",
    });
    expect(repairArgs("open_screen", { screen: "community_list" })).toEqual({
      screen: "community",
    });
  });

  it("접은 값은 검문을 통과한다", () => {
    const fixed = repairArgs("open_screen", { screen: "@admin_table" });
    const verdict = guard("open_screen", fixed, TOOL_SPECS.open_screen, ctx());
    expect(verdict.ok).toBe(true);
    if (verdict.ok) expect(verdict.args.screen).toBe("admin");
  });

  it("어느 화면에나 있는 지점은 접지 않는다", () => {
    /* @header_search는 모든 화면에 있다. 어디로 보낼지 정할 수 없으므로
       추측하지 않는다. 엉뚱한 화면을 여는 쪽이 더 나쁘다 */
    expect(repairArgs("open_screen", { screen: "@header_search" })).toEqual({
      screen: "@header_search",
    });
  });

  it("반대 방향은 접지 않는다", () => {
    /* 지점 자리에 화면 이름이 오면 그 화면의 어디를 짚으라는 뜻인지 알 수
       없다. 아무 데나 고르면 엉뚱한 곳을 강조한다 */
    const verdict = guard(
      "point_at",
      { target: "admin", note: "여기" },
      TOOL_SPECS.point_at,
      ctx(),
    );
    expect(verdict.ok).toBe(false);
  });
});
