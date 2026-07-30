"use client";

import { useEffect, useRef, useState } from "react";

/**
 * 숫자 카운트업 — 값이 바뀔 때 자리에서 굴러간다.
 * 선행 프로젝트(P1) 관리자 대시보드의 지표 표기 문법을 따른다: 지표는 갱신됐다는
 * 사실 자체가 정보라, 값이 소리 없이 교체되면 바뀐 걸 놓친다.
 *
 * rAF 한 개만 쓰고 transform/opacity를 건드리지 않는다(레이아웃 흔들림 없음).
 * 움직임 줄이기 설정이 켜져 있으면 애니메이션 없이 최종값을 바로 쓴다.
 */
export function NumberTicker({
  value,
  duration = 620,
  format,
}: {
  value: number;
  duration?: number;
  format?: (value: number) => string;
}) {
  const [shown, setShown] = useState(value);
  const fromRef = useRef(value);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    const from = fromRef.current;
    if (reduce || from === value) {
      fromRef.current = value;
      setShown(value);
      return;
    }

    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      // --ease-damped와 같은 감속 곡선(강한 감속·정착)
      const eased = 1 - Math.pow(1 - t, 3);
      setShown(from + (value - from) * eased);
      if (t < 1) {
        frameRef.current = requestAnimationFrame(step);
      } else {
        fromRef.current = value;
      }
    };
    frameRef.current = requestAnimationFrame(step);

    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      // 중간에 끊겨도 다음 애니메이션의 시작점은 화면에 보이던 값이어야 한다
      fromRef.current = value;
    };
  }, [value, duration]);

  const rounded = Number.isInteger(value) ? Math.round(shown) : shown;
  return (
    <span style={{ fontVariantNumeric: "tabular-nums" }}>
      {format ? format(rounded) : rounded.toLocaleString("ko-KR")}
    </span>
  );
}
