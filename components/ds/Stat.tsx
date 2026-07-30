"use client";

import { SlotNumber } from "./SlotNumber";
import { Icon } from "@/components/Icon";

/**
 * 지표 카드 — P1 관리자 대시보드의 Stat 문법.
 *
 * 등장은 index * 60ms 스태거의 scale-in, 값은 슬롯 릴. 색은 tint 4종이
 * 전부다 — 지표마다 색을 새로 고르기 시작하면 색이 정보가 아니라 장식이 된다.
 */
export type StatTint = "brand" | "success" | "warn" | "danger";

export function Stat({
  icon,
  tint = "brand",
  label,
  value,
  suffix,
  sub,
  index = 0,
}: {
  icon?: string;
  tint?: StatTint;
  label: string;
  value: number;
  suffix?: string;
  /** 값 아래 보조 문구 — "지난주 대비 +12" 같은 맥락 */
  sub?: React.ReactNode;
  /** 등장 스태거 순서 */
  index?: number;
}) {
  return (
    <div
      className={`ds-stat is-${tint}`}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="ds-stat-head">
        {icon ? (
          <span className="ds-stat-ic">
            <Icon name={icon} />
          </span>
        ) : null}
        <span className="ds-stat-label">{label}</span>
      </div>
      <div className="ds-stat-value">
        <SlotNumber value={value} />
        {suffix ? <small>{suffix}</small> : null}
      </div>
      {sub ? <div className="ds-stat-sub">{sub}</div> : null}
    </div>
  );
}
