import Link from "next/link";
import { Crumb } from "@/components/Crumb";
import type { CSSProperties } from "react";
import {
  BOARDS,
  FEED,
  HOT_KEYWORDS,
  POPULAR_WEEK,
  type BoardKey,
  type FeedItem,
} from "@/lib/seed/feed";
import { PostRow } from "@/components/PostRow";
import { LiveKeywords } from "@/components/LiveKeywords";
import { Icon } from "@/components/Icon";
import { Coach } from "@/components/Coach";
import { Paging } from "@/components/Paging";

export const metadata = { title: "커뮤니티 | W 세일즈" };

/** 시안 정본 02번(커뮤니티 게시판) 구조 그대로 — .pagehead → .tabs → .split(.filterbar+.feed+.paging / 사이드) */
const SORTS = [
  { key: "recent", label: "최신순" },
  { key: "popular", label: "인기순" },
] as const;

/**
 * 작성 후 경과 분 — 최신순의 정렬 키(공유 계약: FeedItem.ageMinutes).
 * 필드가 아직 없는 시드가 섞여 있어도 깨지지 않게 0으로 방어한다.
 */
/**
 * 현재 페이지가 속한 블록만 보인다.
 *
 * 페이지 수만큼 버튼을 다 그리면 좁은 폭에서 줄이 넘치고, 페이저 높이가
 * 바뀌면 버튼이 커서 밑에서 달아난다. 그건 Paging이 막으려는 것과 정면으로
 * 부딪힌다. 다섯 개씩 끊어 보여주면 폭도 높이도 일정하다.
 */
