"use client";

import Link from "next/link";
import { type CSSProperties, useEffect, useRef, useState } from "react";
import { COMPANIES, type Company } from "@/lib/seed/companies";
import { LATEST_REVIEWS } from "@/lib/seed/feed";
import { Icon } from "./Icon";
import { CompanyReviewCard } from "./CompanyReviewCard";
import { CompanyCompare } from "./CompanyCompare";
import { CompanyReviewCardSkeleton, Sk, SkRegion } from "./Skeleton";

/**
 * 비교 카드(.cmp)의 실측 크기 — 1440px 홈 기준, 로딩 전후 섹션이 0px도
 * 움직이지 않도록 못 박는다. 섹션 높이는 두 칸 중 더 큰 이 카드가 정하고,
 * 폭은 auto 마진 때문에 stretch가 풀려 내용 크기(fit-content)로 잡히므로
 * 높이·폭 둘 다 실측값으로 고정해야 카드 자리가 그대로 이어진다.
 * 값이 1/64px 단위인 이유: 브라우저가 레이아웃을 1/64px로 스냅해서,
 * 반올림한 값을 넣으면 실측과 1/64px이 어긋난다.
 */
const CMP_H = 561.171875;
const CMP_W = 436.0625;

function SalarySlot({ value, from = 4200 }: { value: number; from?: number }) {
  const [rolling, setRolling] = useState(false);
  const slotRef = useRef<HTMLSpanElement>(null);
  const formatted = value.toLocaleString("ko-KR");
  const initial = from.toLocaleString("ko-KR").padStart(formatted.length, "0");

  useEffect(() => {
    const reduce = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduce) {
      setRolling(true);
      return;
    }
    const slot = slotRef.current;
    if (!slot) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setRolling(true);
        observer.disconnect();
      },
      { threshold: 0.35 },
    );
    observer.observe(slot);
    return () => observer.disconnect();
  }, []);

  return (
    <span
      ref={slotRef}
      className={`home-salary-slot${rolling ? " is-rolling" : ""}`}
      aria-label={formatted}
    >
      {[...formatted].map((character, index) => {
        if (character === ",")
          return (
            <span className="home-salary-comma" key={`comma-${index}`}>
              ,
            </span>
          );
        const target = Number(character);
        const start = Number(initial[index]) || 0;
        return (
          <span
            className="home-salary-reel"
            aria-hidden
            key={`${character}-${index}`}
            style={
              {
                "--slot-start": start,
                "--slot-end": target + 20,
                "--slot-delay": `${index * 65}ms`,
              } as CSSProperties
            }
          >
            <span>
              {Array.from({ length: 30 }, (_, digit) => (
                <i key={digit}>{digit % 10}</i>
              ))}
            </span>
          </span>
        );
      })}
    </span>
  );
}

