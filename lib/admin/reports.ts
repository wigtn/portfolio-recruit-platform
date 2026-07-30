import type { Report } from "./seed";

/**
 * 신고 상태 규칙 — 표의 탭·배지·조치 버튼이 전부 여기서 나온다.
 * 시안은 행마다 다른 버튼 쌍(삭제/복원 · 블라인드/반려 · 인증 취소/반려)을 그려놨다.
 * 그건 유형과 상태에 따라 할 수 있는 일이 다르기 때문이라, 규칙으로 옮겼다.
 */

export type Tab = "open" | "closed";

export const TABS: Array<{ key: Tab; label: string }> = [
  { key: "open", label: "미처리" },
  { key: "closed", label: "처리완료" },
];

/** 아직 판단이 남은 상태 — 자동 임시 블라인드도 사람이 확정해야 끝난다 */
const OPEN = new Set(["검토 대기", "임시 블라인드"]);

export function tabOf(report: Report): Tab {
  return OPEN.has(report.status) ? "open" : "closed";
}

export function badgeOf(status: string) {
  if (status === "블라인드" || status === "삭제" || status === "인증 취소")
    return "bs no";
  if (status === "반려" || status === "복원") return "bs ok";
  return "bs wait";
}

export type Action = { tool: string; label: string; danger?: boolean };

export function actionsOf(report: Report): Action[] {
  switch (report.status) {
    case "임시 블라인드":
      // 이미 자동으로 가려진 상태 — 지울지 되살릴지만 남았다
      return [
        { tool: "report.delete", label: "삭제", danger: true },
        { tool: "report.restore", label: "복원" },
      ];
    case "검토 대기":
      return report.kind === "실적 인증"
        ? [
            { tool: "report.revoke", label: "인증 취소", danger: true },
            { tool: "report.reject", label: "반려" },
          ]
        : [
            { tool: "report.blind", label: "블라인드", danger: true },
            { tool: "report.reject", label: "반려" },
          ];
    case "블라인드":
    case "삭제":
    case "인증 취소":
      return [{ tool: "report.restore", label: "복원" }];
    default:
      // 반려·복원 — 다시 문제가 되면 블라인드로 되돌릴 수 있다
      return [{ tool: "report.blind", label: "블라인드", danger: true }];
  }
}

/** 조치별 감사 사유 — 왜 했는지가 남아야 추적이 된다 */
export const REASON: Record<string, string> = {
  "report.blind": "신고 누적·정책 위반",
  "report.reject": "정책 위반 아님 — 신고 반려",
  "report.delete": "스팸·광고 확인 — 콘텐츠 삭제",
  "report.restore": "정책 위반 아님 — 콘텐츠 복원",
  "report.revoke": "증빙 불일치 — 실적 인증 취소",
};
