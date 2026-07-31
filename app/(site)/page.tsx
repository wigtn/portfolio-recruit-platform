"use client";

import Link from "next/link";
import { Fragment, useEffect, useState } from "react";
import { COMPANIES } from "@/lib/seed/companies";
import { BOARDS, FEED } from "@/lib/seed/feed";
import { NumberTicker } from "@/components/NumberTicker";
import {
  JobCardSkeleton,
  Sk,
  SkRegion,
  useMockLoading,
} from "@/components/Skeleton";
import { loadState, type AdminState } from "@/lib/admin/overlay";
import { HomeFeed } from "@/components/HomeFeed";
import { HeroSearch } from "@/components/HeroSearch";
import { JobCard } from "@/components/JobCard";
import { jobsWithCompany } from "@/lib/seed/jobs";
import { Icon } from "@/components/Icon";
import { ClosingBanner } from "@/components/ClosingBanner";
import { HomeCompanyInsights } from "@/components/HomeDiscoverSections";

/**
 * 홈 — 시안 정본(r4-REFERENCE.html 01번)의 마크업·클래스를 그대로 따른다.
 * 구조를 재해석하지 않는다: .hero → .sec(추천 회사) → .sec/.split(피드+사이드) → .ctaband → .footer
 */
/** 히어로 제목 — 마스크가 단어 단위라 토큰도 단어 단위로 끊는다. */
/** 홈에 세우는 채용공고 수 — 스켈레톤과 실제 카드가 같이 읽는 하나의 값 */
const HOME_JOBS = 3;

const TITLE_WORDS: React.ReactNode[] = [
  "현장의",
  "답은,",
  <span className="ink-em" key="a">
    현장
  </span>,
  <span key="b">
    <span className="ink-em">사람들</span>에게.
  </span>,
];

export default function HomePage() {
  const [admin, setAdmin] = useState<AdminState | null>(null);
  // 목업 데이터는 즉시 있지만, 실제 서비스의 첫 진입을 보여주려고 지연을 강제한다.
  const loading = useMockLoading();

  useEffect(() => setAdmin(loadState()), []);

  const recommended = admin
    ? admin.curation.companies
        .map((slot) => COMPANIES.find((company) => company.name === slot.name))
        .filter((company) => {
          if (!company) return false;
          return !admin.companies.some(
            (managed) =>
              managed.name === company.name && managed.status === "숨김",
          );
        })
        .filter((company): company is (typeof COMPANIES)[number] =>
          Boolean(company),
        )
    : COMPANIES.slice(0, 3);
  const pinnedTitles = admin?.curation.posts.map((slot) => slot.name) ?? [];

  return (
    <>
      <div className="hero">
        <div className="inner">
          <span className="eyebrow">영업직 커뮤니티, 회사 리뷰</span>
          <h1 aria-label="현장의 답은, 현장 사람들에게.">
            {TITLE_WORDS.map((word, i) => (
              <Fragment key={i}>
                {i > 0 ? " " : null}
                <span className="rise" aria-hidden>
                  <i style={{ animationDelay: `${90 + i * 62}ms` }}>{word}</i>
                </span>
              </Fragment>
            ))}
          </h1>
          <p>영업직이 직접 남긴 회사 평점과 연봉, 현장에서 통하는 노하우까지</p>
          <HeroSearch />
          <div
            className={loading ? "herostat" : "herostat sk-arrive-soft"}
            style={{ minHeight: 24 }}
            aria-busy={loading}
          >
            {loading ? (
              <>
                <span className="sr-only">서비스 지표 불러오는 중</span>
                <Sk w={104} h={15} />
                <Sk w={132} h={15} />
                <Sk w={88} h={15} />
              </>
            ) : (
              <>
                <span>
                  <b>
                    <NumberTicker
                      value={COMPANIES.reduce(
                        (sum, company) => sum + company.reviewCount,
                        0,
                      )}
                    />
                  </b>
                  익명 리뷰
                </span>
                <i />
                <span>
                  <b>
                    <NumberTicker
                      value={BOARDS.reduce(
                        (sum, board) => sum + board.count,
                        0,
                      )}
                    />
                  </b>
                  현장 질문, 노하우
                </span>
                <i />
                <span>
                  <b>
                    <NumberTicker value={COMPANIES.length} />
                  </b>
                  등록 회사
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 채용공고 — 공고는 직무·조건·마감이 먼저다. 회사 평점 비교는
          아래 "현직자 회사 리뷰"가 맡는다. */}
      <div className="sec sec-home home-feature-section">
        <div className="sec-head">
          <h2>
            채용공고<span className="sub">영업 직무만 골라서</span>
          </h2>
          {/* 공고 목록 화면은 없다 — 목적지(/companies)에 맞는 문구만 약속한다 */}
          <Link className="more home-view-all" href="/jobs">
            채용공고 전체 보기
            <Icon name="arrow" />
          </Link>
        </div>
        {loading ? (
          <SkRegion label="채용공고">
            <div className="cgrid">
              {Array.from({ length: HOME_JOBS }, (_, index) => (
                <JobCardSkeleton key={index} />
              ))}
            </div>
          </SkRegion>
        ) : (
          <div className="cgrid sk-arrive">
            {/* 홈은 맛보기다 — 전체는 /jobs가 맡는다. 위 스켈레톤도 같은 수를
                세우므로(자리 예약) 이 수를 바꾸면 스켈레톤도 같이 바꾼다. */}
            {jobsWithCompany()
              .slice(0, HOME_JOBS)
              .map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
          </div>
        )}
      </div>

      <HomeCompanyInsights companies={recommended} loading={loading} />

      <div className="sec sec-home home-community-section">
        <HomeFeed items={FEED} pinnedTitles={pinnedTitles} loading={loading} />
      </div>

      {/* 만든 주체(WIGTN)를 밝히는 마지막 블록 — 영상·모션은 컴포넌트가 관리 */}
      <ClosingBanner />
    </>
  );
}
