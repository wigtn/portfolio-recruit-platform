import { PolicyMatrixSk } from "@/components/admin/PolicyStatic";
import { RouteSk } from "@/components/admin/RouteSkeleton";

/**
 * 권한 정책 스켈레톤 — 탭 바(정적 라벨 실물) + 기본 탭(역할 정책) 미러.
 * 구조·라벨이 전부 정적이라 실물 마크업 그대로 자리를 잡고, 토글 자리만
 * shimmer다(전환 시 크기 변화 0).
 */
export default function PoliciesLoading() {
  return (
    <RouteSk label="권한 정책">
      <div className="seg poltabs" aria-hidden>
        <button type="button" className="on">
          역할 정책
        </button>
        <button type="button">운영자 계정</button>
        <button type="button">보안 규칙</button>
      </div>
      <PolicyMatrixSk />
    </RouteSk>
  );
}
