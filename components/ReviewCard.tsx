"use client";

import { useEffect, useRef, useState } from "react";
import { loadUser, saveUser, toggleIn } from "@/lib/demo/user";
import {
  addReviewReply,
  loadReviewReplies,
  subscribeMyReviews,
  type ReviewReply,
} from "@/lib/demo/reviews";
import { DEMO_PROFILE } from "@/lib/demo/profile";
import { useRole } from "@/lib/demo/role";
import type { Review } from "@/lib/seed/reviews";
import { ReportModal } from "./ReportModal";
import { RoleModal } from "./demo/RoleModal";
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
  const { role } = useRole();
  const [helpful, setHelpful] = useState(false);
  const [reported, setReported] = useState(false);
  const [reporting, setReporting] = useState(false);
  /* 체험 중 단 답글 — 시드 답글 뒤에 이어 붙는다 */
  const [myReplies, setMyReplies] = useState<ReviewReply[]>([]);
  const [replying, setReplying] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [gateOpen, setGateOpen] = useState(false);
  const replyInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const user = loadUser();
    setHelpful(user.helpful.includes(review.id));
    setReported(user.reported.includes(review.id));
    const sync = () => setMyReplies(loadReviewReplies()[review.id] ?? []);
    sync();
    return subscribeMyReviews(sync);
  }, [review.id]);

  const submitReply = () => {
    // 답글도 회원의 일이다 — 게스트는 로그인(역할 전환)으로 유도한다
    if (role === "guest") {
      setGateOpen(true);
      return;
    }
    const text = replyText.trim();
    if (!text) {
      replyInput.current?.focus();
      return;
    }
    const now = new Date();
    addReviewReply(review.id, {
      id: `${review.id}-reply-${crypto.randomUUID()}`,
      author: DEMO_PROFILE.nick,
      text,
      writtenAt: `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, "0")}`,
    });
    setReplyText("");
    setReplying(false);
  };

  return (
    <div className="review" id={`review-${review.id}`}>
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
        <span>영업, {review.employment}</span>
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
          style={{ color: "var(--ink-3)", cursor: "pointer" }}
          onClick={() => {
            setReplying((current) => !current);
            setReplyText("");
          }}
        >
          답글
        </button>
        <button
          style={{ color: "var(--ink-5)", cursor: "pointer" }}
          disabled={reported}
          onClick={() => setReporting(true)}
        >
          {reported ? "신고함" : "신고"}
        </button>
      </div>

      {review.replies?.length || myReplies.length ? (
        <div className="reviewreplies">
          {[...(review.replies ?? []), ...myReplies].map((reply) => (
            <div className="reviewreply" key={reply.id}>
              <div className="reviewreply-head">
                <span className="tag">{reply.author}</span>
                <span>{reply.writtenAt}</span>
              </div>
              <p>{reply.text}</p>
            </div>
          ))}
        </div>
      ) : null}

      {replying ? (
        <div className="replybox" style={{ marginTop: 10 }}>
          <input
            ref={replyInput}
            className="in"
            autoFocus
            value={replyText}
            placeholder="이 리뷰에 답글을 남겨보세요"
            onChange={(event) => setReplyText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.nativeEvent.isComposing)
                submitReply();
              if (event.key === "Escape") setReplying(false);
            }}
          />
          <button className="btn primary sm" onClick={submitReply}>
            등록
          </button>
        </div>
      ) : null}

      {gateOpen ? <RoleModal onClose={() => setGateOpen(false)} /> : null}

      {reporting ? (
        <ReportModal
          subject={{
            id: review.id,
            target: `${company}, “${review.headline}”`,
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
