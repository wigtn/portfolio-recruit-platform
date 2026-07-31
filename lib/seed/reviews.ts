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

/** 손으로 쓴 대표 리뷰 — 각 회사 목록의 첫 화면을 잡는다 */
const CURATED_REVIEWS: Review[] = [
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
    pros: "질환, 제품 교육이 체계적이라 영업하면서 전문성이 쌓입니다. 무리한 목표를 잡지 않아 압박도 덜한 편이에요.",
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

/* ── 리뷰 확장 ──────────────────────────────────────────────────
   손으로 쓴 14건만으로는 회사당 1~3건이라 목록이 한 화면에서 끝난다. 무한
   스크롤이 붙어도 보여줄 게 없고, "리뷰 212건"이라는 회사 시드와도 어긋난다.

   그래서 회사의 **평점 축 특성**에서 리뷰를 파생시킨다. 인센티브가 높은
   회사는 장점에 인센티브가, 성과압박이 높은 회사는 단점에 압박이 나온다 —
   무작위 문장을 뿌리면 평점표와 리뷰가 따로 놀아서 금방 들킨다.

   companies.ts가 이 파일을 import하므로(리뷰 수 집계) 여기서 COMPANIES를
   되부르면 순환이 된다. 축 특성만 최소한으로 복제해 둔다. */

type AxisKey =
  | "incentive"
  | "goalRealism"
  | "managerCoaching"
  | "accountAllocation"
  | "pressure";

/** 회사별 성격 — companies.ts의 axes와 같은 방향으로 맞춰 둔다 */
const PROFILES: Array<{
  slug: string;
  base: number;
  strong: AxisKey[];
  weak: AxisKey[];
}> = [
  {
    slug: "diamond-tech",
    base: 4.3,
    strong: ["incentive", "goalRealism"],
    weak: ["managerCoaching"],
  },
  {
    slug: "block-trading",
    base: 4.1,
    strong: ["accountAllocation"],
    weak: ["pressure", "managerCoaching"],
  },
  {
    slug: "square-commerce",
    base: 3.8,
    strong: ["managerCoaching"],
    weak: ["incentive", "goalRealism"],
  },
  {
    slug: "circle-trading",
    base: 3.9,
    strong: ["goalRealism"],
    weak: ["accountAllocation"],
  },
  {
    slug: "triangle-electronics",
    base: 4.0,
    strong: ["incentive", "accountAllocation"],
    weak: ["pressure"],
  },
  {
    slug: "nabla-bio",
    base: 4.2,
    strong: ["managerCoaching", "goalRealism"],
    weak: ["incentive"],
  },
];

/** 축이 좋을 때 나오는 말 */
const PROS: Record<AxisKey, string[]> = {
  incentive: [
    "인센티브 산정식이 사내에 공개돼 있어서 내 몫이 맞는지 직접 검산할 수 있어요.",
    "초과 달성분에 상한이 없어서 분기 후반에 밀어붙일 이유가 분명합니다.",
    "지급 주기가 짧아 성과가 체감되는 속도가 빠릅니다.",
    "신규 계약과 갱신 인센티브가 따로 잡혀서 어느 쪽을 해도 보상이 붙어요.",
    "연말 정산 때 산정 근거를 표로 받아볼 수 있어 다툴 일이 없습니다.",
    "팀 성과급과 개인 성과급이 분리돼 있어 남 탓할 구조가 아닙니다.",
  ],
  goalRealism: [
    "목표가 전년 실적과 시장 상황을 반영해서 잡혀요. 숫자 놀음이 아닙니다.",
    "분기 중 상황이 크게 바뀌면 목표를 다시 협의할 창구가 실제로 있습니다.",
    "신규 담당자에게는 초기 유예 기간을 줘서 자리 잡을 시간이 있어요.",
    "목표 배분 때 담당 계정 구성을 같이 보기 때문에 납득이 됩니다.",
    "달성률이 아니라 파이프라인 질까지 같이 보는 편이에요.",
    "무리한 밀어내기 매출을 위에서 오히려 말립니다.",
  ],
  managerCoaching: [
    "매니저가 동행 영업을 실제로 따라붙고, 끝나면 피드백을 문서로 남겨줍니다.",
    "주간 1:1이 형식이 아니라 딜 단위로 막힌 지점을 같이 뚫는 자리예요.",
    "실패한 딜도 회고 대상이라 다음 제안이 확실히 나아집니다.",
    "제안서 초안을 매니저가 먼저 읽고 고쳐줘서 첫 미팅 질이 다릅니다.",
    "고객사 임원 미팅에 매니저가 같이 들어가 무게를 실어줍니다.",
    "신입 온보딩 커리큘럼이 문서로 있어 시작이 막막하지 않아요.",
  ],
  accountAllocation: [
    "계정 배분 기준이 문서로 있어서 연차만으로 좋은 계정이 가지 않습니다.",
    "이관 시 인수인계 기간이 보장돼서 고객이 붕 뜨는 일이 없어요.",
    "신규와 기존 비중을 담당자와 협의해 조정할 수 있습니다.",
    "산업군별로 나눠서 전문성이 쌓이는 구조입니다.",
    "계정 수가 과하지 않아 한 곳에 제대로 붙을 수 있어요.",
    "성과가 나면 더 큰 계정으로 옮겨주는 경로가 실제로 있습니다.",
  ],
  pressure: [
    "미달이라고 공개적으로 압박하지 않아요. 원인을 같이 봅니다.",
    "주간 실적 공유가 줄 세우기가 아니라 정보 공유 목적입니다.",
    "분기 마감 때도 야근을 강요하는 분위기는 아닙니다.",
    "휴가를 실적과 엮지 않아서 쓸 때 눈치가 안 보여요.",
    "한 분기 부진했다고 바로 흔들지 않고 지켜봐 줍니다.",
    "숫자 이야기를 하되 사람을 깎지는 않는 문화입니다.",
  ],
};

/** 축이 나쁠 때 나오는 말 */
const CONS: Record<AxisKey, string[]> = {
  incentive: [
    "인센티브 지급이 분기 말에 몰려서 현금 흐름이 불규칙합니다.",
    "기준이 기별로 바뀌는 편이라 연초 계획을 세우기 어려워요.",
    "기본급 비중이 낮아 비수기엔 체감 수입이 확 줄어듭니다.",
    "산정식이 복잡해서 받기 전까지 얼마인지 가늠이 안 됩니다.",
    "대형 계약 하나에 좌우돼서 매달 편차가 큽니다.",
    "갱신 건은 인센티브 비중이 낮아 손이 덜 가게 됩니다.",
  ],
  goalRealism: [
    "목표가 전년 대비 일괄 상향이라 시장이 꺾인 해에도 그대로 갑니다.",
    "팀별 목표 편차가 커서 어느 팀에 배치되느냐가 실적을 좌우해요.",
    "분기 중 목표가 상향 조정되는 경우가 있습니다.",
    "신규 산업군인데도 기존 팀과 같은 잣대로 평가합니다.",
    "목표를 정할 때 현장 의견이 들어갈 자리가 좁아요.",
    "달성률만 보다 보니 장기 계정에 투자할 유인이 적습니다.",
  ],
  managerCoaching: [
    "매니저에 따라 코칭 편차가 큽니다. 운에 맡기는 부분이 있어요.",
    "1:1이 실적 점검 위주라 막힌 딜을 푸는 데는 도움이 적습니다.",
    "신입 온보딩이 문서화돼 있지 않아 선배 어깨너머로 배웁니다.",
    "매니저가 플레잉 코치라 본인 숫자에 밀려 붙어줄 시간이 적어요.",
    "피드백이 구두로만 오가서 다음에 뭘 바꿔야 할지 남지 않습니다.",
    "조직 개편이 잦아 매니저가 자주 바뀝니다.",
  ],
  accountAllocation: [
    "좋은 계정이 연차 순으로 가는 편이라 초반엔 실적 내기 어렵습니다.",
    "이관 기준이 명확하지 않아 담당이 자주 바뀌는 계정이 있어요.",
    "신규 개척 비중이 높게 잡혀 기존 계정 관리 시간이 부족합니다.",
    "담당 계정 수가 많아 한 곳에 깊이 붙기 어렵습니다.",
    "지역, 산업 경계가 모호해 팀 간 충돌이 종종 생겨요.",
    "퇴사자 계정이 몰릴 때가 있어 분기 초에 부담이 큽니다.",
  ],
  pressure: [
    "주간 실적 공유가 사실상 줄 세우기라 부담이 큽니다.",
    "분기 마감 주에는 주말 출근이 관행처럼 있습니다.",
    "미달이 연속되면 면담 강도가 빠르게 올라갑니다.",
    "고객 요청이 시간 구분 없이 들어오는 편이에요.",
    "마감 직전에 할인 승인 받으러 뛰는 일이 반복됩니다.",
    "숫자가 안 나오면 회의 분위기가 확실히 무거워집니다.",
  ],
};

const HEADLINES = [
  "숫자로 말하면 확실히 인정받는 곳",
  "배울 건 많지만 사람을 많이 탑니다",
  "신규 개척 경험 쌓기에는 좋은 환경",
  "안정적이지만 성장 속도는 완만해요",
  "제도는 잘 갖춰져 있고 운영이 관건",
  "영업으로 커리어 첫 단추 끼우기 괜찮아요",
  "실적 압박은 있지만 보상은 따라옵니다",
  "매니저 복이 절반인 회사",
  "계정만 잘 받으면 해볼 만합니다",
  "제품이 좋아서 영업이 수월한 편",
  "체계는 있는데 속도가 느립니다",
  "성과 중심 문화가 뚜렷해요",
  "이직 전에 팀 분위기는 꼭 확인하세요",
  "오래 다니는 사람이 많은 데는 이유가 있어요",
  "커리어 2~3년차에 밟고 가기 좋은 곳",
  "레퍼런스가 탄탄해서 미팅 잡기가 수월해요",
  "조직은 젊은데 프로세스는 보수적입니다",
  "영업이 존중받는 회사라고 느꼈어요",
  "일은 많지만 배운 게 남습니다",
  "본사 지원이 빠른 편이라 현장이 편해요",
  "중간 관리자 층이 얇아 성장 기회는 열려 있어요",
  "고객사 규모가 커서 스케일은 확실합니다",
  "정착하면 오래 다닐 만한 환경",
  "산업 자체가 사이클을 타니 감안하세요",
  "첫 1년은 버티기, 이후는 다를 겁니다",
  "동료 수준이 높아 자극이 됩니다",
  "보상보다 안정성을 보는 분께 맞아요",
  "빠르게 성장하고 싶다면 나쁘지 않습니다",
  "업무 강도 대비 보상은 무난한 수준",
  "합류 전 담당 계정 구성을 꼭 물어보세요",
];

const MONTHS = [
  "2026.07",
  "2026.06",
  "2026.05",
  "2026.04",
  "2026.03",
  "2026.02",
  "2026.01",
  "2025.12",
  "2025.11",
  "2025.10",
  "2025.09",
  "2025.08",
];

/** 회사당 생성 건수 — 무한 스크롤을 여러 번 굴려야 끝나는 양 */
const PER_COMPANY = 62;

function pick<T>(pool: T[], seed: number): T {
  return pool[seed % pool.length];
}

function expandedReviews(): Review[] {
  const out: Review[] = [];
  PROFILES.forEach((profile, p) => {
    for (let i = 0; i < PER_COMPANY; i += 1) {
      const seed = p * 31 + i * 7;
      const strong = pick(profile.strong, i);
      const weak = pick(profile.weak, i + 1);
      // 평점은 회사 기준선 둘레에 흩는다 — 전부 같은 점수면 평균이 거짓말이 된다
      const drift = [0, 0.5, -0.5, 0.5, -1, 0, 1, -0.5][i % 8];
      const score = Math.min(5, Math.max(2, profile.base + drift));
      out.push({
        id: `r-x-${profile.slug}-${i + 1}`,
        companySlug: profile.slug,
        headline: pick(HEADLINES, seed),
        score: Math.round(score * 2) / 2,
        pros: pick(PROS[strong], i),
        cons: pick(CONS[weak], i + p),
        employment: i % 3 === 2 ? "전직원" : "현직원",
        years: 1 + ((seed * 3) % 9),
        writtenAt: pick(MONTHS, i),
        helpful: 2 + ((seed * 5) % 41),
      });
    }
  });
  return out;
}

/**
 * 손으로 쓴 14건이 앞, 파생분이 뒤 — 첫 화면은 항상 가장 잘 쓴 리뷰가 잡는다.
 *
 * 파생분까지 REVIEWS에 합치는 게 중요하다. companies.ts가 이 배열을 세어
 * 카드의 "리뷰 N건"을 덮어쓰기 때문에(표기 수치 = 실데이터), 파생분을 따로
 * 빼두면 표기 수와 실제 나열 수가 어긋난다.
 */
export const REVIEWS: Review[] = [...CURATED_REVIEWS, ...expandedReviews()];

export function reviewsOf(companySlug: string) {
  return REVIEWS.filter((review) => review.companySlug === companySlug);
}
