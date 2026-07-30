"use client";

import { useCallback, useRef, useState } from "react";

/**
 * 세로 목록 드래그 정렬 — 의존성 없는 포인터 구현.
 *
 * P1은 dnd-kit을 쓰지만 이 데모는 런타임 의존을 늘리지 않는다(토스트와
 * 같은 결정). 동작 감각은 같게 맞춘다: 핸들을 잡으면 해당 행이 포인터를
 * 따라오고, 나머지 행이 FLIP처럼 자리를 비켜 준다(200ms 감속). 놓으면
 * onMove(from, to)로 확정 — 저장은 호출부의 "변경 저장" 버튼 몫이다.
 *
 * 키보드: 핸들 포커스 후 ↑/↓로 한 칸씩 이동(드래그의 대체 수단).
 *
 * 사용:
 *   const drag = useDragSort(items.length, (from, to) => reorder(from, to));
 *   <div ref={drag.itemRef(i)} style={drag.itemStyle(i)} ...>
 *     <button className="ds-draghandle" {...drag.handleProps(i)}>⋮⋮</button>
 */
export function useDragSort(
  count: number,
  onMove: (from: number, to: number) => void,
) {
  const itemEls = useRef<Array<HTMLElement | null>>([]);
  const [dragging, setDragging] = useState<number | null>(null);
  const [dy, setDy] = useState(0);
  const [target, setTarget] = useState<number | null>(null);
  const session = useRef<{
    startY: number;
    centers: number[];
    height: number;
  } | null>(null);

  const itemRef = useCallback(
    (index: number) => (el: HTMLElement | null) => {
      itemEls.current[index] = el;
    },
    [],
  );

  const finish = useCallback(
    (commit: boolean) => {
      if (commit && dragging !== null && target !== null && target !== dragging) {
        onMove(dragging, target);
      }
      session.current = null;
      setDragging(null);
      setTarget(null);
      setDy(0);
    },
    [dragging, target, onMove],
  );

  const handleProps = useCallback(
    (index: number) => ({
      onPointerDown: (event: React.PointerEvent) => {
        // 좌클릭·터치만. 텍스트 선택으로 새지 않게 기본 동작을 끊는다.
        if (event.button !== 0 && event.pointerType === "mouse") return;
        event.preventDefault();
        (event.currentTarget as HTMLElement).setPointerCapture(
          event.pointerId,
        );
        const rects = itemEls.current
          .slice(0, count)
          .map((el) => el?.getBoundingClientRect());
        session.current = {
          startY: event.clientY,
          centers: rects.map((r) => (r ? r.top + r.height / 2 : 0)),
          height: rects[index]?.height ?? 0,
        };
        setDragging(index);
        setTarget(index);
      },
      onPointerMove: (event: React.PointerEvent) => {
        const s = session.current;
        if (!s || dragging === null) return;
        const delta = event.clientY - s.startY;
        setDy(delta);
        // 잡은 행의 현재 중심이 어느 행 자리에 있는지로 목적지를 정한다
        const center = s.centers[dragging] + delta;
        let next = 0;
        for (let i = 0; i < count; i += 1) {
          if (center > s.centers[i]) next = i;
        }
        if (center < s.centers[0]) next = 0;
        setTarget(next);
      },
      onPointerUp: () => finish(true),
      onPointerCancel: () => finish(false),
      onKeyDown: (event: React.KeyboardEvent) => {
        if (event.key === "ArrowUp" && index > 0) {
          event.preventDefault();
          onMove(index, index - 1);
        } else if (event.key === "ArrowDown" && index < count - 1) {
          event.preventDefault();
          onMove(index, index + 1);
        }
      },
      role: "button" as const,
      tabIndex: 0,
      "aria-label": "드래그해서 순서 변경 (키보드: ↑/↓)",
    }),
    [count, dragging, finish, onMove],
  );

  /** 행에 얹을 transform — 잡은 행은 포인터를, 나머지는 비켜 줄 자리를 따른다 */
  const itemStyle = useCallback(
    (index: number): React.CSSProperties => {
      const s = session.current;
      if (dragging === null || !s) return {};
      if (index === dragging) {
        return {
          transform: `translateY(${dy}px)`,
          zIndex: 5,
          position: "relative",
          transition: "none",
          cursor: "grabbing",
        };
      }
      const t = target ?? dragging;
      let shift = 0;
      if (dragging < t && index > dragging && index <= t) shift = -s.height;
      if (dragging > t && index >= t && index < dragging) shift = s.height;
      return {
        transform: shift ? `translateY(${shift}px)` : undefined,
        transition: "transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
      };
    },
    [dragging, dy, target],
  );

  return { itemRef, handleProps, itemStyle, dragging };
}
