"use client";

/**
 * 핵심 기능 체험의 걸음별 안내 대본.
 *
 * 가이드 목록을 누르면 그 화면으로 가긴 갔다 — 그런데 거기서 끝이었다.
 * 체크(완료)는 실동작 훅(markProgress: 생성 버튼, 신고 접수, 정책 저장…)이
 * 만드는데, 방문자는 무엇을 눌러야 그 실동작에 닿는지 알 길이 없었다.
 * "봤다는 플래그를 어떻게 켜는지 판단이 안 된다"의 정체다.
 *
 * 그래서 항목마다 대본을 둔다. 어느 화면의 무엇을 어떤 순서로 누르는지
 * 말풍선이 걸음걸음 짚고, 실동작이 일어나면(markProgress 신호) 다음 걸음으로
 * 넘어간다. 여러 화면을 왕복하는 항목(신고→운영자 큐, 증빙 제출→승인→승급)은
 * 걸음에 화면(path)이 적혀 있어서, 화면이 바뀌어도 안내가 이어진다.
 *
 * 셀렉터는 전부 해당 컴포넌트 소스에서 확인한 것이다(2026-08-05). 지점
 * 하나가 낡으면 그 걸음만 "대상 없음" 말풍선으로 내려앉고 다음으로 넘어갈
 * 수 있다 — 대본 전체가 죽지는 않는다.
 */

import type { DemoFeature } from "./progress";

export type GuideStep = {
  /** 이 걸음이 사는 화면 */
  path: RegExp;
  /** 경로가 어긋났거나 다음 걸음이 다른 화면일 때 돌아갈 주소 */
  at: string;
  /** 다른 화면으로 건너가는 걸음의 길잡이 문구 — 왜 그 화면으로 가는지 */
  arrive?: string;
  selector: string;
  /** 말풍선 본문. 무엇을 하라는 것인지 한두 문장 */
  note: string;
  /**
   * 다음 걸음으로 넘어가는 방식.
   * next = 말풍선의 다음 버튼 (설명 걸음)
   * act  = 방문자가 대상을 실제로 누르면 (조작 걸음)
   * done = 이 기능의 실동작 신호(markProgress)가 오면 (완료 대기 걸음)
   */
  advance: "next" | "act" | "done";
  /** 대상이 없으면 조용히 건너뛴다 — 예: 이미 운영자라 게이트가 안 뜬 경우 */
  optional?: boolean;
};

/* 운영 화면 공통 — 운영자가 아니면 열람 게이트 모달이 먼저 선다.
   이미 운영자면 게이트가 없으니 optional로 걸음이 스스로 빠진다.
   arrive는 이 걸음이 화면 전환의 이음새일 때(왕복 체험) 길잡이가 하는 말 */
const ADMIN_GATE = (at: string, arrive?: string): GuideStep => ({
  path: new RegExp(`^${at.replace(/\//g, "\\/")}`),
  at,
  arrive,
  selector: ".gatemodal-cta",
  note: "운영자 전용 화면이에요. 이 데모는 로그인 대신 역할만 바꿔요 — 운영자로 로그인을 눌러주세요.",
  advance: "act",
  optional: true,
});

