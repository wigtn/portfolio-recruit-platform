"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { COMPANIES } from "@/lib/seed/companies";
import { HOT_KEYWORDS, keywordHref } from "@/lib/seed/feed";
import { Icon } from "./Icon";

/**
 * 히어로 검색.
 *
 * 포커스의 주인공은 **테두리가 아니라 열리는 제안 패널**이다. 검색 UX 정본이
 * 그렇다 — 모션은 상태 변화를 알리는 용도지 장식이 아니고, 확장은 느리게
 * 연출하는 게 아니라 빠르게 끝나야 한다. 그래서 회전하는 테두리 빛 같은
 * "백그라운드 처리 중" 관용구는 여기 쓰지 않는다.
 *
 * 구성
 * - 평상시: 제안이 세로로 굴러가는 플레이스홀더(뭘 검색할 수 있는지 알려준다)
 * - 진입: 아이콘만 있는 작은 상자가 그려지고 → 한 박자 멈췄다가 → 가로로
 *   늘어나 탄력 있게 정착한다. 내용물은 상자가 자리를 잡은 뒤 들어온다.
 * - 포커스: 패널이 위에서 탄력 있게 내려온다(스프링 이징, 260ms)
 * - 타이핑: 회사·키워드를 실시간으로 걸러 보여준다. 장식이 아니라 실제로 찾아준다
 * - 키보드: ↑↓ 이동 · Enter 선택 · Esc 닫기
 */
type Row =
  | { kind: "keyword"; label: string; href: string }
  | {
      kind: "company";
      label: string;
      sub: string;
      score: number;
      href: string;
    };

/* 롤링 플레이스홀더 문구 — "뭘 검색할 수 있는지"를 보여주는 게 목적이라
   회사명(마스킹이라 칠 수 없다)이 아닌 실제 인기 키워드로 돌린다 */
const ROLL_ITEMS = [
  "회사명 또는 영업 직무를 검색하세요",
  ...HOT_KEYWORDS.slice(0, 5).map((k) => `‘${k.word}’ 후기 찾아보기`),
];

