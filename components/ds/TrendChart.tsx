"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * 추이 라인 차트 — P1 관리자 대시보드의 순수 SVG 구현.
 *
 * 핵심 설계 (P1 이식 노트 그대로):
 * - 폭은 ResizeObserver 실측 → viewBox를 1:1로 맞춘다. 고정 viewBox를
 *   스케일하면 SVG 텍스트가 모바일에서 뭉개진다.
 * - 라인은 pathLength=1 + dasharray 트릭으로 그려지듯 등장(1s damped,
 *   계열마다 120ms 시차). 면적 그라디언트는 0.6s 늦게 페이드인.
 * - 크로스헤어는 g의 translateX에 0.16s transition — 포인트 사이를
 *   미끄러진다. 툴팁은 HTML 오버레이(SVG 텍스트보다 다루기 쉽다),
 *   x 55% 기준 좌우 플립.
 */
const PAD = { l: 34, r: 12, t: 14, b: 22 };

export function TrendChart({
  data,
  series,
  height = 220,
  unit = "",
}: {
  data: Array<Record<string, number | string> & { date: string }>;
  series: Array<{ key: string; label: string; color: string }>;
  height?: number;
  unit?: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [on, setOn] = useState(false);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const node = wrapRef.current;
    if (!node) return;
    const observer = new ResizeObserver(() =>
      setWidth(node.getBoundingClientRect().width),
    );
    observer.observe(node);
    const frame = requestAnimationFrame(() =>
      requestAnimationFrame(() => setOn(true)),
    );
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, []);

  const max =
    Math.max(
      1,
      ...data.flatMap((row) => series.map((s) => Number(row[s.key]) || 0)),
    ) * 1.08;

  const plotW = Math.max(0, width - PAD.l - PAD.r);
  const plotH = height - PAD.t - PAD.b;
  const x = useCallback(
    (index: number) =>
      PAD.l + (data.length <= 1 ? 0 : (index / (data.length - 1)) * plotW),
    [data.length, plotW],
  );
  const y = useCallback(
    (value: number) => PAD.t + plotH - (value / max) * plotH,
    [plotH, max],
  );

  const onMove = (event: React.MouseEvent) => {
    if (!wrapRef.current || data.length === 0) return;
    const rect = wrapRef.current.getBoundingClientRect();
    const px = event.clientX - rect.left - PAD.l;
    const index = Math.round((px / Math.max(1, plotW)) * (data.length - 1));
    setHover(Math.max(0, Math.min(data.length - 1, index)));
  };

  if (data.length === 0) {
    return <div className="ds-trend-empty">데이터 없음</div>;
  }

  const flip = hover !== null && x(hover) > width * 0.55;
  // x 라벨 간격 — P1은 30일 데이터라 7칸 고정이었다. 기간 전환으로 점 수가
  // 달라지는 이 대시보드는 "최대 8개"로 환산해 같은 밀도를 유지한다.
  const tickStep = Math.max(1, Math.ceil(data.length / 8));

  return (
    <div
      className="ds-trend"
      ref={wrapRef}
      style={{ height }}
      onMouseMove={onMove}
      onMouseLeave={() => setHover(null)}
    >
      {width > 0 ? (
        <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height}>
          {/* y축 눈금 3개 — 0 / 절반 / 최대. 더 많으면 격자가 소음이 된다 */}
          {[0, 0.5, 1].map((t) => (
            <g key={t}>
              <line
                x1={PAD.l}
                x2={width - PAD.r}
                y1={y(max * t)}
                y2={y(max * t)}
                stroke="var(--line)"
                strokeDasharray={t === 0 ? undefined : "3 5"}
              />
              <text
                x={PAD.l - 7}
                y={y(max * t) + 4}
                textAnchor="end"
                className="ds-trend-tick"
              >
                {Math.round(max * t).toLocaleString()}
              </text>
            </g>
          ))}
          {/* x 라벨 — tickStep 간격 */}
          {data.map((row, index) =>
            index % tickStep === 0 ? (
              <text
                key={index}
                x={x(index)}
                y={height - 6}
                textAnchor="middle"
                className="ds-trend-tick"
              >
                {row.date}
              </text>
            ) : null,
          )}

          {series.map((s, seriesIndex) => {
            const points = data.map(
              (row, index) => `${x(index)},${y(Number(row[s.key]) || 0)}`,
            );
            const path = `M ${points.join(" L ")}`;
            const area = `${path} L ${x(data.length - 1)},${y(0)} L ${x(0)},${y(0)} Z`;
            const gradientId = `dst-${s.key}-${Math.round(width)}`;
            return (
              <g key={s.key}>
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor={s.color} stopOpacity="0.22" />
                    <stop offset="1" stopColor={s.color} stopOpacity="0.02" />
                  </linearGradient>
                </defs>
                <path
                  d={area}
                  fill={`url(#${gradientId})`}
                  style={{
                    opacity: on ? 1 : 0,
                    transition: `opacity 0.7s ease-out ${0.6 + seriesIndex * 0.12}s`,
                  }}
                />
                <path
                  d={path}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={2}
                  strokeLinecap="round"
                  pathLength={1}
                  strokeDasharray={1}
                  strokeDashoffset={on ? 0 : 1}
                  style={{
                    transition: `stroke-dashoffset 1s var(--ease-damped) ${seriesIndex * 0.12}s`,
                  }}
                />
              </g>
            );
          })}

          {hover !== null ? (
            <g
              className="ds-trend-cross"
              style={{ transform: `translateX(${x(hover)}px)` }}
            >
              <line
                y1={PAD.t}
                y2={height - PAD.b}
                stroke="var(--ink-4)"
                strokeDasharray="3 4"
              />
              {series.map((s) => (
                <circle
                  key={s.key}
                  cy={y(Number(data[hover][s.key]) || 0)}
                  r={4}
                  fill={s.color}
                  stroke="var(--card)"
                  strokeWidth={2}
                />
              ))}
            </g>
          ) : null}
        </svg>
      ) : null}

      {hover !== null ? (
        <div
          className="ds-trend-tip"
          style={{
            left: x(hover) + (flip ? -10 : 10),
            transform: flip ? "translateX(-100%)" : undefined,
            top: Math.max(
              8,
              Math.min(
                height - 70,
                y(
                  Math.max(
                    ...series.map((s) => Number(data[hover][s.key]) || 0),
                  ),
                ) - 24,
              ),
            ),
          }}
        >
          <b>{data[hover].date}</b>
          {series.map((s) => (
            <span key={s.key}>
              <i style={{ background: s.color }} />
              {s.label} {(Number(data[hover][s.key]) || 0).toLocaleString()}
              {unit}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