export const GUIDE_TOURS: Partial<Record<DemoFeature, GuideStep[]>> = {
  "ai-answer": [
    {
      path: /^\/community\/p-4821\/?$/,
      at: "/community/p-4821",
      selector: ".aicall",
      note: "생성 버튼을 눌러보세요. AI가 질문과 리뷰 범위를 읽고 참고 답변을 만들어요.",
      advance: "act",
    },
    {
      path: /^\/community\/p-4821\/?$/,
      at: "/community/p-4821",
      selector: ".aiwrap",
      note: "초안이 스트리밍으로 흐르고, 끝나면 안전 재검사까지 자동으로 돌아요. 초안이 완성되면 체험이 체크돼요.",
      advance: "done",
    },
    {
      path: /^\/community\/p-4821\/?$/,
      at: "/community/p-4821",
      selector: ".afpublish",
      note: "생성만으로는 게시되지 않아요. 내 닉네임으로 게시를 눌러야 답변 목록에 실제로 실려요.",
      advance: "act",
    },
  ],

  "company-review": [
    {
      path: /^\/companies\/[^/]+\/?$/,
      at: "/companies/diamond-tech",
      selector: ".writecta",
      note: "리뷰 쓰기로 들어가요. 운영팀도 작성자를 알 수 없는 익명 리뷰예요.",
      advance: "act",
    },
    {
      path: /^\/companies\/[^/]+\/review\/?$/,
      at: "/companies/diamond-tech/review",
      selector: ".ratepick",
      note: "다섯 항목에 별점을 매겨요. 항목별 점수가 평균 평점의 재료가 돼요.",
      advance: "next",
    },
    {
      path: /^\/companies\/[^/]+\/review\/?$/,
      at: "/companies/diamond-tech/review",
      selector: ".formactions .btn.primary",
      note: "총평·장점·단점을 채우고 등록해보세요. 데모니까 짧게 써도 돼요 — 등록하면 평점이 바로 재계산돼요.",
      advance: "done",
    },
    {
      path: /^\/companies\/[^/]+\/review\/?$/,
      at: "/companies/diamond-tech/review",
      selector: ".formcard a.btn.primary",
      note: "등록됐어요. 내 리뷰 확인하기를 눌러 회사 화면으로 돌아가요.",
      advance: "act",
    },
    {
      path: /^\/companies\/[^/]+\/?$/,
      at: "/companies/diamond-tech",
      arrive: "회사 화면으로 돌아가 평점이 재계산된 걸 확인해볼게요.",
      selector: ".scorebox",
      note: "방금 매긴 별점이 평균에 반영됐어요. 리뷰 맨 위에 내 리뷰가 올라와 있어요.",
      advance: "next",
    },
  ],

  "content-safety": [
    {
      path: /^\/community\/write\/?$/,
      at: "/community/write",
      selector: ".demobtn",
      note: "이 버튼으로 위험한 코드와 연락처가 섞인 글을 붙여넣어 보세요.",
      advance: "act",
    },
    {
      path: /^\/community\/write\/?$/,
      at: "/community/write",
      selector: ".weditor",
      note: "위험한 조각만 골라 취소선이 그어지고 제거돼요. 멀쩡한 본문과 서식은 그대로예요.",
      advance: "done",
    },
  ],

  report: [
    {
      path: /^\/community\/p-4821\/?$/,
      at: "/community/p-4821",
      selector: ".rb-report",
      note: "신고 버튼을 눌러보세요. 접수하면 운영자 큐에 실제로 쌓여요.",
      advance: "act",
    },
    {
      path: /^\/community\/p-4821\/?$/,
      at: "/community/p-4821",
      selector: ".modalwrap .gate-acts .btn.primary",
      note: "신고는 회원의 일이에요. 일반 회원으로 로그인을 누르고 계속해요.",
      advance: "act",
      optional: true,
    },
    {
      path: /^\/community\/p-4821\/?$/,
      at: "/community/p-4821",
      selector: ".modalwrap .modal",
      note: "사유를 고르고 접수해요. 이 신고가 운영자 신고 관리에 행으로 생겨요.",
      advance: "done",
    },
    {
      path: /^\/community\/p-4821\/?$/,
      at: "/community/p-4821",
      selector: ".modalwrap a.btn.primary[href='/admin/reports']",
      note: "접수됐어요. 신고 관리에서 보기를 눌러 운영자 화면으로 건너가볼게요.",
      advance: "act",
    },
    ADMIN_GATE(
      "/admin/reports",
      "운영자 신고 관리로 넘어가 방금 접수가 쌓인 걸 확인해볼게요.",
    ),
    {
      path: /^\/admin\/reports/,
      at: "/admin/reports",
      arrive: "운영자 신고 관리로 넘어가 방금 접수가 쌓인 걸 확인해볼게요.",
      selector: ".dtable",
      note: "방금 접수한 신고가 맨 위에 쌓였어요. 블라인드 같은 처리는 '중요한 조치 전 본인 확인' 체험에서 이어져요.",
      advance: "next",
    },
  ],

  evidence: [
    {
      path: /^\/badges\/?$/,
      at: "/badges",
      selector: ".dropzone",
      note: "여기를 눌러 아무 파일이나 증빙으로 담아보세요. 데모라 실제로 업로드되지는 않아요.",
      advance: "act",
    },
    {
      path: /^\/badges\/?$/,
      at: "/badges",
      selector: ".evform-foot .btn.primary",
      note: "파일이 담기면 검토 요청을 눌러요. 운영자 증빙 검토 큐로 실제로 넘어가요.",
      advance: "done",
    },
    ADMIN_GATE(
      "/admin/badges",
      "이번엔 운영자가 되어 방금 낸 신청을 직접 승인해볼게요.",
    ),
    {
      path: /^\/admin\/badges/,
      at: "/admin/badges",
      arrive: "이번엔 운영자가 되어 방금 낸 신청을 직접 승인해볼게요.",
      selector: ".dtable tbody tr",
      note: "맨 위 김영업 — 방금 제출한 신청이에요. 행을 눌러 여세요.",
      advance: "act",
    },
    {
      path: /^\/admin\/badges/,
      at: "/admin/badges",
      selector: ".evacts .btn.primary",
      note: "승인을 누르면 인증 배지가 붙고 회원 등급이 실제로 올라가요.",
      advance: "act",
    },
    {
      path: /^\/badges\/?$/,
      at: "/badges",
      arrive: "사용자 화면으로 돌아가 등급이 올라간 걸 확인해볼게요.",
      selector: ".badgestate",
      note: "제출 → 운영자 승인 → 등급 승급까지, 한 바퀴가 실제 데이터로 돌았어요.",
      advance: "next",
    },
  ],

  question: [
    ADMIN_GATE("/admin/questions"),
    {
      path: /^\/admin\/questions/,
      at: "/admin/questions",
      selector: ".dtable tbody tr",
      note: "답변을 기다리는 질문들이에요. 행을 눌러 질문을 열어보세요.",
      advance: "act",
    },
    {
      path: /^\/admin\/questions/,
      at: "/admin/questions",
      selector: ".evacts .btn.primary",
      note: "AI 초안이 채워져 있어요. 다듬은 뒤 답변 등록을 누르면 사용자 글 상세에 운영자 배지로 붙어요.",
      advance: "done",
    },
  ],

  "step-up": [
    ADMIN_GATE("/admin/reports"),
    {
      path: /^\/admin\/reports/,
      at: "/admin/reports",
      selector: ".tact .tbtn.no",
      note: "블라인드·삭제 같은 위험 조치 버튼을 눌러보세요. 되돌리기 어려운 조치라 실행 전에 확인부터 물어요.",
      advance: "act",
    },
    {
      path: /^\/admin\/reports/,
      at: "/admin/reports",
      selector: ".modal.form .facts .btn.primary",
      note: "무슨 일이 일어나는지 확인하고 실행해요.",
      advance: "act",
    },
    {
      path: /^\/admin\/reports/,
      at: "/admin/reports",
      selector: ".stepup",
      note: "실행 직전에 본인 확인이 한 번 더 서요. 체험용 코드 000000을 넣고 확인을 누르면 처리돼요.",
      advance: "done",
    },
  ],

  curation: [
    ADMIN_GATE("/admin/curation"),
    {
      path: /^\/admin\/curation/,
      at: "/admin/curation",
      selector: ".ds-draghandle",
      note: "⋮⋮ 핸들을 끌어 노출 순서를 바꿔보세요. 키보드 ↑/↓로도 움직여요.",
      advance: "next",
    },
    {
      path: /^\/admin\/curation/,
      at: "/admin/curation",
      selector: ".ahd .btn",
      note: "변경 저장을 눌러야 홈에 반영돼요. 저장하면 처리 기록에도 남아요.",
      advance: "done",
    },
    {
      path: /^\/$/,
      at: "/",
      arrive: "홈으로 돌아가 저장한 배치가 반영된 걸 확인해볼게요.",
      selector: ".home-company-insights",
      note: "방금 저장한 순서대로 회사가 노출되고 있어요. 운영 화면과 사용자 화면이 같은 데이터를 봐요.",
      advance: "next",
    },
  ],

  policy: [
    ADMIN_GATE("/admin/policies"),
    {
      path: /^\/admin\/policies/,
      at: "/admin/policies",
      selector: ".ptog",
      note: "토글을 눌러 권한 하나를 바꿔보세요.",
      advance: "act",
    },
    {
      path: /^\/admin\/policies/,
      at: "/admin/policies",
      selector: ".polhead .btn",
      note: "저장을 눌러요. 권한은 모든 화면 게이트의 근거라 본인 확인이 한 번 더 붙어요.",
      advance: "act",
    },
    {
      path: /^\/admin\/policies/,
      at: "/admin/policies",
      selector: ".stepup",
      note: "체험용 코드 000000을 넣고 확인하면 저장돼요. 바뀐 권한이 실제 화면 게이트를 바꿔요.",
      advance: "done",
    },
  ],
};

