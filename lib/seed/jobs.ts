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

/** 손으로 쓴 대표 공고 — 상세 화면의 기준점이 되는 세 건 */
const CURATED_JOBS: Job[] = [
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
      "국내 중견, 대기업 대상 신규 거래처 발굴과 초기 제안(콜드콜, 전시회, 소개)",
      "제안서 작성과 실무, 임원 미팅 리드, 계약 조건 협상",
      "온보딩 3개월간 기존 고객 인수인계 후 신규 계정 단독 운영",
      "CRM(자체 툴) 파이프라인 관리, 주간 단위 단계 업데이트",
    ],
    requirements: [
      "B2B 영업 경력 3년 이상 (IT, 솔루션 업계 우대)",
      "신규 개척 실적을 수치로 설명할 수 있는 분",
      "제안서, 견적서 작성이 손에 익은 분",
    ],
    preferred: [
      "SaaS, 구독형 상품 영업 경험",
      "파트너, 리셀러 채널 운영 경험",
      "데이터 기반 파이프라인 관리 습관",
    ],
    workplace: "판교 본사 (주 1회 재택 가능)",
    process: ["서류 검토", "실무 인터뷰", "임원 인터뷰", "처우 협의, 입사"],
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
      "동남아(베트남, 인도네시아) 거래선 관리와 신규 바이어 발굴",
      "분기 1~2회 현지 출장, 전시회 참가와 바이어 미팅",
      "수출 견적, 납기 협의, 포워더, 통관 일정 조율",
      "환율, 시황 리포트 기반 분기 판매 계획 수립",
    ],
    requirements: [
      "해외 영업 경력 5년 이상",
      "영어 비즈니스 회화 가능 (이메일, 미팅 리드)",
      "무역 실무(인코텀즈, L/C) 이해",
    ],
    preferred: [
      "동남아 시장 거래선 보유",
      "베트남어, 인도네시아어 가능자",
      "상사, 제조 업계 경험",
    ],
    workplace: "서울 본사 (분기 현지 출장)",
    process: ["서류 검토", "직무 인터뷰(영어 포함)", "임원 인터뷰", "처우 협의"],
  },
  {
    id: "j-2203",
    companySlug: "square-commerce",
    title: "리테일 MD 영업",
    employment: "정규직",
    career: "신입, 경력",
    daysLeft: null,
    payLow: 4000,
    payHigh: 5200,
    conditions: ["교육 3개월", "계정 인수인계"],
    responsibilities: [
      "대형마트, 이커머스 채널 입점 제안과 프로모션 기획",
      "발주, 재고, 매출 데이터 분석으로 채널별 판매 전략 수립",
      "시즌 상품 매대, 노출 협상, 현장 라운딩(주 2회)",
      "정산, 반품 이슈 대응과 채널 담당자 관계 관리",
    ],
    requirements: [
      "유통, 리테일 영업 경력 무관 (신입 지원 가능)",
      "엑셀 기반 매출 데이터 정리가 가능한 분",
      "운전면허 소지 (현장 라운딩)",
    ],
    preferred: [
      "MD, 리테일 인턴 경험",
      "이커머스 오픈마켓 운영 경험",
      "식품, 생활용품 카테고리 이해",
    ],
    workplace: "서울 사무소 + 수도권 현장",
    process: ["서류 검토", "실무 인터뷰", "처우 협의, 입사"],
  },
];

/**
 * 직무 원형 — 공고를 부풀리려고 문구만 바꾼 껍데기를 두지 않는다.
 *
 * 영업 안에서 실제로 갈리는 유형(신규 개척 / 계정 관리 / 채널 / 인사이드 /
 * 세일즈 엔지니어 / 전략 계정 / 파트너 얼라이언스)을 원형으로 두고, 회사별
 * 조건(연봉 범위·근무지·업종)만 회사 시드에서 파생시킨다. 그래야 목록이
 * 길어져도 카드마다 읽을 내용이 다르다.
 */
