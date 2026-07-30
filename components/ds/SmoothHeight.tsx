"use client";

import { useEffect, useRef, useState } from "react";

/**
 * 내용 높이 변화를 부드럽게 — P1 이식.
 *
 * 2단계: ① outer를 현재 px로 고정하고 새 높이로 transition(그동안만
 * overflow hidden) → ② 끝나면 auto 복귀 + 내용 페이드인.
 *
 * P1 원본 코멘트에 기록된 함정 두 개를 그대로 지킨다:
 * - finishTimer는 ref로 들고 **언마운트에서만** 정리한다. 리렌더 cleanup이
 *   지우면 opacity 0에서 고착된다.
 * - 시작 높이는 auto 상태면 rect 재측정이 아니라 "기억해둔 직전 높이"를
 *   쓴다. 재측정하면 이미 새 내용 높이가 나와 전환이 스킵된다.
 */
export function SmoothHeight({
  children,
  duration = 350,
  fadeDuration = 220,
  keepVisible = false,
}: {
  children: React.ReactNode;
  duration?: number;
  fadeDuration?: number;
  /** 매초 갱신되는 화면 — 페이드가 오히려 깜빡임이 된다 */
  keepVisible?: boolean;
}) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const lastHeight = useRef<number | null>(null);
  const finishTimer = useRef<number | null>(null);
  const [animating, setAnimating] = useState(false);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;

    const observer = new ResizeObserver(() => {
      const next = inner.getBoundingClientRect().height;
      const from = lastHeight.current;
      lastHeight.current = next;
      if (from === null || Math.abs(from - next) < 1) return;

      outer.style.height = `${from}px`;
      setAnimating(true);
      if (!keepVisible) setFading(true);
      // 강제 리플로우로 시작 높이를 커밋한 뒤 목표 높이로
      void outer.offsetHeight;
      outer.style.height = `${next}px`;

      if (finishTimer.current) window.clearTimeout(finishTimer.current);
      finishTimer.current = window.setTimeout(() => {
        outer.style.height = "auto";
        setAnimating(false);
        setFading(false);
      }, duration);
    });
    observer.observe(inner);
    lastHeight.current = inner.getBoundingClientRect().height;

    return () => {
      observer.disconnect();
      if (finishTimer.current) window.clearTimeout(finishTimer.current);
    };
  }, [duration, keepVisible]);

  return (
    <div
      ref={outerRef}
      style={{
        transition: `height ${duration}ms var(--ease-damped)`,
        overflow: animating ? "hidden" : undefined,
      }}
    >
      <div
        ref={innerRef}
        style={
          keepVisible
            ? undefined
            : {
                opacity: fading ? 0.35 : 1,
                transition: `opacity ${fadeDuration}ms ease-out`,
              }
        }
      >
        {children}
      </div>
    </div>
  );
}
