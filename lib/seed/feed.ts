/**
 * 커뮤니티 피드·사이드 위젯 시드 — r4-REFERENCE.html 기준. 전부 합성 데이터.
 * 글 상세가 있는 항목만 postId를 갖는다(나머지는 목록 표시용).
 *
 * postId는 posts.ts / posts-extra.ts의 id가 정본이다 — 예전에 "p-f-7"처럼
 * 하이픈이 하나 더 붙어 34건이 전부 404로 갔다. 여기서 다시 지어내지 않는다.
 */

import { ALL_POSTS } from "./posts";
import { COMPANIES } from "./companies";

export type FeedItem = {
  id: string;
  postId?: string;
  badges: string[];
  title: string;
  author: string;
  at: string;
  /**
   * 작성 후 경과 분 — "18분 전"이면 18, "7일 전"이면 10080.
   * at은 표시용 문구일 뿐이라 정렬에 못 쓴다. 최신순 정렬은 이 값을 쓴다.
   * 같은 날짜 문구끼리는 몇 분씩 어긋나게 둬서 순서가 결정적이게 한다.
   */
  ageMinutes: number;
  likes: number;
  comments: number;
  views: number;
  board: BoardKey;
  /** 홈 인기글 카드는 excerpt만 렌더한다 — 비어 있으면 카드가 빈 채로 나간다 */
  excerpt?: string;
  /** 생성 이미지가 있는 글만 실제 썸네일 경로를 갖는다. */
  image?: string;
};

export type BoardKey = "qna" | "knowhow" | "proof" | "free";

export const BOARDS: Array<{ key: BoardKey; label: string; count: number }> = [
  { key: "qna", label: "질문답변", count: 128 },
  { key: "knowhow", label: "노하우", count: 57 },
  { key: "proof", label: "실적인증", count: 31 },
  { key: "free", label: "자유", count: 204 },
];

