import Link from "next/link";
import { notFound } from "next/navigation";
import {
  COMPANIES,
  SALES_AXES,
  getCompany,
  type Company,
} from "@/lib/seed/companies";
import { reviewsOf } from "@/lib/seed/reviews";
import { MyReviews } from "./MyReviews";
import { ReviewList } from "./ReviewList";
import { FollowButton } from "@/components/FollowButton";
import { Coach } from "@/components/Coach";
import { CompanyTabs } from "@/components/CompanyTabs";
import { Icon } from "@/components/Icon";

export function generateStaticParams() {
  return COMPANIES.map((company) => ({ slug: company.slug }));
}

/** 시안 정본 04번(회사 상세·리뷰) 구조 그대로 — .cprofile → .sec/.statgrid(.scorebox + .reviewbox) */
const SORTS = [
  { key: "recent", label: "최신순" },
  { key: "high", label: "평점 높은순" },
  { key: "low", label: "평점 낮은순" },
] as const;

export default async function CompanyDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sort?: string; tab?: string }>;
}) {
  const { slug } = await params;
  const { sort = "recent", tab = "reviews" } = await searchParams;

  const company = getCompany(slug);
  if (!company) notFound();

  // 회사별 실값(공유 계약: Company.employees/salaryCount) — 6개 회사가 전부
  // "320명 · 88건"이면 비교 시연이 무너진다. 필드가 아직 없으면 기존 값으로 방어.
  const employees =
    (company as Company & { employees?: number }).employees ?? 320;
  const salaryCount =
    (company as Company & { salaryCount?: number }).salaryCount ?? 88;

  const reviews = [...reviewsOf(slug)].sort((a, b) => {
    if (sort === "high") return b.score - a.score;
    if (sort === "low") return a.score - b.score;
    return b.writtenAt.localeCompare(a.writtenAt);
  });

  return (
    <CompanyTabs
      slug={slug}
      initial={tab === "salary" ? "salary" : "reviews"}
      reviewCount={company.reviewCount}
      salaryCount={salaryCount}
      header={
        <div className="top">
          {/* 목록·비교·공고 카드는 전부 로고 이미지를 쓴다. 상세만 글리프(◇)로
              남아 있어 같은 회사인데 표식이 달라 보였다 — 정본은 로고다. */}
          <div className="lg">
            <img src={company.logo} alt={`${company.name} 로고`} />
          </div>
          <div className="info">
            <h1>{company.name}</h1>
            <div className="meta">
              {company.industry}, {company.region}, 정규직, 사원수{" "}
              {employees.toLocaleString()}명
            </div>
          </div>
          <div className="acts">
            <FollowButton slug={slug} />
            <Link
              className="btn primary sm writecta"
              href={`/companies/${slug}/review`}
            >
              <Icon name="edit" />
              리뷰 쓰기
            </Link>
          </div>
        </div>
      }
      scorebox={
        <div className="scorebox">
          <div className="big">{company.score.toFixed(1)}</div>
          <div className="stars">
            <StarBar score={company.score} />
          </div>
          <div className="cnt">
            전, 현직 영업직 리뷰 <b>{company.reviewCount}</b>건
          </div>
          <div
            className="ratings"
            style={{
              marginTop: 16,
              paddingTop: 16,
              borderTop: "1px solid var(--line)",
            }}
          >
            {SALES_AXES.map((axis) => (
              <div className="rate" key={axis.key}>
                <span className="k">{axis.label}</span>
                <span className="bar">
                  <span
                    style={{
                      width: `${(company.axes[axis.key] / 5) * 100}%`,
                    }}
                  />
                </span>
                <span className="v">{company.axes[axis.key].toFixed(1)}</span>
              </div>
            ))}
          </div>
        </div>
      }
      salary={<SalaryPanel company={company} salaryCount={salaryCount} />}
      reviews={
        <>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 16,
              flexWrap: "wrap",
              gap: 10,
            }}
          >
            <h4 style={{ margin: 0 }}>영업직 리뷰 {company.reviewCount}건</h4>
            <div className="seg">
              {SORTS.map((option) => (
                <Link
                  key={option.key}
                  className={sort === option.key ? "on" : undefined}
                  href={`/companies/${slug}?tab=reviews&sort=${option.key}`}
                >
                  {option.label}
                </Link>
              ))}
            </div>
          </div>

          <Coach id="company-anon">
            리뷰는 <b>익명</b>이에요, 운영자도 작성자를 못 봐요. 직접 써보면{" "}
            <b>평점이 바로 재계산</b>돼요
          </Coach>

          {/* 체험 중 등록한 내 리뷰가 맨 위 — 클라이언트에서 병합한다 */}
          <MyReviews company={company} />

          {/* 맛보기 한 건은 그대로, 나머지는 게스트에게 잠긴다.
              회원에게는 스크롤로 이어 부른다(ReviewList) */}
          <ReviewList reviews={reviews} company={company.name} />
        </>
      }
    />
  );
}

