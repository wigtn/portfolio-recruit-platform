"use client";

import { useEffect, useRef, useState } from "react";
import { Crumb } from "./Crumb";

/**
 * 상담 요청 히어로 — 홈 마무리 배너와 같은 무대(영상 screen 블렌드 + 딤 +
 * 오로라)에 AE식 워드 리빌과 포인터 패럴럭스를 얹는다. 움직이는 건 배경
 * 레이어뿐이다(콘텐츠 크기·위치 불변 규율).
 */
const TITLE_WORDS = ["이", "데모,", "우리", "서비스로", "만들어보세요."];

const FACTS = ["화면 20종 인도", "검증 모듈 재조합", "운영 도구 포함"];

export function ContactHero() {
  const rootRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    // 마운트 직후 리빌 — 첫 화면이라 스크롤 트리거 대신 짧은 지연 후 재생
    const timer = window.setTimeout(() => setLive(true), 80);
    return () => window.clearTimeout(timer);
  }, []);

  // 포인터 패럴럭스 — 영상 레이어만 살짝 따라온다(reduce 설정이면 생략)
  useEffect(() => {
    const node = rootRef.current;
    const video = videoRef.current;
    if (!node || !video) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const onMove = (event: PointerEvent) => {
      const rect = node.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      video.style.transform = `scale(1.06) translate(${x * -14}px, ${y * -10}px)`;
    };
    const onLeave = () => {
      video.style.transform = "scale(1.06)";
    };
    node.addEventListener("pointermove", onMove);
    node.addEventListener("pointerleave", onLeave);
    return () => {
      node.removeEventListener("pointermove", onMove);
      node.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div
      className={live ? "pagehead contact-hero is-live" : "pagehead contact-hero"}
      ref={rootRef}
    >
      {/* 히어로는 페이지 최상단 — 로드가 곧 뷰포트 진입이라 autoplay가 곧
          "들어왔을 때 1회"다. 반복은 하지 않고 마지막 프레임에 멈춘다 */}
      <video
        ref={videoRef}
        className="closing-video"
        src="/media/wigtn-dynamic.mp4"
        autoPlay
        muted
        playsInline
        aria-hidden
      />
      <div className="closing-dim" aria-hidden />
      <Crumb items={[{ label: "상담 요청" }]} />
      <div className="ttl">
        <div>
          <h1
            className="contact-title"
            aria-label="이 데모, 우리 서비스로 만들어보세요."
          >
            {TITLE_WORDS.map((word, index) => (
              <span className="w" key={index} aria-hidden>
                <span
                  style={{ "--d": `${index * 70}ms` } as React.CSSProperties}
                >
                  {word}
                </span>
              </span>
            ))}
          </h1>
          <div className="desc">
            방금 체험한 것들을 우리 사업의 서비스로, 구성과 일정을 제안드려요
          </div>
          <div className="contact-facts">
            {FACTS.map((fact, index) => (
              <span
                key={fact}
                style={{
                  "--d": `${420 + index * 90}ms`,
                } as React.CSSProperties}
              >
                {fact}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
