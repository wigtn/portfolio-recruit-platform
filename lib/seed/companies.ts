/**
 * 회사·리뷰 시드 — r4-REFERENCE.html의 실제 값을 그대로 옮긴다(시각 정본과 수치가 어긋나면
 * 시안 대조 리뷰가 불가능해지므로). 전부 합성 데이터다.
 *
 * 평점 축은 영업 직무 기준 5축(r4 변경 6번) — 일반 리뷰 사이트의 워라밸·사내문화가 아니라
 * 인센티브·목표현실성·매니저코칭·계정배분·성과압박. 성과압박은 낮을수록 좋은 역방향 축이다.
 */

export const SALES_AXES = [
  { key: "incentive", label: "인센티브" },
  { key: "goalRealism", label: "목표현실성" },
  { key: "managerCoaching", label: "매니저코칭" },
  { key: "accountAllocation", label: "계정배분" },
  { key: "pressure", label: "성과압박", reverse: true },
] as const;

export type SalesAxisKey = (typeof SALES_AXES)[number]["key"];


import { REVIEWS } from "./reviews";
export type Company = {
  slug: string;
  logo: string;
  mark: string;
  name: string;
  industry: string;
  region: string;
  score: number;
  reviewCount: number;
  /** 사원수 — 상세 헤더가 회사마다 320명으로 고정돼 있어 비교 시연이 어색했다 */
  employees: number;
  /** 연봉 데이터 표본 수 — 탭 카운트·"N건 기준" 문구가 이 값을 읽는다 */
  salaryCount: number;
  salaryLow: number;
  salaryHigh: number;
  axes: Record<SalesAxisKey, number>;
  tags: string[];
};

export const COMPANIES: Company[] = [
  {
    slug: "diamond-tech",
    logo: "/images/company-logos/diamond-tech.png",
    mark: "◇",
    name: "◇◇테크",
    industry: "IT",
    region: "판교",
    score: 4.3,
    reviewCount: 212,
    employees: 1240,
    salaryCount: 156,
    salaryLow: 4800,
    salaryHigh: 6500,
    axes: {
      incentive: 4.3,
      goalRealism: 4.1,
      managerCoaching: 3.7,
      accountAllocation: 4.0,
      pressure: 3.4,
    },
    tags: ["코칭", "수평적"],
  },
  {
    slug: "block-trading",
    logo: "/images/company-logos/block-trading.png",
    mark: "▓",
    name: "▓▓상사",
    industry: "종합상사",
    region: "서울",
    score: 4.1,
    reviewCount: 128,
    employees: 380,
    salaryCount: 96,
    salaryLow: 4200,
    salaryHigh: 5900,
    axes: {
      incentive: 4.5,
      goalRealism: 3.8,
      managerCoaching: 3.9,
      accountAllocation: 3.7,
      pressure: 3.6,
    },
    tags: ["인센티브 좋음", "목표 현실적"],
  },
  {
    slug: "square-commerce",
    logo: "/images/company-logos/square-commerce.png",
    mark: "□",
    name: "□□커머스",
    industry: "이커머스",
    region: "서울",
    score: 3.9,
    reviewCount: 87,
    employees: 560,
    salaryCount: 74,
    salaryLow: 4000,
    salaryHigh: 6200,
    axes: {
      incentive: 3.8,
      goalRealism: 4.4,
      managerCoaching: 3.1,
      accountAllocation: 3.9,
      pressure: 4.1,
    },
    tags: ["빠른 성장", "인센티브"],
  },
  {
    slug: "triangle-electronics",
    logo: "/images/company-logos/triangle-electronics.png",
    mark: "△",
    name: "△△전자",
    industry: "제조",
    region: "수원",
    score: 3.7,
    reviewCount: 94,
    employees: 2100,
    salaryCount: 118,
    salaryLow: 4200,
    salaryHigh: 5800,
    axes: {
      incentive: 3.5,
      goalRealism: 4.0,
      managerCoaching: 4.1,
      accountAllocation: 3.6,
      pressure: 3.2,
    },
    tags: ["성장기회", "교육"],
  },
  {
    slug: "nabla-bio",
    logo: "/images/company-logos/nabla-bio.png",
    mark: "▽",
    name: "▽▽바이오",
    industry: "제약",
    region: "대전",
    score: 3.6,
    reviewCount: 45,
    employees: 340,
    salaryCount: 52,
    salaryLow: 4500,
    salaryHigh: 6000,
    axes: {
      incentive: 3.3,
      goalRealism: 3.6,
      managerCoaching: 4.3,
      accountAllocation: 3.5,
      pressure: 2.9,
    },
    tags: ["전문성", "장기근속"],
  },
  {
    slug: "circle-trading",
    logo: "/images/company-logos/circle-trading.png",
    mark: "○",
    name: "○○물산",
    industry: "유통",
    region: "부산",
    score: 3.4,
    reviewCount: 61,
    employees: 470,
    salaryCount: 63,
    salaryLow: 3800,
    salaryHigh: 5200,
    axes: {
      incentive: 3.0,
      goalRealism: 2.9,
      managerCoaching: 4.0,
      accountAllocation: 3.3,
      pressure: 3.8,
    },
    tags: ["안정적", "복지"],
  },
];

/**
 * 축별 전체 회사 평균 — 카드의 막대가 "잘한 건지"를 읽으려면 기준선이 필요하다.
 * 값을 따로 지어내지 않고 등록된 회사에서 계산한다.
 */
export const AXIS_AVERAGE: Record<SalesAxisKey, number> = SALES_AXES.reduce(
  (acc, axis) => {
    const total = COMPANIES.reduce((sum, c) => sum + c.axes[axis.key], 0);
    acc[axis.key] = total / COMPANIES.length;
    return acc;
  },
  {} as Record<SalesAxisKey, number>,
);

export function getCompany(slug: string) {
  return COMPANIES.find((company) => company.slug === slug);
}

/**
 * 업종 필터 — 하드코딩 4종이던 시절, 종합상사·이커머스·제약 회사 3곳은 어떤
 * 필터로도 도달할 수 없었다. 데이터에서 도출해 목록과 필터가 어긋나지 않게 한다.
 */
/* 표기 수치 동기화 — 카드의 "리뷰 N건"과 실제 나열되는 리뷰 수가 어긋나면
   데모의 신뢰가 무너진다. 시드 숫자를 믿지 않고 리뷰 시드에서 직접 센다. */
const actualReviewCount = (slug: string) =>
  REVIEWS.filter((review) => review.companySlug === slug).length;
for (const company of COMPANIES) {
  company.reviewCount = actualReviewCount(company.slug);
  company.salaryCount = actualReviewCount(company.slug);
}

export const INDUSTRIES: string[] = [
  "전체",
  ...Array.from(new Set(COMPANIES.map((company) => company.industry))),
];
