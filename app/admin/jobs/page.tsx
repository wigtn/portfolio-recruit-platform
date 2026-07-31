import { JobsAdmin } from "@/components/admin/JobsAdmin";

export const metadata = { title: "채용공고, 백오피스" };

/** 채용공고 관리 — 등록·마감·재노출·삭제가 사용자 /jobs로 그대로 돌아간다 */
export default function JobsPage() {
  return <JobsAdmin />;
}
