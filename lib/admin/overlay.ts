"use client";

import {
  seed,
  type AdminAccount,
  type JobRow,
  type AuditRow,
  type Company,
  type Curation,
  type Evidence,
  type InquiryRow,
  type Member,
  type Notice,
  type PolicyRow,
  type Report,
} from "./seed";
import type { SafetyLevel } from "@/lib/seed/posts";

/**
 * 체험 오버레이 — 방문자의 조치는 **이 브라우저에만** 남는다.
 *
 * r4 변경 9번: 체험 입력은 서버에 기록하지 않는다(AC — DB 신규 행 0). 서버 메모리에 두면
 * 배포 시 방문자끼리 상태가 섞여, 앞사람이 어질러 놓은 화면을 다음 클라이언트가 보게 된다.
 * 그래서 시드 위에 덮어쓰는 오버레이를 localStorage에 두고 "데모 초기화"로 지운다.
 *
 * 게이트 판정(권한·step-up·멱등)은 여전히 backoffice-frame이 한다 — 저장 위치만 바뀐 것이다.
 */

const KEY = "wigtn-demo-admin-v1";

/**
 * 저장 스키마 버전.
 *
 * 시드에 필드가 늘면 예전에 저장된 행은 그 필드가 없는 채로 올라온다. 아래 `mergeById`가
 * 대부분을 흡수하지만(같은 id의 시드 행 위에 덮으므로 새 필드는 기본값을 얻는다),
 * 시드에 없는 id로 만들어진 행이나 구조 자체가 바뀐 경우는 덮을 바탕이 없다.
 * 그럴 땐 이 숫자를 올린다 — 맞지 않는 저장분은 통째로 버린다.
 *
 * 체험 오버레이는 버려도 되는 값이다. 화면이 깨지는 것보다 시드로 돌아가는 게 낫다.
 */
/* 4: 표기 수치 실데이터 동기화 — 회사 리뷰 수(212 등)가 리뷰 시드 실개수로
   바뀌었다. 구 저장분의 companies.reviews가 시드를 덮으면 옛 숫자가 부활한다. */
const SCHEMA = 4;

type Stored = Partial<AdminState> & { schema?: number };

/**
 * 저장된 행을 같은 id의 시드 행 위에 덮는다.
 * 시드에 필드가 늘어도 예전 저장분이 그대로 화면을 깨뜨리지 않는다.
 * 시드에 없는 id(체험 중 등록한 회사·공지 등)는 그대로 살린다.
 */
function mergeById<T extends { id: string }>(base: T[], saved: unknown): T[] {
  if (!Array.isArray(saved)) return base;
  const seedById = new Map(base.map((row) => [row.id, row]));
  return (saved as T[])
    .filter((row) => row && typeof row.id === "string")
    .map((row) => {
      const original = seedById.get(row.id);
      return original ? { ...original, ...row } : row;
    });
}

/** AI 운영 설정 — 관리자 화면에서 바꾸면 글 상세의 AI 참고 답변에 그대로 적용된다 */
export type GuardKey = "rule" | "moderation" | "human";

export type AiSettings = {
  safety: SafetyLevel;
  guards: Record<GuardKey, boolean>;
  /** 익명 세션당 AI 생성 허용 횟수 */
  quota: number;
};

const AI_DEFAULT: AiSettings = {
  safety: "basic",
  guards: { rule: true, moderation: true, human: true },
  quota: 3,
};

/**
 * 운영자 답변 — 답변 없는 질문 큐(question.answer)의 산출물.
 * 시드 글(comments)은 손대지 않고 이 오버레이만 쌓는다 — 사용자 글 상세
 * (PostAnswers)가 이걸 읽어 "운영자" 배지로 병합하고, 큐 건수는 이만큼 줄어든다.
 */
export type OperatorAnswer = {
  postId: string;
  text: string;
  /** ISO 문자열 — 표시할 때 화면에서 접는다 */
  at: string;
  actor: string;
};

export type AdminState = {
  reports: Report[];
  members: Member[];
  evidence: Evidence[];
  audit: AuditRow[];
  companies: Company[];
  notices: Notice[];
  curation: Curation;
  policy: PolicyRow[];
  admins: AdminAccount[];
  jobs: JobRow[];
  ai: AiSettings;
  answers: OperatorAnswer[];
  /** 1:1 문의 큐 — 사용자 /contact 접수가 여기로 들어온다 */
  inquiries: InquiryRow[];
};

