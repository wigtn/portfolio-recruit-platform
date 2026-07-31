import Link from "next/link";
import type { JobWithCompany } from "@/lib/seed/jobs";
import { Icon } from "./Icon";

/**
 * 채용공고 카드.
 *
 * 회사 카드(평점·만족도 축)와 역할이 다르다. 공고에서 먼저 읽히는 건
 * **직무 → 조건 → 마감**이고, 회사는 그 다음이다. 그래서 위계를 뒤집는다:
 * 직무명이 제목, 회사는 그 위 한 줄.
 *
 * 다만 이 서비스의 차별점은 "공고 옆에 현직자 평점이 같이 붙는" 것이라,
 * 카드 바닥에 평점·리뷰 수를 남겨 리뷰 쪽으로 건너갈 수 있게 한다.
 */
export function JobCard({
  job,
  closed = false,
}: {
  job: JobWithCompany;
  /** 백오피스에서 마감된 공고 — 흐려지고 D-day 자리가 "마감"이 된다 */
  closed?: boolean;
}) {
  const { company } = job;
  const urgent = job.daysLeft !== null && job.daysLeft <= 3;

  return (
    <Link className={closed ? "job is-closed" : "job"} href={`/jobs/${job.id}`}>
      <div className="job-head">
        <span className="job-logo">
          <img src={company.logo} alt="" />
        </span>
        <span className="job-company">
          <b>{company.name}</b>
          <small>
            {company.industry}, {company.region}
          </small>
        </span>
        <span
          className={
            closed
              ? "job-dday is-closed"
              : urgent
                ? "job-dday is-urgent"
                : "job-dday"
          }
        >
          {closed ? "마감" : job.daysLeft === null ? "상시" : `D-${job.daysLeft}`}
        </span>
      </div>

      <h3 className="job-title">{job.title}</h3>
      <div className="job-meta">
        <span>{job.employment}</span>
        <i aria-hidden />
        <span>{job.career}</span>
      </div>

      <div className="job-pay">
        <span className="job-pay-label">제시 연봉</span>
        {job.payLow > 0 ? (
          <strong>
            {job.payLow.toLocaleString()}~{job.payHigh.toLocaleString()}
            <small>만원</small>
          </strong>
        ) : (
          <strong className="job-pay-na">회사 내규에 따름</strong>
        )}
      </div>

      {/* 체크 아이콘 3줄이면 카드가 길어지고 시선이 세로로 끌린다 — 칩 한 줄로 */}
      <ul className="job-conditions">
        {job.conditions.map((condition) => (
          <li key={condition}>{condition}</li>
        ))}
      </ul>

      {/* 공고만 보고 지원하지 않도록 — 현직자 평점을 같은 카드에서 보여준다 */}
      <div className="job-foot">
        <span className="job-score">
          <Icon name="star" filled />
          <b>{company.score.toFixed(1)}</b>
          <small>리뷰 {company.reviewCount}건</small>
        </span>
        {/* 목적지는 회사 리뷰 상세다 — "공고 보기"라고 쓰면 없는 화면을 약속하게 된다 */}
        <span className="job-go">
          회사 리뷰 보기
          <Icon name="arrow" />
        </span>
      </div>
    </Link>
  );
}
