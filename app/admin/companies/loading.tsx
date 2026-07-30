import { Icon } from "@/components/Icon";
import { SkMcard } from "@/components/admin/AdminSkeleton";
import { RouteSk, TableCardSk } from "@/components/admin/RouteSkeleton";

/** 회사 관리 스켈레톤 — 지표 3장 + 회사 표(시드 7행)를 미러링한다 */
export default function CompaniesLoading() {
  return (
    <RouteSk label="회사 관리">
      <div className="mrow" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
        {Array.from({ length: 3 }).map((_, index) => (
          <SkMcard key={index} />
        ))}
      </div>
      {/* 일괄 업로드 드롭존 — 내용이 전부 정적이라 실물 마크업 그대로가
          곧 완벽한 자리 예약이다(높이 142px 실측) */}
      <div className="dropzone" aria-hidden style={{ pointerEvents: "none" }}>
        <Icon name="upload" />
        <div>
          <b>CSV 파일을 끌어다 놓거나 클릭해서 업로드</b>
        </div>
        <div className="sub">
          회사명 · 업종 · 지역 열 인식 · 오류는 행 단위로 알려줘요 (콜드스타트
          대량 입력)
          <br />
          <span style={{ color: "var(--accent)", fontWeight: 700 }}>
            양식 내려받기
          </span>
        </div>
      </div>

      <TableCardSk
        title="회사 목록"
        search="회사명 검색"
        cols={[
          "회사",
          "업종 · 지역",
          "리뷰",
          "평점",
          "상태",
          // 실물 표(CompaniesAdmin)의 조치 th width와 같은 값 — 컬럼 경계 고정
          { label: "조치", width: 178 },
        ]}
        rows={7}
        // P1 그리드 재실측(1440px) — 조치 버튼 nowrap으로 전 행이 한 줄, 마지막 행만 1px 낮다
        rowHs={[52.2, 52.2, 52.2, 52.2, 52.2, 52.2, 51.2]}
      />
    </RouteSk>
  );
}
