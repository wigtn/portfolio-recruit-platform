import Link from "next/link";
import { AXIS_AVERAGE, SALES_AXES, type Company } from "@/lib/seed/companies";
import { Icon } from "./Icon";

/**
 * 회사 카드 — 시안 정본 `.company` 구조 그대로.
 * .chead(로고+이름) → .scoreline(점수+별+리뷰칩) → .salary → .ratings → .ctags
 *
 * 축 바 개수는 화면마다 다르다: 홈 2개, 탐색 3개, 상세 5개 전부(시안 기준).
 */
export function CompanyCard({
  company,
  axisLimit = 3,
  href,
}: {
  company: Company;
  axisLimit?: number;
  href?: string;
}) {
  return (
    <Link className="company" href={href ?? `/companies/${company.slug}`}>
      <div className="chead">
        <div className="lg">
          <img src={company.logo} alt={`${company.name} 로고`} />
        </div>
        <div className="company-identity">
          <div className="cn">{company.name}</div>
          <div className="ci">
            {company.industry}, {company.region}
          </div>
        </div>
        <span
          className="company-score"
          aria-label={`평점 ${company.score.toFixed(1)}`}
        >
          <Icon name="star" filled />
          <b>{company.score.toFixed(1)}</b>
        </span>
      </div>

      <div className="company-keyfacts">
        <div className="salary">
          <span>영업직 연봉</span>
          <strong>
            {company.salaryLow.toLocaleString()}~
            {company.salaryHigh.toLocaleString()}
            <small>만원</small>
          </strong>
        </div>
        <span className="company-review-count">
          리뷰 <b>{company.reviewCount}</b>
        </span>
      </div>

      <div className="ratings">
        {SALES_AXES.slice(0, axisLimit).map((axis) => (
          <div className="rate" key={axis.key}>
            <span className="k">{axis.label}</span>
            <span className="bar">
              <span
                style={{ width: `${(company.axes[axis.key] / 5) * 100}%` }}
              />
              {/* 전체 평균 눈금 — 이게 없으면 4.3이 높은 값인지 알 수 없다 */}
              <i
                className="avg"
                style={{ left: `${(AXIS_AVERAGE[axis.key] / 5) * 100}%` }}
                aria-hidden
              />
            </span>
            <span className="v">{company.axes[axis.key].toFixed(1)}</span>
          </div>
        ))}
      </div>

      <div className="ctags">
        {company.tags.map((tag) => (
          <span className="ctag" key={tag}>
            {tag}
          </span>
        ))}
      </div>

      {/* 카드가 링크라는 걸 문장으로도 알린다 — 태그만 있으면 끝난 카드로 보인다 */}
      <span className="company-go">
        리뷰 {company.reviewCount}건 보기
        <Icon name="arrow" />
      </span>
    </Link>
  );
}
