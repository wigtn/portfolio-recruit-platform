"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@/components/Icon";

/**
 * 아이콘 호버 툴팁 — P1 문법.
 *
 * body 포털 + fixed 배치라 overflow·스태킹 함정에 안 걸린다. 150ms 지연
 * 표시(스쳐 지나갈 때 안 뜬다) · 이탈 즉시 소멸 · 스프링 팝 등장.
 */
export function IconTip({
  label,
  icon = "alert",
  wide = false,
  down = false,
}: {
  label: string;
  icon?: string;
  /** 여러 줄 설명용 넓은 판 */
  wide?: boolean;
  /** 아래로 펼침 (기본은 위) */
  down?: boolean;
}) {
  const anchorRef = useRef<HTMLSpanElement>(null);
  const timerRef = useRef<number | null>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  const show = () => {
    timerRef.current = window.setTimeout(() => {
      const rect = anchorRef.current?.getBoundingClientRect();
      if (!rect) return;
      setPos({
        x: rect.left + rect.width / 2,
        y: down ? rect.bottom + 8 : rect.top - 8,
      });
    }, 150);
  };
  const hide = () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    setPos(null);
  };
  useEffect(
    () => () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    },
    [],
  );

  return (
    <span
      ref={anchorRef}
      className="ds-tipanchor"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      tabIndex={0}
      role="note"
      aria-label={label}
    >
      <Icon name={icon} />
      {pos
        ? createPortal(
            <span
              className={[
                "ds-tip",
                wide ? "is-wide" : "",
                down ? "is-down" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              style={{ left: pos.x, top: pos.y }}
              aria-hidden
            >
              {label}
            </span>,
            document.body,
          )
        : null}
    </span>
  );
}
