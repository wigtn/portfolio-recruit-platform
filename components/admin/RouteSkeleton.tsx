import { Sk, SkRegion } from "@/components/Skeleton";
import { ROW_H, SkRows, SkToolbar } from "./AdminSkeleton";

/**
 * 라우트 스켈레톤 조각 — 각 admin loading.tsx가 화면 구조(헤더·지표 행·표
 * 프레임·컬럼 수·행 높이)를 미러링할 때 쓰는 공용 부품.
 *
 * P1 관례대로 정적으로 아는 것(제목·컬럼명·탭 라벨)은 **실물 그대로** 낸다 —
 * 스켈레톤 바로 바꾸면 글자 높이(17px)와 바 높이(12px)가 달라 도착 순간
 * 헤더가 5px 밀린다. 행 수는 "9~10개" 관례 대신 **시드 기본값**을 따른다 —
 * 절대 규칙(스켈레톤→데이터 크기 변화 0)이 우선이다.
 */

/** .ahd 액션 바 미러 — 제목은 셸 헤더가 말하므로 화면에는 액션만 남았다.
    actionW: 실제 버튼(들)의 실측 폭. 높이는 .btn.sm 30px 고정. */
export function AhdSk({ actionW = 86 }: { actionW?: number }) {
  return (
    <div className="ahd" aria-hidden>
      <Sk w={actionW} h={30} r={8} />
    </div>
  );
}

/** 표 카드 미러 — 컬럼명 배열이 곧 열 수. ""는 체크박스 열(34px)이다 */
export function TableCardSk({
  title,
  tabs,
  search,
  actions,
  cols,
  rows,
  rowH = ROW_H.badge,
  rowHs,
  toolbar = true,
}: {
  title: string;
  tabs?: string[];
  /** 헤더의 검색 상자(placeholder) — 있으면 tabletop 높이가 달라진다 */
  search?: string;
  /** 기능 버튼 자리 — 실측 폭 배열(h30). 버튼은 그리드 카드 안이 정위치다 */
  actions?: number[];
  /**
   * 문자열이 곧 컬럼명. 실물 표가 th에 width를 잡는 컬럼(조치 버튼 열 등)은
   * 같은 값을 여기에도 줘야 스켈레톤→데이터 전환에서 컬럼 경계가 안 움직인다.
   */
  cols: Array<string | { label: string; width: number }>;
  rows: number;
  rowH?: number;
  /** 줄바꿈으로 행 높이가 제각각인 표의 실측 배열(1440px 기준) */
  rowHs?: readonly number[];
  toolbar?: boolean;
}) {
  return (
    <div className="tablecard" aria-hidden>
      <div className="tabletop">
        <h4>{title}</h4>
        {search ? (
          <div className="search" style={{ maxWidth: 220, flex: "none" }}>
            <input placeholder={search} disabled />
          </div>
        ) : null}
        {tabs ? (
          <div className="seg">
            {tabs.map((label, index) => (
              <button
                key={label}
                className={index === 0 ? "on" : undefined}
                disabled
              >
                {label}
              </button>
            ))}
          </div>
        ) : null}
        {actions ? (
          <div style={{ display: "flex", gap: 8, flex: "none" }}>
            {actions.map((width, index) => (
              <Sk key={index} w={width} h={30} r={8} />
            ))}
          </div>
        ) : null}
      </div>
      {toolbar ? <SkToolbar /> : null}
      <table className="dtable">
        <thead>
          <tr>
            {cols.map((col, index) => {
              if (typeof col === "object") {
                return (
                  <th key={index} style={{ width: col.width }}>
                    {col.label}
                  </th>
                );
              }
              return col ? (
                <th key={index}>{col}</th>
              ) : (
                <th key={index} style={{ width: 34 }}>
                  <input type="checkbox" disabled aria-hidden />
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          <SkRows cols={cols.length} rows={rows} rowH={rowH} rowHs={rowHs} />
        </tbody>
      </table>
    </div>
  );
}

/** 지표 카드(ds-stat) 미러 — Stat과 같은 프레임이라 도착 시 덜컥이지 않는다 */
export function StatSk() {
  return (
    <div className="ds-stat" aria-hidden>
      <div className="ds-stat-head">
        <Sk w={38} h={38} r={12} />
        <Sk w={56} h={12} />
      </div>
      {/* 값 줄 30px·보조 줄 18px — 실제 타이포의 줄 높이를 그대로 세운다 */}
      <div className="ds-stat-value" style={{ alignItems: "center" }}>
        <Sk w={74} h={30} />
      </div>
      <div
        className="ds-stat-sub"
        // 실측 19.2px — 18로 두면 지표 행이 도착 순간 1.2px 내려앉는다
        style={{ display: "flex", alignItems: "center", minHeight: 19.2 }}
      >
        <Sk w={110} h={12} />
      </div>
    </div>
  );
}

/** 라우트 스켈레톤 공통 래퍼 — 카드 등장 모션을 끄고(.aload) 로딩을 알린다 */
export function RouteSk({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="aload">
      <SkRegion label={label}>{children}</SkRegion>
    </div>
  );
}

export { ROW_H };
