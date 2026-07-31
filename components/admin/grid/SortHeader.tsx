"use client";

import { useCallback, useRef, useState } from "react";
import {
  applySortChain,
  nextSortChain,
  type SortChainEntry,
} from "@wigtn/ui-kit/table/sort";
import { Icon } from "@/components/Icon";
import { useColumnResize } from "./ColumnResize";

/**
 * 데이터 그리드 표 킷 — 정렬 컬럼 헤더 (선행 프로젝트 P1에서 이식).
 *
 * 상용 데이터 그리드(AG Grid 계열)의 표준 동작을 그대로 따른다:
 * - 일반 클릭: 이 컬럼 **단독** 정렬. asc → desc → 해제 3단 순환.
 * - Shift+클릭: 다중 정렬에 **추가**. 그 컬럼만 asc → desc → 제거, 나머지 유지.
 * - 정렬 가능한 컬럼은 미정렬 상태에서도 아이콘을 저채도로 상시 노출한다 —
 *   호버해야 보이면 "정렬되는 표"라는 걸 아무도 모른다.
 *
 * 순서 결정은 ui-kit의 순수 코어(`@wigtn/ui-kit/table/sort`)가 한다.
 * 여기는 그 코어에 붙는 표현 레이어일 뿐이라 정렬 규칙이 갈릴 일이 없다.
 */
export type { SortChainEntry };

/** 정렬 체인 상태 훅. `defaultChain`은 사용자가 손대기 전까지의 초기 정렬. */
export function useSortChain<T>(
  getters: Record<string, (row: T) => unknown>,
  defaultChain: SortChainEntry[] = [],
) {
  // 초기값 고정 — 렌더마다 배열 리터럴이 새로 생겨도 리셋 기준은 그대로다
  const defaultRef = useRef(defaultChain);
  const [chain, setChain] = useState<SortChainEntry[]>(defaultRef.current);

  const onSort = useCallback((key: string, additive = false) => {
    setChain((current) => nextSortChain(current, key, additive));
  }, []);

  const sortOf = useCallback(
    (key: string) => chain.find((entry) => entry.key === key) ?? null,
    [chain],
  );

  const sortRows = useCallback(
    (rows: T[]) => applySortChain(rows, chain, getters),
    // getters는 모듈 상수로 넘기는 걸 전제한다(매 렌더 새 객체면 정렬이 매번 다시 돈다)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [chain],
  );

  const reset = useCallback(() => setChain(defaultRef.current), []);

  return { chain, onSort, sortOf, sortRows, reset };
}

export function SortHeader({
  label,
  sortKey,
  sort,
  onSort,
  order,
  align = "left",
  className,
}: {
  label: string;
  sortKey: string;
  sort: SortChainEntry | null;
  onSort: (key: string, additive?: boolean) => void;
  /** 다중 정렬일 때 이 컬럼의 우선순위(1부터). 단일 정렬이면 넘기지 않는다. */
  order?: number;
  align?: "left" | "right" | "center";
  className?: string;
}) {
  const resize = useColumnResize();
  const thRef = useRef<HTMLTableCellElement>(null);
  const active = Boolean(sort);

  return (
    <th
      ref={thRef}
      className={[
        "gth",
        active ? "is-sorted" : "",
        align !== "left" ? `is-${align}` : "",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-sort={
        active ? (sort!.dir === "asc" ? "ascending" : "descending") : "none"
      }
    >
      <button
        type="button"
        className="gth-btn"
        onClick={(event) => onSort(sortKey, event.shiftKey)}
        title="클릭: 이 컬럼으로 정렬(오름차순 → 내림차순 → 해제), Shift+클릭: 다중 정렬에 추가"
        aria-label={`${label} 정렬`}
      >
        <span className="gth-label">{label}</span>
        <Icon name={active ? (sort!.dir === "asc" ? "up" : "down") : "sort"} />
        {order ? <span className="gth-order">{order}</span> : null}
      </button>

      {resize ? (
        /* 리사이즈 핸들 — 정렬 클릭과 분리된 오른쪽 가장자리 영역.
           구분선은 항상 은은히 보이고, 잡는 순간 인디고로 굵어진다. */
        <span
          className={
            resize.resizing === thRef.current?.cellIndex
              ? "gth-grip is-active"
              : "gth-grip"
          }
          onPointerDown={(event) =>
            resize.startResize(
              thRef.current?.cellIndex ?? 0,
              event,
              thRef.current,
            )
          }
          onClick={(event) => event.stopPropagation()}
          role="separator"
          aria-orientation="vertical"
          aria-label={`${label} 열 너비 조정`}
        >
          <i />
        </span>
      ) : null}
    </th>
  );
}
