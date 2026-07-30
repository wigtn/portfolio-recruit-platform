"use client";

import { useEffect, useState } from "react";
import { RadialGauge } from "@/components/ds/RadialGauge";
import {
  loadState,
  subscribeState,
  type AdminState,
} from "@/lib/admin/overlay";

/**
 * 시스템 · AI 모니터링 — 게이지는 ds RadialGauge(P1 반원 게이지)로 그린다.
 *
 * 수치 자체는 합성이다 — 이 데모에 실제 지연·비용 측정치가 없다(근거를 아래
 * SYSTEM_GAUGES 주석에 남긴다). 대신 **안전 장치 상태는 오버레이 실측**이다:
 * AI 운영 화면에서 장치를 끄면 이 카드의 배지가 즉시 경고로 바뀐다 —
 * 대시보드가 실제 설정을 읽고 있다는 왕복을 보여주는 자리(OpsQueue 실측 패턴).
 */

/** 합성 게이지 시드 — 시안 정본 11번의 값 그대로. 측정할 실데이터가 없다. */
const SYSTEM_GAUGES: Array<{
  label: string;
  value: number;
  limit: number;
  unit: string;
}> = [
  { label: "AI 응답 지연 (p95)", value: 1.8, limit: 5, unit: "s" },
  { label: "AI 생성 실패율", value: 0.4, limit: 5, unit: "%" },
  { label: "이번 시간 호출", value: 7, limit: 20, unit: "회" },
  { label: "오늘 토큰 비용", value: 12.4, limit: 20, unit: "$" },
  // "한도 대비 사용량" 표현이라 값이 클수록 경고색이다. 성공률(높을수록 좋음)을
  // 그대로 넣으면 99.2%가 경고로 칠해진다 — 위험 쪽 수치로 뒤집어 읽는다.
  { label: "알림 발송 실패율", value: 0.8, limit: 5, unit: "%" },
  { label: "저장소 사용량", value: 7.4, limit: 20, unit: "GB" },
];

export function SystemGauges() {
  const [state, setState] = useState<AdminState | null>(null);

  // AI 화면의 조치 즉시(같은 탭) · 다른 탭 제출에도 배지가 따라온다
  useEffect(() => {
    const sync = () => setState(loadState());
    sync();
    return subscribeState(sync);
  }, []);

  const guards = state ? Object.values(state.ai.guards) : [];
  const offCount = guards.filter((on) => !on).length;

  return (
    <div className="chartcard">
      <div className="chd">
        <h4>시스템 · AI 모니터링</h4>
        {state ? (
          <span
            className="ds-guardbadge"
            style={offCount ? { color: "var(--hot)" } : undefined}
          >
            {offCount
              ? `안전 장치 ${offCount}개 꺼짐`
              : "안전 장치 3중 방어 가동"}
          </span>
        ) : null}
      </div>
      {/* 2×3 밀집 그리드를 세로 리스트로 — 게이지 6개가 110px 칸에 구겨지면
          라벨이 10.5px 말줄임으로 뭉개졌다. 행마다 게이지+텍스트를 가로로 놓아
          라벨(12.5px)·보조 수치가 제 크기로 읽힌다. */}
      <div className="ds-monlist">
        {SYSTEM_GAUGES.map((gauge) => {
          const ratio = gauge.value / gauge.limit;
          return (
            <div className="ds-monrow" key={gauge.label}>
              {/* 라벨은 행 우측 텍스트가 담당한다 — 게이지 중앙엔 %만 남긴다 */}
              <RadialGauge
                value={ratio}
                size={92}
                label=""
                // 한도의 80%를 넘으면 경고색 — 시안 게이지의 warn/bad 문법을 잇는다
                color={
                  ratio >= 0.8
                    ? "var(--hot)"
                    : ratio >= 0.6
                      ? "var(--star)"
                      : "var(--accent)"
                }
              />
              <div className="ds-montxt">
                <span className="lb">{gauge.label}</span>
                <small>
                  {gauge.value}
                  {gauge.unit} / {gauge.limit}
                  {gauge.unit}
                </small>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
