"use client";

import { useEffect, useState } from "react";
import { NumberTicker } from "@/components/NumberTicker";

/**
 * 반원 게이지 — P1의 상한 대비 사용량 표기.
 *
 * 진행 호는 strokeDasharray의 첫 항만 키워 채운다(0.8s 감속). 중앙 %는
 * NumberTicker로 같이 굴러간다 — 호와 숫자가 따로 놀면 어느 쪽이 참인지
 * 헷갈린다.
 */
export function RadialGauge({
  value,
  size = 180,
  label,
  sub,
  color = "var(--accent)",
}: {
  /** 0~1 */
  value: number;
  size?: number;
  label: string;
  sub?: string;
  color?: string;
}) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() =>
      requestAnimationFrame(() => setOn(true)),
    );
    return () => cancelAnimationFrame(frame);
  }, []);

  const clamped = Math.max(0, Math.min(1, value));
  const radius = 70;
  const half = Math.PI * radius;
  const height = (size * 100) / 180;

  return (
    // 150px 미만이면 중앙 타이포를 줄인다 — 큰 폰트가 호 위로 넘친다
    <div
      className={size < 150 ? "ds-gauge is-sm" : "ds-gauge"}
      style={{ width: size }}
    >
      <svg viewBox="0 0 180 100" width={size} height={height} aria-hidden>
        <path
          d="M 20 86 A 70 70 0 0 1 160 86"
          fill="none"
          stroke="var(--track)"
          strokeWidth={14}
          strokeLinecap="round"
        />
        <path
          d="M 20 86 A 70 70 0 0 1 160 86"
          fill="none"
          stroke={color}
          strokeWidth={14}
          strokeLinecap="round"
          strokeDasharray={`${on ? half * clamped : 0} ${half}`}
          style={{
            transition: "stroke-dasharray 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        />
      </svg>
      <div className="ds-gauge-center">
        <b>
          <NumberTicker value={Math.round(clamped * 100)} />%
        </b>
        <span>{label}</span>
        {sub ? <small>{sub}</small> : null}
      </div>
    </div>
  );
}
