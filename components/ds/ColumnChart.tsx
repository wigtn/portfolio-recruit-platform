"use client";

import { useEffect, useState } from "react";

/**
 * 세로 기둥 차트 — P1 문법. SVG가 아니라 div다.
 *
 * 기둥 높이는 2px → 값으로 transition(0.7s 감속 + 15ms 스태거, 상한 350ms).
 * 라이브러리 축·그리드는 이 밀도에서 소음이라 값 라벨과 기둥만 남긴다.
 * 호버 툴팁은 기둥 꼭대기에 앵커된다.
 */
export function ColumnChart({
  data,
  unit = "",
  height = 210,
  refLine,
}: {
  data: Array<{ label: string; value: number; color?: string; hint?: string }>;
  unit?: string;
  height?: number;
  /** 기준선 — 평균·목표 같은 비교 축 */
  refLine?: { value: number; label: string };
}) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() =>
      requestAnimationFrame(() => setOn(true)),
    );
    return () => cancelAnimationFrame(frame);
  }, []);

  const max =
    Math.max(...data.map((item) => item.value), refLine?.value ?? 0) || 1;
  // 라벨 영역(-44px)을 빼야 기둥이 컨테이너를 뚫지 않는다 — P1 원본의 함정 노트
  const usable = height - 44;

  return (
    <div className="ds-cols" style={{ height }}>
      {refLine ? (
        <div
          className="ds-cols-ref"
          style={{ bottom: 24 + (refLine.value / max) * usable }}
        >
          <span>{refLine.label}</span>
        </div>
      ) : null}
      {data.map((item, index) => {
        const barHeight = on ? Math.max(2, (item.value / max) * usable) : 2;
        return (
          <div className="ds-col" key={item.label}>
            <div className="ds-col-tip" style={{ bottom: barHeight + 30 }}>
              <b>
                {item.value.toLocaleString()}
                {unit}
              </b>
              {item.hint ? <span>{item.hint}</span> : null}
            </div>
            <span className="ds-col-value">{item.value.toLocaleString()}</span>
            <div
              className="ds-col-bar"
              style={{
                height: barHeight,
                background: item.color ?? "var(--accent)",
                transitionDelay: `${Math.min(index * 15, 350)}ms`,
              }}
            />
            <span className="ds-col-label">{item.label}</span>
          </div>
        );
      })}
    </div>
  );
}
