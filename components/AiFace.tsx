"use client";

import { Icon } from "./Icon";

/**
 * AI가 말하는 표면의 얼굴. 모프 블롭 아바타(.aiav)와 착지 스파클(.aispark).
 *
 * 원래 AiAnswerCard 안에만 있던 마크업을 뽑아냈다. 같은 제품 안에서 AI가 말하는
 * 표면이 두 벌이 되면 "검증된 모듈을 조립했다"는 이 데모의 주장 자체가 약해진다.
 * 글 상세의 AI 참고 답변과 데모 도우미가 같은 얼굴을 쓴다.
 *
 * 크기는 시안 규격 세 단계다. sm(26)은 말풍선 옆, md(34)는 답변 줄,
 * lg(44)는 플로팅 진입점.
 */
export function AiAvatar({
  size = "md",
  thinking,
  live,
  spark,
  className,
}: {
  size?: "sm" | "md" | "lg";
  /** 생성 중. 모프와 회전이 빨라진다 */
  thinking?: boolean;
  /**
   * 말하고 있지 않아도 계속 움직여야 하는 자리인가.
   *
   * 기본은 정지다. 챗봇은 봇 메시지마다 이 아바타를 붙이므로, 전부 움직이면
   * 대화가 길어질수록 프레임이 선형으로 무너진다(4개일 때 136.8→37.3fps).
   * 지나간 말의 아바타가 도는 걸 보는 사람은 없다.
   *
   * 그래서 켜는 자리는 둘뿐이다 — 지금 말하는 중(thinking)과, 화면에 하나만
   * 존재하면서 시선을 끌어야 하는 진입점(live).
   */
  live?: boolean;
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
        live ? "is-live" : "",
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
