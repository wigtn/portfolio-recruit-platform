"use client";

import { useEffect, useState } from "react";
import { ThinkingOrb, type OrbState } from "thinking-orbs";

import { TOOL_ORB, TOOL_RUNNING } from "@/lib/demo/chat-tools";

/**
 * 생각 중 표시.
 *
 * 점 세 개가 뛰는 건 메신저의 문법이다. "상대가 타이핑 중"이라는 뜻이지
 * "기계가 계산 중"이 아니다. AI가 답을 만드는 시간은 사람이 자판을 두드리는
 * 시간과 성격이 다르므로 표시도 달라야 한다.
 *
 * thinking-orbs의 여섯 상태를 전부 쓴다. 스스로 생각하는 동안에는 읽기,
 * 찾기, 쓰기 세 궤도를 차례로 돌고, 도구를 실행하는 동안에는 그 도구의
 * 성격에 맞는 궤도로 바꾼다. 로더가 하나뿐이면 화면을 여는 것과 답을 쓰는
 * 것이 같은 모양이 되고, 그러면 표시가 상태를 말하지 않는 장식이 된다.
 *
 * 색은 잉크 그대로 둔다. 뒤에 accent 원판을 깔아 색을 넣어 봤는데 알약
 * 하나가 덧붙은 것처럼 보였다. 색은 옆의 문구가 훑는 빛으로 충분하다.
 */

/** 스스로 생각하는 동안의 단계. 읽기 → 찾기 → 쓰기 */
const BEATS: Array<{ say: string; orb: OrbState }> = [
  { say: "질문을 읽고 있어요", orb: "listening" },
  { say: "관련된 내용을 찾고 있어요", orb: "searching" },
  { say: "답을 정리하고 있어요", orb: "composing" },
];

export function Thinking({ tool }: { tool?: string }) {
  const [beat, setBeat] = useState(0);

  useEffect(() => {
    if (tool) return;
    const timer = window.setInterval(
      () => setBeat((now) => Math.min(now + 1, BEATS.length - 1)),
      2200,
    );
    return () => window.clearInterval(timer);
  }, [tool]);

  const say = tool ? (TOOL_RUNNING[tool] ?? "작업하는 중") : BEATS[beat].say;
  const orb: OrbState = tool
    ? (TOOL_ORB[tool] ?? "working")
    : BEATS[beat].orb;

  return (
    <span className="thinking" role="status">
      <span className="orb" aria-hidden>
        <ThinkingOrb state={orb} size={20} speed={1} />
      </span>
      {/* 글자에도 빛이 지나간다. 오브만 돌고 글자가 멈춰 있으면 문구가
          자막처럼 읽히고, 둘이 같이 움직여야 한 덩어리로 보인다 */}
      <span className="thinking-say" key={say}>
        {say}
      </span>
    </span>
  );
}
