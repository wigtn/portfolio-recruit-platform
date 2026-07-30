"use client";

import { useEffect, useState } from "react";
import { loadUser, saveUser, toggleIn } from "@/lib/demo/user";
import type { Review } from "@/lib/seed/reviews";
import { ReportModal } from "./ReportModal";
import { Icon } from "./Icon";
import { LikeIcon } from "./ReactIcons";

/**
 * 리뷰 카드 — 시안 정본 `.review` 구조 그대로.
 * .rtop(총평+별점) → .pc.pro(장점) → .pc.con(단점) → .rmeta
 *
 * 작성자 열이 없는 게 계약이다(익명). 맨 오른쪽 `신고`가 신고 진입점 —
 * 누르면 운영자 신고 관리에 실제로 행이 생긴다.
 */
export function ReviewCard({
  review,
  company,
}: {
  review: Review;
  company: string;
}) {
  const [helpful, setHelpful] = useState(false);
  const [reported, setReported] = useState(false);
  const [reporting, setReporting] = useState(false);

  useEffect(() => {
    const user = loadUser();
    setHelpful(user.helpful.includes(review.id));
    setReported(user.reported.includes(review.id));
  }, [review.id]);

  return (
    <div className="review">
      <div className="rtop">
        <div className="rt">“{review.headline}”</div>
        <span className="stars">
          <Icon name="star" filled className="st1" />
          <span className="n">{review.score.toFixed(1)}</span>
        </span>
      </div>

      <div className="pc pro">
        <span className="lab">
          <Icon name="like" />
          장점
        </span>
        <p>{review.pros}</p>
      </div>

      <div className="pc con">
        <span className="lab">
          <Icon name="like" style={{ transform: "rotate(180deg)" }} />
          단점
        </span>
        <p>{review.cons}</p>
      </div>

      <div className="rmeta">
        <span>영업 · {review.employment}</span>
        <span>{review.years}년차</span>
        <span>{review.writtenAt}</span>
        <button
          style={{ marginLeft: "auto" }}
          className={helpful ? "rhelp on" : "rhelp"}
          onClick={() => {
            const user = loadUser();
            const next = { ...user, helpful: toggleIn(user.helpful, review.id) };
            saveUser(next);
            setHelpful(next.helpful.includes(review.id));
          }}
        >
          <span className="rbic" key={helpful ? "on" : "off"}>
            <LikeIcon />
          </span>
          도움돼요 {review.helpful + (helpful ? 1 : 0)}
        </button>
        <button
          style={{ color: "var(--ink-5)", cursor: "pointer" }}
          disabled={reported}
          onClick={() => setReporting(true)}
        >
          {reported ? "신고함" : "신고"}
        </button>
      </div>

      {reporting ? (
        <ReportModal
          subject={{
            id: review.id,
            target: `${company}: “${review.headline}”`,
            kind: "회사 리뷰",
            body: `[장점] ${review.pros}\n\n[단점] ${review.cons}`,
            author: "익명",
          }}
          onClose={(submitted) => {
            setReporting(false);
            if (submitted) setReported(true);
          }}
        />
      ) : null}
    </div>
  );
}
