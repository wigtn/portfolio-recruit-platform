import { ROW_H } from "@/components/admin/AdminSkeleton";
import { RouteSk, TableCardSk } from "@/components/admin/RouteSkeleton";

/**
 * 처리 기록 스켈레톤 — 표 1행은 시드 기본값이다. 감사 기록은 조치할수록
 * 쌓이므로 첫 방문(오버레이 없음) 기준으로만 자리를 맞춘다.
 */
export default function AuditLoading() {
  return (
    <RouteSk label="처리 기록">
      <TableCardSk
        title="최근 활동"
        actions={[146]}
        search="대상, 사유 검색"
        tabs={["전체", "콘텐츠", "회원", "설정"]}
        cols={["시각", "운영자", "액션", "대상", "사유"]}
        rows={1}
        rowH={ROW_H.audit}
      />
    </RouteSk>
  );
}