type Archetype = {
  key: string;
  title: string;
  employment: string;
  career: string;
  /** 회사 연봉 범위 안에서 이 직무가 앉는 구간 (0~1) */
  band: [number, number];
  conditions: string[];
  responsibilities: string[];
  requirements: string[];
  preferred: string[];
  process: string[];
};

const ARCHETYPES: Archetype[] = [
  {
    key: "am",
    title: "기존 고객 계정 관리(AM)",
    employment: "정규직",
    career: "경력 2년 이상",
    band: [0.1, 0.62],
    conditions: ["계정 인수인계", "갱신 인센티브", "리드 제공"],
    responsibilities: [
      "담당 계정의 갱신, 업셀 협상과 연간 사용 계획 합의",
      "분기 비즈니스 리뷰(QBR) 운영 - 사용 지표와 성과 보고",
      "이탈 징후 계정 조기 감지와 내부 지원 조직 연계",
      "계정별 매출 예측을 주 단위로 갱신",
    ],
    requirements: [
      "B2B 계정 관리 또는 영업 경력 2년 이상",
      "고객사 실무, 의사결정자와 동시에 대화해본 경험",
      "갱신률, 업셀 실적을 수치로 설명할 수 있는 분",
    ],
    preferred: [
      "구독형 상품의 갱신 사이클 운영 경험",
      "CS, CSM 조직과 협업해본 경험",
      "데이터로 이탈 위험을 관리해본 경험",
    ],
    process: ["서류 검토", "실무 인터뷰", "임원 인터뷰", "처우 협의, 입사"],
  },
  {
    key: "inside",
    title: "인사이드 세일즈",
    employment: "정규직",
    career: "신입, 경력",
    band: [0, 0.42],
    conditions: ["리드 제공", "교육 2개월", "재택 병행"],
    responsibilities: [
      "인바운드 문의 자격 검증(BANT)과 초기 상담",
      "아웃바운드 콜, 메일 시퀀스 운영과 미팅 세팅",
      "필드 영업에게 넘길 리드의 맥락 정리와 인계",
      "CRM 활동 기록 - 단계별 전환율을 주 단위로 리포트",
    ],
    requirements: [
      "전화, 화상 상담에 거부감이 없는 분",
      "문서로 맥락을 정리해 넘길 수 있는 분",
      "목표 기반으로 하루 활동량을 관리해본 경험",
    ],
    preferred: [
      "SaaS, 솔루션 인사이드 세일즈 경험",
      "CRM(세일즈포스, 허브스팟) 사용 경험",
      "콜 스크립트를 직접 개선해본 경험",
    ],
    process: ["서류 검토", "전화 인터뷰", "실무 인터뷰", "처우 협의"],
  },
  {
    key: "channel",
    title: "채널, 대리점 영업",
    employment: "정규직",
    career: "경력 3년 이상",
    band: [0.15, 0.7],
    conditions: ["채널 인센티브", "법인차 지원", "출장비 별도"],
    responsibilities: [
      "지역 대리점, 총판 발굴과 계약 조건 협상",
      "채널별 판매 목표 배분과 월 단위 실적 점검",
      "대리점 영업사원 대상 상품 교육과 동행 영업",
      "채널 간 가격, 영역 충돌 조정",
    ],
    requirements: [
      "채널, 대리점 영업 경력 3년 이상",
      "다수의 파트너를 동시에 관리해본 경험",
      "운전면허 소지 (지역 순회)",
    ],
    preferred: [
      "총판 계약 구조를 설계해본 경험",
      "지역 영업 조직을 새로 세팅해본 경험",
      "유통 마진 구조에 대한 이해",
    ],
    process: ["서류 검토", "실무 인터뷰", "임원 인터뷰", "처우 협의, 입사"],
  },
  {
    key: "se",
    title: "세일즈 엔지니어(기술영업)",
    employment: "정규직",
    career: "경력 3년 이상",
    band: [0.28, 0.85],
    conditions: ["기술 교육 지원", "자격증 응시료 지원", "리드 제공"],
    responsibilities: [
      "고객 요구사항 기술 검토와 도입 구성안 설계",
      "PoC, 데모 환경 구축과 검증 결과 보고",
      "제안서의 기술 섹션 작성, RFP 대응",
      "도입 후 초기 안정화까지 기술 창구 역할",
    ],
    requirements: [
      "기술영업, 솔루션 컨설팅 경력 3년 이상",
      "제품 구조를 고객 언어로 바꿔 설명할 수 있는 분",
      "PoC를 주도해본 경험",
    ],
    preferred: [
      "클라우드, 데이터 인프라 이해",
      "RFP 대응 문서를 직접 써본 경험",
      "개발 조직과 요구사항을 조율해본 경험",
    ],
    process: ["서류 검토", "기술 인터뷰", "케이스 발표", "처우 협의"],
  },
  {
    key: "key",
    title: "전략 계정 영업(Key Account)",
    employment: "정규직",
    career: "경력 7년 이상",
    band: [0.45, 1],
    conditions: ["인센티브 상한 없음", "법인차 지원", "임원 동행 지원"],
    responsibilities: [
      "대기업 전략 계정의 연간 거래 계획 수립과 임원 관계 관리",
      "대형 입찰, 연간 단가 계약 협상 리드",
      "계정 내 다부서 확산(랜드 앤 익스팬드) 설계",
      "분기 손익을 보며 할인, 투자 의사결정 제안",
    ],
    requirements: [
      "B2B 영업 경력 7년 이상, 대형 계정 경험",
      "연 단위 계약 협상을 단독으로 이끈 경험",
      "복수 이해관계자를 설득해본 경험",
    ],
    preferred: [
      "제조, 금융 등 규제 산업 계정 경험",
      "글로벌 본사와 협업해본 경험",
      "계약서 조건을 법무와 조율해본 경험",
    ],
    process: [
      "서류 검토",
      "실무 인터뷰",
      "케이스 발표",
      "임원 인터뷰",
      "처우 협의",
    ],
  },
  {
    key: "alliance",
    title: "파트너, 얼라이언스",
    employment: "정규직",
    career: "경력 5년 이상",
    band: [0.32, 0.8],
    conditions: ["파트너 인센티브", "출장비 별도", "재택 병행"],
    responsibilities: [
      "리셀러, SI 파트너 발굴과 공동 사업 계획 수립",
      "파트너 대상 상품 교육, 인증 프로그램 운영",
      "공동 영업 기회 발굴과 딜 레지스트레이션 관리",
      "파트너별 기여 매출 집계와 정산 조건 협의",
    ],
    requirements: [
      "파트너, 제휴 영업 경력 5년 이상",
      "공동 사업 계획을 문서로 합의해본 경험",
      "내부 영업 조직과 파트너 간 이해를 조율해본 경험",
    ],
    preferred: [
      "SI, MSP 파트너 생태계 이해",
      "파트너 포털, 인증 체계를 운영해본 경험",
      "해외 파트너와 영어로 협업해본 경험",
    ],
    process: ["서류 검토", "실무 인터뷰", "임원 인터뷰", "처우 협의"],
  },
  {
    key: "newbiz",
    title: "신규 시장 개척 영업",
    employment: "정규직",
    career: "경력 4년 이상",
    band: [0.22, 0.78],
    conditions: ["인센티브 상한 없음", "초기 3개월 목표 유예", "출장비 별도"],
    responsibilities: [
      "미개척 산업군 리스트업과 진입 시나리오 수립",
      "콜드 아웃리치부터 첫 계약까지 전 과정 단독 수행",
      "초기 레퍼런스 계정 확보와 사례화",
      "시장 반응을 상품 조직에 구조화해 전달",
    ],
    requirements: [
      "B2B 신규 개척 경력 4년 이상",
      "레퍼런스 없이 첫 계약을 만들어본 경험",
      "거절을 데이터로 정리해 다음 시도에 반영하는 습관",
    ],
    preferred: [
      "신규 산업군 진입을 주도해본 경험",
      "가격 정책을 처음부터 설계해본 경험",
      "마케팅과 공동 캠페인을 돌려본 경험",
    ],
    process: ["서류 검토", "실무 인터뷰", "케이스 발표", "처우 협의, 입사"],
  },
];

