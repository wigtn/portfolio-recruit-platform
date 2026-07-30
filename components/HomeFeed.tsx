"use client";

import Link from "next/link";
import { LikeCount } from "./LikeCount";
import { CommentCount } from "./CommentCount";
import {
  type CSSProperties,
  type PointerEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { BOARDS, type FeedItem } from "@/lib/seed/feed";
import { Icon } from "./Icon";
import { Sk, SkRegion } from "./Skeleton";
import { AnonymousIdentity } from "./AnonymousIdentity";

const iconByBoard = {
  qna: "comment",
  knowhow: "book-open",
  proof: "award",
  free: "users",
} as const;

function hrefFor(item: FeedItem) {
  return item.postId
    ? `/community/${item.postId}`
    : `/community?board=${item.board}&sort=popular`;
}

export function HomeFeed({
  items,
  pinnedTitles = [],
  loading = false,
}: {
  items: FeedItem[];
  pinnedTitles?: string[];
  loading?: boolean;
}) {
  const sorted = [...items].sort((a, b) => {
    const aPinned = pinnedTitles.indexOf(a.title);
    const bPinned = pinnedTitles.indexOf(b.title);
    if (aPinned >= 0 || bPinned >= 0) {
      if (aPinned < 0) return 1;
      if (bPinned < 0) return -1;
      return aPinned - bPinned;
    }
    return b.likes + b.comments * 2 - (a.likes + a.comments * 2);
  });
  const boardCounts = new Map<FeedItem["board"], number>();
  const popular = sorted
    .filter((item) => {
      const count = boardCounts.get(item.board) ?? 0;
      if (count >= 2) return false;
      boardCounts.set(item.board, count + 1);
      return true;
    })
    .slice(0, 8);
  const boardLabels = new Map(BOARDS.map((board) => [board.key, board.label]));
  const [index, setIndex] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [visibleCount, setVisibleCount] = useState(4);
  const dragStart = useRef<number | null>(null);
  const suppressClick = useRef(false);
  const maxIndex = Math.max(0, popular.length - visibleCount);

  useEffect(() => {
    const updateVisibleCount = () => {
      const next =
        window.innerWidth <= 560 ? 1 : window.innerWidth <= 900 ? 2 : 4;
      setVisibleCount(next);
      setIndex((value) => Math.min(value, Math.max(0, popular.length - next)));
    };
    updateVisibleCount();
    window.addEventListener("resize", updateVisibleCount);
    return () => window.removeEventListener("resize", updateVisibleCount);
  }, [popular.length]);

  useEffect(() => {
    if (index >= maxIndex) return;
    const timer = window.setInterval(
      () => setIndex((value) => Math.min(maxIndex, value + 1)),
      6_000,
    );
    return () => window.clearInterval(timer);
  }, [index, maxIndex]);

  const move = (direction: -1 | 1) => {
    setIndex((value) => Math.max(0, Math.min(maxIndex, value + direction)));
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    dragStart.current = event.clientX;
    suppressClick.current = false;
    // ⚠ 여기서 바로 setPointerCapture를 걸면 안 된다 — 캡처가 걸린 순간
    // 이후 click이 카드(Link)가 아니라 캡처 요소로 향해서, 카드를 눌러도
    // 글로 이동하지 않았다. 캡처는 실제 드래그로 판정된 뒤에만 건다.
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (dragStart.current === null) return;
    const distance = event.clientX - dragStart.current;
    if (Math.abs(distance) > 6 && !suppressClick.current) {
      suppressClick.current = true;
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    setDragX(Math.max(-90, Math.min(90, distance)));
  };

  const finishDrag = () => {
    if (dragStart.current === null) return;
    if (dragX <= -50) move(1);
    if (dragX >= 50) move(-1);
    dragStart.current = null;
    setDragX(0);
  };

  return (
    <>
      <div className="sec-head home-popular-head">
        <h2>실시간 인기글</h2>
      </div>

      {loading ? (
        /* 실물은 세로 피드가 아니라 가로 캐러셀이다 — 스켈레톤이 다른 모양이면
           전환 때 245px가 튄다. 카드 골격을 실물과 같은 트랙 규칙(4/2/1열,
           min-height 252px)으로 그린다. */
        <SkRegion label="실시간 인기글">
          <div className="home-popular-window">
            <div className="home-popular-track is-static">
              {[0, 1, 2, 3].map((value) => (
                <div className="home-popular-card sk-pop" key={value}>
                  <Sk w={54} h={20} />
                  <Sk w="82%" h={17} style={{ marginTop: 14 }} />
                  <Sk w="64%" h={17} style={{ marginTop: 6 }} />
                  <Sk w="90%" h={13} style={{ marginTop: 12 }} />
                  <Sk w="70%" h={13} style={{ marginTop: 5 }} />
                  <Sk w={120} h={14} style={{ marginTop: "auto" }} />
                </div>
              ))}
            </div>
          </div>
        </SkRegion>
      ) : (
        <div
          className="home-popular-viewport sk-arrive"
          aria-label="실시간 인기글 캐러셀. 좌우로 밀어 탐색"
          onClickCapture={(event) => {
            if (!suppressClick.current) return;
            event.preventDefault();
            event.stopPropagation();
            suppressClick.current = false;
          }}
          onPointerCancel={finishDrag}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={finishDrag}
        >
          {index > 0 ? (
            <button
              className="home-popular-side is-prev"
              type="button"
              aria-label="이전 인기글"
              onClick={() => move(-1)}
              onPointerDown={(event) => event.stopPropagation()}
            >
              <Icon name="chevL" />
            </button>
          ) : null}
          {index < maxIndex ? (
            <button
              className="home-popular-side is-next"
              type="button"
              aria-label="다음 인기글"
              onClick={() => move(1)}
              onPointerDown={(event) => event.stopPropagation()}
            >
              <Icon name="chevR" />
            </button>
          ) : null}
          <div className="home-popular-window">
            <div
              className="home-popular-track"
              style={
                {
                  "--popular-desktop": `calc(${-25 * index}% + ${-3.5 * index + dragX}px)`,
                  "--popular-tablet": `calc(${-50 * index}% + ${-7 * index + dragX}px)`,
                  "--popular-mobile": `calc(${-100 * index}% + ${-14 * index + dragX}px)`,
                } as CSSProperties
              }
            >
              {popular.map((item, cardIndex) => (
                <Link
                  className="home-popular-card"
                  href={hrefFor(item)}
                  key={`${item.id}-${cardIndex}`}
                >
                  <div className="home-popular-copy">
                    <div className="home-popular-card-head">
                      <span className="home-popular-category">
                        <Icon name={iconByBoard[item.board]} />
                        {boardLabels.get(item.board)}
                      </span>
                      <time>{item.at}</time>
                    </div>
                    {/* excerpt 없는 글이 큐레이션으로 고정되면 본문이 빈 카드가 된다 — 제목으로 폴백 */}
                    <p>{item.excerpt ?? item.title}</p>
                    <footer>
                      <AnonymousIdentity
                        verified={item.badges.includes("인증")}
                      />
                      <span>
                        <Icon name="like" /> <LikeCount postId={item.postId} base={item.likes} />{" "}
                        <Icon name="comment" /> <CommentCount postId={item.postId} base={item.comments} />
                      </span>
                    </footer>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      <Link className="home-feed-list-more" href="/community">
        <span>전체보기</span>
        <Icon name="arrow" />
      </Link>
    </>
  );
}
