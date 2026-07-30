import { SkMcard } from "@/components/admin/AdminSkeleton";
import { RouteSk, TableCardSk } from "@/components/admin/RouteSkeleton";

/** 회원 관리 스켈레톤 — 지표 4장 + 회원 표(시드 6행)를 미러링한다 */
export default function MembersLoading() {
  return (
    <RouteSk label="회원 관리">
      <div className="mrow">
        {Array.from({ length: 4 }).map((_, index) => (
          <SkMcard key={index} />
        ))}
      </div>
      <TableCardSk
        title="회원 목록"
        search="닉네임·이메일 검색"
        tabs={["전체", "인증", "정지"]}
        cols={["", "회원", "등급", "활동", "상태", "가입일", "조치"]}
        rows={6}
        // P1 그리드 재실측(1440px) — 줄바꿈 행이 사라져 전 행 한 줄, 마지막 행만 1px 낮다
        rowHs={[61.8, 61.8, 61.8, 61.8, 61.8, 60.8]}
      />
    </RouteSk>
  );
}
