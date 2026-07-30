"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { COMPANIES } from "@/lib/seed/companies";
import { FEED } from "@/lib/seed/feed";
import { Icon } from "./Icon";

/**
 * 상단 통합 검색 — 헤더의 아이콘 버튼에서 여는 커맨드 팔레트.
 * 히어로의 인라인 검색과 역할을 구분하면서 회사와 커뮤니티 글을 한 번에 찾는다.
 */
export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) return;

    input.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((current) => !current);
        return;
      }
      if (event.key === "Escape" && open) {
        setOpen(false);
        trigger.current?.focus();
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
    .split(/[\s·,]+/)
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
    <>
      <button
        ref={trigger}
        className="gsearch"
        aria-label="회사·글 검색 열기"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <Icon name="search" />
      </button>

      {open ? (
        <div
          className="modalwrap search-modal-wrap"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={descriptionId}
          onClick={(event) => {
            if (event.target === event.currentTarget) close();
          }}
        >
          <div className="modal search-modal">
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
                              {company.mark}
                            </span>
                            <span className="search-result-copy">
                              <span className="nm">{company.name}</span>
                              <span className="meta">
                                {company.industry} · {company.region}
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
                                {item.badges.includes("인증") ? " · 인증" : ""}
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
        </div>
      ) : null}
    </>
  );
}