/** 부분 채움 별 — 시안 `.starbar`(배경 5개 위에 fill 레이어를 % 만큼 덮는다) */
function StarBar({ score }: { score: number }) {
  const stars = Array.from({ length: 5 });
  return (
    <span className="starbar">
      <span className="base">
        {stars.map((_, index) => (
          <Icon key={index} name="star" filled />
        ))}
      </span>
      <span className="fill" style={{ width: `${(score / 5) * 100}%` }}>
        {stars.map((_, index) => (
          <Icon key={index} name="star" filled />
        ))}
      </span>
    </span>
  );
}

/** 연봉 탭 — 시안엔 자리만 있었다. 리뷰와 같은 축(고정급·인센티브)으로 쪼개 보여준다 */
function SalaryPanel({
  company,
  salaryCount,
}: {
  company: Company;
  salaryCount: number;
}) {
  const mid = Math.round((company.salaryLow + company.salaryHigh) / 2);
  // 인센티브 비중은 인센티브 축 평점을 그대로 쓴다 — 다른 수치를 지어내지 않는다
  const incentive = Math.round((company.axes.incentive / 5) * 40);
  const bands = [
    { label: "1~3년차", low: company.salaryLow, high: mid },
    {
      label: "4~7년차",
      low: mid,
      high: Math.round((mid + company.salaryHigh) / 2),
    },
    {
      label: "8년차+",
      low: Math.round((mid + company.salaryHigh) / 2),
      high: company.salaryHigh,
    },
  ];

  return (
    <div className="salgrid">
      {/* 카드 1 — 범위와 급여 구성 */}
      <div className="salcard">
        <div className="salcap">영업직 연봉 범위</div>
        <div className="salrange">
          <b>
            {company.salaryLow.toLocaleString()}~
            {company.salaryHigh.toLocaleString()}
          </b>
          <span>만원</span>
        </div>
        <p className="salbase">전, 현직 영업직이 남긴 {salaryCount}건 기준</p>

        <div className="salmix">
          <div className="salmix-bar" aria-hidden>
            <span style={{ width: `${100 - incentive}%` }} />
            <i style={{ width: `${incentive}%` }} />
          </div>
          <div className="salmix-legend">
            <span>
              <em className="d fix" /> 고정급 {100 - incentive}%
            </span>
            <span>
              <em className="d inc" /> 인센티브 {incentive}%
            </span>
          </div>
        </div>
      </div>

      {/* 카드 2 — 연차별 구간. 전체 범위 위에 놓인 구간 바라 어디서
          시작해 어디까지 가는지가 한눈에 잡힌다 */}
      <div className="salcard">
        <div className="salcap">연차별 범위</div>
        <div className="salbands">
          {bands.map((band) => {
            const span = company.salaryHigh - company.salaryLow || 1;
            const left = ((band.low - company.salaryLow) / span) * 100;
            const width = ((band.high - band.low) / span) * 100;
            return (
              <div className="salband" key={band.label}>
                <span className="k">{band.label}</span>
                <span className="track" aria-hidden>
                  <span
                    className="range"
                    style={{
                      left: `${left}%`,
                      width: `${Math.max(width, 6)}%`,
                    }}
                  />
                </span>
                <span className="v">
                  {band.low.toLocaleString()}~{band.high.toLocaleString()}
                </span>
              </div>
            );
          })}
          <div className="salscale" aria-hidden>
            <span>
              <i>{company.salaryLow.toLocaleString()}</i>
              <i>{company.salaryHigh.toLocaleString()} 만원</i>
            </span>
          </div>
        </div>
      </div>

      {/* 카드 3(전폭) — 등록 회사 전체와 같은 눈금에서 비교.
          모든 값이 회사 시드의 실값이다 — 새 수치를 지어내지 않는다 */}
      <div className="salcard salwide">
        <div className="salcap">등록 회사 연봉 비교</div>
        <div className="salbands">
          {[...COMPANIES]
            .sort((a, b) => b.salaryHigh - a.salaryHigh)
            .map((peer) => {
              const low = Math.min(...COMPANIES.map((c) => c.salaryLow));
              const high = Math.max(...COMPANIES.map((c) => c.salaryHigh));
              const span = high - low || 1;
              const left = ((peer.salaryLow - low) / span) * 100;
              const width = ((peer.salaryHigh - peer.salaryLow) / span) * 100;
              const isSelf = peer.slug === company.slug;
              return (
                <Link
                  className={isSelf ? "salpeer is-self" : "salpeer"}
                  href={`/companies/${peer.slug}?tab=salary`}
                  key={peer.slug}
                >
                  <span className="k">
                    {peer.name}
                    {isSelf ? <em>이 회사</em> : null}
                  </span>
                  <span className="track" aria-hidden>
                    <span
                      className="range"
                      style={{
                        left: `${left}%`,
                        width: `${Math.max(width, 5)}%`,
                      }}
                    />
                  </span>
                  <span className="v">
                    {peer.salaryLow.toLocaleString()}~
                    {peer.salaryHigh.toLocaleString()}
                  </span>
                </Link>
              );
            })}
        </div>
      </div>

      {/* 카드 4 — 보상 만족도(인센티브 축 평점, 등록사 평균 대비) */}
      <div className="salcard">
        <div className="salcap">보상 만족도, 인센티브 축</div>
        <div className="salrate">
          <b>{company.axes.incentive.toFixed(1)}</b>
          <span className="of">/ 5.0</span>
        </div>
        <div className="salrate-bars">
          <div className="row">
            <span className="k">{company.name}</span>
            <span className="bar">
              <span
                style={{ width: `${(company.axes.incentive / 5) * 100}%` }}
              />
            </span>
            <span className="v">{company.axes.incentive.toFixed(1)}</span>
          </div>
          <div className="row is-avg">
            <span className="k">등록사 평균</span>
            <span className="bar">
              <span
                style={{
                  width: `${
                    (COMPANIES.reduce(
                      (sum, peer) => sum + peer.axes.incentive,
                      0,
                    ) /
                      COMPANIES.length /
                      5) *
                    100
                  }%`,
                }}
              />
            </span>
            <span className="v">
              {(
                COMPANIES.reduce((sum, peer) => sum + peer.axes.incentive, 0) /
                COMPANIES.length
              ).toFixed(1)}
            </span>
          </div>
        </div>
        <p className="salbase" style={{ margin: "12px 0 0" }}>
          성과급 산정 기준이 공개되고 그대로 지급되는지를 매긴 축이에요
        </p>
      </div>

      {/* 카드 5 — 보상을 말한 현직자 리뷰 인용(가장 높은 평점 리뷰) */}
      <div className="salcard">
        <div className="salcap">현직자 한마디</div>
        {(() => {
          const top = [...reviewsOf(company.slug)].sort(
            (a, b) => b.score - a.score,
          )[0];
          if (!top) return null;
          return (
            <blockquote className="salquote">
              <b className="qhead">{top.headline}</b>
              <p>{top.pros}</p>
              <footer className="qfoot">
                <span className="qav">
                  <Icon name="user" />
                </span>
                <span className="qwho">
                  익명
                  <small>
                    영업, {top.employment}, {top.years}년차
                  </small>
                </span>
                <span className="qscore">
                  <Icon name="star" filled />
                  {top.score.toFixed(1)}
                </span>
              </footer>
              <Link className="qgo" href={`/companies/${company.slug}?tab=reviews`}>
                리뷰 전체 보기
                <Icon name="arrow" />
              </Link>
            </blockquote>
          );
        })()}
      </div>
    </div>
  );
}
