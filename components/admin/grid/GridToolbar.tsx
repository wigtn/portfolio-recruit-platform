"use client";

import { Icon } from "@/components/Icon";
import type { SortChainEntry } from "./SortHeader";

/**
 * 그리드 상태 줄 — 표 위에 지금 무엇이 걸려 있는지 적는다.
 *
 * 정렬이 헤더 아이콘으로만 표시되면, 다중 정렬을 걸어 둔 채 스크롤을 내린
 * 사람은 자기가 무슨 순서를 보고 있는지 모른다. 걸린 정렬을 문장으로 적고
 * 한 번에 푸는 버튼을 둔다. 총 건수도 여기서 말한다 — 표 안에 세는 곳이 없다.
 */
export function GridToolbar({
  total,
  filtered,
  chain,
  labels,
  onReset,
  selection,
}: {
  /** 필터 전 전체 건수 */
  total: number;
  /** 지금 표에 그려진 건수 */
  filtered: number;
  chain: SortChainEntry[];
  /** 정렬 키 → 사람이 읽는 컬럼 이름 */
  labels: Record<string, string>;
  onReset: () => void;
  /** 체크박스 선택 상태 — 있으면 같은 바가 일괄 액션 모드로 바뀐다.
      별도 바를 위에 얹으면 표 전체가 43px 움찔거린다(절대 금지). */
  selection?: {
    count: number;
    unit?: string;
    actions: React.ReactNode;
    onClear: () => void;
  };
}) {
  if (selection && selection.count > 0) {
    return (
      <div className="gtoolbar is-bulk">
        <span className="gtoolbar-count">
          <b>{selection.count}</b>
          {selection.unit ?? "건"} 선택
        </span>
        <span className="gtoolbar-sep" aria-hidden />
        <span className="gtoolbar-bulkacts">{selection.actions}</span>
        <button
          type="button"
          className="gtoolbar-clear"
          style={{ marginLeft: "auto" }}
          onClick={selection.onClear}
        >
          선택 해제
          <Icon name="x" />
        </button>
      </div>
    );
  }
  return (
    <div className="gtoolbar">
      <span className="gtoolbar-count">
        <b>{filtered.toLocaleString()}</b>
        {filtered === total ? "건" : `건 / 전체 ${total.toLocaleString()}건`}
      </span>

      {chain.length > 0 ? (
        <span className="gtoolbar-sort">
          <span className="gtoolbar-sep" aria-hidden />
          정렬
          {chain.map((entry, index) => (
            <span className="gtoolbar-chip" key={entry.key}>
              {index > 0 ? <em>그다음</em> : null}
              {labels[entry.key] ?? entry.key}
              <Icon name={entry.dir === "asc" ? "up" : "down"} />
            </span>
          ))}
          <button type="button" className="gtoolbar-clear" onClick={onReset}>
            해제
            <Icon name="x" />
          </button>
        </span>
      ) : (
        <span className="gtoolbar-hint">
          <span className="gtoolbar-sep" aria-hidden />
          컬럼 제목을 눌러 정렬 · Shift+클릭으로 조건 추가
        </span>
      )}
    </div>
  );
}
