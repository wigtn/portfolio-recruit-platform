"use client";

import { useEffect, useRef, useState } from "react";
import { loadUser, saveUser, toggleIn } from "@/lib/demo/user";
import type { Post } from "@/lib/seed/posts";
import { ReportModal } from "./ReportModal";
import { Icon } from "./Icon";
import { BookmarkIcon, FlagIcon, LikeIcon, ShareIcon } from "./ReactIcons";
import { toast } from "./ds/Toaster";

/**
 * 글 반응 — 시안 `.reactbar`. 도움돼요·스크랩은 이 브라우저에 남고,
 * 신고는 운영자 신고 관리로 넘어간다.
 *
 * 공유는 단순 복사가 아니라 서비스 선택 시트를 연다 — X·페이스북은 웹
 * 인텐트로 실제 열리고, 카카오톡은 SDK 키가 필요해 데모 안내로 정직하게
 * 말한다. 버튼마다 눌림 스프링과 아이콘 팝 애니메이션이 붙는다.
 */
export function ReactBar({ post, likes }: { post: Post; likes: number }) {
  const [liked, setLiked] = useState(false);
  const [scrapped, setScrapped] = useState(false);
  const [reported, setReported] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const shareRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const user = loadUser();
    setLiked(user.likes.includes(post.id));
    setScrapped(user.scraps.includes(post.id));
    setReported(user.reported.includes(post.id));
  }, [post.id]);

  // 시트 바깥 클릭 — 닫는다
  useEffect(() => {
    if (!shareOpen) return;
    const close = (event: PointerEvent) => {
      if (!shareRef.current?.contains(event.target as Node)) {
        setShareOpen(false);
      }
    };
    window.addEventListener("pointerdown", close);
    return () => window.removeEventListener("pointerdown", close);
  }, [shareOpen]);

  function toggle(key: "likes" | "scraps") {
    const user = loadUser();
    const next = { ...user, [key]: toggleIn(user[key], post.id) };
    saveUser(next);
    if (key === "likes") setLiked(next.likes.includes(post.id));
    else setScrapped(next.scraps.includes(post.id));
  }

  async function copyLink() {
    setShareOpen(false);
    // 브라우저가 막으면(비보안 컨텍스트 등) 조용히 실패하지 않게 알린다
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast("글 주소를 복사했어요", { tone: "success" });
    } catch {
      window.prompt("이 주소를 복사하세요", window.location.href);
    }
  }

  function shareTo(service: "x" | "facebook" | "kakao") {
    setShareOpen(false);
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(post.title);
    if (service === "x") {
      window.open(
        `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
        "_blank",
        "noopener,width=560,height=460",
      );
    } else if (service === "facebook") {
      window.open(
        `https://www.facebook.com/sharer/sharer.php?u=${url}`,
        "_blank",
        "noopener,width=560,height=460",
      );
    } else {
      // 카카오 공유는 SDK 앱 키가 필요하다 — 데모는 정직하게 말한다
      toast("카카오톡 공유는 데모에서 연결하지 않았어요 — 링크 복사를 써보세요", {
        tone: "info",
      });
    }
  }

  return (
    <>
      <div className="reactbar">
        <button
          className={liked ? "rb rb-like on" : "rb rb-like"}
          onClick={() => toggle("likes")}
        >
          {/* key 교체로 요소 모션이 상태 전환마다 다시 돈다 */}
          <span className="rbic" key={liked ? "on" : "off"}>
            <LikeIcon />
            {liked ? (
              /* 파티클 버스트 — 절대배치라 레이아웃 크기 불변 */
              <span className="rburst" aria-hidden>
                {Array.from({ length: 6 }).map((_, index) => (
                  <i key={index} style={{ "--a": `${index * 60}deg` } as React.CSSProperties} />
                ))}
              </span>
            ) : null}
          </span>
          도움돼요 {likes + (liked ? 1 : 0)}
        </button>
        <button
          className={scrapped ? "rb rb-scrap on" : "rb rb-scrap"}
          onClick={() => toggle("scraps")}
        >
          <span
            className={scrapped ? "rbic is-fill" : "rbic"}
            key={scrapped ? "on" : "off"}
          >
            <BookmarkIcon />
          </span>
          스크랩
        </button>

        <span className="sharewrap" ref={shareRef}>
          <button
            className={shareOpen ? "rb rb-share is-open" : "rb rb-share"}
            aria-haspopup="menu"
            aria-expanded={shareOpen}
            onClick={() => setShareOpen((prev) => !prev)}
          >
            <span className="rbic" key={shareOpen ? "on" : "off"}>
              <ShareIcon />
            </span>
            공유
          </button>
          {shareOpen ? (
            <span className="sharepop" role="menu">
              <button role="menuitem" onClick={() => shareTo("kakao")}>
                <i className="spic is-kakao">K</i>카카오톡
              </button>
              <button role="menuitem" onClick={() => shareTo("x")}>
                <i className="spic is-x">𝕏</i>X에 공유
              </button>
              <button role="menuitem" onClick={() => shareTo("facebook")}>
                <i className="spic is-fb">f</i>페이스북
              </button>
              <button role="menuitem" onClick={copyLink}>
                <i className="spic is-link">
                  <Icon name="link" />
                </i>
                링크 복사
              </button>
            </span>
          ) : null}
        </span>

        <button
          className={reported ? "rb rb-report on" : "rb rb-report"}
          disabled={reported}
          onClick={() => setReporting(true)}
        >
          <span className="rbic" key={reported ? "on" : "off"}>
            <FlagIcon />
          </span>
          신고
        </button>
      </div>

      {reporting ? (
        <ReportModal
          subject={{
            id: post.id,
            target: post.title,
            kind: "커뮤니티 글",
            body: post.body,
            author: "익명",
          }}
          onClose={(submitted) => {
            setReporting(false);
            if (submitted) setReported(true);
          }}
        />
      ) : null}
    </>
  );
}
