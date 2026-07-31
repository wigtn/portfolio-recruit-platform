import { SkMcard } from "@/components/admin/AdminSkeleton";
import { RouteSk, TableCardSk } from "@/components/admin/RouteSkeleton";

/** 신고 관리 스켈레톤 — 지표 4장 + 미처리 탭 표(시드 6행)를 미러링한다 */
export default function ReportsLoading() {
  return (
    <RouteSk label="신고 관리">
      <div className="mrow">
        {Array.from({ length: 4 }).map((_, index) => (
          <SkMcard key={index} />
        ))}
      </div>
      {/* 4행 = 기본 탭(미처리)의 시드 열림 건수 — 전체 6건이 아니다.
          행 높이는 1440px 실측 — P1 그리드(패딩 10px·첫끝 20px)에선 조치
          버튼이 줄바꿈되지 않아 전 행이 한 줄이다. 마지막 행은 구분선이 없어 1px 낮다. */}
      <TableCardSk
        title="신고 목록"
        search="신고 대상, 사유 검색"
        tabs={["미처리", "처리완료"]}
        cols={["", "신고 대상", "유형", "사유", "누적", "상태", "조치"]}
        rows={4}
        rowHs={[52.2, 52.2, 52.2, 51.2]}
      />
    </RouteSk>
  );
}
