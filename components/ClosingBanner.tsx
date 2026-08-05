"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";
import {
  DEMO_FEATURES,
  DEMO_PROGRESS_EVENT,
  loadProgress,
  type DemoFeature,
} from "@/lib/demo/progress";
import { startGuideTour } from "@/lib/demo/feature-guide";

/**
 * 마무리 배너 — 로고 네이비 면 + 다이내믹 영상(screen 블렌드) 위에서
 * 스크롤로 들어오면 헤드라인이 단어 단위로 마스크를 뚫고 올라온다(AE식
 * 라인 마스크 리빌). 한 번만 재생하고, 모션 줄이기 설정이면 바로 최종 상태.
 *
 * 내용은 체험 진행도가 정한다(리뷰 결정 — 무대는 그대로, 내용만 갈았다).
 * 여기까지 스크롤한 사람에게 필요한 건 다음 한 걸음이다: 아직이면 체험
 * 시작, 하다 말았으면 남은 체험 이어가기, 다 봤으면 남긴 흔적 확인.
 * "리뷰 목록 보기" 같은 범용 CTA는 이 화면의 존재 이유가 아니었다.
 */

type Stage = {
  words: string[];
  sub: string;
  cta: string;
  /** 라우트 CTA — 없으면 next 체험 투어를 시작하는 버튼이 선다 */
  href?: string;
};

export function ClosingBanner() {
  const router = useRouter();
  const rootRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [live, setLive] = useState(false);
  const [progress, setProgress] = useState<Set<DemoFeature>>(new Set());

  useEffect(() => {
    const sync = () => setProgress(loadProgress());
    sync();
    window.addEventListener(DEMO_PROGRESS_EVENT, sync);
    return () => window.removeEventListener(DEMO_PROGRESS_EVENT, sync);
  }, []);

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

  const done = DEMO_FEATURES.filter((feature) => progress.has(feature.id));
  /* 다음 체험 — 아직 안 한 것 중 첫 번째. 챗봇은 걸음별 대본이 없는
     화면 위 장치라 배너 CTA로는 잇지 않는다 */
  const next = DEMO_FEATURES.find(
    (feature) => !progress.has(feature.id) && !feature.action,
  );

  const stage: Stage = !done.length
    ? {
        words: ["전부,", "실제로", "동작해요."],
        sub: `${DEMO_FEATURES.length}가지 핵심 기능을 직접 실행해볼 수 있어요 — 말풍선이 걸음마다 안내해요.`,
        cta: "체험 시작하기",
      }
    : next
      ? {
          words: ["남은", "것도", "직접 확인해보세요."],
          sub: `${DEMO_FEATURES.length}가지 중 ${done.length}가지를 실행까지 마치셨어요 — 다음은 ${next.title}이에요.`,
          cta: "이어서 체험하기",
        }
      : {
          words: ["전부,", "직접", "확인하셨네요."],
          sub: "10가지가 모두 실제 데이터로 돌아갔어요 — 남긴 흔적은 내 활동에 모여 있어요.",
          cta: "내 활동 보기",
          href: "/my",
        };

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

        <h2 className="closing-title" aria-label={stage.words.join(" ")}>
          {stage.words.map((word, index) => (
            <span className="w" key={`${word}-${index}`} aria-hidden>
              <span style={{ "--d": `${index * 80}ms` } as React.CSSProperties}>
                {word}
              </span>{" "}
            </span>
          ))}
        </h2>
        <p className="closing-sub">{stage.sub}</p>

        <div className="closing-act">
          {stage.href ? (
            <Link className="closing-cta" href={stage.href}>
              {stage.cta}
              <Icon name="arrow" />
            </Link>
          ) : (
            <button
              type="button"
              className="closing-cta"
              onClick={() => {
                if (!next) return;
                /* 걸음별 안내를 걸고 그 화면으로 — 도착하면 말풍선이
                   무엇을 누를지 짚는다(FeatureGuide) */
                startGuideTour(next.id, false);
                router.push(next.href);
              }}
            >
              {stage.cta}
              <Icon name="arrow" />
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
