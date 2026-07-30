"use client";

import { useEffect, useState } from "react";
import type { Company } from "@/lib/seed/companies";
import type { Review } from "@/lib/seed/reviews";
import { loadMyReviews, scoreWithMine } from "@/components/ReviewComposer";
import { ReviewCard } from "@/components/ReviewCard";
import { Icon } from "@/components/Icon";

/**
 * 내가 쓴 리뷰 — 리뷰 목록 맨 위에 얹는 클라이언트 병합 레이어.
 *
 * 상세 페이지는 시드만 읽는 서버 컴포넌트라, 체험 중 등록한 리뷰(localStorage)는
 * 여기서 클라이언트로 병합한다. 작성 화면이 약속한 "회사 평균에 바로 반영"을
 * 지키는 자리다 — 내 별점을 얹어 다시 계산한 평균을 함께 보여준다.
 */
export function MyReviews({ company }: { company: Company }) {
  const [mine, setMine] = useState<Review[]>([]);

  useEffect(() => setMine(loadMyReviews(company.slug)), [company.slug]);

  // 리뷰를 안 썼으면 아무 자리도 차지하지 않는다 — 시드 목록이 그대로 첫 화면이다
  if (mine.length === 0) return null;

  const average = scoreWithMine(company, mine);

  return (
    <>
      <div className="safenote" style={{ marginBottom: 14 }}>
        <span className="si">
          <Icon name="star" filled />
        </span>
        <div>
          <b>
            내 별점 반영 평균 {average.toFixed(1)} · 리뷰{" "}
            {company.reviewCount + mine.length}건
          </b>
          <span>
            방금 남긴 리뷰를 얹어 다시 계산한 값이에요 — 체험용이라 이
            브라우저에만 반영돼요.
          </span>
        </div>
      </div>
      {mine.map((review) => (
        <ReviewCard key={review.id} review={review} company={company.name} />
      ))}
    </>
  );
}