/** 이 기능의 안내 대본. 없으면 빈 배열 — 부른 쪽이 "안내 없음"으로 처리 */
export function guideTourOf(feature: DemoFeature): GuideStep[] {
  return GUIDE_TOURS[feature] ?? [];
}

/* ── 진행 상태 ──
   화면을 건너다니는 안내라 상태가 라우팅(전체 리로드 포함)을 살아남아야
   한다. sessionStorage — 탭을 닫으면 안내도 끝나는 게 맞다. wigtn-demo-
   접두라 체험 초기화(resetDemoExperience)에 함께 쓸려간다. */
const TOUR_KEY = "wigtn-demo-guide-tour-v1";

/** 안내 시작 신호 — 러너가 이걸 듣고 저장된 상태를 다시 읽는다 */
export const GUIDE_TOUR_EVENT = "wigtn-demo-guide-tour";

export type GuideTourState = {
  feature: DemoFeature;
  step: number;
  /**
   * 시작 시점에 이미 완료였는가. markProgress는 이미 켜진 항목에는 신호를
   * 다시 쏘지 않으므로, 재체험에서는 done 걸음이 자동으로 안 넘어간다 —
   * 그때는 말풍선의 건너뛰기가 길이다. 첫 체험(false)에서만 자동 진행한다.
   */
  wasDone: boolean;
};

export function loadGuideTour(): GuideTourState | null {
  if (typeof window === "undefined") return null;
  try {
    const parsed = JSON.parse(
      window.sessionStorage.getItem(TOUR_KEY) ?? "null",
    ) as GuideTourState | null;
    if (!parsed || typeof parsed.step !== "number") return null;
    if (!GUIDE_TOURS[parsed.feature]) return null;
    return parsed;
  } catch {
    window.sessionStorage.removeItem(TOUR_KEY);
    return null;
  }
}

export function saveGuideTour(state: GuideTourState) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(TOUR_KEY, JSON.stringify(state));
}

export function clearGuideTour() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(TOUR_KEY);
}

/** 목록에서 항목을 누르면 부른다. 대본이 없는 항목(챗봇)은 조용히 무시 */
export function startGuideTour(feature: DemoFeature, wasDone: boolean) {
  if (!GUIDE_TOURS[feature]) return;
  saveGuideTour({ feature, step: 0, wasDone });
  window.dispatchEvent(new CustomEvent(GUIDE_TOUR_EVENT));
}
