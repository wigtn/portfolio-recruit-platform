"use client";

import Link from "next/link";
import { LikeCount } from "./LikeCount";
import { CommentCount } from "./CommentCount";
import type { FeedItem } from "@/lib/seed/feed";
import { Icon } from "./Icon";
import { AnonymousIdentity } from "./AnonymousIdentity";
import { useBlinded } from "./BlindGate";

/**
 * 피드 행 — 시안 정본 `.post` 구조 그대로.
 * .badges → .t(제목) → .m(작성자 + .met 통계) + 선택적 .thumb
 *
 * 운영자가 블라인드·삭제 처리한 글은 목록에서도 제목·본문 신호를 가린다
 * (블라인드 판정은 BlindGate와 같은 오버레이를 읽는다 — 상세만 가리고 목록에
 * 제목이 남으면 가린 게 아니다). 그래서 클라이언트 컴포넌트다.
 */
export function PostRow({ item }: { item: FeedItem }) {
  const blinded = useBlinded(item.postId);

  if (blinded) {
    // 행 자리는 유지하되 내용 신호(제목·작성자·썸네일)를 걷는다.
    // 링크는 남긴다 — 상세에서 왜 가려졌는지(BlindGate 안내)를 볼 수 있다.
    return (
      <Link className="post" href={`/community/${item.postId}`}>
        <div>
          <div className="badges">
            <span className="cat">블라인드</span>
          </div>
          <div className="t" style={{ color: "var(--ink-4)" }}>
            운영자에 의해 블라인드된 글이에요
          </div>
          <div className="m">
            <span className="who" style={{ color: "var(--ink-4)" }}>
              신고 처리로 가려졌어요
            </span>
          </div>
        </div>
        <div className="post-aside">
          <time className="post-time">{item.at}</time>
        </div>
      </Link>
    );
  }

  const inner = (
    <>
      <div>
        <div className="badges">
          {item.badges.map((badge) =>
            badge === "HOT" ? (
              <span className="tag hot" key={badge}>
                <Icon name="fire" className="status-icon-fire" />
                HOT
              </span>
            ) : badge === "인증" ? (
              <span className="tag verified" key={badge}>
                <Icon name="award" />
                인증
              </span>
            ) : (
              <span className="cat" key={badge}>
                {badge}
              </span>
            ),
          )}
        </div>
        <div className="t">{item.title}</div>
        <div className="m">
          <span className="who">
            <AnonymousIdentity verified={item.badges.includes("인증")} />
          </span>
          <span className="met">
            <span>
              <Icon name="like" />
              <LikeCount postId={item.postId} base={item.likes} />
            </span>
            <span>
              <Icon name="comment" />
              <CommentCount postId={item.postId} base={item.comments} />
            </span>
            <span>
              <Icon name="view" />
              {item.views}
            </span>
          </span>
        </div>
      </div>
      <div className="post-aside">
        <time className="post-time">{item.at}</time>
        {/* 시안의 빈 사각형은 "이미지 실패"로 읽힌다. 첨부가 있다는 신호를 넣는다. */}
        {item.image ? (
          <div className="thumb">
            <img src={item.image} alt="" loading="lazy" />
          </div>
        ) : null}
      </div>
    </>
  );

  return item.postId ? (
    <Link className="post" href={`/community/${item.postId}`}>
      {inner}
    </Link>
  ) : (
    <div className="post">{inner}</div>
  );
}
