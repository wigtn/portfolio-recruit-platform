"use client";

import { useEffect, useState } from "react";
import { QueueSummary } from "@wigtn/backoffice-frame/components/queue-summary";
import { Icon } from "../Icon";
import { Sk, SkRegion } from "@/components/Skeleton";
import { QUEUE } from "@/lib/admin/dashboard";
import {
  loadState,
  subscribeState,
  type AdminState,
} from "@/lib/admin/overlay";
import { openQuestions } from "@/lib/admin/seed";
import { tabOf } from "@/lib/admin/reports";

/**
 * 운영 큐의 데이터·코치만 앱이 소유하고 목록 표현과 안전 링크 판정은 모듈이 맡는다.
 *
 * count는 하드코딩하지 않는다 — 신고·증빙·중복·답변 없는 질문은 담당 화면과 같은
 * 오버레이에서 실측한다. 대시보드가 "8건"이라는데 담당 화면이 "4건"이면 큐를
 * 믿을 수 없게 된다. 데이터 근거가 없는 항목(AI 생성 실패)만 시드 값 그대로 둔다.
 */
const LIVE_COUNT: Record<string, (state: AdminState) => number> = {
  "신고된 위험 콘텐츠": (state) =>
    state.reports.filter((row) => tabOf(row) === "open").length,
  "답변 없는 질문": (state) => openQuestions(state.answers).length,
  "증빙 검토 대기": (state) =>
    state.evidence.filter((row) => row.status === "대기").length,
  "회사 중복 · 사명 변경 확인": (state) =>
    state.companies.filter((row) => row.status === "중복 의심").length,
};

/**
 * 시드(dashboard.ts QUEUE)의 목적지·부기 덮어쓰기 — "답변 없는 질문"은 예전에
 * 커뮤니티 목록(사용자 화면)으로 나갔다. 백오피스 담당 화면이 생겼으니 그쪽으로
 * 잇고, 실측과 안 맞는 "48시간 경과" 부기는 걷는다. (QUEUE 자체는 타 소유 파일)
 */
const QUEUE_OVERRIDE: Record<string, { href?: string; note?: string }> = {
  "답변 없는 질문": { href: "/admin/questions", note: "" },
};

/** 큐 행별 실측 높이(1440px) — 스켈레톤이 실제 모듈 렌더와 같은 자리를 잡는다 */
const QUEUE_ROW_H = [54.8, 54.8, 54.8, 54.8, 54.8];

export function OpsQueue() {
  const [coach, setCoach] = useState(true);
  const [state, setState] = useState<AdminState | null>(null);

  // 조치 즉시(같은 탭 커스텀 이벤트) · 다른 탭 제출(storage)에 함께 따라간다
  useEffect(() => {
    const sync = () => setState(loadState());
    sync();
    return subscribeState(sync);
  }, []);

  return (
    <div className="chartcard">
      <div className="chd">
        <h4>운영 큐</h4>
        <span style={{ fontSize: "12px", color: "var(--ink-3)" }}>
          처리가 필요한 항목
        </span>
      </div>

      {coach ? (
        <div className="coachwrap">
          <div className="coach up">
            <span className="cb">데모</span>
            <span className="ct">
              항목을 누르면 <b>실제 작업 화면</b>으로 이어져요
            </span>
            <button
              className="cx"
              onClick={() => setCoach(false)}
              aria-label="안내 닫기"
            >
              <Icon name="x" />
            </button>
          </div>
        </div>
      ) : null}

      <div className="module-surface dashboard-queue">
        {state ? (
          <QueueSummary
            output={{
              queues: QUEUE.map((item) => ({
                label: item.label,
                note: QUEUE_OVERRIDE[item.label]?.note ?? item.note ?? "",
                count: LIVE_COUNT[item.label]?.(state) ?? item.count,
                href: QUEUE_OVERRIDE[item.label]?.href ?? item.href,
                icon: item.icon,
              })),
            }}
            renderIcon={(name) => <Icon name={name} />}
          />
        ) : (
          <SkRegion label="운영 큐">
            {/* 실제 큐 목록(ul)은 행 사이 8px 간격이 있다 — 없으면 32px 짧아진다 */}
            <div style={{ display: "grid", rowGap: 8 }} aria-hidden>
              {QUEUE.map((item, index) => (
                <div
                  key={item.label}
                  style={{
                    height: QUEUE_ROW_H[index % QUEUE_ROW_H.length],
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
          </SkRegion>
        )}
      </div>
    </div>
  );
}