/** 마감일 분포 — 상시(null)와 임박이 섞여야 목록이 진짜처럼 읽힌다 */
const DEADLINES: Array<number | null> = [12, 5, null, 21, 8, 30, null, 3, 16];

/** 회사 연봉 범위 안에서 직무 구간을 잘라 100만원 단위로 맞춘다 */
function payBand(low: number, high: number, band: [number, number]) {
  const span = high - low;
  const round = (value: number) => Math.round(value / 100) * 100;
  return {
    payLow: round(low + span * band[0]),
    payHigh: round(low + span * band[1]),
  };
}

/**
 * 경력 티어 — 같은 직무라도 회사는 주니어/시니어 공고를 따로 낸다.
 *
 * 원형 × 회사만으로는 42건이라 무한 스크롤을 두어 번 굴리면 끝난다. 티어를
 * 한 축 더 두면 목록이 실제 채용 보드만큼 깊어지고, 같은 직무 안에서 조건이
 * 어떻게 갈리는지(연봉대·경력·고용형태)도 같이 보여진다.
 */
const TIERS: Array<{
  suffix: string;
  career: string;
  employment?: string;
  /** 원형 구간을 이 티어 쪽으로 당긴다 */
  shift: number;
}> = [
  { suffix: "주니어", career: "경력 1~3년", shift: -0.18 },
  { suffix: "", career: "", shift: 0 },
  { suffix: "시니어", career: "경력 8년 이상", shift: 0.2 },
  {
    suffix: "계약직",
    career: "경력 무관",
    employment: "계약직",
    shift: -0.1,
  },
];

