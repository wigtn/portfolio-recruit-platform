"use client";

import type { Company } from "@/lib/seed/companies";
import type { Review } from "@/lib/seed/reviews";

const KEY = "wigtn-demo-my-reviews-v1";
const READ_KEY = "wigtn-demo-review-replies-read-v1";

export const MY_REVIEWS_CHANGE_EVENT = "wigtn-demo-my-reviews-change";

export function loadMyReviews(companySlug?: string): Review[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(KEY) ?? "[]");
    const rows = Array.isArray(parsed) ? (parsed as Review[]) : [];
    return companySlug
      ? rows.filter((row) => row.companySlug === companySlug)
      : rows;
  } catch {
    window.localStorage.removeItem(KEY);
    return [];
  }
}

/**
 * 등록할 때마다 새 리뷰를 추가한다.
 *
 * 데모 작성 화면은 같은 회사에 다시 진입할 수 있으므로 기존 리뷰를 교체하면
 * 사용자가 방금 누른 "리뷰 등록"과 리뷰 수 증가가 서로 어긋난다. 저장 결과를
 * 반환해 완료 화면의 평균·건수도 같은 목록을 기준으로 계산한다.
 */
export function saveMyReview(review: Review): Review[] {
  if (typeof window === "undefined") return [];
  const next = [review, ...loadMyReviews()];
  window.localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent(MY_REVIEWS_CHANGE_EVENT));
  return next;
}

export function subscribeMyReviews(listener: () => void) {
  if (typeof window === "undefined") return () => {};
  const onStorage = (event: StorageEvent) => {
    if (event.key === KEY) listener();
  };
  window.addEventListener(MY_REVIEWS_CHANGE_EVENT, listener);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(MY_REVIEWS_CHANGE_EVENT, listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** 내 리뷰를 얹은 재계산 평균 — 상세 통계와 완료 화면이 같은 식을 쓴다. */
export function scoreWithMine(company: Company, mine: Review[]) {
  const total =
    company.score * company.reviewCount +
    mine.reduce((sum, review) => sum + review.score, 0);
  return total / (company.reviewCount + mine.length);
}

/* ── 리뷰 답글 ──
   시드 답글(review.replies)은 읽기 전용이라, 체험 중 다는 답글은 리뷰 id로
   묶어 따로 둔다. 화면(ReviewCard)과 내 정보의 답글 수가 같은 저장소를 봐야
   "답글을 달았는데 개수가 안 는다"가 안 생긴다. */
const REPLY_KEY = "wigtn-demo-review-replies-v1";

export type ReviewReply = {
  id: string;
  author: string;
  text: string;
  writtenAt: string;
};

export function loadReviewReplies(): Record<string, ReviewReply[]> {
  if (typeof window === "undefined") return {};
  try {
    const parsed = JSON.parse(window.localStorage.getItem(REPLY_KEY) ?? "{}");
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, ReviewReply[]>)
      : {};
  } catch {
    window.localStorage.removeItem(REPLY_KEY);
    return {};
  }
}

export function addReviewReply(reviewId: string, reply: ReviewReply) {
  if (typeof window === "undefined") return;
  const all = loadReviewReplies();
  all[reviewId] = [...(all[reviewId] ?? []), reply];
  window.localStorage.setItem(REPLY_KEY, JSON.stringify(all));
  /* 내 리뷰 목록(내 정보)과 같은 신호를 쓴다 — 답글 수가 그쪽 화면에도 산다 */
  window.dispatchEvent(new CustomEvent(MY_REVIEWS_CHANGE_EVENT));
}

export function loadReadReviewReplies(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const parsed = JSON.parse(window.localStorage.getItem(READ_KEY) ?? "[]");
    return new Set(Array.isArray(parsed) ? (parsed as string[]) : []);
  } catch {
    window.localStorage.removeItem(READ_KEY);
    return new Set();
  }
}

export function markReviewRepliesRead(reviewId: string) {
  if (typeof window === "undefined") return;
  const next = loadReadReviewReplies();
  next.add(reviewId);
  window.localStorage.setItem(READ_KEY, JSON.stringify([...next]));
}
