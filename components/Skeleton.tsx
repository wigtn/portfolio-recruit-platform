"use client";

import { useEffect, useState } from "react";

/**
 * 로딩 스켈레톤 — 자리를 먼저 잡고 shimmer로 "오는 중"을 알린다.
 *
 * shimmer 자체는 ui-kit의 `.uk-sk`(선행 프로젝트 P1에서 이식된 밴드 sweep)를 그대로
 * 쓴다. 다만 `.uk-sk`는 HSL 시맨틱 토큰(--muted/--background/--radius)을 요구하는데
 * 이 앱은 r4 정본의 HEX 토큰 체계라, `.sk`에서 그 세 개만 정본 색으로 얹어 준다.
 *
 * 데모라 실제 네트워크가 없으므로 지연은 강제한다 — 스켈레톤이 한 프레임만
 * 스치면 로딩 처리를 했는지 안 했는지 보이지 않는다.
 */
export const MOCK_DELAY = 2000;

export function useMockLoading(delay: number = MOCK_DELAY) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return loading;
}

/** 스켈레톤 블록 하나. 최종 요소와 같은 크기를 넣어야 자리가 안 튄다. */
export function Sk({
  w,
  h = 12,
  r,
  style,
}: {
  w?: number | string;
  h?: number | string;
  r?: number;
  style?: React.CSSProperties;
}) {
  return (
    <span
      className="uk-sk sk"
      aria-hidden
      style={{ width: w, height: h, borderRadius: r, ...style }}
    />
  );
}

/** 로딩 영역 공통 래퍼 — 스크린리더에 "불러오는 중"을 한 번만 알린다. */
export function SkRegion({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div role="status" aria-live="polite" aria-busy>
      <span className="sr-only">{label} 불러오는 중</span>
      {children}
    </div>
  );
}

/**
 * 실측 높이 모음 — 유추가 아니라 렌더된 실제 요소를 재서 넣은 값이다(1440px 홈 기준).
 * 스켈레톤의 존재 이유가 자리 예약이라, 몇 px이라도 어긋나면 데이터가 도착할 때
 * 페이지가 밀린다.
 */
const H = {
  /** 홈 피드 4행의 실측 높이 — 1·2행은 배지(.tag)가 있어 5.2px 더 높다 */
  posts: [119.4, 119.4, 114.2, 114.2],
  /** 실제 피드의 썸네일 배치와 같게 — 1·4행에만 붙는다 */
  postThumbs: [true, false, false, true],
  /* 아래 둘은 1/64px 단위다 — 브라우저 레이아웃 스냅 단위라, 반올림하면
     전환 때 1/64px이 어긋난다. */
  /** 채용공고 카드(.job)의 실측 높이 */
  job: 292.96875,
  /** 현직자 리뷰 카드(.company.creview)의 실측 높이 */
  creview: 222.328125,
} as const;

/** 피드 행 — 대응하는 실제 행과 같은 높이를 쓴다 */
export function PostRowSkeleton({ index = 0 }: { index?: number }) {
  const thumb = H.postThumbs[index % H.postThumbs.length];
  return (
    <div
      className="post sk-post"
      style={{ height: H.posts[index % H.posts.length] }}
      aria-hidden
    >
      <div>
        <div className="badges">
          <Sk w={46} h={23.6} r={6} />
          <Sk w={52} h={18} r={4} />
        </div>
        <Sk w="58%" h={17} style={{ marginBottom: 11 }} />
        <div className="m">
          <span className="who">
            <Sk w={20} h={20} r={99} />
            <Sk w={96} h={12} />
          </span>
          <span className="met">
            <Sk w={34} h={12} />
            <Sk w={30} h={12} />
            <Sk w={38} h={12} />
          </span>
        </div>
      </div>
      {thumb ? <Sk w={74} h={74} r={10} /> : null}
    </div>
  );
}

/** 채용공고 카드 — .job과 같은 높이를 못 박는다(내용 합이 실측보다 짧다) */
export function JobCardSkeleton() {
  return (
    <div className="job sk-job" style={{ minHeight: H.job }} aria-hidden>
      <div className="job-head">
        <Sk w={40} h={40} r={11} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <Sk w="54%" h={14} style={{ marginBottom: 6 }} />
          <Sk w="36%" h={11} />
        </div>
        <Sk w={42} h={22} r={7} />
      </div>
      <Sk w="76%" h={18} style={{ marginTop: 14, marginBottom: 10 }} />
      <Sk w="48%" h={12} style={{ marginBottom: 16 }} />
      <Sk w="62%" h={22} style={{ marginBottom: 16 }} />
      <Sk w="70%" h={12} style={{ marginBottom: 8 }} />
      <Sk w="58%" h={12} style={{ marginBottom: 8 }} />
      <Sk w="46%" h={12} />
      <div className="job-foot">
        <Sk w={104} h={14} />
        <Sk w={72} h={14} />
      </div>
    </div>
  );
}

/** 현직자 회사 리뷰 카드 — 헤더 + 인용 + 축 2개 + 진입 문구. 높이도 실측 고정 */
export function CompanyReviewCardSkeleton() {
  return (
    <div
      className="company creview sk-company"
      style={{ minHeight: H.creview }}
      aria-hidden
    >
      <div className="chead">
        <Sk w={42} h={42} r={10} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <Sk w="52%" h={15} style={{ marginBottom: 7 }} />
          <Sk w="34%" h={12} />
        </div>
        <Sk w={44} h={18} r={6} />
      </div>
      <div className="creview-quote">
        <Sk w="92%" h={15} style={{ marginBottom: 8 }} />
        <Sk w={132} h={11} />
      </div>
      <div className="ratings">
        {[0, 1].map((index) => (
          <div className="rate" key={index}>
            <Sk w={54} h={12} />
            <Sk h={7} r={99} style={{ flex: 1 }} />
            <Sk w={22} h={12} />
          </div>
        ))}
      </div>
      <Sk w={118} h={14} style={{ marginTop: 14 }} />
    </div>
  );
}