export const FEED: FeedItem[] = [
  {
    // 상세(p-4821)가 정본 — 목록과 상세의 제목·수치가 다르면 눌러본 순간 들킨다
    id: "f-1",
    postId: "p-4821",
    badges: ["HOT", "질문답변"],
    title: "신규 거래처 뚫는 노하우 있나요?",
    author: "익명의 영업인",
    at: "2시간 전",
    ageMinutes: 120,
    likes: 24,
    comments: 2,
    views: 1284,
    board: "qna",
    excerpt:
      "기존 계정 관리만 하다가 신규 개척을 처음 맡았습니다. 전시회랑 콜드콜 중엔 뭐가 더 효과적일까요?",
    image: "/images/community/sales-meeting.png",
  },
  {
    id: "f-2",
    postId: "p-4820",
    badges: ["노하우"],
    title: "인센티브 구조, 5개 회사 비교해봤습니다",
    author: "박세일",
    at: "3시간 전",
    ageMinutes: 180,
    likes: 57,
    comments: 12,
    views: 341,
    board: "knowhow",
    excerpt:
      "면접 본 5개 회사의 인센티브 구조를 정리했습니다. 선형 지급과 구간 배율 — 실수령은 목표 산정 방식이 갈랐어요.",
    image: "/images/community/pipeline-review.png",
  },
  {
    id: "f-3",
    postId: "p-4819",
    badges: ["인증", "실적인증"],
    title: "상반기 실적 인증합니다",
    author: "최과장",
    at: "5일 전",
    ageMinutes: 7200,
    likes: 88,
    comments: 21,
    views: 512,
    board: "proof",
    excerpt:
      "상반기 목표 대비 214% 마감했습니다. 작년에 놓친 계정 12곳을 분기마다 다시 돈 게 제일 컸어요.",
    image: "/images/community/deal-handshake.png",
  },
  {
    id: "f-4",
    postId: "p-4818",
    badges: ["자유"],
    title: "매니저 코칭 없는 회사 겪어보신 분?",
    author: "이대리",
    at: "5일 전",
    ageMinutes: 7320,
    likes: 12,
    comments: 5,
    views: 96,
    board: "free",
    excerpt:
      "입사 반년인데 온보딩도 코칭도 없었습니다. 매니저는 숫자만 봐요. 원래 영업직은 이런 건가요?",
    image: "/images/community/client-presentation.png",
  },
  {
    id: "f-5",
    postId: "p-4817",
    badges: ["질문답변"],
    title: "계정 배분 기준, 다들 어떻게 협의하세요?",
    author: "정주임",
    at: "6일 전",
    ageMinutes: 8640,
    likes: 19,
    comments: 0,
    views: 204,
    board: "qna",
    excerpt:
      "팀 내 계정 배분이 연차순이라 신입은 신규 개척만 합니다. 어떤 근거를 들고 가야 협의가 될까요?",
  },
  {
    id: "f-6",
    postId: "p-4816",
    badges: ["노하우"],
    title: "콜드콜 리스트 만드는 법 — 3년치 정리",
    author: "한부장",
    at: "6일 전",
    ageMinutes: 8700,
    likes: 76,
    comments: 15,
    views: 488,
    board: "knowhow",
    excerpt:
      "3년 동안 쓴 리스트 만드는 방식을 정리합니다. 업종·규모로 자르고, 결정권자를 못 채우면 그 줄은 버립니다.",
  },
  {
    id: "f-7",
    postId: "p-f7",
    badges: ["질문답변"],
    title: "첫 미팅 후 팔로업 메일은 언제 보내는 게 좋을까요?",
    author: "윤세일",
    at: "6일 전",
    ageMinutes: 8760,
    likes: 31,
    comments: 14,
    views: 276,
    board: "qna",
    excerpt:
      "미팅 당일에 보내야 할지 다음 날 오전이 좋을지 매번 타이밍을 재게 됩니다. 내용은 어디까지 담으시나요?",
  },
  {
    id: "f-8",
    postId: "p-f8",
    badges: ["노하우"],
    title: "거절 고객을 3개월 뒤 다시 전환한 팔로업 순서",
    author: "서팀장",
    at: "7일 전",
    ageMinutes: 10080,
    likes: 103,
    comments: 28,
    views: 821,
    board: "knowhow",
    excerpt:
      "예산 문제로 접었던 고객사를 이번 분기에 다시 열었습니다. 거절 직후엔 팔지 않고 사유만 기록한 게 시작이었어요.",
    image: "/images/community/sales-meeting.png",
  },
  {
    id: "f-9",
    postId: "p-f9",
    badges: ["인증", "실적인증"],
    title: "분기 목표 132% 달성, 파이프라인 공개합니다",
    author: "오현장",
    at: "7일 전",
    ageMinutes: 10140,
    likes: 94,
    comments: 32,
    views: 695,
    board: "proof",
    excerpt:
      "큰 딜 하나가 아니라 중간 규모가 고르게 붙어 나온 132%입니다. 커버리지를 목표의 3.5배로 잡고 시작했어요.",
  },
  {
    id: "f-10",
    postId: "p-f10",
    badges: ["자유"],
    title: "외근 많은 날 다들 점심 어떻게 해결하세요?",
    author: "임대리",
    at: "7일 전",
    ageMinutes: 10200,
    likes: 17,
    comments: 26,
    views: 188,
    board: "free",
    excerpt:
      "미팅 사이에 점심 시간이 애매하게 뜹니다. 차에서 김밥 먹은 지 3주째인데 다들 어떻게 하세요?",
  },
  {
    id: "f-11",
    postId: "p-f11",
    badges: ["질문답변"],
    title: "SaaS 영업 이직 시 포트폴리오에 뭘 넣어야 할까요?",
    author: "배주임",
    at: "8일 전",
    ageMinutes: 11520,
    likes: 42,
    comments: 19,
    views: 354,
    board: "qna",
    excerpt:
      "제조에서 SaaS로 옮기려는데 고객사명·계약 금액은 어디까지 쓸 수 있나요? SaaS가 특히 보는 지표도 궁금합니다.",
  },
  {
    id: "f-12",
    postId: "p-f12",
    badges: ["노하우"],
    title: "담당자가 의사결정권자 연결을 계속 피하는데요",
    author: "파이프라인텅장",
    at: "2시간 전",
    ageMinutes: 135,
    excerpt:
      "실무 담당자 반응은 좋은데 윗분 연결 얘기만 나오면 자꾸 다음에 보자고 하네요. 너무 밀어붙이면 딜 깨질까 봐 애매합니다.",
    likes: 121,
    comments: 37,
    views: 936,
    board: "knowhow",
    image: "/images/community/sales-meeting.png",
  },
  {
    id: "f-13",
    postId: "p-f13",
    badges: ["인증", "실적인증"],
    title: "신규 로고 8개 수주한 6월 실적 인증",
    author: "강AE",
    at: "8일 전",
    ageMinutes: 11580,
    likes: 73,
    comments: 18,
    views: 542,
    board: "proof",
    excerpt:
      "5월에 리스트를 갈아엎고 직원 수 50~200 구간으로 좁혔더니 응답률이 두 배가 됐습니다. 전부 신규 로고예요.",
    image: "/images/community/deal-handshake.png",
  },
  {
    id: "f-14",
    postId: "p-f14",
    badges: ["자유"],
    title: "월요일 아침 파이프라인 회의, 우리 회사만 긴가요",
    author: "조영업",
    at: "9일 전",
    ageMinutes: 12960,
    likes: 38,
    comments: 44,
    views: 417,
    board: "free",
    excerpt:
      "매주 월요일 9시부터 두 시간, 전원이 딜을 하나씩 다 읽습니다. 다른 회사도 이렇게 하시나요?",
  },
  {
    id: "f-15",
    postId: "p-f15",
    badges: ["질문답변"],
    title: "경쟁사 가격을 먼저 물어보는 고객 대응법 궁금합니다",
    author: "신입AE",
    at: "9일 전",
    ageMinutes: 13020,
    likes: 29,
    comments: 23,
    views: 301,
    board: "qna",
    excerpt:
      "모른다고 하면 준비가 없어 보이고, 안다고 하면 가격 싸움으로 끌려가는 것 같아서 매번 얼버무리게 됩니다.",
  },
  {
    id: "f-16",
    postId: "p-f16",
    badges: ["노하우"],
    title: "데모 미팅 전날 보내는 아젠다 템플릿 공유",
    author: "류매니저",
    at: "9일 전",
    ageMinutes: 13080,
    likes: 86,
    comments: 11,
    views: 609,
    board: "knowhow",
    excerpt:
      "데모 노쇼를 줄이려고 전날 아젠다를 보냅니다. 소요 시간, 다룰 항목 세 개, 항목별 필요한 참석자까지요.",
  },
  {
    id: "f-17",
    postId: "p-f17",
    badges: ["인증", "실적인증"],
    title: "입사 3개월인데 첫 엔터프라이즈 계약했어요 ㅠㅠ",
    author: "신입AE살려",
    at: "1시간 전",
    ageMinutes: 60,
    excerpt:
      "처음엔 제가 맡아도 되나 싶었는데 선배님들한테 제안서 계속 피드백 받고 오늘 도장 찍었습니다. 아직도 얼떨떨하네요.",
    likes: 146,
    comments: 52,
    views: 1104,
    board: "proof",
  },
  {
    id: "f-18",
    postId: "p-f18",
    badges: ["자유"],
    title: "영업하면서 진짜 도움 됐던 책 있으신가요",
    author: "책상앞영업",
    at: "4시간 전",
    ageMinutes: 240,
    excerpt:
      "말 잘하는 법 말고 실제 미팅이나 협상할 때 써먹을 만한 내용이면 좋겠습니다. 다들 한 권씩만 추천 부탁드려요.",
    likes: 65,
    comments: 61,
    views: 583,
    board: "free",
  },
  {
    id: "f-19",
    postId: "p-f19",
    badges: ["질문답변"],
    title: "기존 고객 업셀 제안은 어떤 신호가 왔을 때 시작하나요?",
    author: "차대리",
    at: "11일 전",
    ageMinutes: 15840,
    likes: 37,
    comments: 16,
    views: 268,
    board: "qna",
    excerpt:
      "갱신 시점에 맞춰 꺼내야 할지, 사용량이 늘었을 때 바로 꺼내야 할지 헷갈립니다. 너무 일찍이면 팔려고만 하는 인상일까요?",
  },
  {
    id: "f-20",
    postId: "p-f20",
    badges: ["노하우"],
    title: "주간 파이프라인 리뷰를 20분 안에 끝내는 방법",
    author: "남리더",
    at: "11일 전",
    ageMinutes: 15900,
    likes: 97,
    comments: 24,
    views: 714,
    board: "knowhow",
    excerpt:
      "회의를 두 시간에서 20분으로 줄였더니 오히려 예측이 정확해졌습니다. 규칙은 두 개뿐이에요.",
  },
  {
    id: "f-21",
    postId: "p-f21",
    badges: ["인증", "실적인증"],
    title: "상반기 재계약률 94%, 고객 관리 루틴도 남겨요",
    author: "송CSM",
    at: "11일 전",
    ageMinutes: 15960,
    likes: 112,
    comments: 35,
    views: 867,
    board: "proof",
    excerpt:
      "갱신 대상 34곳 중 32곳 재계약했습니다. 계약 후 2주·3개월·갱신 3개월 전, 세 번은 무조건 만납니다.",
  },
  {
    id: "f-22",
    postId: "p-f22",
    badges: ["자유"],
    title: "이번 달 인센티브 들어오면 가장 먼저 할 일",
    author: "고영업",
    at: "12일 전",
    ageMinutes: 17280,
    likes: 22,
    comments: 39,
    views: 326,
    board: "free",
    excerpt:
      "작년엔 인센티브가 들어온 지 2주 만에 사라졌습니다. 올해는 절반은 그냥 두고 시작하려고요.",
  },
  {
    id: "f-23",
    postId: "p-f23",
    badges: ["질문답변"],
    title: "채용공고 OTE 이거 믿어도 되는 숫자인가요?",
    author: "이직각보는중",
    at: "8시간 전",
    ageMinutes: 480,
    excerpt:
      "기본급은 괜찮은데 OTE가 너무 높게 적혀 있어서요. 면접에서 달성률 물어보면 솔직하게 알려주는지도 궁금합니다.",
    likes: 54,
    comments: 31,
    views: 498,
    board: "qna",
    image: "/images/community/client-presentation.png",
  },
  {
    id: "f-24",
    postId: "p-f24",
    badges: ["노하우"],
    title: "미팅 노트를 CRM에 남길 때 꼭 쓰는 네 가지 항목",
    author: "진과장",
    at: "12일 전",
    ageMinutes: 17340,
    likes: 68,
    comments: 9,
    views: 455,
    board: "knowhow",
    excerpt:
      "노트는 네 줄만 남깁니다. 새로 안 사실, 상대의 걱정, 다음 액션, 그리고 내가 답 못 한 질문이요.",
  },
  {
    id: "f-25",
    postId: "p-f25",
    badges: ["인증", "실적인증"],
    title: "휴면 고객 재활성화로 월 목표 초과 달성했습니다",
    author: "탁AE",
    at: "13일 전",
    ageMinutes: 18720,
    likes: 79,
    comments: 22,
    views: 571,
    board: "proof",
    excerpt:
      "휴면 리스트 41곳 중 담당자가 바뀐 곳만 골라 연락했습니다. 9곳 미팅, 3곳 계약으로 이어졌어요.",
  },
  {
    id: "f-26",
    postId: "p-f26",
    badges: ["자유"],
    title: "회사에서 지원해줬으면 하는 영업 도구 하나만 꼽는다면?",
    author: "안세일",
    at: "13일 전",
    ageMinutes: 18780,
    likes: 34,
    comments: 47,
    views: 392,
    board: "free",
    excerpt:
      "CRM은 있는데 정작 필요한 건 통화 녹음이랑 자동 요약입니다. 미팅 노트 쓰는 데 하루 40분씩 써요.",
  },
  {
    id: "f-27",
    postId: "p-f27",
    badges: ["질문답변"],
    title: "전화 연결률이 갑자기 떨어졌는데 리스트 문제일까요?",
    author: "마인턴",
    at: "14일 전",
    ageMinutes: 20160,
    likes: 18,
    comments: 12,
    views: 213,
    board: "qna",
    excerpt:
      "지난달엔 20통에 3~4명은 연결됐는데 이번 달은 한 명 될까 말까입니다. 스크립트는 그대로예요.",
  },
  {
    id: "f-28",
    postId: "p-f28",
    badges: ["노하우"],
    title: "월말 딜을 무리하게 당기지 않고 마감하는 체크리스트",
    author: "백부장",
    at: "14일 전",
    ageMinutes: 20220,
    likes: 91,
    comments: 20,
    views: 648,
    board: "knowhow",
    excerpt:
      "월말에 할인으로 당긴 딜은 다음 달에 구멍을 냅니다. 당기기 전에 확인하는 세 가지를 정리했어요.",
  },
  {
    id: "f-29",
    postId: "p-f29",
    badges: ["인증", "실적인증"],
    title: "공공기관 영업 9개월 끌다가 드디어 계약했네요",
    author: "공공영업9년차",
    at: "42분 전",
    ageMinutes: 42,
    excerpt:
      "나라장터 등록부터 보안 검토, 예산 이월까지 안 걸린 데가 없었습니다. 중간에 세 번은 엎어진 줄 알았는데 오늘 최종 연락 받았네요.",
    likes: 164,
    comments: 46,
    views: 1287,
    board: "proof",
    image: "/images/community/client-presentation.png",
  },
  {
    id: "f-30",
    postId: "p-f30",
    badges: ["자유"],
    title: "영업 직군끼리만 공감하는 순간들",
    author: "영업인A",
    at: "15일 전",
    ageMinutes: 21600,
    likes: 71,
    comments: 55,
    views: 681,
    board: "free",
    excerpt:
      "'검토해 보겠습니다'를 듣는 순간 이미 결과를 아는 것. 하나씩 보태 주세요, 오늘 좀 웃고 싶습니다.",
    image: "/images/community/pipeline-review.png",
  },
  {
    id: "f-31",
    postId: "p-f31",
    badges: ["질문답변"],
    title: "고객이 예산 없다고 하면 그냥 접으세요?",
    author: "이번달도마이너스",
    at: "10시간 전",
    ageMinutes: 600,
    excerpt:
      "진짜 예산이 없는 건지 우선순위가 낮은 건지 구분이 안 됩니다. 계속 팔로업하자니 서로 시간만 쓰는 느낌이고요.",
    likes: 27,
    comments: 34,
    views: 337,
    board: "qna",
  },
  {
    id: "f-32",
    postId: "p-f32",
    badges: ["노하우"],
    title: "고객사 조직도 다들 어떻게 파악하세요?",
    author: "B2B초보",
    at: "6시간 전",
    ageMinutes: 360,
    excerpt:
      "담당자 말만 듣고 갔다가 결재 라인이 완전히 달라서 딜이 늦어진 적이 있습니다. 자연스럽게 물어보는 방법이 있을까요?",
    likes: 118,
    comments: 29,
    views: 902,
    board: "knowhow",
  },
  {
    id: "f-33",
    postId: "p-f33",
    badges: ["인증", "실적인증"],
    title: "첫 해 연간 쿼터 108%로 마무리했습니다",
    author: "나AE",
    at: "16일 전",
    ageMinutes: 23040,
    likes: 137,
    comments: 40,
    views: 995,
    board: "proof",
    excerpt:
      "상반기 62%에서 하반기에 몰아쳐 108%로 마감했습니다. 2주 안에 다음 단계가 안 잡히면 우선순위를 내렸어요.",
  },
  {
    id: "f-34",
    postId: "p-f34",
    badges: ["자유"],
    title: "재택 영업과 출근 영업, 집중도 차이 있으세요?",
    author: "표대리",
    at: "16일 전",
    ageMinutes: 23100,
    likes: 26,
    comments: 33,
    views: 319,
    board: "free",
    excerpt:
      "주 2회 재택으로 바뀌었는데 재택인 날 콜 수가 확실히 줄어듭니다. 다들 어떠세요?",
  },
  {
    id: "f-35",
    postId: "p-f35",
    badges: ["질문답변"],
    title: "최종 견적서에 유효기간을 며칠로 두시나요?",
    author: "유매니저",
    at: "17일 전",
    ageMinutes: 24480,
    likes: 21,
    comments: 17,
    views: 249,
    board: "qna",
    excerpt:
      "짧으면 압박 같고 길면 늘어집니다. 업종마다 다르겠지만 보통 며칠로 잡으시나요?",
  },
  {
    id: "f-36",
    postId: "p-f36",
    badges: ["노하우"],
    title: "소개 영업 요청이 부담스럽지 않게 들리는 문장",
    author: "전이사",
    at: "17일 전",
    ageMinutes: 24540,
    likes: 109,
    comments: 26,
    views: 778,
    board: "knowhow",
    excerpt:
      "'소개해 주실 분 없으실까요'는 상대를 곤란하게 만듭니다. 사람 대신 자료를 전달해 달라고 바꿨어요.",
  },
  {
    id: "f-37",
    postId: "p-f37",
    badges: ["인증", "실적인증"],
    title: "파트너 채널 매출 첫 1억 달성 인증",
    author: "방채널",
    at: "17일 전",
    ageMinutes: 24600,
    likes: 126,
    comments: 38,
    views: 924,
    board: "proof",
    excerpt:
      "직판만 하던 조직에서 채널을 열어 반년 만에 1억을 넘겼습니다. 초반 3개월은 마진 대신 동행이었어요.",
  },
  {
    id: "f-38",
    postId: "p-f38",
    badges: ["자유"],
    title: "고객 미팅 전 긴장 풀기 위한 나만의 루틴",
    author: "홍영업",
    at: "18일 전",
    ageMinutes: 25920,
    likes: 44,
    comments: 42,
    views: 475,
    board: "free",
    excerpt:
      "6년 차인데도 큰 미팅 전엔 손이 떨립니다. 차에서 질문 세 개를 소리 내서 읽고 들어가요.",
  },
  {
    id: "f-39",
    postId: "p-f39",
    badges: ["인증", "실적인증"],
    title: "작년 대비 평균 계약 단가 38% 높였습니다",
    author: "심과장",
    at: "18일 전",
    ageMinutes: 25980,
    likes: 98,
    comments: 27,
    views: 733,
    board: "proof",
    excerpt:
      "건수는 줄었는데 매출은 늘었습니다. 첫 미팅에서 예산 범위를 먼저 확인한 게 전부예요.",
  },
  {
    id: "f-40",
    postId: "p-f40",
    badges: ["자유"],
    title: "퇴근 5분 전에 고객 전화 오면 받으세요?",
    author: "오늘도외근",
    at: "3시간 전",
    ageMinutes: 190,
    excerpt:
      "진짜 노트북 덮고 나가려는 순간에 전화가 왔는데 결국 40분 통화했습니다. 급한 건 아니었다는데 다들 어디까지 받으시나요?",
    likes: 53,
    comments: 68,
    views: 744,
    board: "free",
  },

  /**
   * 답변 없는 질문 4건 (f-q1~f-q4 → p-q1~p-q4) — 운영자 질문 큐의 시드.
   * comments 0이 데이터다: 대시보드 "답변 없는 질문" 건수가 여기서 실측된다.
   * 전부 최근 시각으로 둔다 — 커뮤니티 목록 최신순에서 위에 서야 "아직 아무도
   * 답하지 않은 질문"이라는 상황이 눈에 보인다.
   */
  {
    id: "f-q1",
    postId: "p-q1",
    badges: ["질문답변"],
    title: "견적 보낸 뒤 답이 없는 고객, 몇 번까지 연락해보세요?",
    author: "조용한수신함",
    at: "25분 전",
    ageMinutes: 25,
    likes: 2,
    comments: 0,
    views: 47,
    board: "qna",
    excerpt:
      "견적까지 요청했던 고객이 일주일째 무응답입니다. 매달리는 것처럼 보일까 봐 멈췄는데, 몇 번까지 해보시나요?",
  },
  {
    id: "f-q2",
    postId: "p-q2",
    badges: ["질문답변"],
    title: "수금이 자꾸 밀리는 거래처, 영업이 어디까지 챙겨야 하나요?",
    author: "수금도영업",
    at: "1시간 전",
    ageMinutes: 68,
    likes: 4,
    comments: 0,
    views: 63,
    board: "qna",
    excerpt:
      "대금이 두 달째 밀리는데 회계팀은 영업이 독촉하라고 합니다. 관계 안 상하게 독촉하는 방법이 있을까요?",
  },
  {
    id: "f-q3",
    postId: "p-q3",
    badges: ["질문답변"],
    title: "제안 발표에 결정권자가 안 들어온다는데 일정 미루는 게 낫나요?",
    author: "발표전날",
    at: "3시간 전",
    ageMinutes: 175,
    likes: 6,
    comments: 0,
    views: 88,
    board: "qna",
    excerpt:
      "최종 발표에 임원은 다 빠지고 실무진만 듣는다고 합니다. 일정을 미루자고 하면 실례일까요?",
  },
  {
    id: "f-q4",
    postId: "p-q4",
    badges: ["질문답변"],
    title: "전임자가 관리하던 큰 거래처를 인수인계 없이 넘겨받았습니다",
    author: "중고신입",
    at: "5시간 전",
    ageMinutes: 320,
    likes: 9,
    comments: 0,
    views: 112,
    board: "qna",
    excerpt:
      "제일 큰 거래처를 인수인계 없이 넘겨받았습니다. 기록이 없는데 모른다고 솔직하게 말해도 될까요?",
  },
];

