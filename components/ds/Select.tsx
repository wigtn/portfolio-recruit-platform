"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@/components/Icon";

/**
 * 커스텀 셀렉트 — P1 문법의 이식.
 *
 * 네이티브 select는 OS마다 생김이 다르고 옵션 행을 꾸밀 수 없다.
 * 트리거 버튼 + body 포털 드롭다운(스크롤 컨테이너에 안 잘림) + 스프링
 * 스케일 등장 + 키보드(↑↓ Enter Esc) + 선택 체크가 P1의 계약이다.
 *
 * 포지셔닝: 트리거 rect 기준 아래 우선, 공간이 없으면 위로 뒤집는다.
 */
export type SelectOption = {
  value: string;
  label: string;
  sub?: string;
};

export function Select({
  value,
  onChange,
  options,
  ariaLabel,
  placeholder = "선택",
  className,
  searchable = false,
  searchPlaceholder = "검색",
}: {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  ariaLabel: string;
  placeholder?: string;
  className?: string;
  /** 옵션이 많을 때 — 드롭다운 상단에 검색 입력을 얹는다 */
  searchable?: boolean;
  searchPlaceholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [pos, setPos] = useState<{
    x: number;
    y: number;
    width: number;
    up: boolean;
  } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");

  const current = options.find((option) => option.value === value);
  const needle = query.trim().toLowerCase();
  const shown = useMemo(
    () =>
      !searchable || !needle
        ? options
        : options.filter((option) =>
            `${option.label} ${option.sub ?? ""}`
              .toLowerCase()
              .includes(needle),
          ),
    [options, searchable, needle],
  );

  const place = () => {
    const rect = btnRef.current?.getBoundingClientRect();
    if (!rect) return;
    const height = Math.min(options.length, 8) * 40 + 12;
    const up =
      rect.bottom + height + 8 > window.innerHeight && rect.top > height;
    setPos({
      x: rect.left,
      y: up ? rect.top - 6 : rect.bottom + 6,
      width: Math.max(rect.width, 180),
      up,
    });
  };

  const show = () => {
    setQuery("");
    setActive(
      Math.max(
        0,
        options.findIndex((o) => o.value === value),
      ),
    );
    place();
    setOpen(true);
    if (searchable) {
      window.setTimeout(() => searchRef.current?.focus(), 30);
    }
  };

  // 스크롤·리사이즈에 따라붙는다 — 닫아버리면 스크롤 중 선택이 끊긴다
  useEffect(() => {
    if (!open) return;
    const sync = () => place();
    window.addEventListener("scroll", sync, true);
    window.addEventListener("resize", sync);
    const close = (event: PointerEvent) => {
      if (
        !btnRef.current?.contains(event.target as Node) &&
        !listRef.current?.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    window.addEventListener("pointerdown", close);
    return () => {
      window.removeEventListener("scroll", sync, true);
      window.removeEventListener("resize", sync);
      window.removeEventListener("pointerdown", close);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => setActive(0), [needle]);

  useEffect(() => {
    if (!open) return;
    listRef.current
      ?.querySelector(".ds-opt.is-active")
      ?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (!open) {
      if (["Enter", " ", "ArrowDown", "ArrowUp"].includes(event.key)) {
        event.preventDefault();
        show();
      }
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((i) => (shown.length ? (i + 1) % shown.length : 0));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => (i <= 0 ? shown.length - 1 : i - 1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (shown[active]) {
        onChange(shown[active].value);
        setOpen(false);
        btnRef.current?.focus();
      }
    }
  };

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className={className ? `ds-select ${className}` : "ds-select"}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => (open ? setOpen(false) : show())}
        onKeyDown={onKeyDown}
      >
        <span className="ds-select-v">
          {current?.label ?? <i className="ds-select-ph">{placeholder}</i>}
        </span>
        <Icon name="down" />
      </button>

      {open && pos
        ? createPortal(
            <div
              ref={listRef}
              className={pos.up ? "ds-dropdown is-up" : "ds-dropdown"}
              role="listbox"
              aria-label={ariaLabel}
              style={{
                left: Math.min(pos.x, window.innerWidth - pos.width - 12),
                top: pos.up ? undefined : pos.y,
                bottom: pos.up ? window.innerHeight - pos.y : undefined,
                minWidth: pos.width,
              }}
            >
              {searchable ? (
                <span className="ds-dropdown-search">
                  <Icon name="search" />
                  <input
                    ref={searchRef}
                    autoFocus
                    value={query}
                    placeholder={searchPlaceholder}
                    aria-label={searchPlaceholder}
                    onChange={(event) => setQuery(event.target.value)}
                    onKeyDown={onKeyDown}
                  />
                </span>
              ) : null}
              {shown.length === 0 ? (
                <span className="ds-dropdown-empty">
                  “{query.trim()}” 결과가 없어요
                </span>
              ) : null}
              {shown.map((option, index) => (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={option.value === value}
                  className={[
                    "ds-opt",
                    index === active ? "is-active" : "",
                    option.value === value ? "is-picked" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                    btnRef.current?.focus();
                  }}
                >
                  <span className="ds-opt-main">
                    {option.label}
                    {option.sub ? <small>{option.sub}</small> : null}
                  </span>
                  {option.value === value ? <Icon name="check" /> : null}
                </button>
              ))}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
