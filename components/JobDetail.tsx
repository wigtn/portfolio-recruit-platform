"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { loadState, subscribeState } from "@/lib/admin/overlay";
import type { JobRow } from "@/lib/admin/seed";
import { COMPANIES } from "@/lib/seed/companies";
import { JOBS } from "@/lib/seed/jobs";
import { loadUser, saveUser } from "@/lib/demo/user";
import { useRole } from "@/lib/demo/role";
import { RoleModal } from "./demo/RoleModal";
import { Icon } from "./Icon";
import { Sk, SkRegion, useMockLoading } from "./Skeleton";
import { toast } from "./ds/Toaster";
import { JobCard } from "./JobCard";

/**
 * 채용공고 상세 — 목록과 같은 오버레이가 정본이다(백오피스 등록·마감 반영).
 * 조건(conditions)은 서비스 시드에만 있어 시드 공고면 병합해 보여준다.
 * 지원하기는 회원 게이트를 거치고, 지원 기록은 이 브라우저에 남는다.
 */
export function JobDetail({ jobId }: { jobId: string }) {
  const { role } = useRole();
  const [rows, setRows] = useState<JobRow[] | null>(null);
  const [applied, setApplied] = useState(false);
  const [gateOpen, setGateOpen] = useState(false);
  const delaying = useMockLoading();
  const loading = delaying || rows === null;

  useEffect(() => {
    const sync = () => setRows(loadState().jobs);
    sync();
    return subscribeState(sync);
  }, []);

  useEffect(() => {
    setApplied(loadUser().applied.includes(jobId));
  }, [jobId]);

  if (loading) {
    return (
      <SkRegion label="채용공고 상세">
        <div className="split">
          <div className="card jobdoc" aria-hidden>
            <Sk w={120} h={20} r={6} style={{ marginBottom: 14 }} />
            <Sk w="56%" h={26} style={{ marginBottom: 10 }} />
            <Sk w={200} h={14} style={{ marginBottom: 22 }} />
            <Sk w="100%" h={72} r={12} style={{ marginBottom: 18 }} />
            <Sk w="88%" h={14} style={{ marginBottom: 8 }} />
            <Sk w="70%" h={14} />
          </div>
          <div>
            <div className="card" aria-hidden>
              <Sk w="60%" h={16} style={{ marginBottom: 12 }} />
              <Sk w="100%" h={54} r={10} />
            </div>
          </div>
        </div>
      </SkRegion>
    );
  }

  const row = (rows ?? []).find((item) => item.id === jobId);
  if (!row) {
    return (
      <div className="card" style={{ padding: 40, textAlign: "center" }}>
        <div style={{ fontWeight: 700, marginBottom: 4 }}>
          내려갔거나 없는 공고예요
        </div>
        <Link className="btn line sm" href="/jobs" style={{ marginTop: 10 }}>
          채용공고 목록으로
        </Link>
      </div>
    );
  }

  const company = COMPANIES.find((item) => item.slug === row.companySlug);
  const seedJob = JOBS.find((item) => item.id === row.id);
  const closed = row.status === "마감";
  const others = (rows ?? []).filter(
    (item) =>
      item.companySlug === row.companySlug &&
      item.id !== row.id &&
      item.status === "노출중",
  );

  const apply = () => {
    if (role === "guest") {
      setGateOpen(true);
      return;
    }
    const user = loadUser();
    if (!user.applied.includes(row.id)) {
      saveUser({ ...user, applied: [...user.applied, row.id] });
    }
    setApplied(true);
    toast("지원이 접수됐어요, 이 브라우저에만 남는 체험 기록이에요", {
      tone: "success",
    });
  };

  return (
    <div className="split">
      <article className="card jobdoc sk-arrive">
        {company ? (
          <Link className="jobdoc-co" href={`/companies/${company.slug}`}>
            <span className="cmp-logo">
              <img src={company.logo} alt="" />
            </span>
            <b>{company.name}</b>
            <small>
              {company.industry}, {company.region}
            </small>
            <span className="jobdoc-co-score">
              <Icon name="star" filled />
              {company.score.toFixed(1)}
            </span>
            <Icon name="arrow" />
          </Link>
        ) : null}

        <h1 className="jobdoc-title">{row.title}</h1>

        <div className="jobdoc-tags">
          {closed ? (
            <span className="bs neu">마감된 공고</span>
          ) : row.daysLeft === null ? (
            <span className="bs ok">상시 채용</span>
          ) : (
            <span className={row.daysLeft <= 3 ? "bs no" : "bs ok"}>
              마감 D-{row.daysLeft}
            </span>
          )}
          <span className="bs neu">{row.employment}</span>
          <span className="bs neu">{row.career}</span>
        </div>

        {/* 핵심 요약 — 연봉·근무지·마감을 표로 먼저 */}
        <div className="jobdoc-summary">
          <div>
            <span>제시 연봉</span>
            {row.payLow > 0 ? (
              <b>
                {row.payLow.toLocaleString()}~{row.payHigh.toLocaleString()}
                만원
              </b>
            ) : (
              <b>회사 내규에 따름</b>
            )}
          </div>
          <div>
            <span>근무지</span>
            <b>{seedJob?.workplace || `${company?.region ?? "-"} 사무소`}</b>
          </div>
          <div>
            <span>마감</span>
            <b>
              {closed
                ? "마감"
                : row.daysLeft === null
                  ? "상시 채용"
                  : `D-${row.daysLeft}`}
            </b>
          </div>
        </div>

        {seedJob && seedJob.responsibilities.length > 0 ? (
          <section className="jobdoc-sec">
            <h4>주요 업무</h4>
            <ul>
              {seedJob.responsibilities.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        ) : null}

        {seedJob && seedJob.requirements.length > 0 ? (
          <section className="jobdoc-sec">
            <h4>자격 요건</h4>
            <ul>
              {seedJob.requirements.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        ) : null}

        {seedJob && seedJob.preferred.length > 0 ? (
          <section className="jobdoc-sec">
            <h4>우대 사항</h4>
            <ul>
              {seedJob.preferred.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        ) : null}

        {seedJob && seedJob.conditions.length > 0 ? (
          <section className="jobdoc-sec is-cond">
            <h4>영업 조건, 공고에서 실제로 궁금한 것</h4>
            <div className="jobdoc-chips">
              {seedJob.conditions.map((condition) => (
                <span key={condition}>
                  <Icon name="check" />
                  {condition}
                </span>
              ))}
            </div>
          </section>
        ) : null}

        {seedJob && seedJob.process.length > 0 ? (
          <section className="jobdoc-sec">
            <h4>채용 절차</h4>
            <div className="jobdoc-process">
              {seedJob.process.map((step, index) => (
                <span className="pstep" key={step}>
                  <i>{index + 1}</i>
                  {step}
                  {index < seedJob.process.length - 1 ? (
                    <Icon name="arrow" />
                  ) : null}
                </span>
              ))}
            </div>
          </section>
        ) : null}

        {!seedJob ? (
          <p className="jobdoc-note">
            운영자가 등록한 공고예요, 상세 내용은 회사에 문의해 주세요.
          </p>
        ) : null}
      </article>

      <div className="wside">
        {/* 지원 카드 — 스크롤을 따라오는 1순위 액션 */}
        <div className="card jobapply">
          {row.payLow > 0 ? (
            <div className="jobapply-pay">
              <span>제시 연봉</span>
              <b>
                {row.payLow.toLocaleString()}~{row.payHigh.toLocaleString()}
                <small>만원</small>
              </b>
            </div>
          ) : null}
          <button
            className="btn primary jobapply-btn"
            disabled={closed || applied}
            onClick={apply}
          >
            {closed ? "마감된 공고예요" : applied ? "지원 완료" : "지원하기"}
          </button>
          <p className="jobapply-note">
            {closed
              ? "다른 공고를 확인해보세요"
              : "지원 전에 현직자 평점을 먼저 확인해보세요"}
          </p>
        </div>

        {company ? (
          <div className="card">
            <h4>이 회사, 현직자 평점</h4>
            <div className="jobdoc-score">
              <b>{company.score.toFixed(1)}</b>
              <span className="of">/ 5.0</span>
              <Link href={`/companies/${company.slug}`}>
                리뷰 {company.reviewCount}건
                <Icon name="arrow" />
              </Link>
            </div>
            <p className="jobdoc-hint">
              공고만 보고 지원하지 마세요, 인센티브, 목표현실성 같은 영업 축
              평점을 먼저 확인할 수 있어요.
            </p>
          </div>
        ) : null}

        {others.length > 0 && company ? (
          <div className="card">
            <h4>{company.name}의 다른 공고</h4>
            <div className="jobdoc-others">
              {others.map((item) => (
                <Link key={item.id} href={`/jobs/${item.id}`}>
                  <b>{item.title}</b>
                  <small>
                    {item.employment}, {" "}
                    {item.daysLeft === null ? "상시" : `D-${item.daysLeft}`}
                  </small>
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {gateOpen ? <RoleModal onClose={() => setGateOpen(false)} /> : null}
    </div>
  );
}

/** 목록/상세 어디서든 같은 카드 계약을 쓰기 위한 재노출 */
export { JobCard };
