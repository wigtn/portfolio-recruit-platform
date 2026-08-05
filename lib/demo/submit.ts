"use client";

import { loadState, saveState } from "@/lib/admin/overlay";
import type { Report } from "@/lib/admin/seed";
import { loadUser, saveUser } from "./user";
import { markProgress } from "./progress";

/**
 * 서비스 화면 → 백오피스로 넘어가는 것들.
 *
 * 데모의 핵심 고리다. 신고를 누르면 운영자 화면 신고 목록에 실제로 행이 생기고,
 * 증빙을 올리면 증빙 검토 큐에 신청이 뜬다. 운영자가 승인·반려하면 그 결과가
 * 다시 마이페이지로 돌아온다. 이 왕복이 없으면 두 화면이 그냥 그림이다.
 *
 * 방문자가 만든 것도 게이트를 거치지 않는다 — 신고·신청은 회원이 하는 일이고,
 * 판정(블라인드·승인)만 운영자 권한이다.
 */

function stamp() {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(now.getMonth() + 1)}.${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

export type ReportInput = {
  /** 신고 대상 식별자 — 같은 걸 두 번 신고하지 못하게 쓴다 */
  id: string;
  target: string;
  kind: string;
  reason: string;
  body: string;
  author: string;
  by: string;
};

/** 신고 접수 — 이미 접수된 대상이면 누적 횟수만 올린다 */
export function submitReport(input: ReportInput) {
  const state = loadState();
  const at = stamp();
  const existing = state.reports.find((row) => row.id === input.id);

  const reports: Report[] = existing
    ? state.reports.map((row) =>
        row.id === input.id
          ? {
              ...row,
              count: row.count + 1,
              // 3회 누적이면 자동 임시 블라인드 — 화면 부제가 약속하는 규칙이다
              status:
                row.status === "검토 대기" && row.count + 1 >= 3
                  ? "임시 블라인드"
                  : row.status,
              filings: [
                ...row.filings,
                { at, by: input.by, reason: input.reason },
              ],
            }
          : row,
      )
    : [
        {
          id: input.id,
          target: input.target,
          kind: input.kind,
          reason: input.reason,
          count: 1,
          status: "검토 대기",
          // 글 신고는 대상 id가 곧 글 id다 — 운영자가 블라인드하면
          // 게이트가 이 값으로 원문을 가린다. 리뷰·댓글 신고에는 넣지 않는다.
          postId: input.kind === "커뮤니티 글" ? input.id : undefined,
          author: input.author,
          at,
          body: input.body,
          note: "체험 중 접수된 신고예요, 이 브라우저에만 남아요",
          filings: [{ at, by: input.by, reason: input.reason }],
        },
        ...state.reports,
      ];

  saveState({ ...state, reports });

  const user = loadUser();
  saveUser({ ...user, reported: [...new Set([...user.reported, input.id])] });
  markProgress("report");

  return existing ? existing.count + 1 : 1;
}

const MY_EVIDENCE_ID = "ev-me";

/** 실적 인증 신청 — 운영자 증빙 검토 큐로 간다 */
export function submitEvidence(files: number) {
  const state = loadState();
  const now = new Date();
  const applied = `${String(now.getMonth() + 1).padStart(2, "0")}.${String(now.getDate()).padStart(2, "0")}`;

  // 등급 표기는 badges 페이지 사다리와 같은 문구여야 한다 — "전문가"라는
  // 등급은 사다리에 없어서 왕복 시연에서 어느 단계로 가는 신청인지 안 읽혔다.
  const row = {
    id: MY_EVIDENCE_ID,
    applied,
    nick: "김영업",
    change: "Lv.4 필드리더 → Lv.5 세일즈마스터",
    files,
    status: "대기",
  };

  saveState({
    ...state,
    evidence: [
      row,
      ...state.evidence.filter((item) => item.id !== MY_EVIDENCE_ID),
    ],
  });

  const user = loadUser();
  saveUser({ ...user, evidence: { status: "검토 대기", files } });
  markProgress("evidence");
}

/**
 * 1:1 문의 접수 — 운영자 문의 큐(백오피스 1:1 문의)에 실제로 쌓인다.
 *
 * 문의는 익명 커뮤니티와 달리 "내 계정의 일"이라 닉네임으로 남는다.
 * 답변이 달리면 알림 벨과 /contact 내 문의 내역으로 돌아온다 — 신고·증빙과
 * 같은 왕복이다. 외부(슬랙·메일)로는 보내지 않는다. 실서비스 모듈로 뗄 때
 * 그 연동은 운영자 답변 지점(run.ts inquiry.answer)에 붙는다.
 */
export function submitInquiry(input: {
  category: string;
  message: string;
  by: string;
}) {
  const state = loadState();
  const id = `inq-me-${crypto.randomUUID().slice(0, 8)}`;
  /* 내 기록을 먼저 남긴다 — saveState가 쏘는 오버레이 신호를 받은 화면이
     myInquiries()를 다시 읽는데, 그 시점에 user.inquiries가 비어 있으면
     방금 접수한 문의가 내역에서 빠진다(실측: 접수 직후 내역 미표시). */
  const user = loadUser();
  saveUser({ ...user, inquiries: [id, ...user.inquiries] });
  saveState({
    ...state,
    inquiries: [
      {
        id,
        category: input.category,
        message: input.message,
        by: input.by,
        at: stamp(),
        status: "대기",
      },
      ...state.inquiries,
    ],
  });
  return id;
}

/** 내 문의 내역 — 운영자 답변까지 포함해 오버레이(정본)에서 읽는다 */
export function myInquiries() {
  const user = loadUser();
  if (user.inquiries.length === 0) return [];
  const mine = new Set(user.inquiries);
  return loadState().inquiries.filter((row) => mine.has(row.id));
}

/**
 * 내 신청의 현재 상태 — 운영자가 승인·반려하면 여기로 돌아온다.
 * 관리자 오버레이가 정본이라 그쪽을 읽는다(방문자 오버레이는 신청 사실만 들고 있다).
 */
export function myEvidenceStatus() {
  const user = loadUser();
  if (!user.evidence) return null;
  const row = loadState().evidence.find((item) => item.id === MY_EVIDENCE_ID);
  if (!row) return user.evidence;
  return {
    status: (row.status === "대기" ? "검토 대기" : row.status) as
      "검토 대기" | "승인" | "반려",
    files: row.files,
    reason: row.reason,
  };
}