/**
 * 원형 × 회사 × 티어 전개 — 회사마다 다른 조합이 걸리도록 인덱스를 어긋나게
 * 돌린다. 같은 회사에 같은 공고가 두 번 뜨지 않고, 목록을 내려도 반복감이 없다.
 */
function expandedJobs(): Job[] {
  const out: Job[] = [];
  let serial = 2204;
  ARCHETYPES.forEach((archetype, a) => {
    COMPANIES.forEach((company, c) => {
      TIERS.forEach((tier, t) => {
        // 모든 조합(7×6×4=168)은 과하다. 회사·원형마다 티어 3종만 걸리게 솎는다.
        if ((a + c + t) % 4 === 3) return;
        const band: [number, number] = [
          Math.max(0, archetype.band[0] + tier.shift),
          Math.min(1, archetype.band[1] + tier.shift),
        ];
        const { payLow, payHigh } = payBand(
          company.salaryLow,
          company.salaryHigh,
          band,
        );
        out.push({
          id: `j-${serial++}`,
          companySlug: company.slug,
          title: tier.suffix
            ? `${archetype.title}, ${tier.suffix}`
            : archetype.title,
          employment: tier.employment ?? archetype.employment,
          career: tier.career || archetype.career,
          daysLeft:
            DEADLINES[
              (a * COMPANIES.length * TIERS.length + c * TIERS.length + t) %
                DEADLINES.length
            ],
          payLow,
          payHigh,
          conditions: archetype.conditions,
          responsibilities: archetype.responsibilities,
          requirements: archetype.requirements,
          preferred: archetype.preferred,
          workplace: `${company.region} 근무`,
          process: archetype.process,
        });
      });
    });
  });
  return out;
}

export const JOBS: Job[] = [...CURATED_JOBS, ...expandedJobs()];

export type JobWithCompany = Job & { company: Company };

export function jobsWithCompany(): JobWithCompany[] {
  return JOBS.map((job) => {
    const company = COMPANIES.find((item) => item.slug === job.companySlug);
    if (!company) throw new Error(`공고 ${job.id}의 회사를 찾을 수 없어요`);
    return { ...job, company };
  });
}
