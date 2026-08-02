/**
 * 순수 질문 게이트 계약.
 *
 * 도구 판단 콜을 건너뛰는 판정이다. 여기서 조작 요청을 순수 질문으로 잘못
 * 보면, "커뮤니티 보여줘"가 도구 없이 말로만 답해지고 데모의 간판 기능이
 * 조용히 사라진다. 그래서 오탐(조작을 순수로 봄)은 0이어야 한다. 반대로
 * 순수 질문을 조작으로 봐도 손해는 도구 콜 한 번뿐이라, 판정은 보수적이다.
 */

import { describe, expect, it } from "vitest";
import {
  NEXT_BY_INTENT,
  intentById,
  isPureQuestion,
  nextChips,
  splitFollowups,
} from "./chat";

describe("순수 질문 게이트", () => {
  it("조작 신호가 없는 순수 질문은 도구 콜을 건너뛴다", () => {
    for (const q of [
      "유지보수는 어떻게 되나요?",
      "기간 얼마나 걸려요?",
      "견적은 어떻게 잡나요?",
      "하자보수 기간이 궁금해요",
      "결제 기능도 되나요?",
    ]) {
      expect(isPureQuestion(q, false), q).toBe(true);
    }
  });

  it("화면 조작 신호가 하나라도 있으면 순수 질문이 아니다 (C-2 오탐 방지)", () => {
    for (const q of [
      "관리자 화면 보여줘", // 인텐트 키워드(관리자)에도 매칭되지만 '보여'가 있다
      "커뮤니티 열어줘",
      "글 써줘",
      "백오피스로 이동해줘",
      "빨간색으로 바꿔줘",
      "이 데모 안내해줘",
      "그 글 어디 있어요?",
    ]) {
      expect(isPureQuestion(q, false), q).toBe(false);
    }
  });

  it("진행 중인 조작(trace 존재)이면 순수 질문으로 보지 않는다", () => {
    // 다음 걸음이 남아 있을 수 있으니 판단 콜을 건너뛰지 않는다
    expect(isPureQuestion("고마워요", true)).toBe(false);
    expect(isPureQuestion("유지보수는요?", true)).toBe(false);
  });
});

describe("칩은 대화를 따라 바뀐다", () => {
  it("마지막 질문의 이웃을 먼저 세운다", () => {
    const chips = nextChips("cost", new Set());
    // NEXT_BY_INTENT.cost = duration, source, cms, revision
    expect(chips.map((c) => c.id)).toEqual([
      "duration",
      "source",
      "cms",
      "revision",
    ]);
  });

  it("이미 물어본 것은 다시 제안하지 않는다", () => {
    const duration = intentById("duration");
    const chips = nextChips("cost", new Set([duration!.chip!]));
    expect(chips.map((c) => c.id)).not.toContain("duration");
    expect(chips).toHaveLength(4);
  });

  it("이웃이 모자라면 기본 순서로 채운다", () => {
    /* 이웃 넷을 전부 물어봤어도 칩 줄이 비면 안 된다 — 진입로가 사라진다 */
    const used = new Set(
      (NEXT_BY_INTENT.cost ?? [])
        .map((id) => intentById(id)?.chip)
        .filter((chip): chip is string => !!chip),
    );
    const chips = nextChips("cost", used);
    expect(chips.length).toBeGreaterThan(0);
    expect(chips.every((c) => !used.has(c.chip!))).toBe(true);
  });

  it("걸린 인텐트가 없어도 칩을 준다", () => {
    expect(nextChips(null, new Set()).length).toBe(4);
  });

  it("중복을 세우지 않는다", () => {
    const chips = nextChips("tour", new Set());
    expect(new Set(chips.map((c) => c.id)).size).toBe(chips.length);
  });
});

describe("답변 끝의 후속 질문을 떼어낸다", () => {
  it("본문과 질문 둘로 가른다", () => {
    const { body, chips } = splitFollowups(
      "6~8주 정도 걸려요.[[NEXT]]유지보수는 어떻게 하나요?|비용은 얼마인가요?",
    );
    expect(body).toBe("6~8주 정도 걸려요.");
    expect(chips).toEqual(["유지보수는 어떻게 하나요?", "비용은 얼마인가요?"]);
  });

  it("마커가 오는 중이면 부스러기를 감춘다", () => {
    /* 스트리밍이라 "[[N"까지만 온 순간이 있다. 그대로 그리면 방문자가
       대괄호를 본다 — 그 사이 본문만 보여야 한다 */
    for (const partial of ["[", "[[", "[[N", "[[NEX", "[[NEXT"]) {
      expect(splitFollowups(`답변이에요.${partial}`).body).toBe("답변이에요.");
    }
  });

  it("마커가 없으면 본문 그대로", () => {
    const { body, chips } = splitFollowups("그냥 답변입니다.");
    expect(body).toBe("그냥 답변입니다.");
    expect(chips).toEqual([]);
  });

  it("대괄호가 본문에 있어도 마커가 아니면 안 자른다", () => {
    expect(splitFollowups("[참고] 자료를 보세요").body).toBe(
      "[참고] 자료를 보세요",
    );
  });

  it("질문 뒤에 딴 말을 붙여도 첫 줄만 쓴다", () => {
    const { chips } = splitFollowups(
      "답변.[[NEXT]]기간은요?|비용은요?\n도움이 되셨길 바랍니다",
    );
    expect(chips).toEqual(["기간은요?", "비용은요?"]);
  });

  it("셋 이상을 보내도 둘만 쓴다", () => {
    const { chips } = splitFollowups("답변.[[NEXT]]하나?|둘?|셋?|넷?");
    expect(chips).toHaveLength(2);
  });

  it("빈 질문과 지나치게 긴 질문은 버린다", () => {
    const { chips } = splitFollowups(`답변.[[NEXT]]||${"가".repeat(60)}|짧아요?`);
    expect(chips).toEqual(["짧아요?"]);
  });
});
