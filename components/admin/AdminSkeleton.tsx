import { Sk } from "@/components/Skeleton";

/**
 * 백오피스 스켈레톤 조각 — useAdmin의 state가 null인 첫 프레임을 채운다.
 * ("use client"를 달지 않는다 — 훅이 없어 서버에서도 그릴 수 있고, 그래야
 * 각 라우트 loading.tsx가 같은 조각으로 화면 구조를 미러링할 수 있다.
 * Sk는 클라이언트 리프라 어느 쪽에서 불러도 문제없다.)
 *
 * 사용자 화면과 같은 절대 규칙을 따른다: 로딩은 스켈레톤으로, 스켈레톤→데이터 전환 시
 * 크기 변화 0. 그래서 행 높이는 유추가 아니라 렌더된 실제 표를 잰 값(1440px 기준)이고,
 * 행 수는 시드 기본값과 같게 맞춘다 — 첫 방문(오버레이 없음)에서 화면이 밀리지 않는다.
 *
 * 셀 너비는 고정 배열로 돌린다 — 난수를 쓰면 서버·클라이언트 렌더가 갈려 hydration이
 */

/**
 * dtable 한 행의 실측 높이 — 표마다 셀 구성이 달라 조금씩 다르다.
 * P1 그리드 문법 적용(셀 세로 패딩 12→10px)으로 전 행이 4px씩 낮아져 재실측했다.
 * 마지막 행은 구분선이 없어 1px 낮다 — 각 화면 rowHs 배열이 그 값을 든다.
 */
export const ROW_H = {
  /** 신고·회원·공지 표 (배지 셀 포함) */
  badge: 52.2,
  /** 증빙 검토 큐 */
  evidence: 46.2,
  /** 처리 기록 */
  audit: 45.2,
} as const;

const CELL_W = ["62%", "44%", "76%", "38%", "55%", "48%", "68%", "40%"];

/**
 * 표 몸통 스켈레톤 — thead는 실제 것을 그대로 쓰고 tbody 안에서만 바꿔 끼운다.
 * 내용이 줄바꿈되는 표는 행마다 높이가 다르다 — rowHs(실측 배열)가 오면 그대로,
 * 없으면 rowH 단일값으로 돌린다.
 */
export function SkRows({
  cols,
  rows,
  rowH = ROW_H.badge,
  rowHs,
}: {
  cols: number;
  rows: number;
  rowH?: number;
  rowHs?: readonly number[];
}) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr
          key={rowIndex}
          style={{ height: rowHs?.[rowIndex] ?? rowH }}
          aria-hidden
        >
          {Array.from({ length: cols }).map((_, colIndex) => (
            <td key={colIndex}>
              <Sk
                w={CELL_W[(rowIndex * 3 + colIndex) % CELL_W.length]}
                h={13}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

/** 지표 카드(.mcard) 스켈레톤 — mk(19.2px)·mv(40px) 줄 높이를 그대로 지킨다 */
export function SkMcard() {
  return (
    <div className="mcard" aria-hidden>
      <div className="mk" style={{ minHeight: 19.2 }}>
        <Sk w={56} h={12} />
      </div>
      <div
        className="mv"
        style={{ minHeight: 40, display: "flex", alignItems: "center" }}
      >
        <Sk w={38} h={22} />
      </div>
    </div>
  );
}

/** 그리드 툴바 자리 — 건수가 0으로 보였다가 튀는 것을 막는다(높이 30.2px 유지) */
export function SkToolbar() {
  return (
    <div className="gtoolbar" aria-hidden>
      <span
        className="gtoolbar-count"
        // 실제 카운트 문구의 줄 높이(19.2px)를 세운다 — 바(12px)만 두면
        // 툴바가 7px 낮아져 도착 순간 표 전체가 내려앉는다
        style={{
          display: "inline-flex",
          alignItems: "center",
          minHeight: 19.2,
        }}
      >
        <Sk w={90} h={12} />
      </span>
    </div>
  );
}
