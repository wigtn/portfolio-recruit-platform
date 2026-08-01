"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { COMPANIES } from "@/lib/seed/companies";
import { FEED } from "@/lib/seed/feed";
import { Icon } from "./Icon";

/**
 * 상단 통합 검색 — 헤더 안에서 열린다.
 *
 * 예전에는 화면 가운데 모달이었다. 두 가지가 문제였다.
 *
 * 넓은 화면에서는 검색 하나에 화면 전체를 덮는 게 과했다. 누른 자리와
 * 열리는 자리가 달라서 시선이 한 번 끊기고, 뒤 화면이 어두워지면 "지금
 * 보던 것에서 벗어났다"는 신호가 된다. 검색은 보던 화면을 두고 잠깐
 * 들르는 일이다. 그래서 아이콘이 있던 자리에서 입력칸이 옆으로 자란다.
 *
 * 좁은 화면에서는 가운데 정렬이 치명적이었다. 입력에 포커스가 가면 키패드가
 * 화면 절반을 먹는데, 모달이 세로 가운데에 있으니 그 아래로 밀려 입력칸이
 * 키패드에 가렸다 — 무엇을 치고 있는지 안 보인다. 그래서 위에 붙인다.
 *
 * 마크업은 한 벌이고 배치만 폭으로 갈린다.
 */
export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const shell = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  /* 포털은 document가 있어야 한다 — 서버 렌더에서는 그리지 않는다 */
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  /* 패널은 body로 내보낸다.

     헤더(.nav)에 backdrop-filter가 걸려 있어서, 그 안에 둔 position: fixed는
     뷰포트가 아니라 헤더를 기준으로 잡힌다(실측: 화면 390px인데 패널 폭
     316px). filter·transform·backdrop-filter는 fixed의 기준 상자를 바꾼다.

     그래서 좌표를 직접 잡는다. 넓은 화면은 트리거 바로 아래에 앵커를 두고,
     좁은 화면은 화면 위에 붙인다(anchor 없음 → CSS가 맡는다). */
  const [anchor, setAnchor] = useState<{ top: number; right: number } | null>(
    null,
  );

  useEffect(() => {
    if (!open) return;

    const place = () => {
      const rect = trigger.current?.getBoundingClientRect();
      const narrow = window.matchMedia("(max-width: 720px)").matches;
      if (!rect || narrow) {
        setAnchor(null);
        return;
      }
      setAnchor({
        top: rect.bottom + 8,
        // 오른쪽 끝을 아이콘에 맞춘다 — 거기서 왼쪽으로 자라는 것으로 보인다
        right: Math.max(12, window.innerWidth - rect.right),
      });
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);

    /* 폭이 자라는 트랜지션(220ms)이 끝나기 전에 포커스를 주면, iOS가
       스크롤을 맞추려다 아직 0px인 칸을 기준으로 잡는다. 한 프레임 뒤에 준다 */
    const timer = window.setTimeout(() => input.current?.focus(), 60);

    /* 배경 잠금은 좁은 화면에서만. 넓은 화면에서는 헤더에 붙은 작은 패널일
       뿐이라 뒤를 잠그면 스크롤이 먹통이 된 것처럼 느껴진다 */
    const narrow = window.matchMedia("(max-width: 720px)").matches;
    const previousOverflow = document.body.style.overflow;
    if (narrow) document.body.style.overflow = "hidden";

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
      if (narrow) document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  /* 바깥을 누르면 닫는다. 모달이 아니라 헤더에 붙은 패널이라 배경을 덮는
     레이어가 없다 — 덮개 대신 문서 클릭을 듣는다. */
  useEffect(() => {
    if (!open) return;
    const onDown = (event: PointerEvent) => {
      const target = event.target as Node;
      // 패널은 포털로 body에 있어서 shell 안에 없다 — 둘 다 물어봐야 한다
      if (shell.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
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
        /* 닫기와 포커스 되돌리기를 한 곳(close)에서 한다.

           여기서 setOpen 직후 focus()를 부르면 실패한다. 열려 있는 동안
           트리거는 visibility: hidden이고, React가 아직 리렌더하지 않아
           그 시점에도 hidden이다 — 숨은 요소는 포커스를 못 받는다.
           close()는 한 프레임 뒤에 부르므로 그때는 보인다. */
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

  return (
    <div
      ref={shell}
      className={open ? "gsearch-shell is-open" : "gsearch-shell"}
    >
      {/* 닫혀 있을 때만 버튼이다. 열리면 그 자리를 입력칸이 차지한다 —
          같은 자리에서 모양만 바뀌어야 "그 버튼이 펼쳐졌다"로 읽힌다 */}
      <button
        ref={trigger}
        className="gsearch"
        aria-label="회사, 글 검색 열기"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <Icon name="search" />
      </button>

      {open && mounted
        ? createPortal(
            <div
              ref={panelRef}
              className={
                anchor ? "gsearch-panel is-anchored" : "gsearch-panel"
              }
              style={anchor ?? undefined}
              role="dialog"
              aria-labelledby={titleId}
              aria-describedby={descriptionId}
              /* 좁은 화면에서는 이 요소가 화면을 덮는 딤이다. 그 여백을 누르면
                 닫힌다 — 넓은 화면에서는 패널에 딱 맞아 이 경로가 안 걸린다 */
              onClick={(event) => {
                if (event.target === event.currentTarget) close();
              }}
            >
          <div className="gsearch-inner">
            {/* 제목 블록은 좁은 화면에서만 보인다. 넓은 화면에서는 헤더에
                붙은 작은 패널이라 제목까지 두면 그게 더 크다 */}
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
              ) : (
                <kbd>ESC</kbd>
              )}
            </form>

            {needle ? (
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
                              <img
                                src={company.logo}
                                alt={`${company.name} 로고`}
                              />
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
                              move(
                                item.postId
                                  ? `/community/${item.postId}`
                                  : "/community",
                              )
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
                <p className="search-hint">
                  <span>
                    <kbd>↵</kbd> 검색
                  </span>
                  <span>
                    <kbd>ESC</kbd> 닫기
                  </span>
                </p>
              </div>
            )}
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
