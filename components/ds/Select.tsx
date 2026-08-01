"use client";

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
  /**
   * 항목 왼쪽에 붙는 그림 주소(회사 로고 등).
   *
   * 글자만 늘어놓으면 ◇◇테크·▓▓상사처럼 형태가 비슷한 이름을 고를 때
   * 매번 읽어야 한다. 로고는 읽지 않고 알아보는 표식이라, 목록에서 찾는
   * 속도가 달라진다.
   */
  media?: string;
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

  /* 열린 뒤 실제 폭으로 위치를 고쳐 잡는다.

     place()는 목록을 그리기 전에 위치를 정하므로 폭을 짐작할 수밖에 없다
     (트리거 폭과 180px 중 큰 값). 그런데 항목에 로고와 업종 줄이 들어가면
     실제로는 그보다 넓어진다 — 390px 화면에서 left 198에 272px짜리가 서서
     오른쪽 80px이 화면 밖으로 나갔다.

     짐작을 정교하게 만드는 대신, 그려진 뒤 한 번 재서 넘친 만큼 되민다.
     내용이 무엇이든 맞는 방법이다. */
  useLayoutEffect(() => {
    if (!open) return;
    const el = listRef.current;
    if (!el) return;
    /* offsetWidth를 쓴다. 이 드롭다운은 스프링 스케일로 등장하는데,
       getBoundingClientRect는 그 transform이 반영된 "지금 보이는" 크기라
       등장 도중에 재면 실제보다 좁게 나온다. offsetWidth는 레이아웃 폭이라
       애니메이션과 무관하다. */
    const left = parseFloat(el.style.left) || 0;
    const over = left + el.offsetWidth - (window.innerWidth - 12);
    if (over > 0) el.style.left = `${Math.max(12, left - over)}px`;
  }, [open, needle]);

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
                /* 양쪽 다 잡는다.
                   min만 있으면 오른쪽 넘침은 막아도 왼쪽으로 밀려 나가는 건
                   못 막는다 — 좁은 화면에서 트리거가 왼쪽에 붙어 있고 목록이
                   더 넓으면 계산 결과가 음수가 된다. */
                left: Math.max(
                  12,
                  Math.min(pos.x, window.innerWidth - pos.width - 12),
                ),
                top: pos.up ? undefined : pos.y,
                bottom: pos.up ? window.innerHeight - pos.y : undefined,
                minWidth: pos.width,
                /* minWidth만 두면 내용이 길 때(로고+이름+업종) 그만큼 늘어나
                   화면 밖으로 나간다. 넘어갈 자리에 상한을 둔다. */
                maxWidth: "calc(100vw - 24px)",
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
                  {option.media ? (
                    <span className="ds-opt-media" aria-hidden>
                      <img src={option.media} alt="" />
                    </span>
                  ) : null}
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
