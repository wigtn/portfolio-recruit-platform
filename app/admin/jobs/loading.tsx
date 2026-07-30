import { JobsAdminSk } from "@/components/admin/JobsAdmin";
import { RouteSk } from "@/components/admin/RouteSkeleton";

/** 채용공고 스켈레톤 — 그리드 미러(컬럼 정적, 행만 shimmer) */
export default function JobsLoading() {
  return (
    <RouteSk label="채용공고">
      <JobsAdminSk />
    </RouteSk>
  );
}
