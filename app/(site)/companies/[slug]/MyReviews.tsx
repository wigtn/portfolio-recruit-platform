"use client";

import { useEffect, useState } from "react";
import type { Company } from "@/lib/seed/companies";
import type { Review } from "@/lib/seed/reviews";
import { loadMyReviews, subscribeMyReviews } from "@/lib/demo/reviews";
import { ReviewCard } from "@/components/ReviewCard";

/**
 * 내가 쓴 리뷰 — 리뷰 목록 맨 위에 얹는 클라이언트 병합 레이어.
 *
 * 상세 페이지는 시드만 읽는 서버 컴포넌트라, 체험 중 등록한 리뷰(localStorage)는
 * 여기서 클라이언트로 병합한다. 작성 화면이 약속한 "회사 평균에 바로 반영"을
 * 지키는 자리다 — 내 별점을 얹어 다시 계산한 평균을 함께 보여준다.
 */
export function MyReviews({ company }: { company: Company }) {
  const [mine, setMine] = useState<Review[]>([]);

  useEffect(() => {
    const sync = () => setMine(loadMyReviews(company.slug));
    sync();
    return subscribeMyReviews(sync);
  }, [company.slug]);

  // 리뷰를 안 썼으면 아무 자리도 차지하지 않는다 — 시드 목록이 그대로 첫 화면이다
  if (mine.length === 0) return null;

  /* 재계산 안내 카드는 걷어냈다(리뷰 지적: 불필요). 반영 수치는 상단
     평점 상자와 카운트가 이미 말하고 있고, 여기서 또 설명하면 목록 맨 위가
     리뷰가 아니라 공지로 시작한다. */
  return (
    <>
      {mine.map((review) => (
        <ReviewCard key={review.id} review={review} company={company.name} />
      ))}
    </>
  );
}
