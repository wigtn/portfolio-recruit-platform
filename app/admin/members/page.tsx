import { MembersTable } from "@/components/admin/MembersTable";

export const metadata = { title: "회원 관리, 백오피스" };

/** 시안 정본 13번(회원 관리) — 정지·해제는 고위험이라 재인증을 거친다 */
export default function MembersPage() {
  return <MembersTable />;
}
