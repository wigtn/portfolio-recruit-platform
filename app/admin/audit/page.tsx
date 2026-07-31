import { AuditTable } from "@/components/admin/AuditTable";

export const metadata = { title: "처리 기록, 백오피스" };

/** 시안 정본 17번(처리 기록) — 조치가 append-only로 쌓이는 걸 확인하는 화면 */
export default function AuditPage() {
  return <AuditTable />;
}
