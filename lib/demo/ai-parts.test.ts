import { describe, expect, it } from "vitest";
import { splitByGuarded } from "./ai-parts";

describe("splitByGuarded, 실생성 텍스트의 위험 표현 토큰화", () => {
  const guarded = [
    { raw: "◇◇테크", loose: "◇◇테크", basic: "국내 대기업 A", strict: "한 기업" },
    { raw: "평균 32% 상승", loose: "평균 32% 상승", basic: "공개된 리뷰 범위", strict: "공개된 리뷰 범위" },
  ];

  it("각 위험 표현 자리를 {i} 토큰으로 바꾼다", () => {
    expect(splitByGuarded("◇◇테크는 평균 32% 상승했다", guarded)).toEqual([
      "{0}",
      "는 ",
      "{1}",
      "했다",
    ]);
  });

  it("표현이 없으면 원문 그대로 한 조각이다", () => {
    expect(splitByGuarded("아무 위험 표현 없음", guarded)).toEqual([
      "아무 위험 표현 없음",
    ]);
  });

  it("같은 표현이 여러 번 나와도 전부 잡는다", () => {
    expect(splitByGuarded("◇◇테크와 ◇◇테크", guarded)).toEqual([
      "{0}",
      "와 ",
      "{0}",
    ]);
  });
});
