"use client";

import { useEffect, useState } from "react";
import { Icon } from "./Icon";

/**
 * 진행 과정 플로우 — 단계 나열이 아니라 "흘러가는 길"로 읽히게 한다.
 * 노드 중심을 관통하는 레일이 활성 단계까지 차오르고, 그 끝을 점이 달린다.
 * 2.4초 자동 순환·호버로 멈춰 읽기는 기존 규격 그대로다.
 */
const STEPS = [
  { label: "상담 요청 접수", sub: "1영업일 안에 회신드려요", icon: "mail" },
  { label: "구성 제안", sub: "업종에 맞는 범위와 견적", icon: "layout" },
  { label: "데모 배포", sub: "지금 이 화면처럼 만져보는 검증", icon: "play" },
  { label: "런칭, 운영", sub: "운영 백오피스까지 함께 인도", icon: "trending" },
];

export function ContactSteps() {
  const [active, setActive] = useState(0);
  const [held, setHeld] = useState<number | null>(null);

  useEffect(() => {
    if (held !== null) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(
      () => setActive((index) => (index + 1) % STEPS.length),
      2400,
    );
    return () => window.clearInterval(timer);
  }, [held]);

  const current = held ?? active;

  return (
    <div className="cflow" style={{ "--i": current } as React.CSSProperties}>
      {/* 레일 — 지나온 길은 그라데이션으로 차 있고, 끝점을 점이 달린다 */}
      <span className="cflow-rail" aria-hidden>
        <i className="fill" />
        <i className="dot" />
      </span>
      {STEPS.map((step, index) => (
        <div
          className={
            index === current
              ? "cfstep on"
              : index < current
                ? "cfstep done"
                : "cfstep"
          }
          key={step.label}
          onMouseEnter={() => setHeld(index)}
          onMouseLeave={() => setHeld(null)}
        >
          <span className="cfno">
            {/* 지나온 단계는 체크 — 길 위에서 "끝났다"가 한눈에 읽힌다 */}
            <Icon name={index < current ? "check" : step.icon} />
          </span>
          <b>{step.label}</b>
          <small>{step.sub}</small>
        </div>
      ))}
    </div>
  );
}
