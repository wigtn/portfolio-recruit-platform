"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

/**
 * 데이터 그리드 표 킷 — 컬럼 너비 고정 + 드래그 리사이즈 (선행 프로젝트 P1에서 이식).
 *
 * `<table>`을 이 provider로 감싸면 표 코드를 고치지 않고 두 가지가 생긴다:
 * 1. 최초 1회 헤더 너비를 실측해 `<colgroup>` + `table-layout: fixed`로 **고정**한다.
 *    정렬이나 검색으로 보이는 행이 바뀌어도 컬럼 폭이 다시 계산되지 않아 표가 움찔거리지 않는다.
 * 2. 헤더 오른쪽 가장자리를 끌어 폭을 조정한다. 표별 `storageKey`로 브라우저에 남는다.
 *
 * 구현은 `cloneElement`로 자식 `<table>`에 ref·colgroup·style을 주입한다 —
 * DOM을 직접 만지지 않아 React가 그린 트리와 어긋날 일이 없다.
 */
const MIN_WIDTH = 48;

interface ColumnResizeCtx {
  startResize: (
    colIndex: number,
    event: React.PointerEvent,
    th: HTMLElement | null,
  ) => void;
  /** 드래그 중인 컬럼 index — 핸들 강조용 */
  resizing: number | null;
}

const Ctx = createContext<ColumnResizeCtx | null>(null);

export const useColumnResize = () => useContext(Ctx);

export function ColumnResizeProvider({
  storageKey,
  children,
}: {
  storageKey: string;
  children: React.ReactNode;
}) {
  const tableRef = useRef<HTMLTableElement | null>(null);
  const [widths, setWidths] = useState<number[]>([]);
  const [resizing, setResizing] = useState<number | null>(null);
  const widthsRef = useRef(widths);
  widthsRef.current = widths;

  // 최초 측정 또는 저장값 복원 — 헤더 첫 행 <th>의 현재(auto) 너비를 실측해 고정한다
  useLayoutEffect(() => {
    const table = tableRef.current;
    if (!table) return;
    const ths = table.querySelectorAll<HTMLTableCellElement>(
      "thead tr:first-child > th",
    );
    if (ths.length === 0) return;

    let restored: number[] | null = null;
    try {
      const raw = window.localStorage.getItem(`colw:${storageKey}`);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (
          Array.isArray(parsed) &&
          parsed.length === ths.length &&
          parsed.every((value) => typeof value === "number" && value > 0)
        ) {
          restored = parsed as number[];
        }
      }
    } catch {
      /* 프라이빗 모드 등 저장소 접근 실패는 무시 — 실측으로 시작한다 */
    }

    setWidths(
      restored ??
        Array.from(ths).map((th) =>
          Math.max(MIN_WIDTH, Math.round(th.getBoundingClientRect().width)),
        ),
    );
  }, [storageKey]);

  const persist = useCallback(
    (next: number[]) => {
      try {
        window.localStorage.setItem(`colw:${storageKey}`, JSON.stringify(next));
      } catch {
        /* 저장 실패는 무시 — 이번 세션에서는 그대로 동작한다 */
      }
    },
    [storageKey],
  );

  const startResize = useCallback(
    (colIndex: number, event: React.PointerEvent, th: HTMLElement | null) => {
      event.preventDefault();
      event.stopPropagation(); // 정렬 클릭과 분리
      const startX = event.clientX;
      const startWidth =
        widthsRef.current[colIndex] ?? th?.getBoundingClientRect().width ?? 120;

      setResizing(colIndex);
      const prevCursor = document.body.style.cursor;
      const prevSelect = document.body.style.userSelect;
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";

      const onMove = (moveEvent: PointerEvent) => {
        const width = Math.max(
          MIN_WIDTH,
          Math.round(startWidth + (moveEvent.clientX - startX)),
        );
        setWidths((prev) => {
          if (prev[colIndex] === width) return prev;
          const next = prev.slice();
          next[colIndex] = width;
          return next;
        });
      };
      const onUp = () => {
        document.removeEventListener("pointermove", onMove);
        document.removeEventListener("pointerup", onUp);
        document.body.style.cursor = prevCursor;
        document.body.style.userSelect = prevSelect;
        setResizing(null);
        persist(widthsRef.current);
      };
      document.addEventListener("pointermove", onMove);
      document.addEventListener("pointerup", onUp);
    },
    [persist],
  );

  const child = React.Children.only(children) as React.ReactElement<{
    style?: React.CSSProperties;
    children?: React.ReactNode;
  }>;
  const frozen = widths.length > 0;

  const cloned = React.cloneElement(
    child,
    {
      ref: tableRef,
      "data-col-resize": "",
      style: {
        ...(child.props.style ?? {}),
        ...(frozen ? { tableLayout: "fixed" as const } : {}),
      },
    } as React.Attributes,
    <>
      {frozen ? (
        <colgroup>
          {widths.map((width, index) => (
            <col key={index} style={{ width }} />
          ))}
        </colgroup>
      ) : null}
      {child.props.children}
    </>,
  );

  return (
    <Ctx.Provider value={{ startResize, resizing }}>{cloned}</Ctx.Provider>
  );
}
