import { RouteSk, TableCardSk } from "@/components/admin/RouteSkeleton";

/** 공지 · 정책 스켈레톤 — 공지 표(시드 10행)를 미러링한다 */
export default function NoticesLoading() {
  return (
    <RouteSk label="공지 · 정책">
      {/* 3행 = 기본 탭(공지사항)의 시드 수. P1 그리드 재실측(1440px) —
          조치 버튼 nowrap으로 전 행이 한 줄, 마지막 행은 구분선이 없어 1px 낮다 */}
      <TableCardSk
        title="문서 목록"
        search="제목 검색"
        actions={[96]}
        tabs={["공지사항", "자주 묻는 질문", "약관 · 정책"]}
        cols={[
          "제목",
          "노출 위치",
          "게시일",
          "상태",
          // 실물 표(NoticesAdmin)의 조치 th width와 같은 값 — 컬럼 경계 고정
          { label: "조치", width: 212 },
        ]}
        rows={3}
        rowHs={[52.2, 52.2, 51.2]}
      />
    </RouteSk>
  );
}