export function HeroSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [roll, setRoll] = useState(0);
  const [rollJump, setRollJump] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // 슬롯처럼 위로 한 칸씩. 마지막 다음엔 복제한 첫 항목으로 내려간 뒤
  // 전환을 끄고 0으로 순간 복귀 — 무한 루프의 관용구다.
  useEffect(() => {
    if (query) return;
    const timer = window.setInterval(() => setRoll((index) => index + 1), 2600);
    return () => window.clearInterval(timer);
  }, [query]);

  useEffect(() => {
    if (roll < ROLL_ITEMS.length) return;
    const timer = window.setTimeout(() => {
      setRollJump(true);
      setRoll(0);
      requestAnimationFrame(() =>
        requestAnimationFrame(() => setRollJump(false)),
      );
    }, 600);
    return () => window.clearTimeout(timer);
  }, [roll]);

  const rows = useMemo<Row[]>(() => {
    const q = query.trim();
    const companies = COMPANIES.filter((c) =>
      q ? c.name.includes(q) || c.industry.includes(q) : true,
    ).slice(0, q ? 4 : 2);
    const keywords = HOT_KEYWORDS.filter((k) =>
      q ? k.word.includes(q) : true,
    ).slice(0, q ? 3 : 4);

    return [
      ...keywords.map((k): Row => ({
        kind: "keyword",
        label: k.word,
        href: keywordHref(k.word),
      })),
      ...companies.map((c): Row => ({
        kind: "company",
        label: c.name,
        sub: `${c.industry} · ${c.region}`,
        score: c.score,
        href: `/companies/${c.slug}`,
      })),
    ];
  }, [query]);

  useEffect(() => setActive(-1), [query]);

  // 빈 검색 가드 — 흔들림·안내 툴팁의 수명
  const [nudge, setNudge] = useState(false);
  const nudgeTimer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(nudgeTimer.current), []);

  const close = () => {
    setOpen(false);
    setActive(-1);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      close();
      inputRef.current?.blur();
      return;
    }
    if (!open || rows.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((i) => (i + 1) % rows.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => (i <= 0 ? rows.length - 1 : i - 1));
    } else if (event.key === "Enter" && active >= 0) {
      event.preventDefault();
      close();
      router.push(rows[active].href);
    }
  };

  return (
    <div className={`herosearch${open ? " is-open" : ""}`}>
      <form
        className={`searchbig${nudge ? " is-nudge" : ""}`}
        action="/companies"
        onSubmit={(event) => {
          if (query.trim()) return;
          // 빈 검색 — 이동 대신 흔들림 + 안내. 제안 패널을 열어 다음 행동을 준다
          event.preventDefault();
          setNudge(true);
          setOpen(true);
          inputRef.current?.focus();
          window.clearTimeout(nudgeTimer.current);
          nudgeTimer.current = window.setTimeout(() => setNudge(false), 1800);
        }}
        // 상자 어디를 눌러도 입력으로 들어간다 — 아이콘·여백까지 커서 영역이다
        onMouseDown={(event) => {
          if ((event.target as HTMLElement).closest("button")) return;
          if (event.target !== inputRef.current) {
            event.preventDefault();
            inputRef.current?.focus();
          }
        }}
      >
        <Icon name="search" />

        <span className="hero-field">
          <input
            ref={inputRef}
            name="q"
            autoComplete="off"
            aria-label="회사·직무·키워드 검색"
            aria-expanded={open}
            aria-controls="hero-suggest"
            role="combobox"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onFocus={() => setOpen(true)}
            onBlur={close}
            onKeyDown={onKeyDown}
          />
          {/* 비어 있을 때만 — 타이핑이 시작되면 실텍스트가 주인공 */}
          {query ? null : (
            <span className="phroll" aria-hidden>
              <span
                className="phroll-track"
                style={{
                  transform: `translateY(-${roll * 24}px)`,
                  transition: rollJump ? "none" : undefined,
                }}
              >
                {[...ROLL_ITEMS, ROLL_ITEMS[0]].map((item, index) => (
                  <span className="phroll-item" key={`${item}-${index}`}>
                    {item}
                  </span>
                ))}
              </span>
            </span>
          )}
        </span>

        <button className="btn primary" type="submit">
          검색
        </button>

        {nudge ? (
          <span className="hs-nudge" role="status">
            검색어를 입력해주세요 — 회사명이나 직무로 찾아드려요
          </span>
        ) : null}
      </form>
      {open ? (
        <div
          className="hs-panel"
          id="hero-suggest"
          role="listbox"
          // 항목을 누르는 순간 blur가 먼저 터져 패널이 닫히면 클릭이 사라진다
          onMouseDown={(event) => event.preventDefault()}
        >
          {rows.length === 0 ? (
            <>
              {/* 회사명이 마스킹이라 자연스러운 질의 대부분이 0건이다 —
                  무반응 대신 인기 검색어로 되돌려 보낸다 */}
              <div className="hs-empty">
                “{query.trim()}” 결과가 없어요 — 인기 검색어로 둘러보세요
              </div>
              {HOT_KEYWORDS.slice(0, 4).map((keyword) => (
                <Link
                  key={keyword.word}
                  href={keywordHref(keyword.word)}
                  className="hs-row"
                  onClick={close}
                >
                  <span className="hs-ic">
                    <Icon name="search" />
                  </span>
                  <span className="hs-label">{keyword.word}</span>
                  <span className="hs-tag">인기 검색</span>
                </Link>
              ))}
            </>
          ) : null}
          {rows.map((row, i) => (
            <Link
              key={`${row.kind}-${row.label}`}
              href={row.href}
              role="option"
              aria-selected={i === active}
              className={i === active ? "hs-row is-active" : "hs-row"}
              style={{ animationDelay: `${Math.min(i, 6) * 26}ms` }}
              onMouseEnter={() => setActive(i)}
              onClick={close}
            >
              {row.kind === "keyword" ? (
                <>
                  <span className="hs-ic">
                    <Icon name="search" />
                  </span>
                  <span className="hs-label">{row.label}</span>
                  <span className="hs-tag">인기 검색</span>
                </>
              ) : (
                <>
                  <span className="hs-ic hs-ic-co">
                    <Icon name="building" />
                  </span>
                  <span className="hs-label">
                    {row.label}
                    <span className="hs-sub">{row.sub}</span>
                  </span>
                  <span className="hs-score">
                    <Icon name="star" filled />
                    {row.score.toFixed(1)}
                  </span>
                </>
              )}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
