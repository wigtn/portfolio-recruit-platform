import { PolicyTabs } from "@/components/admin/PolicyTabs";

export const metadata = { title: "권한 정책 | 백오피스" };

/** 시안 정본 19번(권한 정책) — 역할 정책 · 운영자 계정 · 보안 규칙 세 탭 */
export default function PoliciesPage() {
  return <PolicyTabs />;
}
