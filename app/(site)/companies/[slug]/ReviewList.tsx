"use client";

import { useRole } from "@/lib/demo/role";
import { GuestReviewGate } from "@/components/GuestReviewGate";
import { ReviewCard } from "@/components/ReviewCard";
import { InfiniteFoot, useInfiniteCount } from "@/components/InfiniteList";
import type { Review } from "@/lib/seed/reviews";

/**
 * 회사 리뷰 목록 — 맛보기 한 건 + 나머지.
 *
 * 서버에서 전부 그리던 자리다. 리뷰가 회사당 스무 건 안팎으로 늘면서 한 번에
 * 다 뿌리면 첫 페인트가 무거워졌고, 스크롤로 이어 부를 자리도 없었다.
 *
 * **게스트에게는 무한 스크롤을 걸지 않는다.** 어차피 첫 건 빼고 전부 흐림
 * 처리라, 안 보이는 카드를 계속 불러오는 건 낭비다. 그보다 "몇 건이 잠겨
 * 있는지"를 정확히 보여주는 게 로그인할 이유가 된다 — 그래서 게이트에는
 * 로드된 수가 아니라 **전체 잠긴 수**를 넘긴다.
 */
export function ReviewList({
  reviews,
  company,
}: {
  reviews: Review[];
  company: string;
}) {
  const { role } = useRole();
  const guest = role === "guest";

  const [first, ...rest] = reviews;
  const { count, sentinelRef, more, done, pending } = useInfiniteCount(rest.length, {
    step: 8,
    initial: 8,
  });

  if (!first) return null;

  // 게스트: 흐린 더미는 몇 장만 세워도 "쌓여 있다"가 성립한다
  const shown = guest ? rest.slice(0, 6) : rest.slice(0, count);

  return (
    <>
      <ReviewCard review={first} company={company} />

      {rest.length > 0 ? (
        <GuestReviewGate count={rest.length}>
          {shown.map((review) => (
            <ReviewCard key={review.id} review={review} company={company} />
          ))}
        </GuestReviewGate>
      ) : null}

      {!guest && rest.length > 0 ? (
        <InfiniteFoot
          count={count + 1}
          total={reviews.length}
          done={done}
          label="리뷰"
          sentinelRef={sentinelRef}
          onMore={more}

          pending={pending}
        />
      ) : null}
    </>
  );
}
