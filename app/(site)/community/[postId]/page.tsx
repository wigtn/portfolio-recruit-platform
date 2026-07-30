import Link from "next/link";
import { Crumb } from "@/components/Crumb";
import { notFound } from "next/navigation";
import { ALL_POSTS, getPost } from "@/lib/seed/posts";
import { FEED, POPULAR_WEEK } from "@/lib/seed/feed";
import { PostAnswers } from "@/components/PostAnswers";
import { ReactBar } from "@/components/ReactBar";
import { BlindGate } from "@/components/BlindGate";
import { Icon } from "@/components/Icon";
import { LikeCount } from "@/components/LikeCount";
import { CommentCount } from "@/components/CommentCount";
import { AnonymousIdentity } from "@/components/AnonymousIdentity";

export function generateStaticParams() {
  return ALL_POSTS.map((post) => ({ postId: post.id }));
}

/** 시안 정본 05번(글 상세) 구조 그대로 — .sec > .split(.article + 사이드) */
export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ postId: string }>;
}) {
  const { postId } = await params;
  const post = getPost(postId);
  if (!post) notFound();

  // "도움돼요"는 목록(FEED)의 실값을 쓴다 — 하드코딩 24는 목록 164를 열면 24로
  // 줄어드는 모순을 만들었다. postId 표기 정리 전 저장분도 잇도록 구표기도 본다.
  const feedItem = FEED.find(
    (item) =>
      item.postId === post.id ||
      item.postId?.replace(/^p-f-/, "p-f") === post.id,
  );
  const likes = feedItem?.likes ?? 0;

  return (
    <div className="sec">
      <div className="split">
        <div>
          <Crumb
            style={{ marginBottom: 14 }}
            items={[
              { label: "커뮤니티", href: "/community" },
              { label: post.board },
            ]}
          />

          <div className="article">
            {/* 운영자가 블라인드·삭제한 글이면 제목·본문·반응이 통째로 가려진다 */}
            <BlindGate postId={post.id}>
              <div className="ahead">
                <div className="badges" style={{ display: "flex", gap: 6 }}>
                  {post.badges.map((badge) => (
                    <span
                      className={badge === "HOT" ? "tag hot" : "tag neu"}
                      key={badge}
                    >
                      {badge}
                    </span>
                  ))}
                </div>
                <h1>{post.title}</h1>
                <div className="awho">
                  <AnonymousIdentity verified={post.badges.includes("인증")} />
                  <span>
                    · 영업 {post.authorYears}년차 · {post.postedAt}
                  </span>
                  <span className="met">
                    <span>
                      <Icon name="view" />
                      {post.views}
                    </span>
                    <span>
                      <Icon name="comment" />
                      <CommentCount
                        postId={post.id}
                        base={post.comments.length}
                      />
                    </span>
                  </span>
                </div>
              </div>

              <div className="abody">
                {post.body.split("\n\n").map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>

              <ReactBar post={post} likes={likes} />

              <PostAnswers post={post} />
            </BlindGate>
          </div>
        </div>

        {/* 사이드 — 스크롤을 따라온다(글이 길어도 인기글·광고가 시야에) */}
        <div className="wside">
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
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <span className="adlabel">AD</span>
          {/* 목록의 같은 카드와 동일하게 상담으로 잇는다 — 버튼 모양인데
              눌리지 않는 카드는 죽은 링크로 읽힌다 */}
          <Link className="adcard" href="/contact">
            <div className="adimg c">
              <span className="art" />
              <div className="k">이직 준비</div>
              <div className="h">
                영업직 이력서
                <br />
                무료 첨삭
              </div>
            </div>
            <div className="adbody">
              <span className="adt">현직 세일즈 리더가 직접</span>
              <span className="adgo">신청</span>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