export const HOT_KEYWORDS = [
  { rank: 1, word: "인센티브", delta: "up" as const, value: "2" },
  { rank: 2, word: "계정 배분", delta: "up" as const, value: "5" },
  { rank: 3, word: "△△전자", delta: "same" as const, value: "—" },
  { rank: 4, word: "콜드콜", delta: "down" as const, value: "1" },
  { rank: 5, word: "이직", delta: "new" as const, value: "NEW" },
];

export const LATEST_REVIEWS = [
  {
    quote: "인센티브 산정이 투명해서 납득돼요",
    score: 5.0,
    company: "◇◇테크",
    who: "영업 현직",
    topic: "인센티브",
  },
  {
    quote: "목표는 높지만 코칭이 붙어서 버틸 만해요",
    score: 4.0,
    company: "▓▓상사",
    who: "영업 전직",
    topic: "목표 · 코칭",
  },
  {
    quote: "계정 배분이 연차 위주라 신입은 힘들어요",
    score: 3.0,
    company: "□□커머스",
    who: "영업 현직",
    topic: "계정 배분",
  },
  {
    quote: "신입도 큰 계정을 맡을 기회가 비교적 빨리 와요",
    score: 4.2,
    company: "△△전자",
    who: "영업 현직",
    topic: "성장 기회",
  },
  {
    quote: "제품 교육이 촘촘해서 전문성을 쌓기 좋았습니다",
    score: 4.4,
    company: "▽▽바이오",
    who: "영업 전직",
    topic: "교육 · 성장",
  },
  {
    quote: "성과 압박은 있지만 보상 기준만큼은 명확해요",
    score: 3.8,
    company: "○○물산",
    who: "영업 현직",
    topic: "성과 · 보상",
  },
];

