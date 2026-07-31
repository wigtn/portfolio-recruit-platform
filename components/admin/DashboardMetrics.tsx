"use client";

import { useState } from "react";
import { Stat, type StatTint } from "@/components/ds/Stat";
import { TrendChart } from "@/components/ds/TrendChart";
import {
  METRICS,
  PERIODS,
  TREND,
  XAXIS,
  type Period,
} from "@/lib/admin/dashboard";

/** 시안의 스파크라인 좌표(y가 아래로 증가)를 값 배열로 뒤집는다 */
function valuesFromCoordinates(points: string, height = 100) {
  return points
    .trim()
    .split(/\s+/)
    .map((point) => Number(point.split(",")[1]))
    .filter(Number.isFinite)
    .map((y) => Math.max(0, height - y));
}

/**
 * 지표 카드의 얼굴(아이콘·톤) — 시드 key에 붙여 둔다. 배열 순서에 걸면
 * 기간을 바꾸다 시드 순서가 달라졌을 때 짝이 틀어진다.
 * 톤은 P1 Stat의 4종 안에서만 고른다 — 리뷰는 별점(--star)과 같은 앰버 계열(warn).
 */
const STAT_FACE: Record<string, { icon: string; tint: StatTint }> = {
  visit: { icon: "view", tint: "brand" },
  signup: { icon: "users", tint: "success" },
  posts: { icon: "comment", tint: "brand" },
  reviews: { icon: "star", tint: "warn" },
};

/** 추이 두 계열의 색 — 도넛(콘텐츠 구성)과 같은 짝이어야 화면 안에서 색이 정보가 된다 */
export const TREND_SERIES = [
  { key: "posts", label: "글, 댓글", color: "var(--accent)" },
  { key: "reviews", label: "리뷰", color: "var(--ds-purple)" },
] as const;

/**
 * 기간 상태와 데이터 어댑터만 앱이 소유한다.
 * 지표 카드는 ds Stat(슬롯 릴 + 60ms 스태거), 활동 추이는 ds TrendChart
 * (드로우인·크로스헤어·툴팁) — P1 관리자 대시보드에서 이식한 표현을 배선한다.
 */
export function DashboardMetrics({ children }: { children: React.ReactNode }) {
  const [period, setPeriod] = useState<Period>("7d");
  const metrics = METRICS[period];
  const trend = TREND[period];

  const posts = valuesFromCoordinates(trend.posts, 140);
  const reviews = valuesFromCoordinates(trend.reviews, 140);
  const trendData = XAXIS[period].map((date, index) => ({
    date,
    posts: posts[index] ?? 0,
    reviews: reviews[index] ?? 0,
  }));

  return (
    <>
      {/* 제목은 셸 헤더가 말한다 — 기간 세그먼트만 남는다 */}
      <div className="ahd">
        <div className="seg">
          {PERIODS.map((item) => (
            <button
              key={item.key}
              className={period === item.key ? "on" : undefined}
              onClick={() => setPeriod(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* key로 기간마다 다시 마운트한다 — 슬롯 릴·스태거가 다시 돌면서
          "값이 갱신됐다"가 눈에 잡힌다(P1 대시보드 갱신 신호 문법). */}
      <div className="ds-statrow" key={`stat-${period}`}>
        {metrics.map((metric, index) => (
          <Stat
            key={metric.key}
            index={index}
            icon={STAT_FACE[metric.key]?.icon}
            tint={STAT_FACE[metric.key]?.tint}
            label={metric.label}
            value={Number(metric.value.replace(/,/g, ""))}
            sub={
              <span
                className={metric.dir === "up" ? "ds-delta up" : "ds-delta dn"}
              >
                {metric.delta}, 지난 기간 대비
              </span>
            }
          />
        ))}
      </div>

      <div className="dashgrid">
        <div className="chartcard">
          <div className="chd">
            <h4>활동 추이</h4>
            <span className="ds-legend">
              {TREND_SERIES.map((series) => (
                <span key={series.key}>
                  <i style={{ background: series.color }} />
                  {series.label}
                </span>
              ))}
            </span>
          </div>
          {/* 기간 전환마다 드로우인을 다시 튼다 — 위 지표 카드와 같은 갱신 신호 */}
          <TrendChart
            key={`trend-${period}`}
            data={trendData}
            series={[...TREND_SERIES]}
            height={200}
            unit="건"
          />
        </div>
        {children}
      </div>
    </>
  );
}
