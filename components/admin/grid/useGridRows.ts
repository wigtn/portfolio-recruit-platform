"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { computeWindow } from "@wigtn/ui-kit/table/window";

/**
 * 데이터 그리드 표 킷 — 행 훅 3종 (선행 프로젝트 P1에서 이식).
 *
 * - `useWindowedRows` — 뷰포트 기반 가상 스크롤. 임계치 이하에서는 꺼진다.
 * - `useFlipRows` — 정렬로 순서가 바뀌면 이전 자리에서 제자리로 미끄러진다.
 * - `useVisitedRows` — 열어본 행을 표시한다. "어디까지 봤더라"를 표가 기억한다.
 *
 * 창 계산은 ui-kit 순수 코어(`@wigtn/ui-kit/table/window`)가 한다.
 */

export interface WindowedRows {
  /** 스크롤 컨테이너에 연결하는 콜백 ref — 탭 전환으로 재마운트돼도 다시 붙는다 */
  containerRef: (el: HTMLDivElement | null) => void;
  /** 첫 데이터 행에 연결 — 실제 행 높이 보정용(활성 세션당 1회) */
  measureRef: (el: HTMLElement | null) => void;
  start: number;
  end: number;
  padTop: number;
  padBottom: number;
  /** 윈도잉이 켜졌는지 — 꺼져 있으면 전체 렌더 + FLIP */
  active: boolean;
}

export function useWindowedRows(
  total: number,
  opts?: { estimateRowHeight?: number; overscan?: number; threshold?: number },
): WindowedRows {
  const estimate = opts?.estimateRowHeight ?? 48;
  const overscan = opts?.overscan ?? 10;
  const threshold = opts?.threshold ?? 120;

  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const containerRef = useCallback(
    (el: HTMLDivElement | null) => setContainer(el),
    [],
  );

  const [scrollTop, setScrollTop] = useState(0);
  const [viewportH, setViewportH] = useState(0);
  const [rowHeight, setRowHeight] = useState(estimate);
  // 행 높이는 활성 세션당 1회만 재는 래치다. 매번 재면 서로 높이가 다른 경계 행이
  // 번갈아 뽑혀 rowHeight가 진동하고, 그대로 리렌더 루프가 된다.
  const measured = useRef(false);

  const active = total > threshold;

  const measureRef = useCallback((el: HTMLElement | null) => {
    if (!el || measured.current) return;
    const h = el.getBoundingClientRect().height;
    if (h > 0) {
      measured.current = true;
      setRowHeight(h);
    }
  }, []);

  useEffect(() => {
    if (!active) measured.current = false;
  }, [active]);

  // 뷰포트 높이는 첫 페인트 전에 잰다
  useLayoutEffect(() => {
    if (!container || !active) return;
    const sync = () => {
      setViewportH(container.clientHeight);
      setScrollTop(container.scrollTop);
    };
    sync();
    const onScroll = () => setScrollTop(container.scrollTop);
    container.addEventListener("scroll", onScroll, { passive: true });
    const observer = new ResizeObserver(sync);
    observer.observe(container);
    return () => {
      container.removeEventListener("scroll", onScroll);
      observer.disconnect();
    };
  }, [container, active]);

  if (!active) {
    return {
      containerRef,
      measureRef,
      start: 0,
      end: total,
      padTop: 0,
      padBottom: 0,
      active: false,
    };
  }

  const win = computeWindow({
    scrollTop,
    viewportH: viewportH || estimate * 12,
    rowHeight,
    total,
    overscan,
  });
  return { containerRef, measureRef, ...win, active: true };
}

/**
 * 정렬로 행 순서가 바뀌면 이전 위치에서 제자리로 미끄러진다(FLIP).
 * 어떤 행이 어디로 갔는지 눈으로 따라갈 수 있어야 정렬이 납득된다.
 */
export function useFlipRows(dep: unknown) {
  const rowEls = useRef(new Map<string, HTMLTableRowElement>());
  const rowTops = useRef(new Map<string, number>());

  const registerRow = useCallback(
    (key: string, el: HTMLTableRowElement | null) => {
      if (el) rowEls.current.set(key, el);
      else rowEls.current.delete(key);
    },
    [],
  );

  useLayoutEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    ) {
      rowTops.current = new Map(
        [...rowEls.current].map(([key, el]) => [key, el.offsetTop]),
      );
      return;
    }
    const next = new Map<string, number>();
    for (const [key, el] of rowEls.current) {
      const top = el.offsetTop;
      const prev = rowTops.current.get(key);
      if (prev != null && prev !== top) {
        el.style.transition = "none";
        el.style.transform = `translateY(${prev - top}px)`;
        requestAnimationFrame(() => {
          el.style.transition =
            "transform 340ms cubic-bezier(0.22, 1, 0.36, 1)";
          el.style.transform = "";
        });
      }
      next.set(key, top);
    }
    rowTops.current = next;
  }, [dep]);

  return registerRow;
}

const VISITED_CAP = 500;

/** 열어본 행 — 목록으로 돌아왔을 때 어디까지 봤는지 표가 대신 기억한다 */
export function useVisitedRows(storageKey?: string) {
  const [visited, setVisited] = useState<Set<string>>(() => new Set());

  // 복원은 마운트 후에 — 서버는 항상 "미열람"으로 그려야 hydration이 어긋나지 않는다
  useEffect(() => {
    if (!storageKey) return;
    try {
      const raw = window.sessionStorage.getItem(storageKey);
      if (raw) setVisited(new Set(JSON.parse(raw) as string[]));
    } catch {
      /* 저장소를 못 쓰면 메모리로만 동작한다 */
    }
  }, [storageKey]);

  const visit = useCallback(
    (key: string) => {
      setVisited((prev) => {
        if (prev.has(key)) return prev;
        const next = new Set(prev);
        next.add(key);
        if (storageKey) {
          try {
            window.sessionStorage.setItem(
              storageKey,
              JSON.stringify([...next].slice(-VISITED_CAP)),
            );
          } catch {
            /* 저장 실패 무시 */
          }
        }
        return next;
      });
    },
    [storageKey],
  );

  return { visited, visit };
}
