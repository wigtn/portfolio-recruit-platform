import { Sk } from "@/components/Skeleton";
import { RouteSk, StatSk } from "@/components/admin/RouteSkeleton";

/** 운영 큐 행별 실측 높이 — OpsQueue의 스켈레톤과 같은 값(1440px 기준) */
const QUEUE_ROW_H = [54.8, 64.8, 54.8, 54.8, 54.8];

/**
 * 대시보드 스켈레톤 — 지표 4장(ds-stat) · 추이(200px) · 도넛(150px) ·
 * 운영 큐 5행 · 게이지 6개의 자리를 실제 배치 그대로 잡는다.
 */
export default function AdminLoading() {
  return (
    <RouteSk label="대시보드">
      {/* 기간 세그(오늘/7일/30일) 자리 — 실측 176×33, 우측 정렬 */}
      <div className="ahd" aria-hidden>
        <Sk w={176} h={42} r={8} />
      </div>
      <div className="ds-statrow">
        {Array.from({ length: 4 }).map((_, index) => (
          <StatSk key={index} />
        ))}
      </div>

      <div className="dashgrid">
        <div className="chartcard" aria-hidden>
          <div className="chd">
            <h4>활동 추이</h4>
          </div>
          <Sk w="100%" h={200} r={10} />
        </div>
        <div className="chartcard" aria-hidden>
          <div className="chd">
            <h4>콘텐츠 구성</h4>
          </div>
          <div className="ds-donut">
            <Sk w={150} h={150} r={999} />
            <div style={{ display: "grid", gap: 14, flex: 1 }}>
              {Array.from({ length: 4 }).map((_, index) => (
                <Sk key={index} w="82%" h={12} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="dashgrid" style={{ marginBottom: 0 }}>
        <div className="chartcard" aria-hidden>
          <div className="chd">
            <h4>운영 큐</h4>
          </div>
          {/* 코치 말풍선(40.8px) — 실물이 기본 표시라 자리도 같이 잡는다 */}
          <div className="coachwrap">
            <div className="coach up">
              <span className="cb">데모</span>
              <span className="ct">
                항목을 누르면 <b>실제 작업 화면</b>으로 이어져요
              </span>
            </div>
          </div>
          {/* 실제 큐 목록(ul)의 행 사이 8px 간격까지 미러링한다 */}
          <div style={{ display: "grid", rowGap: 8 }}>
            {QUEUE_ROW_H.map((height, index) => (
              <div
                key={index}
                style={{
                  height,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <Sk w={34} h={34} r={10} />
                <Sk w="46%" h={13} />
                <Sk w={26} h={13} style={{ marginLeft: "auto" }} />
              </div>
            ))}
          </div>
        </div>
        <div className="chartcard" aria-hidden>
          <div className="chd">
            <h4>시스템, AI 모니터링</h4>
          </div>
          <div className="ds-monlist">
            {/* 행 기하는 실물과 같은 .ds-monrow가 만든다 — 게이지 높이는
                92×(100/180)=51.11 실측, 텍스트는 행 높이에 영향 없는 자리만 */}
            {Array.from({ length: 6 }).map((_, index) => (
              <div className="ds-monrow" key={index}>
                <Sk w={92} h={51.11} r={10} />
                <div style={{ display: "grid", gap: 5 }}>
                  <Sk w={112} h={13} />
                  <Sk w={68} h={12} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </RouteSk>
  );
}
