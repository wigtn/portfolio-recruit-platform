"use client";

import { loadState } from "@/lib/admin/overlay";
import { myEvidenceStatus, myInquiries } from "./submit";
import { loadUser } from "./user";

/**
 * 알림 — 새 저장소를 만들지 않고 **이미 있는 상태에서 파생 계산**한다.
 *
 * FAQ(nt-10)는 "처리 결과는 신고자에게 알림으로 전달"이라고 약속하는데,
 * 지금까지 그 결과를 보려면 마이·실적 인증에 직접 들어가야 했다. 여기서
 * 오버레이(운영자 조치 결과)와 유저 상태(내가 낸 신고·증빙)를 대조해
 * 알림 목록을 만든다. 별도 알림 테이블을 두면 조치와 알림이 어긋날 수 있다 —
 * 파생이면 항상 현재 상태와 일치한다.
 *
 * 읽음 여부만 localStorage에 남긴다. 알림 id에 상태를 포함시켜서
 * (`report:p-4821:블라인드`) 같은 대상이라도 상태가 바뀌면 새 알림이 된다.
 */

const READ_KEY = "wigtn-demo-notifread-v1";

/**
 * 헤더 드롭다운(계정 메뉴·알림)의 상호배타 신호 — 하나가 열리면 나머지가
 * 이 이벤트를 듣고 닫는다. 두 컴포넌트가 서로를 몰라야 하므로 상태를
 * 끌어올리는 대신 이벤트로 알린다.
 */
export const MENU_OPEN_EVENT = "wigtn-demo-menu-open";

export function announceMenuOpen(source: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(MENU_OPEN_EVENT, { detail: source }));
}

export type DemoNotification = {
  /** 상태 파생 id — 같은 대상·같은 상태면 같은 id(읽음이 유지된다) */
  id: string;
  kind: "report" | "evidence" | "notice" | "inquiry";
  title: string;
  body?: string;
  href: string;
};

/** 신고 처리 상태 → 신고자에게 보여줄 문구. "검토 대기"는 아직 알릴 게 없다. */
const REPORT_RESULT: Record<string, { title: string; body: string }> = {
  "임시 블라인드": {
    title: "신고가 누적돼 임시 블라인드됐어요",
    body: "운영자 확인 후 최종 처리돼요",
  },
  블라인드: {
    title: "신고하신 콘텐츠가 블라인드됐어요",
    body: "운영자 검토 결과예요, 사유는 처리 기록에 남아요",
  },
  삭제: {
    title: "신고하신 콘텐츠가 삭제됐어요",
    body: "운영자 검토 결과예요, 사유는 처리 기록에 남아요",
  },
  반려: {
    title: "신고가 반려됐어요",
    body: "운영자 검토 결과 조치 대상이 아니라고 판단했어요",
  },
  복원: {
    title: "신고하신 콘텐츠가 복원됐어요",
    body: "재검토 결과 원문이 유지돼요",
  },
};

/**
 * 오버레이·유저 상태에서 알림을 파생한다 — 내 신고의 처리 결과,
 * 내 증빙 상태, 고정 공지 순.
 */
export function deriveNotifications(): DemoNotification[] {
  const user = loadUser();
  const state = loadState();
  const items: DemoNotification[] = [];

  // 1) 내가 낸 신고의 처리 결과 — user.reported의 id가 곧 신고 행 id다
  for (const id of user.reported) {
    const row = state.reports.find((report) => report.id === id);
    if (!row) continue;
    const result = REPORT_RESULT[row.status];
    if (!result) continue; // 검토 대기 등 — 아직 결과가 아니다

    // 커뮤니티 글 신고는 원문으로 보낸다. postId 필드는 다른 레인이 채우는
    // 계약이라 아직 없을 수 있다 — 없으면 신고 행 id(글 신고는 글 id)로 추정한다.
    const postId =
      (row as { postId?: string }).postId ??
      (row.id.startsWith("p-") ? row.id : undefined);
    items.push({
      id: `report:${row.id}:${row.status}`,
      kind: "report",
      title: result.title,
      body: `${row.target}, ${result.body}`,
      href: postId
        ? `/community/${postId}`
        : row.kind === "회사 리뷰"
          ? "/companies"
          : "/community",
    });
  }

  // 2) 내 증빙 상태 — 접수·승인·반려 각각이 별개 알림이다
  const evidence = myEvidenceStatus();
  if (evidence) {
    const byStatus: Record<string, { title: string; body: string }> = {
      "검토 대기": {
        title: "실적 증빙이 검토 큐에 들어갔어요",
        body: "운영자가 확인하면 결과를 알려드려요",
      },
      승인: {
        title: "실적 증빙이 승인됐어요",
        body: "Lv.5 세일즈마스터로 올라갔어요",
      },
      반려: {
        title: "실적 증빙이 반려됐어요",
        body: evidence.reason ?? "사유를 확인하고 다시 올려주세요",
      },
    };
    const copy = byStatus[evidence.status];
    if (copy) {
      items.push({
        id: `evidence:${evidence.status}`,
        kind: "evidence",
        title: copy.title,
        body: copy.body,
        href: "/my",
      });
    }
  }

  // 3) 내 1:1 문의의 답변 — 운영자가 답하면 문의 화면으로 데려간다
  for (const row of myInquiries()) {
    if (row.status !== "답변완료") continue; // 대기는 아직 알릴 게 없다
    items.push({
      id: `inquiry:${row.id}:답변완료`,
      kind: "inquiry",
      title: "1:1 문의에 답변이 도착했어요",
      body: `${row.category} 문의, 운영자가 직접 답했어요`,
      href: `/contact#inquiry-${row.id}`,
    });
  }

  // 4) 고정 공지 — 운영자가 상단 고정한 공지는 전 회원 대상 알림이다
  for (const row of state.notices) {
    if (row.kind !== "notice" || !row.pinned || row.status !== "노출중")
      continue;
    items.push({
      id: `notice:${row.id}`,
      kind: "notice",
      title: row.title,
      body: row.date,
      href: `/notices?kind=notice&doc=${row.id}`,
    });
  }

  return items;
}

export function loadRead(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const parsed = JSON.parse(window.localStorage.getItem(READ_KEY) ?? "[]");
    return new Set(Array.isArray(parsed) ? (parsed as string[]) : []);
  } catch {
    window.localStorage.removeItem(READ_KEY);
    return new Set();
  }
}

export function markRead(ids: string[]) {
  if (typeof window === "undefined") return;
  const next = loadRead();
  for (const id of ids) next.add(id);
  window.localStorage.setItem(READ_KEY, JSON.stringify([...next]));
}
