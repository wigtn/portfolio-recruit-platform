"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";

/**
 * WIGTN 마무리 배너 — 로고 네이비 면 + 다이내믹 영상(screen 블렌드) 위에서
 * 스크롤로 들어오면 헤드라인이 단어 단위로 마스크를 뚫고 올라온다(AE식
 * 라인 마스크 리빌). 한 번만 재생하고, 모션 줄이기 설정이면 바로 최종 상태.
 */
/* 마지막 자리에서는 한 가지만 말한다: 상담을 요청하세요.

   여기까지 스크롤한 사람은 이미 화면을 둘러본 뒤다. 무엇을 봤는지 다시
   설명하거나 이 데모를 근거로 되짚는 문장은 CTA를 그만큼 뒤로 민다.
   "이 화면 그대로", "방금 둘러보신" 같은 자기 참조도 같은 이유로 뺐다.

   기간, 금액 같은 약속도 넣지 않는다. 요구사항 없이 던진 숫자는 상담
   자리에서 뒤집힌다(챗봇 답변과 같은 기준). */
const TITLE_WORDS = ["저희가", "만들어", "드립니다."];

export function ClosingBanner() {
  const rootRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [live, setLive] = useState(false);

  /* 영상은 뷰포트에 들어온 그 순간 한 번만 돈다(사용자 지시 — 반복 금지).
     끝나면 마지막 프레임에 멈춘다. autoplay+loop로 두면 안 보이는 동안에도
     계속 돌고, 스크롤로 도착했을 땐 이미 중간부터라 연출이 아니게 된다 */
  useEffect(() => {
    if (live) void videoRef.current?.play().catch(() => {});
  }, [live]);

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setLive(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setLive(true);
          observer.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <section className={live ? "closing is-live" : "closing"} ref={rootRef}>
      {/* 다이내믹 영상 레이어 — 로고 네이비 면 위에서 빛만 남긴다(screen).
          텍스트 가독을 위해 딤 그라데이션이 그 위를 한 번 덮는다. */}
      <video
        ref={videoRef}
        className="closing-video"
        src="/media/wigtn-dynamic.mp4"
        muted
        playsInline
        preload="auto"
        aria-hidden
      />
      <div className="closing-dim" aria-hidden />

      {/* 면은 화면 끝까지, 내용만 다른 섹션과 같은 폭으로 */}
      <div className="closing-inner sec">
        <p className="closing-brand">
          <span className="closing-logo" aria-label="WIGTN">
            W<i className="dot" />
          </span>
        </p>

        <h2
          className="closing-title"
          aria-label="저희가 만들어 드립니다."
        >
          {TITLE_WORDS.map((word, index) => (
            <span className="w" key={index} aria-hidden>
              <span style={{ "--d": `${index * 80}ms` } as React.CSSProperties}>
                {word}
              </span>{" "}
            </span>
          ))}
        </h2>
        <p className="closing-sub">
          어떤 걸 만들고 싶으신지 알려주세요.
        </p>

        <div className="closing-act">
          <Link className="closing-cta" href="/contact">
            상담 요청하기
            <Icon name="arrow" />
          </Link>
        </div>

        {/* 네 칸짜리 표는 뺐다. 마무리 자리에서 읽는 사람은 이미 화면을
            둘러본 뒤고, 여기서 필요한 건 다음 한 걸음이지 요약이 아니다.
            같은 이야기를 네 번 나눠 적으면 CTA가 그만큼 멀어진다. */}
      </div>
    </section>
  );
}
