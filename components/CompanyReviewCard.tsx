import Link from "next/link";
import type { Company } from "@/lib/seed/companies";
import { Icon } from "./Icon";

/**
 * 현직자 회사 리뷰 카드 — 수치와 목소리를 한 장에 담는다.
 *
 * 이 섹션에는 원래 두 종류가 섞여 있었다: 평점·축만 있는 회사 카드와, 인용문만
 * 있는 리뷰 카드. 같은 회사를 두 번 말하면서 어느 쪽이 본체인지 알 수 없었다.
 *
 * 합치는 기준은 "입사 전에 확인한다"는 섹션 목적이다 — 점수(얼마나)와 인용
 * (무엇이)이 한 카드에 있어야 판단이 된다.
 *
 * 축 막대는 뺐다. 카드 6장 × 2줄이면 파란 막대 12개가 화면을 덮는데, 축 비교는
 * 바로 아래 비교표가 훨씬 정확하게 한다. 연봉·태그도 같은 이유로 뺐다 —
 * 연봉은 채용공고 카드가, 태그는 인용문이 이미 말한다.
 */
export function CompanyReviewCard({
  company,
  quote,
  duplicate = false,
}: {
  company: Company;
  quote?: { quote: string; who: string; topic: string };
  /** 무한 슬라이드용 복제본 — 탭 이동과 스크린리더에서 빼야 같은 카드가 두 번 읽히지 않는다 */
  duplicate?: boolean;
}) {
  return (
    <Link
      className="company creview"
      href={`/companies/${company.slug}`}
      aria-hidden={duplicate || undefined}
      tabIndex={duplicate ? -1 : undefined}
    >
      <div className="chead">
        <div className="lg">
          <img src={company.logo} alt="" />
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

      {quote ? (
        <div className="creview-quote">
          <blockquote>{quote.quote}</blockquote>
          <div className="creview-who">
            {quote.who}
            <i aria-hidden />
            {quote.topic}
          </div>
        </div>
      ) : null}

      <span className="company-go">
        리뷰 {company.reviewCount}건 보기
        <Icon name="arrow" />
      </span>
    </Link>
  );
}