function clone(): AdminState {
  return {
    ...(JSON.parse(JSON.stringify(seed)) as Omit<AdminState, "ai" | "answers">),
    ai: JSON.parse(JSON.stringify(AI_DEFAULT)) as AiSettings,
    answers: [],
  };
}

export function loadState(): AdminState {
  if (typeof window === "undefined") return clone();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return clone();

    const saved = JSON.parse(raw) as Stored;
    // 스키마가 다르면 덮을 바탕이 맞지 않는다 — 버리고 시드로 시작한다
    if (saved.schema !== SCHEMA) {
      window.localStorage.removeItem(KEY);
      return clone();
    }

    const base = clone();
    // 부분 저장분이 와도 깨지지 않게 시드 위에 덮는다(행 단위로)
    return {
      reports: mergeById(base.reports, saved.reports),
      members: mergeById(base.members, saved.members),
      evidence: mergeById(base.evidence, saved.evidence),
      audit: Array.isArray(saved.audit) ? saved.audit : base.audit,
      companies: mergeById(base.companies, saved.companies),
      notices: mergeById(base.notices, saved.notices),
      curation: { ...base.curation, ...saved.curation },
      policy: mergeById(base.policy, saved.policy),
      // 필드가 없던 시절의 저장분은 시드로 — 스키마를 올리지 않고 흡수한다
      admins: mergeById(base.admins, saved.admins),
      jobs: mergeById(base.jobs, saved.jobs),
      ai: {
        ...base.ai,
        ...saved.ai,
        guards: { ...base.ai.guards, ...saved.ai?.guards },
      },
      // 필드가 없던 시절의 저장분은 빈 배열로 — 스키마를 올리지 않고 흡수한다
      answers: Array.isArray(saved.answers) ? saved.answers : base.answers,
      // 필드가 없던 시절의 저장분은 시드로 — 위 admins와 같은 흡수 방식
      inquiries: mergeById(base.inquiries, saved.inquiries),
    };
  } catch {
    window.localStorage.removeItem(KEY);
    return clone();
  }
}

/**
 * 오버레이 변경 알림 — 같은 탭 안의 다른 화면(사이드바 배지·대시보드 큐·열린 표)이
 * 조치 즉시 따라오게 한다. `storage` 이벤트는 **다른 탭에서만** 발화하므로,
 * 같은 탭용 커스텀 이벤트를 저장 시점에 함께 쏜다.
 */
export const OVERLAY_EVENT = "wigtn-demo-admin-change";

/**
 * 오버레이 구독 — 같은 탭(커스텀 이벤트)과 다른 탭(storage)을 한 번에 묶는다.
 * 화면마다 리스너 두 개를 따로 달면 하나씩 빠뜨린다(사이드바 배지가 굳던 원인).
 */
export function subscribeState(listener: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const onStorage = (event: StorageEvent) => {
    // key가 null이면 clear() — 데모 초기화도 열린 화면을 시드로 되돌려야 한다
    if (event.key === null || event.key === KEY) listener();
  };
  window.addEventListener(OVERLAY_EVENT, listener);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(OVERLAY_EVENT, listener);
    window.removeEventListener("storage", onStorage);
  };
}

function notify() {
  // vitest 스텁처럼 dispatchEvent가 없는 window에서도 저장 자체는 깨지지 않게
  window.dispatchEvent?.(new Event(OVERLAY_EVENT));
}

export function saveState(state: AdminState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    KEY,
    JSON.stringify({ ...state, schema: SCHEMA }),
  );
  notify();
}

export function resetState() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
  // 그리드 상태도 함께 지운다 — 컬럼 폭·열어본 행이 남으면 "처음 상태"가 아니다
  for (let index = window.localStorage.length - 1; index >= 0; index -= 1) {
    const key = window.localStorage.key(index);
    if (key?.startsWith("colw:admin-")) window.localStorage.removeItem(key);
  }
  try {
    for (let index = window.sessionStorage.length - 1; index >= 0; index -= 1) {
      const key = window.sessionStorage.key(index);
      if (key && /^admin-.+-visited$/.test(key))
        window.sessionStorage.removeItem(key);
    }
  } catch {
    /* 프라이빗 모드 등 sessionStorage 접근 실패는 무시 */
  }
  notify();
}

/** 감사 기록은 append-only — 맨 위에 쌓인다 */
export function withAudit(
  state: AdminState,
  row: Omit<AuditRow, "at">,
): AdminState {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const at = `${pad(now.getMonth() + 1)}.${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
  return { ...state, audit: [{ at, ...row }, ...state.audit] };
}
