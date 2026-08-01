"use client";

export const DEMO_PROGRESS_EVENT = "wigtn-demo-progress";
/** 가이드에서 챗봇 항목을 누르면 이 이벤트로 패널을 연다(챗봇은 라우트가 없다). */
export const DEMO_OPEN_CHAT_EVENT = "wigtn-demo-open-chat";

/**
 * 우측 하단 패널이 열렸음을 알린다. `detail.owner`가 자기가 아니면 닫는다.
 *
 * 예전엔 CSS로 상대 **버튼**을 숨겼다. 그러면 한쪽을 여는 순간 다른 쪽으로
 * 가는 길이 화면에서 사라진다 — 닫고, 없어진 자리를 찾고, 다시 눌러야 한다.
 * 겹치지 말아야 하는 건 펼쳐진 패널이지 버튼이 아니다.
 */
export const DEMO_PANEL_OPEN_EVENT = "wigtn-demo-panel-open";
export type DemoPanelOwner = "chat" | "guide";

/** 패널을 열 때 부른다. 나머지 패널은 이 신호를 받고 스스로 닫는다. */
export function announcePanel(owner: DemoPanelOwner) {
  window.dispatchEvent(
    new CustomEvent(DEMO_PANEL_OPEN_EVENT, { detail: { owner } }),
  );
}
const KEY = "wigtn-demo-progress-v1";
const THEME_KEY = "wigtn-demo-theme-v1";

export type DemoFeature =
  | "ai-answer"
  | "content-safety"
  | "company-review"
  | "evidence"
  | "report"
  | "audit" // (구) 목록에서 빠졌지만 저장분 호환을 위해 유지
  | "dashboard"
  | "step-up"
  | "policy"
  | "company-import" // (구) 동일
  | "curation"
  | "question"
  | "chatbot"
  | "role";

/**
 * 체험 항목 11개의 정본 목록 — 진행도(loadProgress)를 사람이 읽는 이름으로
 * 바꿔야 하는 화면(데모 위젯, /contact "방금 보신 것들")이 같은 목록을 봐야
 * 개수·이름이 어긋나지 않는다. 하드코딩 "4/11"이 실진행도와 무관하게 붙어
 * 있던 원인이 목록의 사본화였다.
 */
export const DEMO_FEATURES: Array<{
  id: DemoFeature;
  group: "서비스" | "운영 왕복";
  title: string;
  description: string;
  href: string;
  /** 라우트가 아니라 화면 위 장치를 여는 항목. href 대신 이 값으로 분기한다 */
  action?: "chat";
}> = [
  /* 진짜 핵심만 — "실제로 실행하고, 반대편 화면까지 갔다 오는" 것들.
     열람 전용(대시보드·처리 기록), 니치 도구(엑셀 일괄), 데모 장치(역할
     전환)는 뺐다 — 실행을 마쳐야 체크가 켜진다는 약속과 맞아야 한다. */
  {
    id: "ai-answer",
    group: "서비스",
    title: "AI 참고 답변",
    description: "생성 버튼을 누르면 스트리밍 → 안전 재검사까지",
    href: "/community/p-4821",
  },
  {
    id: "company-review",
    group: "서비스",
    title: "회사 리뷰, 항목별 평점",
    description: "리뷰를 쓰면 평점이 바로 재계산돼요",
    href: "/companies/diamond-tech",
  },
  {
    id: "content-safety",
    group: "서비스",
    title: "글쓰기 콘텐츠 안전",
    description: "위험한 코드, 연락처만 골라 제거돼요",
    href: "/community/write",
  },
  {
    id: "report",
    group: "서비스",
    title: "신고 → 블라인드 왕복",
    description: "신고하면 운영자 큐에 실제로 쌓여요",
    href: "/community/p-4821",
  },
  {
    id: "evidence",
    group: "서비스",
    title: "실적 인증 신청",
    description: "제출 → 운영자 승인 → 등급 승급까지",
    href: "/badges",
  },
  {
    id: "chatbot",
    group: "서비스",
    title: "상담 챗봇",
    description: "누르면 대화가 재생돼요. 직접 물어봐도 답해요",
    href: "",
    action: "chat",
  },
  {
    id: "question",
    group: "운영 왕복",
    title: "질문에 공식 답변 달기",
    description: "등록하면 글 상세에 운영자 배지로 붙어요",
    href: "/admin/questions",
  },
  {
    id: "step-up",
    group: "운영 왕복",
    // 원래 "고위험 조치 재인증 (step-up)"이었다. step-up은 인증 업계 용어라
    // 고객이 보는 목록에 그대로 두면 읽히지 않는다. 문구는 실제 모달이 쓰는
    // "본인 확인"에 맞춘다. 같은 기능을 두 이름으로 부르지 않는다.
    title: "중요한 조치 전 본인 확인",
    description: "글 가림이나 계정 정지는 실행 직전에 본인 확인을 거쳐요",
    href: "/admin/reports",
  },
  {
    id: "curation",
    group: "운영 왕복",
    title: "홈 큐레이션 배치 관리",
    description: "드래그로 노출 순서를 바꿔 저장하면 홈에 반영돼요",
    href: "/admin/curation",
  },
  {
    id: "policy",
    group: "운영 왕복",
    title: "역할별 권한 정책",
    description: "토글이 실제 화면 게이트를 바꿔요",
    href: "/admin/policies",
  },
];

export function loadProgress(): Set<DemoFeature> {
  if (typeof window === "undefined") return new Set();
  try {
    const parsed = JSON.parse(window.localStorage.getItem(KEY) ?? "[]");
    return new Set(Array.isArray(parsed) ? (parsed as DemoFeature[]) : []);
  } catch {
    window.localStorage.removeItem(KEY);
    return new Set();
  }
}

export function markProgress(feature: DemoFeature) {
  if (typeof window === "undefined") return;
  const next = loadProgress();
  if (next.has(feature)) return;
  next.add(feature);
  window.localStorage.setItem(KEY, JSON.stringify([...next]));
  window.dispatchEvent(new CustomEvent(DEMO_PROGRESS_EVENT));
}

export function saveDemoTheme(theme: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(THEME_KEY, theme);
}

export function loadDemoTheme() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(THEME_KEY);
}

/** 모든 데모 입력·역할·코치·진행률을 한 번에 지운다. */
export function resetDemoExperience() {
  if (typeof window === "undefined") return;
  for (let index = window.localStorage.length - 1; index >= 0; index -= 1) {
    const key = window.localStorage.key(index);
    // 그리드 개인화(컬럼 폭)는 접두사가 달라 따로 짚는다 — "초기화했는데
    // 표가 예전 폭 그대로"면 초기화가 덜 된 것으로 보인다
    if (key?.startsWith("wigtn-demo-") || key?.startsWith("colw:admin-")) {
      window.localStorage.removeItem(key);
    }
  }
  for (let index = window.sessionStorage.length - 1; index >= 0; index -= 1) {
    const key = window.sessionStorage.key(index);
    if (key?.startsWith("admin-") && key.endsWith("-visited")) {
      window.sessionStorage.removeItem(key);
    }
  }
}
