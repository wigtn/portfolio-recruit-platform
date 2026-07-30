"use client";

import { Icon } from "./Icon";

/**
 * AI가 말하는 표면의 얼굴. 모프 블롭 아바타(.aiav)와 착지 스파클(.aispark).
 *
 * 원래 AiAnswerCard 안에만 있던 마크업을 뽑아냈다. 같은 제품 안에서 AI가 말하는
 * 표면이 두 벌이 되면 "검증된 모듈을 조립했다"는 이 데모의 주장 자체가 약해진다.
 * 글 상세의 AI 참고 답변과 상담 챗봇이 같은 얼굴을 쓴다.
 *
 * 크기는 시안 규격 세 단계다. sm(26)은 말풍선 옆, md(34)는 답변 줄,
 * lg(44)는 플로팅 진입점.
 */
export function AiAvatar({
  size = "md",
  thinking,
  spark,
  className,
}: {
  size?: "sm" | "md" | "lg";
  /** 생성 중. 모프와 회전이 빨라진다 */
  thinking?: boolean;
  /** 착지 스파클. 한 번 떠올랐다 사라진다 */
  spark?: boolean;
  className?: string;
}) {
  return (
    <span
      className={[
        "aiav",
        size === "sm" ? "sm" : size === "lg" ? "lg" : "",
        thinking ? "is-think" : "",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <Icon name="bot" />
      {spark ? (
        <span className="aispark" aria-hidden>
          <i style={{ "--a": "-40deg" } as React.CSSProperties} />
          <i style={{ "--a": "18deg" } as React.CSSProperties} />
          <i style={{ "--a": "72deg" } as React.CSSProperties} />
        </span>
      ) : null}
    </span>
  );
}