function pageWindow(current: number, total: number, size = 5) {
  const start = Math.floor((current - 1) / size) * size + 1;
  const end = Math.min(total, start + size - 1);
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

const ageOf = (item: FeedItem) =>
  (item as FeedItem & { ageMinutes?: number }).ageMinutes ?? 0;

export default async function CommunityPage({
  searchParams,
}: {
  searchParams: Promise<{
    board?: string;
    q?: string;
    sort?: string;
    answered?: string;
    verified?: string;
    page?: string;
  }>;
}) {
  const {
    board = "all",
    q = "",
    sort = "recent",
    answered = "",
    verified = "",
    page = "1",
  } = await searchParams;

  const items = FEED.filter((item) => {
    const byBoard = board === "all" || item.board === (board as BoardKey);
    const byQuery = !q || item.title.includes(q);
    // 답변 있음 · 인증글은 글에 이미 있는 값으로 거른다 — 새 필드를 만들지 않는다
    const byAnswered = !answered || item.comments > 0;
    const byVerified = !verified || item.badges.includes("인증");
    return byBoard && byQuery && byAnswered && byVerified;
  }).sort((a, b) =>
    // 최신순은 경과 분 오름차순 — 조회수로 흉내 내면 18분 전 글이 7일 전 글
    // 아래로 온다(at이 상대 문자열이라 정렬 키는 ageMinutes다)
    sort === "popular" ? b.likes - a.likes : ageOf(a) - ageOf(b),
  );

  const PER_PAGE = 5;
  const pages = Math.max(1, Math.ceil(items.length / PER_PAGE));
  const current = Math.min(Math.max(1, Number(page) || 1), pages);
  const shown = items.slice((current - 1) * PER_PAGE, current * PER_PAGE);
  const visiblePages = pageWindow(current, pages);
  const categoryTabs = [
    { key: "all", label: "전체", icon: "layout", count: FEED.length },
    ...BOARDS.map((item) => {
      const icons: Record<BoardKey, string> = {
        qna: "comment",
        knowhow: "book-open",
        proof: "award",
        free: "users",
      };
      return {
        key: item.key,
        label: item.label,
        icon: icons[item.key],
        count: FEED.filter((post) => post.board === item.key).length,
      };
    }),
  ];
  const activeTabIndex = Math.max(
    0,
    categoryTabs.findIndex((item) => item.key === board),
  );

  const qs = (patch: Record<string, string>) => {
    const next = new URLSearchParams({ board, q, sort, answered, verified });
    Object.entries(patch).forEach(([key, value]) =>
      value ? next.set(key, value) : next.delete(key),
    );
    // 조건이 바뀌면 1페이지로 — 3페이지에서 필터를 좁히면 빈 화면이 나온다
    if (!("page" in patch)) next.delete("page");
    [...next.entries()].forEach(([key, value]) => {
      if (!value) next.delete(key);
    });
    return `/community?${next}`;
  };

  return (
    <>
      <div className="pagehead">
        <Crumb items={[{ label: "커뮤니티" }]} />
        <div className="ttl">
          <div>
            <h1>커뮤니티</h1>
            <div className="desc">
              현장에서 막 올라온 질문과 노하우, 영업직끼리 진짜 이야기
            </div>
          </div>
          <Link
            className="btn primary writecta"
            // 보고 있던 게시판이 글쓰기 폼의 게시판으로 미리 선택된다
            href={
              board === "all"
                ? "/community/write"
                : `/community/write?board=${encodeURIComponent(board)}`
            }
          >
            <Icon name="edit" /> 글 쓰기
          </Link>
        </div>
      </div>

      <div className="sec">
        <div
          className="tabs home-feed-tabs community-category-tabs"
          role="tablist"
          aria-label="커뮤니티 게시판"
          style={{ "--tab-index": activeTabIndex } as CSSProperties}
        >
          <span className="home-feed-tab-cursor" aria-hidden />
          {categoryTabs.map((item) => (
            <Link
              key={item.key}
              className={board === item.key ? "on" : undefined}
              role="tab"
              aria-selected={board === item.key}
              href={qs({ board: item.key })}
            >
              <Icon name={item.icon} className="tab-icon" />
              <span>{item.label}</span>
              <span className="ct">{item.count}</span>
            </Link>
          ))}
        </div>

        <div className="split">
          <div>
            <div className="filterbar">
              <Link
                className={answered ? "fpill on" : "fpill"}
                href={qs({ answered: answered ? "" : "1" })}
              >
                {answered ? (
                  <Icon name="check" style={{ width: 13, height: 13 }} />
                ) : null}
                답변 있음
              </Link>
              <Link
                className={verified ? "fpill on" : "fpill"}
                href={qs({ verified: verified ? "" : "1" })}
              >
                {verified ? (
                  <Icon name="check" style={{ width: 13, height: 13 }} />
                ) : null}
                인증글
              </Link>
              <form className="search" action="/community">
                <input type="hidden" name="board" value={board} />
                <input type="hidden" name="sort" value={sort} />
                {answered ? (
                  <input type="hidden" name="answered" value="1" />
                ) : null}
                {verified ? (
                  <input type="hidden" name="verified" value="1" />
                ) : null}
                <Icon name="search" />
                <input name="q" defaultValue={q} placeholder="제목, 내용 검색" />
              </form>
              <div className="seg">
                {SORTS.map((option) => (
                  <Link
                    key={option.key}
                    className={sort === option.key ? "on" : undefined}
                    href={qs({ sort: option.key })}
                  >
                    {option.label}
                  </Link>
                ))}
              </div>
            </div>

            <Coach
              id="community-ai"
              cta={{ label: "인기 글 열기", href: "/community/p-4821" }}
            >
              아무 글이나 열어보세요, <b>AI 참고 답변이 실제로 생성</b>돼요
            </Coach>

            {items.length === 0 ? (
              <div
                className="card"
                style={{ textAlign: "center", padding: 40 }}
              >
                <p style={{ marginBottom: 14 }}>
                  {q
                    ? `“${q}”에 대한 결과가 없습니다`
                    : "조건에 맞는 글이 없습니다"}
                </p>
                <Link className="btn line" href="/community">
                  조건 초기화
                </Link>
              </div>
            ) : (
              <>
                {/* feed-fixed는 행 높이와 목록 최소 높이를 못 박는다 —
                    페이저가 커서 밑에서 달아나지 않게 하는 쪽 절반이다 */}
                <div
                  className="feed feed-fixed"
                  style={{ "--page-rows": PER_PAGE } as CSSProperties}
                >
                  {shown.map((item) => (
                    <PostRow key={item.id} item={item} />
                  ))}
                </div>
                {pages > 1 ? (
                  <Paging
                    current={current}
                    hrefs={Array.from({ length: pages }, (_, index) =>
                      qs({ page: String(index + 1) }),
                    )}
                    visible={visiblePages}
                  />
                ) : null}
              </>
            )}
          </div>

          <div>
            <div className="card">
              <h4>
                인기글 <span className="mini">이번 주</span>
              </h4>
              <div className="popmini">
                {POPULAR_WEEK.map((item) => (
                  <Link
                    className="p"
                    key={item.title}
                    href={`/community/${item.postId}`}
                  >
                    <div className="pt">{item.title}</div>
                    <div className="pm">
                      <span>
                        <Icon name="like" />
                        {item.likes}
                      </span>
                      <span>
                        <Icon name="comment" />
                        {item.comments}
                      </span>
                      <span>
                        <Icon name="view" />
                        {item.views}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* 백오피스 큐레이션의 "제외 키워드"가 실효를 갖는 자리 —
                위젯이 오버레이를 읽어 제외된 키워드를 순위에서 뺀다 */}
            <LiveKeywords keywords={HOT_KEYWORDS} />

            <span className="adlabel">DEMO AD</span>
            <Link className="adcard" href="/jobs">
              <div className="adimg c">
                <span className="art" />
                <div className="k">채용 정보</div>
                <div className="h">
                  영업직 공고를
                  <br />한눈에 비교
                </div>
              </div>
              <div className="adbody">
                <span className="adt">포트폴리오용 광고 슬롯 데모</span>
                <span className="adgo">보기</span>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
