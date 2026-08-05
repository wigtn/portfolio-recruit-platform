"use client";

import {
  AdminToolError,
  AdminToolRegistry,
  type AdminExecutionContext,
  type JsonObject,
} from "@wigtn/backoffice-frame";
import {
  loadState,
  saveState,
  withAudit,
  type AdminState,
  type GuardKey,
} from "./overlay";
import type { AdminAccount } from "./seed";
import { SAFETY_LABEL, getPost, type SafetyLevel } from "@/lib/seed/posts";
import { markProgress } from "@/lib/demo/progress";

/**
 * 관리자 조치 실행 — 브라우저에서 돈다.
 *
 * 판정은 벤더링한 backoffice-frame이 한다: **권한 → step-up 재인증 → 멱등키** 순으로
 * 실제 거절한다. 통과한 조치만 오버레이(localStorage)에 반영되고 감사 기록에 append된다.
 * 서버로 아무것도 보내지 않는다(r4 — 체험 입력은 DB에 기록하지 않는다).
 */

export type ToolResult =
  | { ok: true; message: string; state: AdminState }
  | { ok: false; code: string; message: string };

const GATE_MESSAGE: Record<string, string> = {
  PERMISSION_DENIED: "이 작업을 할 권한이 없어요. 운영자 역할로 전환해보세요.",
  STEP_UP_REQUIRED: "중요한 작업이라 본인 확인이 필요해요.",
  ACTIVE_SESSION_REQUIRED: "세션이 만료됐어요. 다시 로그인해주세요.",
  IDEMPOTENCY_KEY_REQUIRED:
    "중복 실행을 막기 위한 키가 없어 처리하지 않았어요.",
  INPUT_INVALID: "입력값이 올바르지 않아요.",
  TOOL_NOT_FOUND: "알 수 없는 작업이에요.",
};

/**
 * 거절의 성격.
 *
 * 막혔다고 다 실패는 아니다. "본인 확인이 필요해요"는 **다음 단계**이고,
 * "권한이 없어요, 운영자로 전환해보세요"는 방문자가 할 일이 있는 안내다.
 * 그걸 전부 빨강으로 띄우면 뭔가 고장 난 것으로 읽히고, 정작 진짜 고장
 * (알 수 없는 작업, 멱등 키 없음)과 구분되지 않는다.
 *
 * 톤을 호출부마다 정하지 않고 여기 문구 옆에 둔다 — 문구를 고치는 사람이
 * 톤도 같이 보게 된다.
 */
export type GateTone = "info" | "warn" | "error";

const GATE_TONE: Record<string, GateTone> = {
  // 할 일이 남은 것 — 사람이 이어서 하면 된다
  STEP_UP_REQUIRED: "warn",
  PERMISSION_DENIED: "warn",
  ACTIVE_SESSION_REQUIRED: "warn",
  INPUT_INVALID: "warn",
  // 여기부터는 우리 쪽 고장이다
  IDEMPOTENCY_KEY_REQUIRED: "error",
  TOOL_NOT_FOUND: "error",
};

/** 결과에 맞는 토스트 톤. 성공은 완료, 거절은 위 표, 모르는 코드는 실패 */
export function toneOf(res: ToolResult): "success" | GateTone {
  if (res.ok) return "success";
  return GATE_TONE[res.code] ?? "error";
}

/** 조치에 딸려오는 입력값 — 등록·수정처럼 id만으로 부족한 작업이 쓴다 */
export type ToolPayload = Record<string, unknown>;

type ToolSpec = {
  title: string;
  permissions: string[];
  risk: "low" | "medium" | "high";
  /** 오버레이 상태를 받아 새 상태를 돌려준다(불변) */
  apply: (
    state: AdminState,
    id: string,
    reason?: string,
    payload?: ToolPayload,
  ) => AdminState;
  /** 감사 기록에 남길 대상 라벨 */
  target: (state: AdminState, id: string, payload?: ToolPayload) => string;
};

