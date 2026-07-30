import Link from "next/link";
import { Crumb } from "@/components/Crumb";
import { CompanySectionTabs } from "@/components/CompanySectionTabs";
import { CompanyCompare } from "@/components/CompanyCompare";
import { COMPANIES, SALES_AXES } from "@/lib/seed/companies";
import { Icon } from "@/components/Icon";

export const metadata = { title: "회사 비교 — W 세일즈" };

/**
 * 회사 비교 — 두 회사를 직접 골라 같은 항목으로 맞대는 화면.
 *
 * 홈에는 대표 예시 한 벌만 두고(기능이 무엇인지 알리는 용도), 실제로 고르고
 * 바꾸는 일은 여기서 한다. 같은 컴포넌트를 `interactive`로 재사용하므로
 * 두 화면의 판정 규칙(특히 `성과압박`이 낮을수록 좋다는 것)이 갈리지 않는다.
 */
export default function ComparePage() {
  const reviewTotal = COMPANIES.reduce(
    (sum, company) => sum + company.reviewCount,
    0,
  );

  return (
    <>
      <div className="pagehead">
        <Crumb
          items={[
            { label: "회사 리뷰", href: "/companies" },
            { label: "비교" },
          ]}
        />
        <div className="ttl">
          <div>
            <h1>회사 비교</h1>
            <div className="desc">
              두 회사를 골라 평점·연봉·영업 직무 만족도를 같은 축에서 봅니다
            </div>
          </div>
        </div>
        <CompanySectionTabs active="compare" />

      </div>

      <div className="sec">
        {/* 제목 한 줄만 있으면 머리가 비어 페이지가 카드부터 시작하는 것처럼
            보인다. 무엇을 근거로 비교하는지 숫자로 먼저 말한다. */}
        <ul className="pagehead-facts">
          <li>
            <b>{COMPANIES.length}</b>
            <span>비교 가능 회사</span>
          </li>
          <li>
            <b>{reviewTotal.toLocaleString()}</b>
            <span>검증 리뷰</span>
          </li>
          <li>
            <b>{SALES_AXES.length}</b>
            <span>영업 직무 비교 축</span>
          </li>
          <li>
            <b>3</b>
            <span>공통 지표 — 평점 · 연봉 · 리뷰 수</span>
          </li>
        </ul>

        <CompanyCompare interactive />

        <div className="cmp-axisnote">
          <div className="cmp-axishead">
            <h2>평점 축은 영업 직무 기준이에요</h2>
            <p>
              일반적인 회사 평점과 달리, 영업직이 실제로 갈리는 지점만 축으로
              둡니다.
            </p>
          </div>
          <div className="axisrows">
            {SALES_AXES.map((axis) => (
              <div
                className={
                  "reverse" in axis && axis.reverse
                    ? "axisrow is-reverse"
                    : "axisrow"
                }
                key={axis.key}
              >
                <span className="axisic">
                  <Icon name={AXIS_ICON[axis.key]} />
                </span>
                <b>
                  {axis.label}
                  {"reverse" in axis && axis.reverse ? (
                    <span className="cmp-axisflag">낮을수록 좋음</span>
                  ) : null}
                </b>
                <p>{AXIS_DESC[axis.key]}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="sec-head" style={{ marginTop: 34 }}>
          <h2>
            비교할 수 있는 회사<span className="sub">{COMPANIES.length}곳</span>
          </h2>
          <Link className="more" href="/companies">
            전체 보기
            <Icon name="arrow" />
          </Link>
        </div>
        <p className="cmp-rosternote">
          검증 리뷰가 쌓여 영업 직무 축으로 비교할 수 있는 회사들이에요 —
          누르면 상세 리뷰로 가요.
        </p>
        <div className="cmp-roster">
          {COMPANIES.map((company) => (
            <Link
              className="cmp-roster-item"
              key={company.slug}
              href={`/companies/${company.slug}`}
            >
              <span className="cmp-logo">
                <img src={company.logo} alt="" />
              </span>
              <span className="cmp-roster-name">
                <b>{company.name}</b>
                <small>
                  {company.industry} · {company.region}
                </small>
              </span>
              <span className="cmp-roster-score">
                <Icon name="star" filled />
                {company.score.toFixed(1)}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}

/** 축 설명 — 이름만으로는 무엇을 재는지 모른다 */
const AXIS_ICON: Record<string, string> = {
  incentive: "trending",
  goalRealism: "gauge",
  managerCoaching: "users",
  accountAllocation: "swap",
  pressure: "shield",
};

const AXIS_DESC: Record<string, string> = {
  incentive: "성과급 산정 기준이 공개되고 실제로 그대로 지급되는가",
  goalRealism: "할당 목표가 시장·계정 규모에 비해 달성 가능한가",
  managerCoaching: "매니저가 동행·피드백으로 실제 도움을 주는가",
  accountAllocation: "계정이 연차가 아니라 역량·형평 기준으로 배분되는가",
  pressure: "미달 시 압박의 강도 — 낮을수록 지속 가능한 환경",
};
