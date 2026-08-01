"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";

/**
 * WIGTN 마무리 배너 — 로고 네이비 면 + 다이내믹 영상(screen 블렌드) 위에서
 * 스크롤로 들어오면 헤드라인이 단어 단위로 마스크를 뚫고 올라온다(AE식
 * 라인 마스크 리빌). 한 번만 재생하고, 모션 줄이기 설정이면 바로 최종 상태.
 */
/* 모듈은 세일즈 포인트가 아니다.

   "검증된 모듈을 조립한다"는 말은 우리 입장에서는 품질 근거지만, 듣는
   쪽에서는 "이미 있는 걸 갖다 쓰는구나"로 번역된다. 그 다음 순서는 정해져
   있다 — 그럼 왜 그 값이냐. 우리가 스스로 값을 깎을 논거를 먼저 내주는 셈이다.

   대신 증거를 판다. 이 화면이 곧 증거다. 다른 곳은 스크린샷과 기획서를
   보여 주는데 여기서는 방문자가 직접 눌러 봤다 — 글이 써지고, 신고가 운영자
   화면으로 넘어가고, 거기서 바꾼 값이 되돌아왔다. 그 경험을 마지막에
   한 번 짚어 주는 것이 이 자리에서 할 수 있는 가장 센 말이다.

   문장도 다시 썼다. "검증된 / 빠르고 덜 위험하게" 같은 균형 잡힌 형용사
   대구는 아무 회사나 쓸 수 있어서, 읽는 사람에게 아무것도 남기지 않는다. */
const TITLE_WORDS = ["방금", "둘러보신", "이", "화면이", "포트폴리오예요."];

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
          aria-label="방금 둘러보신 이 화면이 포트폴리오예요."
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
          스크린샷도 기획서도 아니에요. 글이 실제로 써지고, 신고가 운영자
          화면으로 넘어가고, 거기서 바꾼 값이 이 화면에 바로 돌아옵니다.
          만들어 드릴 서비스도 여기까지 동작하는 상태로 넘겨드려요.
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
