import { CompaniesAdmin } from "@/components/admin/CompaniesAdmin";

export const metadata = { title: "회사 관리 — 백오피스" };

/** 시안 정본 15번(회사 관리) — 등록·병합·일괄 업로드가 실제로 동작한다 */
export default function CompaniesPage() {
  return <CompaniesAdmin />;
}