/** 커뮤니티 사이드 "인기글 · 이번 주" — 시안 정본 02번 값 */
/**
 * 사이드 인기글 — 시안 문구를 유지하되 열리는 글로 이어준다.
 * 열리지 않는 제목만 늘어놓으면 목록이 장식이 된다.
 */
/**
 * 주간 인기 — 제목은 사이드에서 보이고, 누르면 postId로 간다.
 * 두 값이 다른 글을 가리키고 있어서 "면접 취소 문자"를 눌렀는데 콜드콜 글이
 * 열렸다. 피드에 실재하는 글에서 조회수 상위를 골라 제목과 목적지를 맞춘다.
 */
/* 표기 수치 동기화 — 목록의 댓글·조회수는 글 상세의 실데이터가 정본이다.
   따로 적으면 "댓글 52"를 눌렀는데 2개가 달려 있는 화면이 나온다. */
const postById = new Map(ALL_POSTS.map((post) => [post.id, post]));
for (const item of FEED) {
  const post = item.postId ? postById.get(item.postId) : undefined;
  if (!post) continue;
  item.comments = post.comments.length;
  item.views = post.views ?? item.views;
}
/* 게시판별 글 수도 실제 피드에서 센다 — 홈 지표와 목록 개수가 같아야 한다 */
for (const board of BOARDS) {
  board.count = FEED.filter((item) => item.board === board.key).length;
}

/** 인기 검색어의 목적지 — 회사명이면 회사 검색, 아니면 커뮤니티 검색.
    제안어를 눌렀는데 0건이 나오면 검색 자체를 못 믿게 된다(가드:
    키워드는 피드 제목이나 회사명에 반드시 존재하는 것만 시드에 둔다). */
export function keywordHref(word: string): string {
  const isCompany = COMPANIES.some((company) => company.name.includes(word));
  return isCompany
    ? `/companies?q=${encodeURIComponent(word)}`
    : `/community?q=${encodeURIComponent(word)}`;
}

export const POPULAR_WEEK: Array<{
  title: string;
  likes: number;
  comments: number;
  views: string;
  postId: string;
}> = FEED.filter((item) => item.postId)
  .slice()
  .sort((a, b) => b.views - a.views)
  .slice(0, 3)
  .map((item) => ({
    title: item.title,
    likes: item.likes,
    comments: item.comments,
    views: item.views.toLocaleString(),
    postId: item.postId!,
  }));