export function HomeCompanyInsights({
  companies = [],
  loading = false,
}: {
  /** 홈 큐레이션 순서가 그대로 온다 — 순서 자체가 운영 결과물이다 */
  companies?: Company[];
  loading?: boolean;
}) {
  const averageSalary = Math.round(
    COMPANIES.reduce(
      (sum, company) => sum + (company.salaryLow + company.salaryHigh) / 2,
      0,
    ) / COMPANIES.length,
  );
  const averageScore = (
    COMPANIES.reduce((sum, company) => sum + company.score, 0) /
    COMPANIES.length
  ).toFixed(1);
  const totalReviews = COMPANIES.reduce(
    (sum, company) => sum + company.reviewCount,
    0,
  );

  // 큐레이션 순서를 앞에 두고 나머지를 잇는다 — 순서 자체가 운영 결과물이다
  const ordered = [
    ...companies,
    ...COMPANIES.filter((c) => !companies.some((p) => p.slug === c.slug)),
  ];
  const quoteOf = (name: string) =>
    LATEST_REVIEWS.find((review) => review.company === name);

  return (
    <div className="home-discover home-company-insights">
      <section className="sec home-discover-section home-review-digest">
        {/* 헤더는 다른 섹션(.sec-head)과 같은 문법으로 — 제목·설명은 왼쪽,
            CTA 알약 하나가 오른쪽. 리뷰 수는 오른쪽에 따로 띄우지 않고
            설명줄에 접는다. 수치와 버튼이 나란히 있으면 서로 경쟁한다. */}
        <div className="sec-head home-review-title">
          <h2>
            현직자 회사 리뷰
            <span className="sub">
              검증된 리뷰 {totalReviews.toLocaleString()}건
            </span>
          </h2>
          <Link className="more home-view-all" href="/companies">
            회사별 리뷰 보기
            <Icon name="arrow" />
          </Link>
        </div>
        <p className="home-review-lead">
          입사 전, 영업팀의 실제 환경을 확인하세요.
        </p>
        {/* 카드는 한 종류다 — 점수(얼마나)와 인용(무엇이)을 한 장에 담는다.
            큐레이션된 회사가 앞에 오고, 나머지가 뒤를 잇는다. */}
        {loading ? (
          <SkRegion label="현직자 회사 리뷰">
            {/* 실물과 같은 .rmarquee 래퍼 — 넘치는 카드를 여기서 잘라야
                모바일에서 페이지에 가로 스크롤이 생기지 않는다 */}
            <div className="rmarquee">
              <div className="rmarquee-track is-static">
                {[0, 1, 2, 3].map((index) => (
                  <CompanyReviewCardSkeleton key={index} />
                ))}
              </div>
            </div>
          </SkRegion>
        ) : (
          /* 무한 슬라이드 — 목록을 두 벌 이어 붙이고 트랙을 -50% 밀면
             이음매 없이 순환한다. 뒤 벌은 복제본이라 초점·스크린리더에서 뺀다.
             호버하면 멈춘다 — 읽거나 누르려는데 흘러가면 안 된다. */
          <div className="rmarquee sk-arrive">
            <div className="rmarquee-track">
              {[...ordered, ...ordered].map((company, index) => (
                <CompanyReviewCard
                  key={`${company.slug}-${index}`}
                  company={company}
                  quote={quoteOf(company.name)}
                  duplicate={index >= ordered.length}
                />
              ))}
            </div>
          </div>
        )}
      </section>

      <section
        className="sec home-discover-section home-market"
        aria-busy={loading}
      >
        {loading ? (
          /* SkRegion의 래퍼 div가 그리드 자식이 되면 2열 배치가 깨진다 —
             섹션을 그리드로 유지한 채 sr-only 안내만 직접 두고, 두 칸을
             실제 마크업과 같은 클래스로 그려 간격·정렬을 CSS에 맡긴다. */
          <>
            <span className="sr-only" role="status" aria-live="polite">
              영업직 연봉, 회사 비교 불러오는 중
            </span>
            <div className="home-market-summary" aria-hidden>
              <Sk w="82%" h={36.6} />
              <Sk w="70%" h={20} style={{ marginTop: 13 }} />
              <div className="home-market-hero-stat">
                <Sk w={122} h={19.2} />
                <Sk w={230} h={54} style={{ marginTop: 5, display: "block" }} />
              </div>
              <div className="home-market-substats">
                <Sk w={104} h={20.8} />
                <Sk w={128} h={20.8} />
              </div>
              <Sk w={132} h={17} style={{ marginTop: 24 }} />
            </div>
            {/* 오른쪽은 비교 카드 자리 — .cmp 클래스로 여백·가운데 정렬을 그대로
                받고 크기만 실측값으로 고정한다(테두리 포함 border-box).
                maxWidth는 좁은 화면에서 넘치지 않게 하는 안전핀이다. */}
            <div
              className="cmp"
              aria-hidden
              style={{
                /* width를 직접 박으면 그리드 트랙 산정 때 %max-width가 무시돼
                   좁은 화면에서 트랙이 436px로 굳는다(페이지 가로 스크롤).
                   반대로 건다: 100%로 늘고 실측값이 상한이다. */
                width: "100%",
                maxWidth: CMP_W,
                height: CMP_H,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  paddingBottom: 16,
                  borderBottom: "1px solid var(--line)",
                }}
              >
                <Sk w="34%" h={44} r={10} />
                <Sk w={36} h={18} r={9} style={{ alignSelf: "center" }} />
                <Sk w="34%" h={44} r={10} />
              </div>
              {/* 실제 카드는 비교 행 8줄이다 — 남은 높이에 고르게 나눠 앉혀
                  줄 리듬이 실제와 같은 밀도로 보이게 한다 */}
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-evenly",
                }}
              >
                {[0, 1, 2, 3, 4, 5, 6, 7].map((index) => (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Sk w="30%" h={16} />
                    <Sk w={72} h={12} />
                    <Sk w="30%" h={16} />
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="home-market-summary sk-arrive">
              <h2>영업직 연봉, 회사 비교</h2>
              <p>같은 항목으로 두 회사를 나란히 놓고 봅니다.</p>
              <div className="home-market-hero-stat">
                <small>등록 회사 평균 연봉</small>
                <strong>
                  <SalarySlot value={averageSalary} />
                  <i>만원</i>
                </strong>
              </div>
              <div className="home-market-substats">
                <span>
                  <Icon name="star" filled />
                  <b>{averageScore}</b> 평균 평점
                </span>
                <span>
                  <Icon name="comment" />
                  <b>{totalReviews.toLocaleString()}</b> 누적 리뷰
                </span>
              </div>
              <Link className="home-market-more" href="/compare">
                직접 비교해보기 <Icon name="arrow" />
              </Link>
            </div>
            <div className="sk-arrive">
              <CompanyCompare animate />
            </div>
          </>
        )}
      </section>
    </div>
  );
}
