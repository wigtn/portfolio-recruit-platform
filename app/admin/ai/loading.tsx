import { Sk } from "@/components/Skeleton";
import { SkMcard } from "@/components/admin/AdminSkeleton";
import { RouteSk, TableCardSk } from "@/components/admin/RouteSkeleton";

/**
 * AI 운영 스켈레톤 — 안전 강도(라디오형 예시 3행)/장치 카드 2장 + 지표 3장 +
 * 처리 내역 그리드(툴바 43px 포함, AI_LOG 4행)를 미러링한다.
 */
export default function AiLoading() {
  return (
    <RouteSk label="AI 운영">
      <div className="dashgrid ai-config-grid">
        <div className="tablecard" aria-hidden>
          <div className="tabletop">
            <h4>AI 안전 강도</h4>
          </div>
          {/* 실물 = 라디오형 예시 행 3개(60px, gap 6) + 노트(37.2) — 재실측 미러 */}
          <div className="safety-body">
            <div style={{ display: "grid", gap: 6 }}>
              {[0, 1, 2].map((index) => (
                <Sk key={index} w="100%" h={60} r={10} />
              ))}
            </div>
            {/* 노트 실측 37.2px(두 줄) — 줄 높이가 아니라 블록 높이로 고정 */}
            <div
              style={{
                display: "grid",
                gap: 5,
                margin: "16px 2px 0" /* 실물: gap 6 + note margin 10 */,
                height: 37.2,
                alignContent: "center",
              }}
            >
              <Sk w="86%" h={12} />
              <Sk w="40%" h={12} />
            </div>
          </div>
        </div>
        <div className="tablecard" aria-hidden>
          <div className="tabletop">
            <h4>안전 장치 구성</h4>
          </div>
          <div style={{ padding: "14px 16px" }}>
            {/* 실제 .qrow(이름+설명 두 줄) 3행 — 호출 한도는 데모 장치라 뺐다 */}
            {[63, 63, 62].map((height, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  height,
                }}
              >
                <Sk w={34} h={34} r={10} />
                <div style={{ display: "grid", gap: 6, flex: 1 }}>
                  <Sk w="34%" h={13} />
                  <Sk w="56%" h={12} />
                </div>
                <Sk w={52} h={24} r={7} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mrow admin-three-stats">
        {Array.from({ length: 3 }).map((_, index) => (
          <SkMcard key={index} />
        ))}
      </div>

      <TableCardSk
        title="AI 처리 내역"
        search="질문·규칙 검색"
        cols={["시각", "대상 질문", "AI 처리", "적용된 안전 규칙", "비교"]}
        rows={4}
        // P1 그리드 재실측(1440px) — 마지막 행은 구분선이 없어 1px 낮다
        rowHs={[46.2, 46.2, 46.2, 45.2]}
        toolbar
      />
    </RouteSk>
  );
}
