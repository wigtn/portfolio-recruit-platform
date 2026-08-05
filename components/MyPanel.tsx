"use client";

import Link from "next/link";
import { LevelBadge } from "@/components/LevelBadge";
import { useEffect, useState } from "react";
import { FEED } from "@/lib/seed/feed";
import { COMPANIES } from "@/lib/seed/companies";
import { loadUser, type UserState } from "@/lib/demo/user";
import { myEvidenceStatus } from "@/lib/demo/submit";
import { DEMO_PROFILE, levelFor, seedActivity } from "@/lib/demo/profile";
import { PostRow } from "./PostRow";
import { Avatar } from "./Avatar";
import { Coach } from "./Coach";
import { Icon } from "./Icon";
import { Sk, SkRegion, useMockLoading } from "./Skeleton";
import { SmoothHeight } from "./ds/SmoothHeight";
import type { Review } from "@/lib/seed/reviews";
import {
  loadMyReviews,
  loadReadReviewReplies,
  loadReviewReplies,
  markReviewRepliesRead,
  subscribeMyReviews,
  type ReviewReply,
} from "@/lib/demo/reviews";

/**
 * 마이페이지 본문 — 프로필 카드·탭·증빙 신청이 전부 실데이터로 동작한다.
 *
 * 프로필 카드가 이 컴포넌트 안에 있는 이유: 카드 수치(작성글·내 리뷰)와 탭
 * 카운트가 **같은 소스에서 파생**돼야 하기 때문이다. 카드가 서버에서 "24"를
 * 박아 두면 바로 아래 탭의 "내 글 2"와 한 화면에서 충돌한다(실제로 그랬다).
 *
 * 증빙을 올리면 **운영자 증빙 검토 큐에 신청이 뜬다.** 운영자가 승인·반려하면
 * 그 결과(반려 사유 포함)가 여기로 돌아온다 — 이 왕복이 이 화면의 데모 포인트다.
 */

type Tab = "posts" | "comments" | "likes" | "scraps" | "follows" | "reviews";

/** 실측 높이(1440px) — 스켈레톤이 자리를 정확히 예약해야 데이터 도착 때 안 민다 */
const H = {
  post: 133.2,
  statValue: 20,
} as const;

