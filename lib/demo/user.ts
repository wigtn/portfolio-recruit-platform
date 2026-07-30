"use client";

/**
 * 방문자 오버레이 — 서비스 화면에서 누른 것들이 여기 남는다.
 *
 * 관리자 오버레이(lib/admin/overlay.ts)와 같은 원칙이다: 서버로 보내지 않고
 * 이 브라우저에만 저장한다(r4 변경 9번 — 체험 입력은 DB에 기록하지 않는다).
 * 키를 나눈 건 관리자 상태와 방문자 상태가 서로 다른 주기로 초기화되기 때문이다.
 */

const KEY = "wigtn-demo-user-v1";
const SCHEMA = 2;

export type EvidenceApplication = {
  status: "검토 대기" | "승인" | "반려";
  files: number;
  reason?: string;
};

/** 체험 중 내가 쓴 글 — 마이페이지 "내 글"에 쌓인다 */
export type MyPost = {
  id: string;
  board: string;
  title: string;
  body: string;
  tags: string[];
  files: number;
  at: string;
};

export type MyAnswer = {
  id: string;
  postId: string;
  text: string;
  at: string;
  /** 대댓글 — 어느 댓글 밑에 달렸는지. 없으면 글에 단 답변 */
  parentId?: string;
};

export type UserState = {
  /** 도움돼요 누른 글 */
  likes: string[];
  scraps: string[];
  /** 팔로우한 회사 slug */
  follows: string[];
  /** 도움돼요 누른 리뷰 */
  helpful: string[];
  /** 신고한 대상 — 같은 걸 두 번 신고하지 못하게 */
  reported: string[];
  /** 실적 인증 신청 — 관리자 증빙 검토와 이어진다 */
  evidence: EvidenceApplication | null;
  posts: MyPost[];
  /** 지원한 공고 id — 채용 상세의 "지원 완료" 상태 유지 */
  applied: string[];
  answers: MyAnswer[];
};

const EMPTY: UserState = {
  likes: [],
  scraps: [],
  follows: [],
  helpful: [],
  reported: [],
  evidence: null,
  posts: [],
  applied: [],
  answers: [],
};

export function loadUser(): UserState {
  if (typeof window === "undefined") return { ...EMPTY };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { ...EMPTY };
    const saved = JSON.parse(raw) as Partial<UserState> & { schema?: number };
    if (saved.schema !== SCHEMA) {
      window.localStorage.removeItem(KEY);
      return { ...EMPTY };
    }
    return {
      likes: saved.likes ?? [],
      scraps: saved.scraps ?? [],
      follows: saved.follows ?? [],
      helpful: saved.helpful ?? [],
      reported: saved.reported ?? [],
      evidence: saved.evidence ?? null,
      posts: saved.posts ?? [],
      applied: saved.applied ?? [],
      answers: saved.answers ?? [],
    };
  } catch {
    window.localStorage.removeItem(KEY);
    return { ...EMPTY };
  }
}

/** 유저 반응 변경 알림 — 목록·사이드바 등 같은 데이터를 쓰는 화면이 구독한다 */
export const USER_CHANGE_EVENT = "wigtn-user-change";

export function saveUser(state: UserState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    KEY,
    JSON.stringify({ ...state, schema: SCHEMA }),
  );
  // storage 이벤트는 다른 탭에서만 발화한다 — 같은 탭용 커스텀 이벤트
  window.dispatchEvent(new CustomEvent(USER_CHANGE_EVENT));
}

/**
 * AI 생성 사용 횟수 — 체험기록과 다른 접두의 날짜 단위 키.
 * "데모 초기화"는 wigtn-demo-* 를 쓸어내는데, 한도까지 같이 풀리면 무제한
 * 체험이 되므로 초기화에서 살아남게 분리했다. 날짜가 바뀌면 스스로 풀린다
 * ("내일 다시 열려요" 문구 그대로).
 */
const AI_RUNS_KEY = "wigtn-ai-runs-v1";

function todayStamp() {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
}

export function loadAiRuns(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = window.localStorage.getItem(AI_RUNS_KEY);
    if (!raw) return 0;
    const saved = JSON.parse(raw) as { day?: string; runs?: number };
    return saved.day === todayStamp() ? (saved.runs ?? 0) : 0;
  } catch {
    return 0;
  }
}

export function bumpAiRuns() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    AI_RUNS_KEY,
    JSON.stringify({ day: todayStamp(), runs: loadAiRuns() + 1 }),
  );
}

export function resetUser() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}

/** 목록형 필드 토글 — 켜져 있으면 빼고, 없으면 넣는다 */
export function toggleIn(list: string[], id: string) {
  return list.includes(id) ? list.filter((item) => item !== id) : [...list, id];
}
