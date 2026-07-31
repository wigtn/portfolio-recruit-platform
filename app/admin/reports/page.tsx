import { ReportsTable } from "@/components/admin/ReportsTable";

export const metadata = { title: "신고 처리, 백오피스" };

/**
 * 시안 정본 12번(신고 관리).
 * 지표·표·조치는 클라이언트 컴포넌트가 맡는다 — 전부 같은 오버레이를 읽어야 숫자가 맞고,
 * 조치는 실제로 모듈 게이트를 통과해야 하므로.
 */
export default function ReportsPage() {
  return (
    <>
      <ReportsTable />
    </>
  );
}
