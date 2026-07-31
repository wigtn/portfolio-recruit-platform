/**
 * 순수 질문 게이트 계약.
 *
 * 도구 판단 콜을 건너뛰는 판정이다. 여기서 조작 요청을 순수 질문으로 잘못
 * 보면, "커뮤니티 보여줘"가 도구 없이 말로만 답해지고 데모의 간판 기능이
 * 조용히 사라진다. 그래서 오탐(조작을 순수로 봄)은 0이어야 한다. 반대로
 * 순수 질문을 조작으로 봐도 손해는 도구 콜 한 번뿐이라, 판정은 보수적이다.
 */

import { describe, expect, it } from "vitest";
import { isPureQuestion } from "./chat";

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
