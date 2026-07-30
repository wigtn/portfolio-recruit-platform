"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";
import { ALL_POSTS, SAFETY_LABEL } from "@/lib/seed/posts";
import { COMPANIES } from "@/lib/seed/companies";
import { REVIEWS } from "@/lib/seed/reviews";
import { JOBS } from "@/lib/seed/jobs";
import { ROLE_LABEL } from "@/lib/demo/role";
import { ADMIN_TOOL_COUNT } from "@/lib/admin/run";

/**
 * 모듈 쇼케이스 — 상담 페이지의 세일즈 포인트.
 *
 * "이 데모가 곧 증거"라는 논리: 방금 체험한 화면 하나하나가 어떤 모듈에서
 * 왔는지 카드로 보여주고, 카드를 누르면 그 모듈이 실제로 돌아가는 화면으로
 * 간다. 수치는 전부 시드/레지스트리에서 파생한다(표기 수치 = 실데이터 규칙).
 */

const COMMENT_COUNT = ALL_POSTS.reduce(
  (sum, post) => sum + post.comments.length,
  0,
);

const MODULES: Array<{
  id: string;
  icon: string;
  hue: number;
  name: string;
  what: string;
  demo: string;
  stat: string;
  href: string;
  cta: string;
}> = [
  {
    id: "auth",
    icon: "key",
    hue: 252,
    name: "인증·멤버십",
    what: "역할 게이트 · 회원 전용 동작",
    demo: "답글·지원하기에 걸리는 회원 게이트, 우상단 역할 전환이 이 모듈이에요.",
    stat: `역할 ${Object.keys(ROLE_LABEL).length}종 게이트`,
    href: "/community",
    cta: "게이트 걸려보기",
  },
  {
    id: "content",
    icon: "comment",
    hue: 217,
    name: "콘텐츠 엔진",
    what: "게시판 · 글 · 답글 · 신고",
    demo: "글쓰기부터 신고 왕복까지: 게시판 종류는 설정으로 늘려요.",
    stat: `글 ${ALL_POSTS.length} · 답글 ${COMMENT_COUNT}`,
    href: "/community",
    cta: "커뮤니티 보기",
  },
  {
    id: "review",
    icon: "star",
    hue: 38,
    name: "리뷰·평점",
    what: "축별 평점 · 연봉 · 회사 비교",
    demo: "영업 5축 평점과 회사 비교표: 축 구성은 업종에 맞게 바꿔 꽂아요.",
    stat: `회사 ${COMPANIES.length} · 리뷰 ${REVIEWS.length}`,
    href: "/companies",
    cta: "리뷰 보기",
  },
  {
    id: "jobs",
    icon: "building",
    hue: 152,
    name: "채용 보드",
    what: "공고 목록 · 상세 · 지원 왕복",
    demo: "백오피스에서 공고를 등록·마감하면 이 목록이 그대로 바뀌어요.",
    stat: `공고 ${JOBS.length}건 연동`,
    href: "/jobs",
    cta: "공고 보기",
  },
  {
    id: "ai",
    icon: "bot",
    hue: 276,
    name: "AI 파이프라인",
    what: "생성 → 안전 재검사 → 게시",
    demo: "AI 답변이 위험 표현을 스스로 고치는 과정: 강도·한도는 운영자가 정해요.",
    stat: `안전 강도 ${Object.keys(SAFETY_LABEL).length}단계`,
    href: "/community/p-4821",
    cta: "생성 지켜보기",
  },
  {
    id: "notify",
    icon: "bell",
    hue: 340,
    name: "알림",
    what: "처리 결과가 돌아오는 길",
    demo: "신고가 백오피스에서 처리되면 알림 벨 뱃지로 돌아와요.",
    stat: "신고 → 처리 → 벨 왕복",
    href: "/community",
    cta: "신고 왕복 해보기",
  },
  {
    id: "admin",
    icon: "gauge",
    hue: 200,
    name: "백오피스 프레임",
    what: "권한 · 위험도 승인 · 감사 로그",
    demo: "모든 운영 동작이 권한 검사와 감사 기록을 지나요. 위험 작업은 재확인.",
    stat: `운영 도구 ${ADMIN_TOOL_COUNT}종`,
    href: "/admin",
    cta: "백오피스 열기",
  },
  {
    id: "ds",
    icon: "palette",
    hue: 12,
    name: "디자인 시스템",
    what: "스켈레톤 · 토스트 · 공통 UI",
    demo: "모든 로딩이 스켈레톤이라 데이터가 와도 화면이 밀리지 않아요.",
    stat: "레이아웃 시프트 0",
    href: "/",
    cta: "홈에서 새로고침",
  },
];

export function ModuleShowcase() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [live, setLive] = useState(false);

  // 스크롤 도착 시 한 번만 계단식 등장 — 상담 페이지는 연출 허용 구역
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
      { threshold: 0.15 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // 포인터 글로우 — 커서 위치를 카드의 CSS 변수로 흘린다
  const glow = (event: React.PointerEvent<HTMLAnchorElement>) => {
    const card = event.currentTarget;
    const rect = card.getBoundingClientRect();
    card.style.setProperty("--mx", `${event.clientX - rect.left}px`);
    card.style.setProperty("--my", `${event.clientY - rect.top}px`);
  };

  return (
    <div className={live ? "modshow is-in" : "modshow"} ref={rootRef}>
      <div className="modshow-hd">
        <span className="modshow-kicker">
          <Icon name="check" />
          WIGTN 방식
        </span>
        <h2>방금 쓰신 기능, 전부 모듈입니다</h2>
        <p>
          이 데모는 검증된 모듈 {MODULES.length}개를 조립해 만들었어요. 카드를
          누르면 그 모듈이 실제로 돌아가는 화면으로 갑니다. 프로젝트에는 필요한
          조합만 골라 일정과 함께 제안드려요.
        </p>
      </div>
      <div className="modgrid">
        {MODULES.map((module, index) => (
          <Link
            key={module.id}
            className="modcard"
            href={module.href}
            style={
              {
                "--hue": module.hue,
                "--d": `${index * 60}ms`,
              } as React.CSSProperties
            }
            onPointerMove={glow}
          >
            <span className="modcard-ic">
              <Icon name={module.icon} />
            </span>
            <b className="modcard-name">{module.name}</b>
            <span className="modcard-what">{module.what}</span>
            <p className="modcard-demo">{module.demo}</p>
            <span className="modcard-ft">
              <span className="modcard-stat">{module.stat}</span>
              <span className="modcard-go">
                {module.cta}
                <Icon name="arrow" />
              </span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
