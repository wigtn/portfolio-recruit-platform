"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";

/**
 * WIGTN 마무리 배너 — 로고 네이비 면 + 다이내믹 영상(screen 블렌드) 위에서
 * 스크롤로 들어오면 헤드라인이 단어 단위로 마스크를 뚫고 올라온다(AE식
 * 라인 마스크 리빌). 한 번만 재생하고, 모션 줄이기 설정이면 바로 최종 상태.
 */
const TITLE_WORDS = ["이", "화면", "그대로,", "업종만", "바꿔", "만들어", "드립니다."];

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

        <h2 className="closing-title" aria-label="이 화면 그대로, 업종만 바꿔 만들어 드립니다.">
          {TITLE_WORDS.map((word, index) => (
            <span className="w" key={index} aria-hidden>
              <span style={{ "--d": `${index * 80}ms` } as React.CSSProperties}>
                {word}
              </span>{" "}
            </span>
          ))}
        </h2>
        <p className="closing-sub">
          커머스, 숙박 예약, 헬프데스크, 같은 모듈을 다시 조합합니다.
        </p>

        <div className="closing-act">
          <Link className="closing-cta" href="/contact">
            상담 요청하기
            <Icon name="arrow" />
          </Link>
        </div>

        <ul className="closing-facts">
          <li>
            <b>산출물</b>
            <strong>화면 20종을 통째로</strong>
            <span>사용자 10화면 + 운영 백오피스 10화면</span>
          </li>
          <li>
            <b>방식</b>
            <strong>검증된 모듈 재조합</strong>
            <span>처음부터 만들지 않아 빠릅니다</span>
          </li>
          <li>
            <b>운영</b>
            <strong>권한, 감사, 재인증 내장</strong>
            <span>운영 도구까지 함께 인도합니다</span>
          </li>
          <li>
            <b>확장</b>
            <strong>업종만 바꿔 다시 조합</strong>
            <span>커머스, 예약, 헬프데스크</span>
          </li>
        </ul>
      </div>
    </section>
  );
}
