/**
 * 리뷰 시드 — r4-REFERENCE.html의 실제 문구를 옮긴다. 전부 합성 데이터.
 *
 * 익명 계약(FR-022): 리뷰에 작성자 식별자가 없다. 직무·재직상태·연차·작성월만 남기고
 * 운영자도 작성자를 볼 수 없다는 게 이 화면의 핵심 메시지다.
 */

export type Review = {
  id: string;
  companySlug: string;
  headline: string;
  score: number;
  pros: string;
  cons: string;
  employment: "현직원" | "전직원";
  years: number;
  writtenAt: string;
  helpful: number;
};

export const REVIEWS: Review[] = [
  {
    id: "r-1",
    companySlug: "diamond-tech",
    headline: "인센티브 구조가 투명하고 코칭이 확실해요",
    score: 5.0,
    pros: "목표 대비 인센티브 산정이 명확하게 공개돼서 납득이 됩니다. 신입도 선배가 동행 영업으로 붙어줘서 초반 적응이 빨라요.",
    cons: "성수기엔 주말 출근이 종종 있고, 팀별로 목표 편차가 큰 편입니다.",
    employment: "현직원",
    years: 2,
    writtenAt: "2026.07",
    helpful: 24,
  },
  {
    id: "r-2",
    companySlug: "diamond-tech",
    headline: "성장은 확실, 다만 성과 압박은 각오하세요",
    score: 4.0,
    pros: "거래처 규모가 커서 배우는 게 많고, 실적만 내면 승진이 빠릅니다.",
    cons: "계정 배분이 연차 위주라 신입 초반엔 실적 내기 어려운 구조예요.",
    employment: "전직원",
    years: 4,
    writtenAt: "2026.06",
    helpful: 18,
  },
  {
    id: "r-3",
    companySlug: "diamond-tech",
    headline: "매니저 성향을 많이 타는 편이에요",
    score: 3.5,
    pros: "제품 교육이 체계적이고, 기술 지원 조직이 빠르게 붙어줍니다.",
    cons: "팀마다 코칭 편차가 커서 어느 매니저를 만나느냐가 중요합니다.",
    employment: "현직원",
    years: 3,
    writtenAt: "2026.05",
    helpful: 11,
  },
  {
    id: "r-4",
    companySlug: "block-trading",
    headline: "인센티브 상한이 없어 성과만큼 가져갑니다",
    score: 4.5,
    pros: "실적이 나오면 보상이 확실합니다. 해외 거래처 경험을 빠르게 쌓을 수 있어요.",
    cons: "출장이 잦고, 분기 마감 시즌에는 일정이 빡빡합니다.",
    employment: "현직원",
    years: 5,
    writtenAt: "2026.07",
    helpful: 31,
  },
  {
    id: "r-5",
    companySlug: "square-commerce",
    headline: "목표는 현실적인데 조직이 자주 바뀝니다",
    score: 3.8,
    pros: "데이터 기반으로 목표를 잡아서 납득이 되고, 툴 지원이 좋습니다.",
    cons: "조직 개편이 잦아 담당 카테고리가 자주 바뀝니다.",
    employment: "전직원",
    years: 2,
    writtenAt: "2026.06",
    helpful: 9,
  },
  // 아래 3개 회사는 표본 리뷰가 0장이라 상세가 "리뷰 94건" 헤더 아래 빈 화면이었다.
  // 각 회사의 axes 점수와 어긋나지 않게 쓴다 — 막대와 문장이 다른 말을 하면 안 된다.
  {
    id: "r-6",
    companySlug: "triangle-electronics",
    headline: "교육과 동행 영업이 촘촘해서 신입이 버티기 좋아요",
    score: 4.0,
    pros: "제품 교육 커리큘럼이 잡혀 있고 매니저가 동행 미팅으로 직접 봐줍니다. 신입도 규모 있는 계정을 맡을 기회가 비교적 빨리 와요.",
    cons: "인센티브 구간이 좁아서 목표를 크게 넘겨도 체감 보상이 크지 않습니다.",
    employment: "현직원",
    years: 2,
    writtenAt: "2026.07",
    helpful: 19,
  },
  {
    id: "r-7",
    companySlug: "triangle-electronics",
    headline: "압박은 덜한데 보상 탄력도 덜합니다",
    score: 3.5,
    pros: "목표 산정이 무리하지 않고, 못 채운 달에 몰아세우는 분위기가 아닙니다.",
    cons: "잘한 사람과 못한 사람의 보상 차이가 작아서 오래 있으면 동기가 무뎌져요.",
    employment: "전직원",
    years: 5,
    writtenAt: "2026.06",
    helpful: 13,
  },
  {
    id: "r-8",
    companySlug: "triangle-electronics",
    headline: "코칭 하나는 확실히 배우고 나가는 회사",
    score: 3.5,
    pros: "분기마다 매니저와 딜 리뷰 미팅이 잡히고 피드백이 구체적입니다.",
    cons: "제조 특성상 딜 주기가 길어서 단기 실적으로는 성과를 체감하기 어렵습니다.",
    employment: "현직원",
    years: 4,
    writtenAt: "2026.05",
    helpful: 8,
  },
  {
    id: "r-9",
    companySlug: "nabla-bio",
    headline: "전문성 쌓기엔 좋은데 보상은 아쉬워요",
    score: 4.0,
    pros: "질환·제품 교육이 체계적이라 영업하면서 전문성이 쌓입니다. 무리한 목표를 잡지 않아 압박도 덜한 편이에요.",
    cons: "인센티브 비중이 낮아서 성과가 커도 연봉 변화가 작습니다.",
    employment: "현직원",
    years: 3,
    writtenAt: "2026.07",
    helpful: 15,
  },
  {
    id: "r-10",
    companySlug: "nabla-bio",
    headline: "여유 있게 오래 다닐 수 있는 회사",
    score: 3.5,
    pros: "매니저 동행과 코칭이 잘 붙고, 장기근속자가 많아 인수인계가 안정적입니다.",
    cons: "담당 권역이 지역 기준으로 굳어 있어서 계정을 바꾸기가 어렵습니다.",
    employment: "전직원",
    years: 6,
    writtenAt: "2026.06",
    helpful: 10,
  },
  {
    id: "r-11",
    companySlug: "nabla-bio",
    headline: "성장은 느리지만 확실합니다",
    score: 3.0,
    pros: "매니저가 콜 준비 단계까지 봐주고, 실수에 관대해서 배우면서 일할 수 있어요.",
    cons: "보상 구조가 보수적이고 승급도 연차 위주라 속도를 내고 싶은 사람에겐 답답합니다.",
    employment: "현직원",
    years: 2,
    writtenAt: "2026.04",
    helpful: 6,
  },
  {
    id: "r-12",
    companySlug: "circle-trading",
    headline: "복지는 좋은데 목표가 해마다 훌쩍 뜁니다",
    score: 3.5,
    pros: "고용이 안정적이고 복지 제도가 잘 갖춰져 있습니다. 매니저 코칭도 형식이 아니라 실제로 붙어요.",
    cons: "목표가 시장 상황과 무관하게 오르는 편이라 월말 압박이 큽니다.",
    employment: "현직원",
    years: 4,
    writtenAt: "2026.07",
    helpful: 21,
  },
  {
    id: "r-13",
    companySlug: "circle-trading",
    headline: "압박을 버틸 수 있으면 배울 건 있어요",
    score: 3.0,
    pros: "선배들의 코칭이 체계적이고, 보상 산정 기준 자체는 명확하게 공개됩니다.",
    cons: "기준은 명확한데 액수가 짜고, 달성 자체가 어려운 목표라 인센티브를 못 받는 달이 많았습니다.",
    employment: "전직원",
    years: 3,
    writtenAt: "2026.06",
    helpful: 12,
  },
  {
    id: "r-14",
    companySlug: "circle-trading",
    headline: "안정적이지만 영업으로 큰 보상을 바라긴 어렵습니다",
    score: 3.5,
    pros: "지역 기반의 안정적인 계정이 많고, 정년까지 다니는 선배가 흔합니다.",
    cons: "성과를 내도 보상 차이가 작고, 월말 마감 시즌의 압박은 각오해야 합니다.",
    employment: "현직원",
    years: 6,
    writtenAt: "2026.05",
    helpful: 9,
  },
];

export function reviewsOf(companySlug: string) {
  return REVIEWS.filter((review) => review.companySlug === companySlug);
}
