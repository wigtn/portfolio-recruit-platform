import { DashboardMetrics } from "@/components/admin/DashboardMetrics";
import { OpsQueue } from "@/components/admin/OpsQueue";
import { SystemGauges } from "@/components/admin/SystemGauges";
import { DonutChart } from "@/components/ds/DonutChart";

export const metadata = { title: "대시보드 — 백오피스" };

/**
 * 콘텐츠 구성 — 시안 정본 11번의 비율 그대로(합성). 색은 전부 토큰이다:
 * 게시글·리뷰는 활동 추이의 두 계열과 같은 짝(--accent/--ds-purple),
 * 댓글은 별점 앰버(--star), 실적 인증은 중립 선색(--line-2).
 */
const CONTENT_MIX = [
  { label: "게시글", value: 46, color: "var(--accent)" },
  { label: "리뷰", value: 26, color: "var(--ds-purple)" },
  { label: "댓글", value: 16, color: "var(--star)" },
  { label: "실적 인증", value: 12, color: "var(--line-2)" },
];

/** P1 재조립 — 지표는 ds Stat, 추이는 ds TrendChart, 도넛·게이지도 ds 킷으로 */
export default function AdminPage() {
  return (
    <>
      {/* 기간 세그먼트 · 지표 · 활동 추이는 상태를 공유하므로 한 컴포넌트다.
          옆 칸(콘텐츠 구성)은 기간과 무관해 그대로 넘긴다. */}
      <DashboardMetrics>
        <div className="chartcard">
          <div className="chd">
            <h4>콘텐츠 구성</h4>
          </div>
          <DonutChart
            data={CONTENT_MIX}
            size={150}
            thickness={16}
            centerValue="4.2천"
            centerLabel="전체 콘텐츠"
          />
        </div>
      </DashboardMetrics>

      <div className="dashgrid" style={{ marginBottom: "0" }}>
        <OpsQueue />
        <SystemGauges />
      </div>
    </>
  );
}
