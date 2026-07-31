"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Lottie 재생기.
 *
 * lottie-web은 250KB 남짓이라 첫 화면에 얹으면 손해다. 그래서 두 가지를 건다.
 * 화면에 들어올 때 동적 import로 가져오고, 화면 밖으로 나가면 재생을 멈춘다.
 * 상담 페이지에는 장면이 넷이라 안 그러면 보이지도 않는 애니메이션 넷이 계속
 * 프레임을 그린다.
 *
 * light 빌드를 쓴다. 표현식과 이펙트가 빠진 대신 용량이 절반이고, 우리가 만든
 * 장면은 도형과 키프레임만 쓰므로 잃는 게 없다.
 *
 * 움직임을 줄이는 설정이면 첫 프레임에서 멈춘다. 정지 화면만으로도 무슨
 * 장면인지 읽히게 구도를 잡아 뒀다.
 */
export function LottieScene({
  data,
  label,
}: {
  /** kit으로 조립한 Lottie 문서 */
  data: object;
  /** 화면 낭독기용 설명 */
  label: string;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);

  // 한 화면 앞서 준비한다. 스크롤이 닿았을 때 이미 돌고 있어야 한다
  useEffect(() => {
    const node = hostRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setNear(true);
          observer.disconnect();
        }
      },
      { rootMargin: "300px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!near) return;
    const node = hostRef.current;
    if (!node) return;

    let animation: {
      destroy: () => void;
      play: () => void;
      pause: () => void;
      goToAndStop: (value: number, isFrame?: boolean) => void;
    } | null = null;
    let visibility: IntersectionObserver | null = null;
    let dead = false;

    const reduce = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    import("lottie-web/build/player/lottie_light").then((mod) => {
      if (dead) return;
      const lottie = (mod.default ?? mod) as {
        loadAnimation: (options: object) => typeof animation;
      };
      animation = lottie.loadAnimation({
        container: node,
        renderer: "svg",
        loop: true,
        autoplay: !reduce,
        animationData: data,
        rendererSettings: { progressiveLoad: true },
      });

      if (reduce) {
        // 정지 화면도 장면이 읽히는 지점에서 세운다
        animation?.goToAndStop(300, true);
        return;
      }

      // 화면 밖이면 그리지 않는다
      visibility = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) animation?.play();
            else animation?.pause();
          }
        },
        { threshold: 0.01 },
      );
      visibility.observe(node);
    });

    return () => {
      dead = true;
      visibility?.disconnect();
      animation?.destroy();
    };
  }, [near, data]);

  return (
    <div className="lot" role="img" aria-label={label}>
      <div className="lot-canvas" ref={hostRef} />
    </div>
  );
}
