import { Sk } from "@/components/Skeleton";
import { ROW_H } from "@/components/admin/AdminSkeleton";
import { RouteSk, TableCardSk } from "@/components/admin/RouteSkeleton";

/**
 * 증빙 검토 스켈레톤 — 검토 큐(시드 3행) + 우측 검토 패널 + 배지 종류 4장.
 * 패널의 이미지 자리(168px)는 실물과 같은 높이다.
 */
export default function BadgesLoading() {
  return (
    <RouteSk label="증빙 검토">
      <div className="reviewgrid">
        <TableCardSk
          title="검토 큐"
          search="신청자·변경 검색"
          tabs={["대기", "승인", "반려"]}
          cols={["신청일", "닉네임", "등급 변경", "증빙", "상태"]}
          rows={3}
          // P1 그리드 재실측 — 마지막 행은 구분선이 없어 1px 낮다
          rowHs={[ROW_H.evidence, ROW_H.evidence, 45.2]}
        />
        {/* 검토 패널 — 이미지(168) · 정보 3행(37) · 사유 입력 · 버튼 행까지
            실물과 같은 뼈대를 세운다(실측 1440px 기준, 패널 총 589px) */}
        <div className="card" aria-hidden>
          <h4
            style={{ display: "flex", alignItems: "center", minHeight: 20.8 }}
          >
            <Sk w={150} h={15} />
          </h4>
          <Sk w="100%" h={168} r={10} style={{ margin: "12px 0" }} />
          <div className="evinfo">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                className="row"
                key={index}
                style={{ display: "flex", alignItems: "center", minHeight: 37 }}
              >
                <Sk w={64} h={13} />
                <Sk w={110} h={13} style={{ marginLeft: "auto" }} />
              </div>
            ))}
          </div>
          <div className="field" style={{ marginTop: 14 }}>
            <label
              style={{ display: "flex", alignItems: "center", minHeight: 22 }}
            >
              <Sk w={90} h={13} />
            </label>
            <Sk w="100%" h={124} r={10} />
          </div>
          <div
            className="evacts"
            style={{ display: "flex", gap: 10, marginTop: 14 }}
          >
            <Sk h={40} r={10} style={{ flex: 1 }} />
            <Sk h={40} r={10} style={{ flex: 1 }} />
          </div>
        </div>
      </div>

      <div className="tablecard" style={{ marginTop: 16 }} aria-hidden>
        <div className="tabletop">
          <h4>배지 종류</h4>
        </div>
        <div className="badgegrid is-badges" style={{ padding: 16 }}>
          {/* Sk 바만 쌓으면 실물(164.6px)보다 19.6px 짧았다 — 실제 클래스
              (.bi/.bn/.bd/.bc)를 그대로 쓰고 줄 높이만 실측값으로 세운다 */}
          {Array.from({ length: 4 }).map((_, index) => (
            <div className={`bcard is-l${index + 1}`} key={index}>
              <div className="bi" />
              <div
                className="bn"
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  minHeight: 21.6,
                }}
              >
                <Sk w={64} h={13} />
              </div>
              <div
                className="bd"
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  minHeight: 16.8,
                }}
              >
                <Sk w={96} h={12} />
              </div>
              <div
                className="bc"
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  minHeight: 29.2,
                }}
              >
                <Sk w={72} h={12} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </RouteSk>
  );
}
