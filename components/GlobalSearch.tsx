"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { COMPANIES } from "@/lib/seed/companies";
import { FEED } from "@/lib/seed/feed";
import { Icon } from "./Icon";

/**
 * 상단 통합 검색 — 폭에 따라 아예 다른 물건이 된다.
 *
 * **넓은 화면: 헤더 안에서 자란다.** 돋보기가 왼쪽으로 밀리면서 그 오른쪽으로
 * 입력칸이 열린다. 검색 하나에 화면 전체를 덮으면 "보던 것에서 벗어났다"는
 * 신호가 되는데, 검색은 보던 화면을 두고 잠깐 들르는 일이다. 누른 자리에서
 * 그대로 열려야 시선이 끊기지 않는다.
 *
 * **좁은 화면: 위에 붙는 시트.** 헤더에 인라인으로 열면 폭이 안 나온다.
 * 그렇다고 가운데 모달로 두면 키패드가 아래 절반을 먹으면서 입력칸이 그
 * 아래로 밀려 가린다 — 무엇을 치고 있는지 안 보인다. 그래서 위에 못 박고
 * 결과만 아래로 흐르게 한다.
 *
 * 두 껍데기가 같은 본문(입력칸·추천어·결과)을 쓴다.
 */
export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const shell = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  /* 포털은 document가 있어야 한다 — 서버 렌더에서는 그리지 않는다 */
  const [mounted, setMounted] = useState(false);
  /* 좁은 화면인가. 껍데기가 통째로 달라서 CSS만으로는 못 가른다 */
  const [narrow, setNarrow] = useState(false);

  useEffect(() => {
    setMounted(true);
    const mq = window.matchMedia("(max-width: 720px)");
    const sync = () => setNarrow(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!open) return;

    /* 폭이 자라는 트랜지션이 끝나기 전에 포커스를 주면, iOS가 스크롤을
       맞추려다 아직 좁은 칸을 기준으로 잡는다. 한 박자 뒤에 준다 */
    const timer = window.setTimeout(() => input.current?.focus(), 60);

    /* 배경 잠금은 좁은 화면에서만. 넓은 화면에서는 헤더에 붙은 작은 칸일
       뿐이라 뒤를 잠그면 스크롤이 먹통이 된 것처럼 느껴진다 */
    const previousOverflow = document.body.style.overflow;
    if (narrow) document.body.style.overflow = "hidden";

    return () => {
      window.clearTimeout(timer);
      if (narrow) document.body.style.overflow = previousOverflow;
    };
  }, [open, narrow]);

  /* 바깥을 누르면 닫는다. 넓은 화면에서는 덮개가 없어서 문서 클릭을 듣는다 */
  useEffect(() => {
    if (!open) return;
    const onDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (shell.current?.contains(target)) return;
      if (sheetRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((current) => !current);
        return;
      }
      if (event.key === "Escape" && open) {
        /* 닫기와 포커스 되돌리기를 한 곳(close)에서 한다. setOpen 직후
           동기적으로 focus()를 부르면 아직 숨어 있는 트리거를 잡는다. */
        close();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const needle = q.trim();
  // 부분어 매칭 — "IT 판교"처럼 띄어 쓰거나 가운뎃점으로 묶어도 토큰 단위로
  // 전부 들어 있으면 찾는다. 통짜 includes는 추천 검색어조차 스스로 실패했다.
  const tokens = needle
    .toLowerCase()
    .split(/[\s,]+/)
    .filter(Boolean);
  const matches = (haystack: string) => {
    const lowered = haystack.toLowerCase();
    return tokens.every((token) => lowered.includes(token));
  };
  const companies = needle
    ? COMPANIES.filter((company) =>
        matches(`${company.name} ${company.industry} ${company.region}`),
      ).slice(0, 4)
    : [];
  const posts = needle
    ? FEED.filter((item) => matches(item.title)).slice(0, 4)
    : [];
  const resultCount = companies.length + posts.length;

  const close = () => {
    setOpen(false);
    requestAnimationFrame(() => trigger.current?.focus());
  };

  const move = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  /** 입력칸 — 두 껍데기가 같은 것을 쓴다 */
  const field = (
    <form
      className="searchbig search-modal-input"
      onSubmit={(event) => {
        event.preventDefault();
        if (!needle) return;
        // 글만 걸린 검색어로 회사 목록에 보내면 0건 화면에 떨어진다 —
        // 회사 매칭이 없으면 커뮤니티 검색으로 보낸다
        move(
          companies.length === 0 && posts.length > 0
            ? `/community?q=${encodeURIComponent(needle)}`
            : `/companies?q=${encodeURIComponent(needle)}`,
        );
      }}
    >
      <Icon name="search" />
      <input
        ref={input}
        value={q}
        placeholder="회사 이름, 글 제목으로 찾아보세요"
        aria-label="회사와 글 통합 검색"
        onChange={(event) => setQ(event.target.value)}
      />
      {q ? (
        <button
          className="search-clear"
          type="button"
          aria-label="검색어 지우기"
          onClick={() => {
            setQ("");
            input.current?.focus();
          }}
        >
          <Icon name="x" />
        </button>
      ) : null}
    </form>
  );

  /** 결과 또는 추천어 */
  const body = needle ? (
    <div className="sresults">
      <div className="search-result-summary">
        <span>
          <b>‘{needle}’</b> 검색 결과
        </span>
        <span>{resultCount}건</span>
      </div>

      {resultCount ? (
        <>
          {companies.length ? (
            <section aria-label="회사 검색 결과">
              <div className="sgroup">
                <span>회사</span>
                <span>{companies.length}</span>
              </div>
              {companies.map((company) => (
                <button
                  className="sr"
                  type="button"
                  key={company.slug}
                  onClick={() => move(`/companies/${company.slug}`)}
                >
                  <span className="search-company-mark">
                    <img src={company.logo} alt={`${company.name} 로고`} />
                  </span>
                  <span className="search-result-copy">
                    <span className="nm">{company.name}</span>
                    <span className="meta">
                      {company.industry}, {company.region}
                    </span>
                  </span>
                  <Icon name="chevR" />
                </button>
              ))}
            </section>
          ) : null}

          {posts.length ? (
            <section aria-label="커뮤니티 글 검색 결과">
              <div className="sgroup">
                <span>커뮤니티 글</span>
                <span>{posts.length}</span>
              </div>
              {posts.map((item) => (
                <button
                  className="sr"
                  type="button"
                  key={item.id}
                  onClick={() =>
                    move(item.postId ? `/community/${item.postId}` : "/community")
                  }
                >
                  <span className="search-result-icon">
                    <Icon name="doc" />
                  </span>
                  <span className="search-result-copy">
                    <span className="nm">{item.title}</span>
                    <span className="meta">
                      익명 게시글
                      {item.badges.includes("인증") ? ", 인증" : ""}
                    </span>
                  </span>
                  <Icon name="chevR" />
                </button>
              ))}
            </section>
          ) : null}
        </>
      ) : (
        <div className="search-empty">
          <span className="search-empty-icon">
            <Icon name="search" />
          </span>
          <b>일치하는 결과가 없어요</b>
          <p>철자를 확인하거나 더 짧은 단어로 검색해보세요.</p>
        </div>
      )}
    </div>
  ) : (
    <div className="search-start">
      <div className="search-start-label">추천 검색어</div>
      <div className="search-suggestions">
        {/* 전부 실재 매칭되는 검색어만 — 추천이 스스로 0건을 내면 안 된다
            (서울=회사 2곳, IT=◇◇테크, 인센티브=노하우 글) */}
        {["서울", "IT", "인센티브"].map((suggestion) => (
          <button
            type="button"
            key={suggestion}
            onClick={() => {
              setQ(suggestion);
              input.current?.focus();
            }}
          >
            <Icon name="search" />
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div
      ref={shell}
      className={open ? "gsearch-shell is-open" : "gsearch-shell"}
    >
      {/* 아이콘만. 상자도 테두리도 두지 않는다 — 좁은 헤더에서 먼저 읽히는
          것이 아이콘이 아니라 상자가 되면 안 된다. 손가락 자리는 44px 그대로 */}
      <button
        ref={trigger}
        className="gsearch"
        aria-label="회사, 글 검색 열기"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <Icon name="search" />
      </button>

      {/* ── 넓은 화면: 헤더 안에서 자란다 ── */}
      {open && !narrow ? (
        <div className="gsearch-inline" role="dialog" aria-label="통합 검색">
          {field}
          <div className="gsearch-drop gsearch-body">{body}</div>
        </div>
      ) : null}

      {/* ── 좁은 화면: 위에 붙는 시트 ── */}
      {open && narrow && mounted
        ? createPortal(
            <div
              ref={sheetRef}
              className="gsearch-sheet"
              role="dialog"
              aria-labelledby={titleId}
              aria-describedby={descriptionId}
              onClick={(event) => {
                if (event.target === event.currentTarget) close();
              }}
            >
              <div className="gsearch-inner gsearch-body">
                <div className="search-modal-head">
                  <div>
                    <span className="search-eyebrow">통합 검색</span>
                    <h2 id={titleId}>무엇을 찾고 계신가요?</h2>
                    <p id={descriptionId}>
                      회사 정보와 커뮤니티 글을 한 번에 찾아보세요.
                    </p>
                  </div>
                  <button
                    className="search-close"
                    type="button"
                    aria-label="검색 닫기"
                    onClick={close}
                  >
                    <Icon name="x" />
                  </button>
                </div>
                {field}
                {body}
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
