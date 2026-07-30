import { Sk } from "@/components/Skeleton";
import { RouteSk, TableCardSk } from "@/components/admin/RouteSkeleton";

/**
 * 답변 없는 질문 스켈레톤 — 질문 큐(시드 5행) + 우측 답변 패널.
 * 행 높이·패널 줄 높이는 1440px 실측값이다(스켈레톤→실물 크기 변화 0 규칙).
 * 패널의 본문 미리보기(132px)·답변 입력은 실물과 같은 뼈대를 세운다.
 */

/**
 * 질문 큐 표 행 실측 높이(1440px) — 마지막 행은 구분선이 없어 1px 낮다.
 * QuestionsQueue의 내부 스켈레톤도 이 값을 쓴다 — 서버 모듈(여기)에 두는 이유는
 * loading.tsx가 "use client" 경계 너머의 값을 읽을 수 없어서다.
 */
export const QUESTION_ROW_HS = [41.8, 41.8, 41.8, 41.8, 40.8] as const;
export default function QuestionsLoading() {
  return (
    <RouteSk label="답변 없는 질문">
      <div className="reviewgrid">
        <TableCardSk
          title="질문 큐"
          tabs={["대기", "답변완료"]}
          cols={["제목", "게시판", "경과", "조회수"]}
          rows={5}
          rowHs={QUESTION_ROW_HS}
        />
        {/* 답변 패널 — 제목·정보 3행·본문 미리보기(132px)·답변 폼·버튼 행.
            줄 높이는 실측(제목 20.8 · 정보행 37, 마지막은 구분선이 없어 36).
            입력창은 Sk 바 대신 실제 textarea를 눕힌다 — 인라인 베이스라인
            여백(약 6.6px)까지 같아야 아래 버튼 행이 제자리에 선다. */}
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
            <Sk h={40} r={10} style={{ flex: 1 }} />
          </div>
        </div>
      </div>
    </RouteSk>
  );
}
