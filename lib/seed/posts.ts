/**
 * 글·AI 참고답변 시드 — r4-REFERENCE.html 문구 기준. 전부 합성 데이터.
 *
 * AI 답변은 안전강도(느슨/기본/엄격)에 따라 위험 표현이 달라진다. 초안(draft)에는 원문이
 * 그대로 있고, 재검사 단계에서 강도별 치환값으로 제자리 교정된다 — 이게 r4 AI 재설계의 핵심이다
 * ("위험하게 썼다 순화"가 아니라 "생성 과정을 노출하고 관리자 설정이 결과를 바꾼다").
 */

import { EXTRA_POSTS } from "./posts-extra";

export type SafetyLevel = "loose" | "basic" | "strict";

export const SAFETY_LABEL: Record<SafetyLevel, string> = {
  loose: "느슨",
  basic: "기본",
  strict: "엄격",
};

export const SAFETY_DESC: Record<SafetyLevel, string> = {
  loose: "회사 실명이 그대로 노출돼요",
  basic: "회사 실명 가림, 미확인 수치 제외",
  strict: "회사 유형까지 가림, 미확인 수치 제외",
};

export const SAFETY_STAT: Record<SafetyLevel, string> = {
  loose: "가린 표현 없음, 원문 그대로",
  basic: "실명 2곳 가림, 수치 1곳 제외",
  strict: "실명, 유형 3곳 가림, 수치 1곳 제외",
};

/** 위험 표현 — 원문과 강도별 치환값 */
export type GuardedTerm = {
  raw: string;
  loose: string;
  basic: string;
  strict: string;
};

export type Post = {
  id: string;
  board: string;
  badges: string[];
  title: string;
  author: string;
  authorYears: number;
  postedAt: string;
  views: number;
  body: string;
  /** AI 초안 — {0},{1} 자리에 GuardedTerm이 들어간다 */
  aiDraft: string;
  guarded: GuardedTerm[];
  comments: Array<{ author: string; years: number; text: string }>;
};