export function MyPanel() {
  const [tab, setTab] = useState<Tab>("posts");
  const [user, setUser] = useState<UserState | null>(null);
  const [evidence, setEvidence] = useState<ReturnType<
    typeof myEvidenceStatus
  > | null>(null);
  const [storedReviews, setStoredReviews] = useState<Review[]>([]);
  /* 체험 중 단 답글(리뷰 id → 답글들) — 시드 답글에 얹어 세야 카드의
     "답글 n"과 리뷰 화면에 실제로 보이는 개수가 같다 */
  const [replyMap, setReplyMap] = useState<Record<string, ReviewReply[]>>({});
  const [readReviewReplies, setReadReviewReplies] = useState<Set<string>>(
    new Set(),
  );

  // 홈과 같은 강제 지연 — localStorage는 즉시 오지만, 스켈레톤이 한 프레임만
  // 스치면 로딩 처리를 했는지 안 했는지 보이지 않는다(Skeleton.tsx의 명분)
  const delaying = useMockLoading();
  const loading = delaying || !user;

  useEffect(() => {
    setUser(loadUser());
    setEvidence(myEvidenceStatus());
    const syncReviews = () => {
      setStoredReviews(loadMyReviews());
      setReplyMap(loadReviewReplies());
    };
    syncReviews();
    setReadReviewReplies(loadReadReviewReplies());
    return subscribeMyReviews(syncReviews);
  }, []);

  const seed = seedActivity();
  const written = user?.posts ?? [];
  const answers = user?.answers ?? [];
  const storedCompanies = new Set(storedReviews.map((review) => review.companySlug));
  const reviews = [
    ...storedReviews,
    ...seed.reviews.filter(
      (review) => !storedCompanies.has(review.companySlug),
    ),
  ];

  const postCount = seed.posts.length + written.length;
  const commentCount = seed.comments.length + answers.length;
  const liked = FEED.filter(
    (item) => item.postId && user?.likes.includes(item.postId),
  );
  const scrapped = FEED.filter(
    (item) => item.postId && user?.scraps.includes(item.postId),
  );
  const followed = COMPANIES.filter((company) =>
    user?.follows.includes(company.slug),
  );

  const level = levelFor(evidence?.status);
  const approved = evidence?.status === "승인";

  const TABS: Array<{ key: Tab; label: string; count: number }> = [
    { key: "posts", label: "내 글", count: postCount },
    { key: "comments", label: "댓글", count: commentCount },
    { key: "likes", label: "도움돼요한 글", count: liked.length },
    { key: "scraps", label: "스크랩", count: scrapped.length },
    { key: "follows", label: "팔로우한 회사", count: followed.length },
    { key: "reviews", label: "내 리뷰", count: reviews.length },
  ];

  // 프로필 카드 수치 — 탭 카운트와 같은 파생값을 쓴다
  const STATS: Array<{ value: string; label: string }> = [
    { value: String(postCount), label: "작성글" },
    { value: String(reviews.length), label: "내 리뷰" },
    { value: DEMO_PROFILE.helpReceived.toLocaleString(), label: "받은 도움" },
  ];

  return (
    <>
      <div className="profilecard">
        <div className="pinfo">
          <div className="pn">
            {DEMO_PROFILE.name}{" "}
            <span className="plevel">
              {loading ? <Sk w={72} h={12} /> : <LevelBadge grade={level} />}
            </span>
          </div>
          <div className="pmeta">{DEMO_PROFILE.meta}</div>
        </div>
        <div className="pstats">
          {STATS.map((stat) => (
            <div className="pstat" key={stat.label}>
              {/* b 안에 Sk를 넣으면 줄상자는 b의 strut이 세운다 — 숫자와 같은 높이 */}
              <b>
                {loading ? <Sk w={30} h={H.statValue} r={5} /> : stat.value}
              </b>
              <span>{stat.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="split">
        <div>
          <div className="tabs my-tabs">
            {TABS.map((item) => (
              <button
                key={item.key}
                className={tab === item.key ? "on" : undefined}
                onClick={() => setTab(item.key)}
              >
                {item.label}{" "}
                {/* 마이 탭의 카운트는 일반 탭의 절대 배치 뱃지를 쓰지 않는다.
                    인라인 흐름에 두어 세로 스크롤과 잘림을 막는다. */}
                <span className="ct">
                  {loading ? <Sk w={8} h={10} /> : item.count}
                </span>
              </button>
            ))}
          </div>

          {loading ? (
            // 기본 탭(내 글)의 시드 2행과 같은 자리 — 높이 실측 고정
            <SkRegion label="내 활동">
              <div className="feed">
                {[0, 1].map((index) => (
                  <div
                    className="post"
                    key={index}
                    style={{ height: H.post }}
                    aria-hidden
                  >
                    <div>
                      <div className="badges">
                        <Sk w={46} h={23.6} r={6} />
                        <Sk w={52} h={23.6} r={6} />
                      </div>
                      <Sk w="58%" h={17} style={{ marginBottom: 11 }} />
                      <div className="m">
                        <span className="who">
                          <Sk w={20} h={20} r={99} />
                          <Sk w={96} h={12} />
                        </span>
                        <span className="met">
                          <Sk w={34} h={12} />
                          <Sk w={30} h={12} />
                          <Sk w={38} h={12} />
                        </span>
                      </div>
                    </div>
                    <Sk w={74} h={74} r={10} />
                  </div>
                ))}
              </div>
            </SkRegion>
          ) : (
            /* 탭 내용은 길이가 제각각이다 — 전환 시 카드가 뚝 끊겨 자라는
               대신 SmoothHeight가 350ms 감속으로 흡수한다(P1 문법) */
            <SmoothHeight>
              <div className="sk-arrive" key={tab}>
                {tab === "posts" ? (
                  <div className="feed">
                    {/* 체험 중 쓴 글이 위에 온다 — 방금 등록한 게 안 보이면 등록이 안 된 걸로 읽힌다 */}
                    {written.map((post) => (
                      <div className="post" key={post.id}>
                        <div>
                          <div className="badges">
                            <span className="cat">{post.board}</span>
                            <span className="tag">방금 작성</span>
                          </div>
                          <div className="t">{post.title}</div>
                          <div className="m">
                            <span className="who">
                              <Avatar name={DEMO_PROFILE.nick} chars={1} />
                              {DEMO_PROFILE.nick}, {post.at}
                            </span>
                            {post.files ? (
                              <span className="met">
                                <span>
                                  <Icon name="image" />
                                  {post.files}
                                </span>
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    ))}
                    {seed.posts.map((item) => (
                      <PostRow key={item.id} item={item} />
                    ))}
                  </div>
                ) : null}

                {tab === "comments" ? (
                  <div className="feed">
                    {/* 체험 중 단 댓글이 위에 온다 — 시드 댓글과 같은 모양으로 */}
                    {answers.map((answer) => (
                      <Link
                        className="post"
                        key={answer.id}
                        href={`/community/${answer.postId}`}
                      >
                        <div>
                          <div className="badges">
                            <span className="tag">방금 작성</span>
                          </div>
                          <div className="t">{answer.text}</div>
                          <div className="m">
                            <span className="who">
                              {DEMO_PROFILE.nick}, {answer.at}
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                    {seed.comments.map(({ post, comment }) => (
                      <Link
                        className="post"
                        key={`${post.id}-${comment.text}`}
                        href={`/community/${post.id}`}
                      >
                        <div>
                          <div className="badges">
                            <span className="cat">{post.board}</span>
                          </div>
                          <div className="t">{comment.text}</div>
                          <div className="m">
                            <span className="who">{post.title}</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : null}

                {tab === "likes" ? (
                  liked.length ? (
                    <Feed items={liked} />
                  ) : (
                    <Empty
                      title="도움돼요한 글이 없어요"
                      sub="글 상세에서 도움돼요를 누르면 여기 모여요"
                    />
                  )
                ) : null}

                {tab === "scraps" ? (
                  scrapped.length ? (
                    <Feed items={scrapped} />
                  ) : (
                    <Empty
                      title="스크랩한 글이 없어요"
                      sub="글 상세에서 스크랩을 누르면 여기 모여요"
                    />
                  )
                ) : null}

                {tab === "follows" ? (
                  followed.length ? (
                    <div className="feed">
                      {followed.map((company) => (
                        <Link
                          className="post"
                          key={company.slug}
                          href={`/companies/${company.slug}`}
                        >
                          <div>
                            <div className="badges">
                              <span className="cat">{company.industry}</span>
                            </div>
                            <div className="t">{company.name}</div>
                            <div className="m">
                              <span className="who">
                                {company.region}, 리뷰 {company.reviewCount}건
                              </span>
                              <span className="met">
                                <span>
                                  <Icon name="star" />
                                  {company.score.toFixed(1)}
                                </span>
                              </span>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <Empty
                      title="팔로우한 회사가 없어요"
                      sub="회사 상세에서 팔로우를 누르면 여기 모여요"
                    />
                  )
                ) : null}

                {tab === "reviews" ? (
                  reviews.length ? (
                    <div className="feed">
                      {reviews.map((review) => {
                        const company = COMPANIES.find(
                          (item) => item.slug === review.companySlug,
                        );
                        const replyCount =
                          (review.replies?.length ?? 0) +
                          (replyMap[review.id]?.length ?? 0);
                        const unread =
                          replyCount > 0 && !readReviewReplies.has(review.id);
                        return (
                          <Link
                            className="post my-review-row"
                            key={review.id}
                            href={`/companies/${review.companySlug}#review-${review.id}`}
                            onClick={() => {
                              if (!replyCount) return;
                              markReviewRepliesRead(review.id);
                              setReadReviewReplies((current) => {
                                const next = new Set(current);
                                next.add(review.id);
                                return next;
                              });
                            }}
                          >
                            <div>
                              <div className="badges">
                                <span className="cat">{company?.name ?? "회사 리뷰"}</span>
                                {unread ? (
                                  <span className="tag hot">새 답글</span>
                                ) : replyCount ? (
                                  <span className="tag neu">답글 확인</span>
                                ) : null}
                              </div>
                              <div className="t">{review.headline}</div>
                              <div className="m">
                                <span className="who">{review.writtenAt}, 익명으로 공개</span>
                                <span className="met">
                                  <span>
                                    <Icon name="star" /> {review.score.toFixed(1)}
                                  </span>
                                  <span>
                                    <Icon name="comment" /> 답글 {replyCount}
                                  </span>
                                </span>
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  ) : (
                    <Empty
                      title="아직 작성한 리뷰가 없어요"
                      sub="회사 상세에서 리뷰를 남기면 여기에 모여요"
                    />
                  )
                ) : null}
              </div>
            </SmoothHeight>
          )}
        </div>

        <div>
          <div className="card">
            <h4>내 등급</h4>
            <div className="evinfo">
              <div className="row">
                <span className="k">현재</span>
                <span className="v" style={{ color: "var(--accent)" }}>
                  {loading ? <Sk w={92} h={12} /> : level}
                </span>
              </div>
              <div className="row">
                <span className="k">받은 도움</span>
                <span className="v">
                  {DEMO_PROFILE.helpReceived.toLocaleString()}
                </span>
              </div>
              <div className="row">
                <span className="k">다음 등급</span>
                <span className="v">
                  {loading ? (
                    <Sk w={140} h={12} />
                  ) : approved ? (
                    "최고 등급이에요"
                  ) : (
                    `${DEMO_PROFILE.nextLevel}, 실적 증빙 승인 시`
                  )}
                </span>
              </div>
            </div>
            <div
              style={{
                fontSize: "12.5px",
                color: "var(--ink-3)",
                marginTop: 10,
              }}
            >
              등급 기준은{" "}
              <Link
                href="/badges"
                style={{ color: "var(--accent)", fontWeight: 700 }}
              >
                실적 인증
              </Link>
              에서 확인해요
            </div>
          </div>

          <Coach
            id="my-evidence"
            cta={{ label: "인증 신청하기", href: "/badges" }}
          >
            실적 증빙을 올리면 <b>운영자가 검토하고 등급이 실제로 올라</b>가요
          </Coach>

          <div className="card">
            <h4>실적 증빙</h4>
            <div className="evinfo">
              <div className="row">
                <span className="k">신청</span>
                <span
                  className="v"
                  style={{
                    color:
                      evidence?.status === "승인"
                        ? "var(--accent)"
                        : evidence?.status === "반려"
                          ? "var(--hot)"
                          : "var(--ink-3)",
                  }}
                >
                  {loading ? (
                    <Sk w={130} h={12} />
                  ) : evidence ? (
                    `${DEMO_PROFILE.nextLevel}, ${evidence.status}`
                  ) : (
                    "아직 신청하지 않았어요"
                  )}
                </span>
              </div>
              {evidence?.status === "반려" && evidence.reason ? (
                <div className="row">
                  <span className="k">반려 사유</span>
                  <span className="v">{evidence.reason}</span>
                </div>
              ) : null}
            </div>

            {!loading && evidence?.status === "승인" ? (
              <div
                className="safenote"
                style={{ marginTop: 11, marginBottom: 0 }}
              >
                <span className="si">
                  <Icon name="check" />
                </span>
                <div>
                  <b>실적 인증 배지를 받았어요</b>
                  <span>이제 실적인증 게시판에 인증글을 쓸 수 있어요</span>
                </div>
              </div>
            ) : (
              <>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--ink-4)",
                    marginTop: 9,
                    // Sk는 block이라 strut이 없다 — 글줄 높이를 직접 예약한다
                    ...(loading
                      ? {
                          height: 19.2,
                          display: "flex",
                          alignItems: "center",
                        }
                      : {}),
                  }}
                >
                  {loading ? (
                    <Sk w={170} h={12} />
                  ) : evidence?.status === "반려" ? (
                    "사유를 확인하고 다시 올려주세요"
                  ) : (
                    "반려되면 사유가 여기에 표시돼요"
                  )}
                </div>
                {/* 신청·업로드는 실적 인증 페이지가 정본 — 여기서 또 받지 않는다 */}
                <Link
                  className="btn line sm"
                  href="/badges"
                  style={{
                    marginTop: 11,
                    width: "100%",
                    justifyContent: "center",
                  }}
                >
                  <Icon name="award" />{" "}
                  {evidence ? "실적 인증에서 다시 신청하기" : "실적 인증 신청하러 가기"}
                </Link>

                {!loading && evidence?.status === "검토 대기" ? (
                  <a
                    className="btn line sm"
                    style={{
                      marginTop: 8,
                      width: "100%",
                      justifyContent: "center",
                    }}
                    href="/admin/badges"
                  >
                    운영자 검토 큐에서 보기
                  </a>
                ) : null}
              </>
            )}
          </div>

          <div className="card">
            <h4>내 배지</h4>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <span className="statchip">첫 리뷰</span>
              <span className="statchip">인증왕</span>
              <span className="statchip">답변 100+</span>
              {!loading && approved ? (
                <span className="statchip">실적 인증</span>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function Feed({ items }: { items: typeof FEED }) {
  return (
    <div className="feed">
      {items.map((item) => (
        <PostRow key={item.id} item={item} />
      ))}
    </div>
  );
}

function Empty({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="card" style={{ textAlign: "center", padding: 40 }}>
      <div style={{ fontWeight: 700, marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 12.5, color: "var(--ink-3)" }}>{sub}</div>
    </div>
  );
}
