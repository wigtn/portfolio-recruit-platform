"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/**
 * 슬롯머신 자릿수 릴 — 선행 프로젝트 P1 관리자 대시보드의 지표 숫자 문법.
 *
 * NumberTicker(카운트업)와 역할이 다르다: 카운트업은 "갱신 중"을, 릴은
 * "도착"을 판다. 대시보드 첫 진입의 큰 숫자는 릴이 정본이다.
 *
 * 각 자릿수를 0-9 스트립 두 바퀴(SPINS) + 목표값으로 세로로 쌓고, 마운트
 * 다음 프레임에 translateY로 굴린다. 왼쪽 자릿수부터 90ms씩 늦게 멈춰
 * 슬롯머신처럼 좌→우로 정착한다. 정수 전용.
 */
const SPINS = 2;
const DURATION = 1100;
const STAGGER = 90;

export function SlotNumber({ value }: { value: number }) {
  const digits = useMemo(() => {
    const rounded = Math.max(0, Math.round(value));
    return String(rounded).split("");
  }, [value]);
  const [on, setOn] = useState(false);
  const reduce = useRef(false);

  useEffect(() => {
    reduce.current =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    // 단일 rAF는 스타일 계산 전에 붙어 트랜지션이 생략될 수 있다 — 이중 rAF
    const frame = requestAnimationFrame(() =>
      requestAnimationFrame(() => setOn(true)),
    );
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    // 자릿수가 바뀌면(999→1000) 릴 개수가 달라지므로 통째로 재마운트한다
    <span className="slotnum" key={digits.length} aria-label={String(value)}>
      {digits.map((digit, index) => {
        if (digit === ",") return <span key={index}>,</span>;
        const target = Number(digit);
        // 스트립: 0..9 를 SPINS바퀴 + 마지막 줄은 0..target
        const strip: number[] = [];
        for (let spin = 0; spin < SPINS; spin += 1)
          for (let n = 0; n <= 9; n += 1) strip.push(n);
        for (let n = 0; n <= target; n += 1) strip.push(n);
        const settled = strip.length - 1;
        return (
          <span className="slotnum-reel" key={index} aria-hidden>
            <span
              className="slotnum-strip"
              style={{
                transform:
                  on || reduce.current
                    ? `translateY(-${settled}em)`
                    : "translateY(0)",
                transitionDuration: reduce.current ? "0ms" : `${DURATION}ms`,
                transitionDelay: reduce.current
                  ? "0ms"
                  : `${index * STAGGER}ms`,
              }}
            >
              {strip.map((n, i) => (
                <span key={i}>{n}</span>
              ))}
            </span>
          </span>
        );
      })}
    </span>
  );
}
