"use client";

import { useEffect, useState } from "react";

/**
 * 도넛 차트 — P1의 순수 SVG 문법. 라이브러리를 들이지 않는다.
 *
 * 세그먼트는 같은 원 위에 strokeDasharray로 얹고, dashoffset을
 * 원둘레 → 최종값으로 굴려 그려지듯 등장시킨다(0.8s damped + 80ms 스태거).
 * 배치는 rotate — 시작점을 12시로 두려고 -90도에서 출발한다.
 */
export function DonutChart({
  data,
  size = 160,
  thickness = 18,
  centerLabel,
  centerValue,
}: {
  data: Array<{ label: string; value: number; color: string }>;
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerValue?: string;
}) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() =>
      requestAnimationFrame(() => setOn(true)),
    );
    return () => cancelAnimationFrame(frame);
  }, []);

  const total = data.reduce((sum, item) => sum + item.value, 0) || 1;
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;

  let offset = 0;
  const segments = data.map((item) => {
    const fraction = item.value / total;
    const segment = { ...item, fraction, start: offset };
    offset += fraction;
    return segment;
  });

  return (
    <div className="ds-donut">
      <div className="ds-donut-wrap" style={{ width: size, height: size }}>
        <svg
          viewBox={`0 0 ${size} ${size}`}
          width={size}
          height={size}
          aria-hidden
        >
          {segments.map((segment, index) => (
            <circle
              key={segment.label}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={segment.color}
              strokeWidth={thickness}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={
                on ? circumference * (1 - segment.fraction) : circumference
              }
              transform={`rotate(${segment.start * 360 - 90} ${size / 2} ${size / 2})`}
              style={{
                transition: `stroke-dashoffset 0.8s var(--ease-damped) ${index * 80}ms`,
              }}
            />
          ))}
        </svg>
        {centerValue ? (
          <div className="ds-donut-center">
            <b>{centerValue}</b>
            {centerLabel ? <span>{centerLabel}</span> : null}
          </div>
        ) : null}
      </div>
      <ul className="ds-donut-legend">
        {segments.map((segment) => (
          <li key={segment.label}>
            <i style={{ background: segment.color }} />
            <span className="nm">{segment.label}</span>
            <b>{Math.round(segment.fraction * 100)}%</b>
          </li>
        ))}
      </ul>
    </div>
  );
}