const TOOLS: Record<string, ToolSpec> = {
  "report.blind": {
    title: "콘텐츠 블라인드",
    permissions: ["content.moderate"],
    risk: "high",
    apply: (state, id) => ({
      ...state,
      reports: state.reports.map((row) =>
        row.id === id ? { ...row, status: "블라인드" } : row,
      ),
    }),
    target: (state, id) =>
      state.reports.find((row) => row.id === id)?.target ?? id,
  },
  // 반려는 "조치하지 않음"이라 되돌리기 쉽다. 여기에도 재인증을 걸면
  // USER-FLOW §2.5의 경고대로 "고위험"이라는 개념 자체가 무뎌진다.
  "report.reject": {
    title: "신고 반려",
    permissions: ["content.moderate"],
    risk: "medium",
    apply: (state, id) => ({
      ...state,
      reports: state.reports.map((row) =>
        row.id === id ? { ...row, status: "반려" } : row,
      ),
    }),
    target: (state, id) =>
      state.reports.find((row) => row.id === id)?.target ?? id,
  },
  "report.delete": {
    title: "콘텐츠 삭제",
    permissions: ["content.moderate"],
    risk: "high",
    apply: (state, id) => ({
      ...state,
      reports: state.reports.map((row) =>
        row.id === id ? { ...row, status: "삭제" } : row,
      ),
    }),
    target: (state, id) =>
      state.reports.find((row) => row.id === id)?.target ?? id,
  },
  "report.restore": {
    title: "콘텐츠 복원",
    permissions: ["content.moderate"],
    risk: "high",
    apply: (state, id) => ({
      ...state,
      reports: state.reports.map((row) =>
        row.id === id ? { ...row, status: "복원" } : row,
      ),
    }),
    target: (state, id) =>
      state.reports.find((row) => row.id === id)?.target ?? id,
  },
  "report.revoke": {
    title: "실적 인증 취소",
    permissions: ["content.moderate"],
    risk: "high",
    apply: (state, id) => ({
      ...state,
      reports: state.reports.map((row) =>
        row.id === id ? { ...row, status: "인증 취소" } : row,
      ),
    }),
    target: (state, id) =>
      state.reports.find((row) => row.id === id)?.target ?? id,
  },
  "member.suspend": {
    title: "회원 정지",
    permissions: ["member.suspend"],
    risk: "high",
    apply: (state, id) => ({
      ...state,
      members: state.members.map((row) =>
        row.id === id ? { ...row, status: "정지" } : row,
      ),
    }),
    target: (state, id) =>
      state.members.find((row) => row.id === id)?.nick ?? id,
  },
  "member.restore": {
    title: "정지 해제",
    permissions: ["member.suspend"],
    risk: "high",
    apply: (state, id) => ({
      ...state,
      members: state.members.map((row) =>
        row.id === id ? { ...row, status: "정상" } : row,
      ),
    }),
    target: (state, id) =>
      state.members.find((row) => row.id === id)?.nick ?? id,
  },
  // 경고는 정지 전 단계 — 이력에 남고, 신고 누적과 함께 제재 판단 근거가 된다
  "member.warn": {
    title: "회원 경고",
    permissions: ["member.suspend"],
    risk: "medium",
    apply: (state, id, reason) => ({
      ...state,
      members: state.members.map((row) =>
        row.id === id
          ? {
              ...row,
              history: [
                { at: "오늘", what: `경고, ${reason ?? "정책 위반"}` },
                ...row.history,
              ],
            }
          : row,
      ),
    }),
    target: (state, id) =>
      state.members.find((row) => row.id === id)?.nick ?? id,
  },
  // 등급 조정 — 증빙 승인 외의 수동 보정. 이력에 남아 근거가 추적된다
  "member.grade": {
    title: "회원 등급 조정",
    permissions: ["grade.approve"],
    risk: "medium",
    apply: (state, id, _reason, payload) => ({
      ...state,
      members: state.members.map((row) =>
        row.id === id
          ? {
              ...row,
              grade: String(payload?.grade ?? row.grade),
              history: [
                {
                  at: "오늘",
                  what: `등급 조정, ${row.grade} → ${String(payload?.grade ?? row.grade)}`,
                },
                ...row.history,
              ],
            }
          : row,
      ),
    }),
    target: (state, id) =>
      state.members.find((row) => row.id === id)?.nick ?? id,
  },
  // 강제 탈퇴 — 복구가 없는 최종 제재. 고위험 재인증 + 확인 다이얼로그 두 겹
  "member.expel": {
    title: "회원 강제 탈퇴",
    permissions: ["member.suspend"],
    risk: "high",
    apply: (state, id) => ({
      ...state,
      members: state.members.map((row) =>
        row.id === id ? { ...row, status: "탈퇴" } : row,
      ),
    }),
    target: (state, id) =>
      state.members.find((row) => row.id === id)?.nick ?? id,
  },
  "evidence.approve": {
    title: "증빙 승인",
    permissions: ["grade.approve"],
    risk: "medium",
    // 승인은 증빙 상태만 바꾸는 게 아니다 — 신청의 목적은 등급이므로, 회원 관리의
    // 등급·이력이 함께 올라가야 화면 사이 숫자가 어긋나지 않는다(신청 change 문구 기준).
    apply: (state, id) => {
      const row = state.evidence.find((item) => item.id === id);
      const next = {
        ...state,
        evidence: state.evidence.map((item) =>
          item.id === id ? { ...item, status: "승인" } : item,
        ),
      };
      if (!row) return next;
      // change 문구는 "Lv.3 리뷰어 → Lv.4 필드리더" — 화살표 오른쪽이 곧 새 등급 표기다
      const grade = row.change.split("→").pop()?.trim() ?? "";
      if (!grade) return next;
      const now = new Date();
      const at = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, "0")}.${String(now.getDate()).padStart(2, "0")}`;
      return {
        ...next,
        members: state.members.map((member) =>
          member.nick === row.nick
            ? {
                ...member,
                grade,
                history: [
                  { at, what: `${grade} 등급 승인` },
                  ...member.history,
                ],
              }
            : member,
        ),
      };
    },
    target: (state, id) =>
      state.evidence.find((row) => row.id === id)?.nick ?? id,
  },
  "evidence.reject": {
    title: "증빙 반려",
    permissions: ["grade.approve"],
    risk: "medium",
    apply: (state, id, reason) => ({
      ...state,
      evidence: state.evidence.map((row) =>
        row.id === id ? { ...row, status: "반려", reason } : row,
      ),
    }),
    target: (state, id) =>
      state.evidence.find((row) => row.id === id)?.nick ?? id,
  },

  // ── AI 운영 ──
  // 보호를 약하게 만드는 쪽만 고위험이다. 끄는 건 재인증을 요구하고, 켜는 건 바로 통과시킨다
  // — 실제 백오피스가 이렇게 생겼고, 게이트가 장식이 아니라는 걸 이 대비로 보여준다.
  "ai.safety": {
    title: "AI 안전 강도 변경",
    permissions: ["ai.configure"],
    risk: "medium",
    apply: (state, id) => ({
      ...state,
      ai: { ...state.ai, safety: id as SafetyLevel },
    }),
    target: (state, id) => `안전 강도 → ${SAFETY_LABEL[id as SafetyLevel]}`,
  },
  "ai.guard.off": {
    title: "안전 장치 끄기",
    permissions: ["ai.configure"],
    risk: "high",
    apply: (state, id) => ({
      ...state,
      ai: {
        ...state.ai,
        guards: { ...state.ai.guards, [id as GuardKey]: false },
      },
    }),
    target: (_state, id) => GUARD_LABEL[id as GuardKey] ?? id,
  },
  "ai.guard.on": {
    title: "안전 장치 켜기",
    permissions: ["ai.configure"],
    risk: "low",
    apply: (state, id) => ({
      ...state,
      ai: {
        ...state.ai,
        guards: { ...state.ai.guards, [id as GuardKey]: true },
      },
    }),
    target: (_state, id) => GUARD_LABEL[id as GuardKey] ?? id,
  },
  "ai.quota": {
    title: "체험 호출 한도 변경",
    permissions: ["ai.configure"],
    // 한도를 올리면 토큰 비용이 올라간다 — 무심코 바꾸지 못하게 중위험으로 둔다
    risk: "medium",
    apply: (state, id) => ({
      ...state,
      ai: { ...state.ai, quota: Number(id) },
    }),
    target: (_state, id) => `세션당 ${id}회`,
  },
};

/* ── 회사 관리 ── */
Object.assign(TOOLS, {
  "company.create": {
    title: "회사 등록",
    permissions: ["company.manage"],
    risk: "low",
    apply: (state, id, _reason, payload) => ({
      ...state,
      companies: [
        {
          id,
          logo: String(payload?.name ?? "?").slice(0, 1),
          name: String(payload?.name ?? ""),
          industry: String(payload?.industry ?? ""),
          region: String(payload?.region ?? ""),
          reviews: 0,
          rating: null,
          status: "노출중",
        },
        ...state.companies,
      ],
    }),
    target: (_state, _id, payload) => String(payload?.name ?? "새 회사"),
  },
  "company.update": {
    title: "회사 정보 수정",
    permissions: ["company.manage"],
    risk: "low",
    apply: (state, id, _reason, payload) => ({
      ...state,
      companies: state.companies.map((row) =>
        row.id === id
          ? {
              ...row,
              name: String(payload?.name ?? row.name),
              industry: String(payload?.industry ?? row.industry),
              region: String(payload?.region ?? row.region),
            }
          : row,
      ),
    }),
    target: (state, id) => state.companies.find((r) => r.id === id)?.name ?? id,
  },
  // 병합은 리뷰가 옮겨 붙고 원래 회사가 사라진다 — 되돌릴 수 없어 고위험이다
  "company.merge": {
    title: "중복 회사 병합",
    permissions: ["company.manage"],
    risk: "high",
    apply: (state, id, _reason, payload) => {
      const dupe = state.companies.find((row) => row.id === id);
      const intoId = String(payload?.into ?? "");
      if (!dupe) return state;
      return {
        ...state,
        companies: state.companies
          .map((row) =>
            row.id === intoId
              ? { ...row, reviews: row.reviews + dupe.reviews }
              : row,
          )
          .filter((row) => row.id !== id),
      };
    },
    target: (state, id, payload) => {
      const dupe = state.companies.find((row) => row.id === id)?.name ?? id;
      const into =
        state.companies.find((row) => row.id === payload?.into)?.name ?? "";
      return into ? `${dupe} → ${into}` : dupe;
    },
  },
  "company.publish": {
    title: "회사 노출",
    permissions: ["company.manage"],
    risk: "low",
    apply: (state, id) => ({
      ...state,
      companies: state.companies.map((row) =>
        row.id === id ? { ...row, status: "노출중" } : row,
      ),
    }),
    target: (state, id) => state.companies.find((r) => r.id === id)?.name ?? id,
  },
  "company.hide": {
    title: "회사 숨김",
    permissions: ["company.manage"],
    risk: "medium",
    apply: (state, id) => ({
      ...state,
      companies: state.companies.map((row) =>
        row.id === id ? { ...row, status: "숨김" } : row,
      ),
    }),
    target: (state, id) => state.companies.find((r) => r.id === id)?.name ?? id,
  },
  "company.import": {
    title: "회사 일괄 등록",
    permissions: ["company.manage"],
    risk: "medium",
    apply: (state, _id, _reason, payload) => {
      const rows = Array.isArray(payload?.rows)
        ? (payload.rows as Array<Record<string, string>>)
        : [];
      return {
        ...state,
        companies: [
          // id를 이름에서 만들면 같은 CSV 재업로드 때 중복돼 React key가 충돌한다
          ...rows.map((row) => ({
            id: `co-x-${crypto.randomUUID().slice(0, 8)}`,
            logo: (row.name ?? "?").slice(0, 1),
            name: row.name ?? "",
            industry: row.industry ?? "",
            region: row.region ?? "",
            reviews: 0,
            rating: null,
            status: "엑셀 신규",
          })),
          ...state.companies,
        ],
      };
    },
    target: (_state, _id, payload) =>
      `${Array.isArray(payload?.rows) ? payload.rows.length : 0}개 회사`,
  },

  /* ── 질문 답변 ── */
  // 운영자 답변 등록 — 시드 글은 손대지 않고 오버레이 answers에 쌓는다.
  // 사용자 글 상세가 즉시 병합해 보여주므로 발행 권한(content.publish)을 요구하되,
  // 언제든 데모 초기화로 되돌릴 수 있어 저위험으로 둔다(재인증 없이 왕복이 이어진다).
  /* 답변은 문의자 화면(알림 벨·/contact 내역)으로 그대로 돌아간다.
     실서비스 모듈로 뗄 때 슬랙·메일 발송 연동이 붙는 자리가 여기다. */
  "inquiry.answer": {
    title: "1:1 문의 답변",
    permissions: ["content.publish"],
    risk: "low",
    apply: (state, id, _reason, payload) => ({
      ...state,
      inquiries: state.inquiries.map((row) =>
        row.id === id
          ? {
              ...row,
              status: "답변완료" as const,
              answer: String(payload?.text ?? ""),
              answeredAt: new Date().toISOString(),
            }
          : row,
      ),
    }),
    // 감사 기록에는 분류와 문의자가 남아야 한다 — id만으로는 못 찾는다
    target: (state, id) => {
      const row = state.inquiries.find((item) => item.id === id);
      return row ? `${row.category} 문의 (${row.by})` : id;
    },
  },

  "question.answer": {
    title: "운영자 답변 등록",
    permissions: ["content.publish"],
    risk: "low",
    apply: (state, id, _reason, payload) => ({
      ...state,
      answers: [
        ...state.answers,
        {
          postId: id,
          text: String(payload?.text ?? ""),
          at: new Date().toISOString(),
          actor: "admin.kim",
        },
      ],
    }),
    // 감사 기록에는 글 제목이 남아야 한다 — id만 남으면 무엇에 답했는지 못 찾는다
    target: (_state, id) => getPost(id)?.title ?? id,
  },

  /* ── 공지 · 정책 ── */
  "notice.create": {
    title: "문서 등록",
    permissions: ["content.publish"],
    risk: "low",
    apply: (state, id, _reason, payload) => ({
      ...state,
      notices: [
        {
          id,
          kind: (payload?.kind as "notice" | "faq" | "terms") ?? "notice",
          title: String(payload?.title ?? ""),
          place: String(payload?.place ?? "공지사항"),
          date: String(payload?.date ?? ""),
          status: "노출중",
          body: String(payload?.body ?? ""),
        },
        ...state.notices,
      ],
    }),
    target: (_state, _id, payload) => String(payload?.title ?? "새 문서"),
  },
  "notice.update": {
    title: "문서 수정",
    permissions: ["content.publish"],
    risk: "low",
    apply: (state, id, _reason, payload) => ({
      ...state,
      notices: state.notices.map((row) =>
        row.id === id
          ? {
              ...row,
              title: String(payload?.title ?? row.title),
              body: String(payload?.body ?? row.body),
            }
          : row,
      ),
    }),
    target: (state, id) => state.notices.find((r) => r.id === id)?.title ?? id,
  },
  // 내리면 서비스 화면에서 즉시 사라진다 — 이용자가 보던 안내가 없어지므로 중위험
  "notice.unpublish": {
    title: "문서 내리기",
    permissions: ["content.publish"],
    risk: "medium",
    apply: (state, id) => ({
      ...state,
      notices: state.notices.map((row) =>
        row.id === id ? { ...row, status: "내림", pinned: false } : row,
      ),
    }),
    target: (state, id) => state.notices.find((r) => r.id === id)?.title ?? id,
  },
  // 고정은 서비스 공지 목록의 맨 위 자리를 정하는 일 — 내리기(unpublish)가 pinned를
  // 지우므로, 다시 고정할 방법이 화면에 있어야 운영 도구가 된다.
  "notice.pin": {
    title: "문서 상단 고정",
    permissions: ["content.publish"],
    risk: "low",
    apply: (state, id) => ({
      ...state,
      notices: state.notices.map((row) =>
        row.id === id ? { ...row, pinned: true } : row,
      ),
    }),
    target: (state, id) => state.notices.find((r) => r.id === id)?.title ?? id,
  },
  "notice.unpin": {
    title: "문서 고정 해제",
    permissions: ["content.publish"],
    risk: "low",
    apply: (state, id) => ({
      ...state,
      notices: state.notices.map((row) =>
        row.id === id ? { ...row, pinned: false } : row,
      ),
    }),
    target: (state, id) => state.notices.find((r) => r.id === id)?.title ?? id,
  },
  "notice.publish": {
    title: "문서 노출",
    permissions: ["content.publish"],
    risk: "low",
    apply: (state, id) => ({
      ...state,
      notices: state.notices.map((row) =>
        row.id === id
          ? { ...row, status: row.kind === "terms" ? "시행중" : "노출중" }
          : row,
      ),
    }),
    target: (state, id) => state.notices.find((r) => r.id === id)?.title ?? id,
  },

  /* ── 큐레이션 ── */
  // 홈 첫 화면이 통째로 바뀐다 — 되돌릴 수 있지만 이용자에게 바로 보이므로 중위험
  "curation.save": {
    title: "큐레이션 변경",
    permissions: ["content.publish"],
    risk: "medium",
    apply: (state, _id, _reason, payload) => ({
      ...state,
      curation: (payload?.curation as AdminState["curation"]) ?? state.curation,
    }),
    target: (_state, _id, payload) => String(payload?.summary ?? "홈 배치"),
  },

  /* ── 채용공고 ── */
  // 마감은 사용자 화면에서 즉시 사라지는 조치 — 되돌릴 수 있어 중위험
  "job.close": {
    title: "채용공고 마감",
    permissions: ["content.publish"],
    risk: "medium",
    apply: (state, id) => ({
      ...state,
      jobs: state.jobs.map((row) =>
        row.id === id ? { ...row, status: "마감" as const } : row,
      ),
    }),
    target: (state, id) => state.jobs.find((r) => r.id === id)?.title ?? id,
  },
  "job.open": {
    title: "채용공고 노출",
    permissions: ["content.publish"],
    risk: "low",
    apply: (state, id) => ({
      ...state,
      jobs: state.jobs.map((row) =>
        row.id === id ? { ...row, status: "노출중" as const } : row,
      ),
    }),
    target: (state, id) => state.jobs.find((r) => r.id === id)?.title ?? id,
  },
  "job.create": {
    title: "채용공고 등록",
    permissions: ["content.publish"],
    risk: "medium",
    apply: (state, id, _reason, payload) => ({
      ...state,
      jobs: [
        {
          id,
          companySlug: String(payload?.companySlug ?? ""),
          company: String(payload?.company ?? ""),
          title: String(payload?.title ?? "새 공고"),
          employment: String(payload?.employment ?? "정규직"),
          career: String(payload?.career ?? "경력 무관"),
          payLow: Number(payload?.payLow ?? 0),
          payHigh: Number(payload?.payHigh ?? 0),
          daysLeft: payload?.daysLeft === null ? null : Number(payload?.daysLeft ?? 14),
          status: "노출중" as const,
        },
        ...state.jobs,
      ],
    }),
    target: (_state, _id, payload) => String(payload?.title ?? "새 공고"),
  },
  // 삭제는 복구가 없다 — 고위험 재인증
  "job.delete": {
    title: "채용공고 삭제",
    permissions: ["content.publish"],
    risk: "high",
    apply: (state, id) => ({
      ...state,
      jobs: state.jobs.filter((row) => row.id !== id),
    }),
    target: (state, id) => state.jobs.find((r) => r.id === id)?.title ?? id,
  },

  /* ── 운영자 계정 ── */
  // 역할은 다른 화면 전부의 판정 근거 — 정책 변경과 같은 급의 고위험이다
  "admin.role": {
    title: "운영자 역할 변경",
    permissions: ["policy.manage"],
    risk: "high",
    apply: (state, id, _reason, payload) => ({
      ...state,
      admins: state.admins.map((row) =>
        row.id === id
          ? { ...row, role: (payload?.role as AdminAccount["role"]) ?? row.role }
          : row,
      ),
    }),
    target: (state, id) =>
      state.admins.find((r) => r.id === id)?.handle ?? id,
  },
  "admin.suspend": {
    title: "운영자 계정 정지",
    permissions: ["policy.manage"],
    risk: "high",
    apply: (state, id) => ({
      ...state,
      admins: state.admins.map((row) =>
        row.id === id ? { ...row, status: "정지" as const } : row,
      ),
    }),
    target: (state, id) =>
      state.admins.find((r) => r.id === id)?.handle ?? id,
  },
  "admin.activate": {
    title: "운영자 계정 활성화",
    permissions: ["policy.manage"],
    risk: "medium",
    apply: (state, id) => ({
      ...state,
      admins: state.admins.map((row) =>
        row.id === id ? { ...row, status: "활성" as const } : row,
      ),
    }),
    target: (state, id) =>
      state.admins.find((r) => r.id === id)?.handle ?? id,
  },
  // 초대는 되돌리기 쉬워 중위험 — 계정은 "초대됨"으로 생기고 접속 전까지 권한이 없다
  "admin.invite": {
    title: "운영자 초대",
    permissions: ["policy.manage"],
    risk: "medium",
    apply: (state, id, _reason, payload) => ({
      ...state,
      admins: [
        ...state.admins,
        {
          id,
          handle: String(payload?.handle ?? "new@demo.wigtn.dev"),
          name: String(payload?.name ?? "새 운영자"),
          role: (payload?.role as AdminAccount["role"]) ?? "viewer",
          twoFA: false,
          lastActive: "-",
          status: "초대됨" as const,
        },
      ],
    }),
    target: (_state, _id, payload) =>
      String(payload?.handle ?? "새 운영자"),
  },

  /* ── 권한 정책 ── */
  // 권한을 바꾸는 건 다른 모든 게이트의 근거를 바꾸는 일이라 재인증을 요구한다
  "policy.save": {
    title: "권한 정책 변경",
    permissions: ["policy.manage"],
    risk: "high",
    apply: (state, _id, _reason, payload) => ({
      ...state,
      policy: (payload?.policy as AdminState["policy"]) ?? state.policy,
    }),
    target: (_state, _id, payload) => String(payload?.summary ?? "역할별 권한"),
  },
} satisfies Record<string, ToolSpec>);

/** 등록된 운영 도구 수 — 상담 페이지 모듈 쇼케이스가 실수치로 인용한다 */
export const ADMIN_TOOL_COUNT = Object.keys(TOOLS).length;

export const GUARD_LABEL: Record<GuardKey, string> = {
  rule: "규칙 필터",
  moderation: "AI 모더레이션",
  human: "사람 확인",
};

/** 레지스트리는 한 번만 만든다 — 매니페스트 검증 비용을 반복하지 않게 */
let registryRef: AdminToolRegistry | null = null;

function getRegistry() {
  if (registryRef) return registryRef;
  const registry = new AdminToolRegistry();

  for (const [name, spec] of Object.entries(TOOLS)) {
    registry.register({
      manifest: {
        name,
        version: 1,
        title: spec.title,
        description: spec.title,
        kind: "command",
        inputSchema: { type: "object", additionalProperties: true },
        outputSchema: { type: "object", additionalProperties: true },
        permissions: spec.permissions,
        risk: spec.risk,
        // 모듈 규칙: 고위험은 멱등키 필수, 그 외는 선택
        idempotency: spec.risk === "high" ? "required" : "optional",
        audit: { mode: "always", action: name, captureBeforeAfter: true },
        executionMode: "sync",
      },
      privateAudit: { redactPaths: [] },
      // 실제 상태 변경은 게이트 통과 뒤 호출부에서 한다(핸들러는 판정 통과 신호만)
      execution: { handler: async (input) => input as JsonObject },
    });
  }

  registryRef = registry;
  return registry;
}

/** 운영자에게 주는 권한 — 권한 정책 화면의 admin 열과 같은 목록이다 */
const ADMIN_PERMISSIONS = [
  "content.moderate",
  "member.suspend",
  "grade.approve",
  "ai.configure",
  "company.manage",
  "content.publish",
  "policy.manage",
];

const POLICY_BY_PERMISSION: Record<string, string> = {
  "content.moderate": "pl-4",
  "member.suspend": "pl-5",
  "grade.approve": "pl-6",
  "company.manage": "pl-7",
  "ai.configure": "pl-9",
  "content.publish": "pl-10",
  "policy.manage": "pl-11",
};

function permissionsFor(state: AdminState, isAdmin: boolean) {
  if (!isAdmin) return new Set<string>();
  return new Set(
    ADMIN_PERMISSIONS.filter((permission) => {
      const rowId = POLICY_BY_PERMISSION[permission];
      if (!rowId) return true;
      const row = state.policy.find((item) => item.id === rowId);
      return row?.grants[2] === "yes";
    }),
  );
}

const IDEMPOTENCY_KEY = "wigtn-demo-admin-idempotency-v1";
const inFlight = new Set<string>();

function completedKeys() {
  if (typeof window === "undefined") return new Set<string>();
  try {
    const parsed = JSON.parse(
      window.localStorage.getItem(IDEMPOTENCY_KEY) ?? "[]",
    );
    return new Set(Array.isArray(parsed) ? (parsed as string[]) : []);
  } catch {
    window.localStorage.removeItem(IDEMPOTENCY_KEY);
    return new Set<string>();
  }
}

function rememberCompleted(key: string) {
  const keys = completedKeys();
  keys.add(key);
  // 체험 세션에서 무한히 자라지 않게 최근 200개만 유지한다.
  window.localStorage.setItem(
    IDEMPOTENCY_KEY,
    JSON.stringify([...keys].slice(-200)),
  );
}

export async function runAdminTool(input: {
  tool: string;
  id: string;
  isAdmin: boolean;
  verified: boolean;
  idempotencyKey?: string;
  reason?: string;
  payload?: ToolPayload;
}): Promise<ToolResult> {
  const requestKey = input.idempotencyKey ?? crypto.randomUUID();
  const spec = TOOLS[input.tool];
  if (!spec) {
    return {
      ok: false,
      code: "TOOL_NOT_FOUND",
      message: "알 수 없는 작업이에요.",
    };
  }

  if (inFlight.has(requestKey) || completedKeys().has(requestKey)) {
    return {
      ok: true,
      message: "이미 처리된 요청이에요. 같은 조치를 다시 적용하지 않았어요.",
      state: loadState(),
    };
  }

  const before = loadState();
  const context: AdminExecutionContext = {
    actorId: "admin.kim",
    claims: { sub: "admin.kim" },
    permissions: permissionsFor(before, input.isAdmin),
    traceId: crypto.randomUUID(),
    idempotencyKey: requestKey,
    stepUp: { recentTotp: input.verified, activeSession: true },
  };

  inFlight.add(requestKey);
  try {
    await getRegistry().execute(
      input.tool,
      1,
      { id: input.id, reason: input.reason, ...input.payload },
      context,
    );
  } catch (error) {
    if (error instanceof AdminToolError) {
      return {
        ok: false,
        code: error.code,
        message: GATE_MESSAGE[error.code] ?? error.message,
      };
    }
    return {
      ok: false,
      code: "FAILED",
      message: error instanceof Error ? error.message : "처리하지 못했어요.",
    };
  } finally {
    inFlight.delete(requestKey);
  }

  // 게이트 통과 — 오버레이에만 반영한다
  const applied = spec.apply(before, input.id, input.reason, input.payload);
  const next = withAudit(applied, {
    actor: context.actorId,
    action: spec.title,
    target: spec.target(before, input.id, input.payload),
    reason: input.reason || "운영자 조치",
  });
  saveState(next);
  rememberCompleted(requestKey);
  markProgress("audit");
  if (spec.risk === "high" && input.verified) markProgress("step-up");
  if (input.tool === "policy.save") markProgress("policy");
  if (input.tool === "company.import") markProgress("company-import");
  if (input.tool === "curation.save") markProgress("curation");
  if (input.tool === "question.answer") markProgress("question");

  // 한국어 조사 — 앞말 받침 유무로 을/를이 갈린다. 템플릿에 '를'을 박으면
  // "권한 정책 변경를"처럼 어색해진다.
  const eul = (() => {
    const last = spec.title.charCodeAt(spec.title.length - 1);
    const isHangul = last >= 0xac00 && last <= 0xd7a3;
    return isHangul && (last - 0xac00) % 28 !== 0 ? "을" : "를";
  })();
  return { ok: true, message: `${spec.title}${eul} 적용했어요.`, state: next };
}
