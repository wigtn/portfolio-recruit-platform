import { COMPANIES, type Company } from "./companies";

/**
 * 채용공고 시드 — 전부 합성 데이터.
 *
 * 이 서비스에서 공고가 다른 채용 사이트와 갈리는 지점은 **공고 옆에 현직자
 * 평점이 같이 붙는다**는 것이다. 그래서 공고는 회사와 느슨하게 묶지 않고
 * `companySlug`로 직접 건다 — 카드에서 평점·리뷰 수를 그 회사에서 읽는다.
 *
 * 연봉은 회사 시드의 범위 안에서만 잡는다. 공고용으로 따로 지어낸 숫자를
 * 두면 회사 상세와 어긋난다.
 */
export type Job = {
  id: string;
  companySlug: string;
  /** 직무명 — 영업 직무 안에서 갈리는 유형까지 드러낸다 */
  title: string;
  /** 고용형태 */
  employment: string;
  /** 요구 경력 */
  career: string;
  /** 마감까지 남은 일수. null이면 상시 채용 */
  daysLeft: number | null;
  /** 이 공고 기준 제시 연봉(만원) */
  payLow: number;
  payHigh: number;
  /** 공고에서 실제로 궁금한 조건 — 복리후생 나열이 아니라 영업 조건 */
  conditions: string[];
  /** 주요 업무 */
  responsibilities: string[];
  /** 자격 요건 */
  requirements: string[];
  /** 우대 사항 */
  preferred: string[];
  /** 근무지 */
  workplace: string;
  /** 채용 절차 */
  process: string[];
};

export const JOBS: Job[] = [
  {
    id: "j-2201",
    companySlug: "diamond-tech",
    title: "B2B 신규 거래처 영업",
    employment: "정규직",
    career: "경력 3년 이상",
    daysLeft: 7,
    payLow: 5200,
    payHigh: 6500,
    conditions: ["인센티브 상한 없음", "법인차 지원", "리드 제공"],
    responsibilities: [
      "국내 중견·대기업 대상 신규 거래처 발굴과 초기 제안(콜드콜·전시회·소개)",
      "제안서 작성과 실무·임원 미팅 리드, 계약 조건 협상",
      "온보딩 3개월간 기존 고객 인수인계 후 신규 계정 단독 운영",
      "CRM(자체 툴) 파이프라인 관리 — 주간 단위 단계 업데이트",
    ],
    requirements: [
      "B2B 영업 경력 3년 이상 (IT·솔루션 업계 우대)",
      "신규 개척 실적을 수치로 설명할 수 있는 분",
      "제안서·견적서 작성이 손에 익은 분",
    ],
    preferred: [
      "SaaS·구독형 상품 영업 경험",
      "파트너·리셀러 채널 운영 경험",
      "데이터 기반 파이프라인 관리 습관",
    ],
    workplace: "판교 본사 (주 1회 재택 가능)",
    process: ["서류 검토", "실무 인터뷰", "임원 인터뷰", "처우 협의 · 입사"],
  },
  {
    id: "j-2202",
    companySlug: "block-trading",
    title: "해외 영업 (동남아 담당)",
    employment: "정규직",
    career: "경력 5년 이상",
    daysLeft: 3,
    payLow: 4800,
    payHigh: 5900,
    conditions: ["출장비 별도", "주재원 전환 가능"],
    responsibilities: [
      "동남아(베트남·인도네시아) 거래선 관리와 신규 바이어 발굴",
      "분기 1~2회 현지 출장 — 전시회 참가와 바이어 미팅",
      "수출 견적·납기 협의, 포워더·통관 일정 조율",
      "환율·시황 리포트 기반 분기 판매 계획 수립",
    ],
    requirements: [
      "해외 영업 경력 5년 이상",
      "영어 비즈니스 회화 가능 (이메일·미팅 리드)",
      "무역 실무(인코텀즈·L/C) 이해",
    ],
    preferred: [
      "동남아 시장 거래선 보유",
      "베트남어·인도네시아어 가능자",
      "상사·제조 업계 경험",
    ],
    workplace: "서울 본사 (분기 현지 출장)",
    process: ["서류 검토", "직무 인터뷰(영어 포함)", "임원 인터뷰", "처우 협의"],
  },
  {
    id: "j-2203",
    companySlug: "square-commerce",
    title: "리테일 MD 영업",
    employment: "정규직",
    career: "신입·경력",
    daysLeft: null,
    payLow: 4000,
    payHigh: 5200,
    conditions: ["교육 3개월", "계정 인수인계"],
    responsibilities: [
      "대형마트·이커머스 채널 입점 제안과 프로모션 기획",
      "발주·재고·매출 데이터 분석으로 채널별 판매 전략 수립",
      "시즌 상품 매대·노출 협상, 현장 라운딩(주 2회)",
      "정산·반품 이슈 대응과 채널 담당자 관계 관리",
    ],
    requirements: [
      "유통·리테일 영업 경력 무관 (신입 지원 가능)",
      "엑셀 기반 매출 데이터 정리가 가능한 분",
      "운전면허 소지 (현장 라운딩)",
    ],
    preferred: [
      "MD·리테일 인턴 경험",
      "이커머스 오픈마켓 운영 경험",
      "식품·생활용품 카테고리 이해",
    ],
    workplace: "서울 사무소 + 수도권 현장",
    process: ["서류 검토", "실무 인터뷰", "처우 협의 · 입사"],
  },
];

export type JobWithCompany = Job & { company: Company };

export function jobsWithCompany(): JobWithCompany[] {
  return JOBS.map((job) => {
    const company = COMPANIES.find((item) => item.slug === job.companySlug);
    if (!company) throw new Error(`공고 ${job.id}의 회사를 찾을 수 없어요`);
    return { ...job, company };
  });
}
