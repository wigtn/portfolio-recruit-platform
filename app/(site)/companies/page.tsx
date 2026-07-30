import Link from "next/link";
import { Crumb } from "@/components/Crumb";
import { COMPANIES, INDUSTRIES } from "@/lib/seed/companies";
import { CompanyCard } from "@/components/CompanyCard";
import { Icon } from "@/components/Icon";
import { Coach } from "@/components/Coach";
import { CompanySectionTabs } from "@/components/CompanySectionTabs";
import { IndustryFilter } from "@/components/IndustryFilter";

export const metadata = { title: "회사 리뷰 | W 세일즈" };

/** 시안 정본 03번(회사 탐색) 구조 그대로 — .pagehead → .filterbar → .coachwrap → .cgrid */
const SORTS = [
  { key: "score", label: "평점순" },
  { key: "salary", label: "연봉순" },
  { key: "reviews", label: "리뷰순" },
] as const;

export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: Promise<{ industry?: string; q?: string; sort?: string }>;
}) {
  const { industry = "전체", q = "", sort = "score" } = await searchParams;

  const filtered = COMPANIES.filter((company) => {
    const byIndustry = industry === "전체" || company.industry === industry;
    const byName = !q || company.name.includes(q);
    return byIndustry && byName;
  }).sort((a, b) => {
    if (sort === "salary") return b.salaryHigh - a.salaryHigh;
    if (sort === "reviews") return b.reviewCount - a.reviewCount;
    return b.score - a.score;
  });

  const qs = (patch: Record<string, string>) =>
    `/companies?${new URLSearchParams({ industry, q, sort, ...patch })}`;

  return (
    <>
      <div className="pagehead">
        <Crumb items={[{ label: "회사 리뷰" }]} />
        <div className="ttl">
          <div>
            <h1>회사 리뷰</h1>
            <div className="desc">
              영업직이 직접 남긴 익명 리뷰: 평점·연봉·항목별 만족도를 한눈에
            </div>
          </div>
          <Link
            className="btn primary writecta"
            href={`/companies/${filtered[0]?.slug ?? "diamond-tech"}/review`}
          >
            <Icon name="edit" />
            리뷰 쓰기
          </Link>
        </div>
        <CompanySectionTabs active="list" />
      </div>

      <div className="sec">
        <div className="filterbar">
          <IndustryFilter
            value={industry}
            q={q}
            sort={sort}
            items={INDUSTRIES.map((name) => ({
              name,
              count:
                name === "전체"
                  ? COMPANIES.length
                  : COMPANIES.filter((company) => company.industry === name)
                      .length,
            }))}
          />
          <form className="search" action="/companies">
            <input type="hidden" name="industry" value={industry} />
            <input type="hidden" name="sort" value={sort} />
            <Icon name="search" />
            <input name="q" defaultValue={q} placeholder="회사 이름으로 검색" />
          </form>
          <div className="seg">
            {SORTS.map((option) => (
              <Link
                key={option.key}
                className={sort === option.key ? "on" : undefined}
                href={qs({ sort: option.key })}
              >
                {option.label}
              </Link>
            ))}
          </div>
        </div>

        <Coach
          id="companies-axes"
          after
          cta={{ label: "두 회사 비교", href: "/compare" }}
        >
          평점 축이 <b>영업 직무 기준</b>이에요. 인센티브·계정배분·성과압박을
          회사끼리 바로 비교할 수 있어요
        </Coach>

        {filtered.length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: 40 }}>
            <p style={{ marginBottom: 14 }}>조건에 맞는 회사가 없어요.</p>
            <Link className="btn line" href="/companies">
              필터 초기화
            </Link>
          </div>
        ) : (
          <div className="cgrid">
            {filtered.map((company) => (
              <CompanyCard key={company.slug} company={company} axisLimit={3} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