export const POSTS: Post[] = [
  {
    id: "p-4821",
    board: "질문답변",
    badges: ["HOT", "질문답변"],
    title: "신규 거래처 뚫는 노하우 있나요?",
    author: "익명의 영업인",
    authorYears: 3,
    postedAt: "2시간 전",
    views: 1284,
    body: "이번에 신규 거래처 개척 업무를 맡게 됐습니다. 기존 계정 관리만 하다가 처음이라 어디서부터 시작해야 할지 막막하네요.\n\n선배님들은 처음 거래처를 뚫을 때 어떤 경로로 접근하셨나요? 전시회나 콜드콜 중에 뭐가 더 효과적인지도 궁금합니다.",
    aiDraft:
      "신규 영업이라면 전시회, 박람회에서 담당자 명함을 먼저 확보하는 방법이 자주 추천돼요. 실제 리뷰에서도 {0}처럼 큰 거래처는 담당자 대면 후 진행이 빠르다는 의견이 많았습니다. 인센티브는 {1}에서 확인하시고, 코칭, 성과압박 분위기는 항목별 평점을 참고하세요.",
    guarded: [
      {
        raw: "◇◇테크",
        loose: "◇◇테크",
        basic: "국내 대기업 A",
        strict: "한 기업",
      },
      {
        raw: "평균 32% 상승",
        loose: "평균 32% 상승",
        basic: "공개된 리뷰 범위",
        strict: "공개된 리뷰 범위",
      },
    ],
    comments: [
      {
        author: "필드리더",
        years: 7,
        text: "전시회가 확실히 빠릅니다. 명함 받고 다음날 바로 연락드리는 게 핵심이에요. 일주일 지나면 기억 못 하십니다.",
      },
      {
        author: "김영업",
        years: 4,
        text: "콜드콜은 리스트 품질이 8할입니다. 업종, 규모로 좁히고 결정권자 이름까지 파악한 다음에 거세요.",
      },
    ],
  },
  {
    id: "p-4820",
    board: "노하우",
    badges: ["노하우"],
    title: "인센티브 구조, 5개 회사 비교해봤습니다",
    author: "박세일",
    authorYears: 6,
    postedAt: "오늘 11:05",
    views: 341,
    body: "이직 준비하면서 면접 본 5개 회사의 인센티브 구조를 정리해봤습니다. 회사명은 밝히지 않을게요.\n\n크게 두 갈래였어요. 하나는 목표 달성률에 비례해서 선형으로 주는 방식, 다른 하나는 구간을 끊어서 100%를 넘기는 순간 배율이 크게 붙는 방식입니다.\n\n체감상 후자가 상단은 화려한데, 목표 자체가 매년 올라가서 2년차부터는 오히려 손해였습니다. 계약서에 목표 산정 방식이 적혀 있는지를 꼭 확인하세요.",
    aiDraft:
      "인센티브는 구조보다 **목표 산정 방식**이 실수령을 좌우한다는 의견이 많아요. {0}처럼 구간 배율이 큰 회사는 첫해 체감이 좋지만, 목표가 매년 오르면 2년차부터 달라질 수 있습니다. 리뷰에서는 {1} 정도로 언급돼요.",
    guarded: [
      {
        raw: "▓▓상사",
        loose: "▓▓상사",
        basic: "국내 중견기업 B",
        strict: "한 기업",
      },
      {
        raw: "실수령 기준 18% 차이",
        loose: "실수령 기준 18% 차이",
        basic: "공개된 리뷰 범위",
        strict: "공개된 리뷰 범위",
      },
    ],
    comments: [
      {
        author: "김영업",
        years: 4,
        text: "목표 산정 방식 확인하라는 말 진짜 공감합니다. 저는 그거 안 보고 갔다가 2년차에 실수령이 줄었어요.",
      },
      {
        author: "한부장",
        years: 11,
        text: "구간형은 팀 전체가 목표를 넘겨야 배율이 붙는 곳도 있습니다. 개인 달성만 보고 판단하면 안 돼요.",
      },
    ],
  },
  {
    id: "p-4819",
    board: "실적인증",
    badges: ["인증", "실적인증"],
    title: "상반기 실적 인증합니다",
    author: "최과장",
    authorYears: 8,
    postedAt: "07.24",
    views: 512,
    body: "상반기 목표 대비 214% 마감했습니다. 증빙은 운영자 검토를 거쳐 인증 배지를 받았어요.\n\n특별한 비결은 없고, 작년에 놓쳤던 계정 12곳을 분기마다 한 번씩 다시 돌았습니다. 세 곳이 올해 열렸어요. 거절당한 곳을 명단에서 지우지 않는 게 제일 크게 작용한 것 같습니다.",
    aiDraft:
      "재방문 주기를 정해두는 방식이 자주 언급돼요. 실제 리뷰에서도 {0}처럼 계정 배분이 연차 위주인 곳은 신규 개척으로 실적을 만드는 사례가 많았습니다. 다만 {1}은 회사마다 편차가 커요.",
    guarded: [
      {
        raw: "□□커머스",
        loose: "□□커머스",
        basic: "국내 유통기업 C",
        strict: "한 기업",
      },
      {
        raw: "달성률 200% 이상",
        loose: "달성률 200% 이상",
        basic: "공개된 리뷰 범위",
        strict: "공개된 리뷰 범위",
      },
    ],
    comments: [
      {
        author: "정주임",
        years: 2,
        text: "거절당한 곳을 안 지운다는 게 인상적이네요. 저는 바로 지워버렸는데 다시 만들어야겠습니다.",
      },
    ],
  },
  {
    id: "p-4818",
    board: "자유",
    badges: ["자유"],
    title: "매니저 코칭 없는 회사 겪어보신 분?",
    author: "이대리",
    authorYears: 2,
    postedAt: "07.24",
    views: 96,
    body: "입사한 지 반년인데 온보딩이라고 할 게 없었습니다. 제품 자료 링크 하나 받고 바로 지역을 배정받았어요.\n\n매니저는 숫자만 확인하고, 어떻게 하면 되는지는 알려주지 않습니다. 원래 영업직은 이런 건가요? 아니면 회사를 잘못 고른 건가요?",
    aiDraft:
      "코칭 유무는 회사별 편차가 큰 항목이에요. 회사 리뷰의 **코칭, 성장** 축 평점을 비교해보시면 도움이 됩니다. {0}처럼 평점이 낮은 곳은 리뷰에서도 비슷한 이야기가 반복돼요. 이직을 고려한다면 {1}을 확인해보세요.",
    guarded: [
      {
        raw: "△△전자",
        loose: "△△전자",
        basic: "국내 제조기업 D",
        strict: "한 기업",
      },
      {
        raw: "코칭 평점 2.4점",
        loose: "코칭 평점 2.4점",
        basic: "공개된 리뷰 범위",
        strict: "공개된 리뷰 범위",
      },
    ],
    comments: [
      {
        author: "필드리더",
        years: 7,
        text: "회사 문제 맞습니다. 반년이면 최소한 동행 방문은 붙여줘야 해요. 옮기시는 걸 권합니다.",
      },
    ],
  },
  {
    id: "p-4817",
    board: "질문답변",
    badges: ["질문답변"],
    title: "계정 배분 기준, 다들 어떻게 협의하세요?",
    author: "정주임",
    authorYears: 2,
    postedAt: "07.23",
    views: 204,
    body: '팀 내 계정 배분이 연차순이라 신입은 사실상 신규 개척만 하게 됩니다.\n\n매니저에게 이야기해봤지만 "원래 그렇게 해왔다"는 답만 돌아왔어요. 이런 건 어떤 근거를 들고 가야 협의가 될까요?',
    aiDraft:
      "배분 기준을 바꾸자고 하기보다 **기준을 문서로 만들자**고 제안하는 쪽이 받아들여지는 경우가 많아요. {0}처럼 계정 배분 평점이 낮은 회사의 리뷰에서도 같은 이야기가 반복됩니다. 수치는 {1}만 공개돼 있어요.",
    guarded: [
      {
        raw: "□□커머스",
        loose: "□□커머스",
        basic: "국내 유통기업 C",
        strict: "한 기업",
      },
      {
        raw: "신입 평균 계정 3개",
        loose: "신입 평균 계정 3개",
        basic: "공개된 리뷰 범위",
        strict: "공개된 리뷰 범위",
      },
    ],
    comments: [],
  },
  {
    id: "p-4816",
    board: "노하우",
    badges: ["노하우"],
    title: "콜드콜 리스트 만드는 법, 3년치 정리",
    author: "한부장",
    authorYears: 11,
    postedAt: "07.23",
    views: 488,
    body: "3년 동안 쓴 방식을 정리합니다. 리스트 품질이 8할이라는 말은 사실입니다.\n\n1) 업종과 규모로 먼저 자릅니다. 전화 받을 이유가 없는 곳은 아예 넣지 않습니다.\n2) 결정권자 이름과 직책을 채웁니다. 이게 안 채워지면 그 줄은 버립니다.\n3) 최근 채용 공고를 봅니다. 영업, CS를 뽑고 있으면 확장 중이라는 신호예요.\n\n이 세 가지만 지켜도 연결률이 두 배는 달라집니다.",
    aiDraft:
      "리스트 선별 기준을 문서로 두는 방식이 자주 추천돼요. 채용 공고를 신호로 쓰는 접근도 리뷰에서 자주 보입니다. {0} 같은 회사는 확장기에 신규 계정이 크게 늘었다는 언급이 있어요. 수치는 {1} 수준으로만 공개돼 있습니다.",
    guarded: [
      {
        raw: "◇◇테크",
        loose: "◇◇테크",
        basic: "국내 대기업 A",
        strict: "한 기업",
      },
      {
        raw: "연결률 2배",
        loose: "연결률 2배",
        basic: "공개된 리뷰 범위",
        strict: "공개된 리뷰 범위",
      },
    ],
    comments: [
      {
        author: "김영업",
        years: 4,
        text: "채용 공고 보는 거 바로 써먹겠습니다. 생각도 못 했네요.",
      },
      {
        author: "이대리",
        years: 2,
        text: "결정권자 못 채우면 버린다는 기준이 명확해서 좋습니다. 저는 그냥 대표번호로 걸고 있었어요.",
      },
    ],
  },
];

/** 손으로 다듬은 6건 + 목록용 34건. 목록에 있는 줄은 전부 열려야 한다. */
export const ALL_POSTS: Post[] = [...POSTS, ...EXTRA_POSTS];

export function getPost(id: string) {
  return ALL_POSTS.find((post) => post.id === id);
}
