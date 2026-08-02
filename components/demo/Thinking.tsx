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

/* 스스로 생각하는 동안의 단계. 읽기 → 찾기 → 쓰기, 그리고 기다림.

   앞의 셋에서 멈추면 안 된다. 마지막 문구("답을 정리하고 있어요")에 20초씩
   묶여 있으면 멈춘 것으로 읽힌다(실기기 지적: 재생성이 무한 로딩 같다).
   시간이 흐르면 흐른다고 말한다 — 뒤로 갈수록 간격을 넓혀, 오래 걸리는
   날에만 나오는 문구가 되게 한다. */
const BEATS: Array<{ at: number; say: string; orb: OrbState }> = [
  { at: 0, say: "질문을 읽고 있어요", orb: "listening" },
  { at: 2200, say: "관련된 내용을 찾고 있어요", orb: "searching" },
  { at: 4400, say: "답을 정리하고 있어요", orb: "composing" },
  { at: 9000, say: "문장을 다듬고 있어요", orb: "composing" },
  { at: 15000, say: "생각이 길어지고 있어요, 조금만요", orb: "working" },
  { at: 24000, say: "아직 쓰고 있어요, 거의 다 왔어요", orb: "working" },
];

export function Thinking({ tool }: { tool?: string }) {
  const [beat, setBeat] = useState(0);

  useEffect(() => {
    if (tool) return;
    const timers = BEATS.slice(1).map((step, index) =>
      window.setTimeout(() => setBeat(index + 1), step.at),
    );
    return () => timers.forEach((timer) => window.clearTimeout(timer));
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
