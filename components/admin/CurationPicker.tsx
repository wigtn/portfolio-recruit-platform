"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@/components/Icon";

/**
 * 큐레이션 픽커 — "실재 목록에서 고르는" 자리의 전용 컴포넌트.
 *
 * 네이티브 select는 검색이 없고, 후보가 40개(글)면 스크롤 지옥이 된다.
 * 검색창 + 풍부한 행(로고·평점·게시판·조회수) + 키보드(↑↓ Enter Esc)로,
 * 행을 누르는 순간 추가까지 끝난다 — 고르고 나서 또 "추가"를 누를 이유가 없다.
 */
export type PickItem = {
  value: string;
  title: string;
  sub?: string;
  meta?: string;
  leading?: React.ReactNode;
};

export function CurationPicker({
  title,
  searchPlaceholder,
  items,
  emptyNote,
  onPick,
  onClose,
}: {
  title: string;
  searchPlaceholder: string;
  items: PickItem[];
  /** 후보가 0일 때 — 전부 이미 배치된 경우의 설명 */
  emptyNote: string;
  onPick: (value: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // 모달이 뜨면 바로 타이핑 — 검색이 이 컴포넌트의 존재 이유다
    const timer = window.setTimeout(() => inputRef.current?.focus(), 30);
    return () => window.clearTimeout(timer);
  }, []);

  const needle = query.trim().toLowerCase();
  const shown = useMemo(
    () =>
      items.filter(
        (item) =>
          !needle ||
          `${item.title} ${item.sub ?? ""}`.toLowerCase().includes(needle),
      ),
    [items, needle],
  );

  useEffect(() => setActive(0), [needle]);

  // 키보드 이동 시 활성 행이 보이게 스크롤을 따라간다
  useEffect(() => {
    listRef.current
      ?.querySelector(".pickrow.is-active")
      ?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") return onClose();
    if (shown.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((i) => (i + 1) % shown.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => (i <= 0 ? shown.length - 1 : i - 1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      onPick(shown[active].value);
    }
  };

  if (!mounted) return null;

  return createPortal(
    <div
      className="modalwrap"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="modal pickmodal"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="pickhd">
          <h3>{title}</h3>
          <button className="tipclose" aria-label="닫기" onClick={onClose}>
            <Icon name="x" />
          </button>
        </div>

        <div className="picksearch">
          <Icon name="search" />
          <input
            ref={inputRef}
            value={query}
            placeholder={searchPlaceholder}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={onKeyDown}
            aria-label={searchPlaceholder}
          />
        </div>

        <div className="picklist" ref={listRef} role="listbox">
          {items.length === 0 ? (
            <div className="pickempty">{emptyNote}</div>
          ) : shown.length === 0 ? (
            <div className="pickempty">
              “{query.trim()}” 결과가 없어요 — 다른 말로 찾아보세요
            </div>
          ) : (
            shown.map((item, index) => (
              <button
                key={item.value}
                type="button"
                role="option"
                aria-selected={index === active}
                className={index === active ? "pickrow is-active" : "pickrow"}
                onMouseEnter={() => setActive(index)}
                onClick={() => onPick(item.value)}
              >
                {item.leading ? (
                  <span className="pickrow-lead">{item.leading}</span>
                ) : null}
                <span className="pickrow-main">
                  <b>{item.title}</b>
                  {item.sub ? <small>{item.sub}</small> : null}
                </span>
                {item.meta ? (
                  <span className="pickrow-meta">{item.meta}</span>
                ) : null}
                <Icon name="plus" />
              </button>
            ))
          )}
        </div>

        <div className="pickfoot">↑↓ 이동 · Enter 추가 · Esc 닫기</div>
      </div>
    </div>,
    document.body,
  );
}
