import type { SafetyLevel } from "@/lib/seed/posts";

/**
 * AI 처리 내역 — 전부 합성 데이터.
 *
 * 비교가 핵심이다(사용자 지시): 운영자는 "무엇이 어떻게 바뀌었는지"를 봐야
 * 규칙의 의도를 파악한다. 그래서 답변을 통짜 문자열이 아니라 **세그먼트**로
 * 둔다 — 문자열은 그대로, 치환 토큰은 {raw(초안 원문), applied(적용 후),
 * rule(어느 규칙이 바꿨나)}로. 화면이 초안↔적용 후를 나란히 그릴 수 있다.
 */

export type DiffToken = {
  /** AI 초안 원문 — 규칙이 없었다면 그대로 나갔을 표현 */
  raw: string;
  /** 안전 규칙 적용 후 실제로 나간 표현 */
  applied: string;
  /** 무엇이 바꿨나 — 화면 태그용 짧은 이름 */
  rule: string;
};

export type AiSegment = string | DiffToken;

export type AiLogRow = {
  id: string;
  at: string;
  question: string;
  held?: boolean;
  /** 적용된 안전 규칙 요약 — 규칙이 없으면 note만 */
  rules?: string;
  note?: string;
  /** 세그먼트 답변 — 있으면 "비교 보기"로 펼쳐진다 */
  answer?: AiSegment[];
};

export const AI_LOG: AiLogRow[] = [
  {
    id: "L-1",
    at: "07.25 15:22",
    question: "△△전자 진짜 별로지 않나요?",
    rules: "회사 실명 가림, 미확인 수치 제외",
    answer: [
      "특정 회사 평가는 리뷰 데이터 범위에서만 답합니다. ",
      { raw: "△△전자", applied: "국내 대기업 A", rule: "회사 실명 가림" },
      "처럼 큰 거래처는 항목별 평점이 갈리니, 인센티브는 ",
      {
        raw: "평균 32% 상승",
        applied: "공개된 리뷰 범위",
        rule: "미확인 수치 제외",
      },
      "에서 확인하도록 안내했어요.",
    ],
  },
  {
    id: "L-2",
    at: "07.25 14:07",
    question: "연봉 인상률, 수치로 알려줘",
    rules: "미확인 수치 제외",
    answer: [
      "연봉 인상률은 회사, 연차마다 갈려 단일 수치로 답하지 않았어요. ",
      {
        raw: "업계 평균 7.2%",
        applied: "회사별 연봉 그래프",
        rule: "미확인 수치 제외",
      },
      "를 보여주고 리뷰의 연봉 탭으로 안내했어요.",
    ],
  },
  {
    id: "L-3",
    at: "07.25 11:40",
    question: "이거 법적으로 문제 없을까?",
    note: "일반 안내",
    answer: [
      "법률 판단은 하지 않아요, 노무 상담 채널 안내와 함께 커뮤니티의 유사 사례 글을 연결했어요.",
    ],
  },
  {
    id: "L-4",
    at: "07.25 09:15",
    question: "[광고] 이직 컨설팅 DM 010-…",
    held: true,
    rules: "스팸, 연락처 감지 → 커뮤니티 답변 대기",
  },
];

/**
 * 안전 강도 예시 — "느슨/기본/엄격"은 이름만으로는 무엇이 달라지는지 모른다.
 * 같은 문장이 강도별로 어떻게 나가는지 한 줄씩 보여준다.
 * 토큰은 사용자 화면(글 상세 AI 답변)의 치환 규칙과 같은 구조(GuardedTerm)다.
 */
export const SAFETY_EXAMPLE: {
  /** 토큰 사이사이 문자열 — [앞, 사이, 뒤] */
  template: [string, string, string];
  tokens: Array<Record<SafetyLevel, string>>;
} = {
  template: [
    "리뷰에서도 ",
    "처럼 큰 거래처는 담당자 대면 후 진행이 빠르다는 의견이 많았고, 인센티브는 ",
    "에서 확인하세요.",
  ],
  tokens: [
    { loose: "◇◇테크", basic: "국내 대기업 A", strict: "한 기업" },
    {
      loose: "평균 32% 상승 후기",
      basic: "공개된 리뷰 범위",
      strict: "공개된 리뷰 범위",
    },
  ],
};

/**
 * AI 운영 지표 — 시안 정본 14번의 수치를 상수로 승격했다.
 *
 * 오버레이(lib/admin/overlay.ts)는 AI **설정**(안전 강도·장치·한도)만 저장하고
 * 생성 호출 횟수는 어디에도 기록하지 않는다 — 그래서 실측으로 파생할 수 없다.
 * AI_LOG(위)는 최근 발췌 4건이라 합계가 아니다. 누적 지표는 여기가 단일 근거다.
 */
export const AI_METRICS = {
  /** 생성한 참고 답변(누적) */
  generated: 42,
  /** 안전 규칙이 실제로 적용된 답변 수 */
  ruleApplied: 18,
  /** 생성 보류(스팸·저신뢰) */
  held: 3,
} as const;
