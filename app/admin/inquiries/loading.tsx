import { Sk } from "@/components/Skeleton";
import { RouteSk, TableCardSk } from "@/components/admin/RouteSkeleton";

/**
 * 1:1 문의 스켈레톤 — 문의 큐(시드 3행 중 대기 2행) + 우측 답변 패널.
 * 질문 관리 미러와 같은 구성이다(표 행 + 제목·정보 3행·원문·답변 폼·버튼).
 */

/**
 * 문의 큐 표 행 높이 — 질문 큐와 같은 한 줄 셀 구성이라 같은 실측값을 쓴다.
 * 마지막 행은 구분선이 없어 1px 낮다. InquiriesQueue의 내부 스켈레톤도 이
 * 값을 쓴다(loading.tsx가 "use client" 경계 밖이라 여기 둔다).
 */
export const INQUIRY_ROW_HS = [41.8, 41.8, 40.8] as const;

export default function InquiriesLoading() {
  return (
    <RouteSk label="1:1 문의">
      <div className="reviewgrid">
        <TableCardSk
          title="문의 큐"
          tabs={["대기", "답변완료"]}
          cols={["분류", "문의", "문의자", "접수"]}
          rows={3}
          rowHs={INQUIRY_ROW_HS}
        />
        {/* 답변 패널 — 제목·정보 3행·원문(132px)·답변 폼·버튼 행 */}
        <div className="card" aria-hidden>
          <h4
            style={{ display: "flex", alignItems: "center", minHeight: 20.8 }}
          >
            <Sk w={200} h={15} />
          </h4>
          <div className="evinfo">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                className="row"
                key={index}
                style={{
                  display: "flex",
                  alignItems: "center",
                  minHeight: index < 2 ? 37 : 36,
                }}
              >
                <Sk w={52} h={12} />
                <Sk
                  w={index === 0 ? 64 : 48}
                  h={12}
                  style={{ marginLeft: "auto" }}
                />
              </div>
            ))}
          </div>
          <div style={{ margin: "12px 0" }}>
            <Sk w="100%" h={132} r={10} />
          </div>
          <div className="field" style={{ marginTop: 14 }}>
            <label
              style={{ display: "flex", alignItems: "center", minHeight: 20.8 }}
            >
              <Sk w={180} h={12} />
            </label>
            <textarea className="in" disabled />
          </div>
          <div
            className="evacts"
            style={{ display: "flex", gap: 10, marginTop: 14 }}
          >
            <Sk h={40} r={10} style={{ flex: 1 }} />
          </div>
        </div>
      </div>
    </RouteSk>
  );
}
