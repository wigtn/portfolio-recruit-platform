"use client";

import { useEffect, useState } from "react";
import { submitReport, type ReportInput } from "@/lib/demo/submit";
import { useRole } from "@/lib/demo/role";
import { RoleModal } from "./demo/RoleModal";
import { Icon } from "./Icon";

/**
 * 신고 — 접수하면 **운영자 신고 관리 화면에 실제로 행이 생긴다**.
 * 3회 누적되면 자동 임시 블라인드까지 그대로 적용된다(화면 부제가 약속하는 규칙).
 *
 * 게스트는 접수 대신 로그인 유도를 본다 — 신고는 회원의 일이고(권한 매트릭스
 * pl-2·pl-3과 같은 결), 익명 신고 남발을 막는 실서비스 문법이기도 하다.
 */

const REASONS = [
  "스팸·광고",
  "실명·비방",
  "허위 정보",
  "선정성",
  "개인정보 노출",
];

export function ReportModal({
  subject,
  onClose,
}: {
  subject: Omit<ReportInput, "reason" | "by">;
  onClose: (submitted?: number) => void;
}) {
  const { role, setRole } = useRole();
  const [reason, setReason] = useState(REASONS[0]);
  const [done, setDone] = useState<number | null>(null);
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="modalwrap"
      role="dialog"
      aria-modal
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose(done ?? undefined);
      }}
    >
      <div className="modal">
        {role === "guest" ? (
          /* GuestReviewGate와 같은 결의 유도 — 한 번에 열리는 길(일반 회원)을
             먼저 주고, 다른 계정은 역할 모달로 보낸다 */
          <>
            <h3>신고는 로그인해야 할 수 있어요</h3>
            <div className="msub">
              지금은 <b>게스트</b>로 보고 있어요. 이 데모는 비밀번호 없이 계정만
              바꿔 로그인합니다.
            </div>
            <div className="gate-acts" style={{ marginBottom: 14 }}>
              <button className="btn primary" onClick={() => setRole("member")}>
                일반 회원으로 로그인
                <Icon name="arrow" />
              </button>
              <button className="gate-other" onClick={() => setSwitching(true)}>
                <Icon name="swap" />
                다른 계정으로 로그인
              </button>
            </div>
            <button
              className="btn line"
              style={{ width: "100%", justifyContent: "center" }}
              onClick={() => onClose()}
            >
              닫기
            </button>
            {switching ? (
              <RoleModal onClose={() => setSwitching(false)} />
            ) : null}
          </>
        ) : done ? (
          <>
            <h3>신고가 접수됐어요</h3>
            <div className="msub">
              이 콘텐츠는 누적 <b>{done}회</b> 신고됐어요
              {done >= 3 ? " — 자동으로 임시 블라인드됐어요" : ""}.
              <br />
              운영자 화면 <b>신고 관리</b>에서 처리 과정을 볼 수 있어요.
            </div>
            <div style={{ display: "flex", gap: 9 }}>
              <button
                className="btn line"
                style={{ flex: 1, justifyContent: "center" }}
                onClick={() => onClose(done)}
              >
                닫기
              </button>
              <a
                className="btn primary"
                style={{ flex: 1, justifyContent: "center" }}
                href="/admin/reports"
              >
                신고 관리에서 보기
              </a>
            </div>
          </>
        ) : (
          <>
            <h3>이 콘텐츠를 신고할게요</h3>
            <div className="msub">
              사유를 골라주세요 — 운영자가 원문과 함께 확인해요
            </div>

            <div className="field">
              <label>신고 사유</label>
              <div className="checkrow">
                {REASONS.map((item) => (
                  <button
                    key={item}
                    className={reason === item ? "checkitem on" : "checkitem"}
                    onClick={() => setReason(item)}
                  >
                    {reason === item ? (
                      <span className="bx">
                        <Icon name="check" />
                      </span>
                    ) : null}
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div className="safenote" style={{ marginBottom: 18 }}>
              <span className="si">
                <Icon name="shield" />
              </span>
              <div>
                <b>신고자는 공개되지 않아요</b>
                <span>운영자에게도 누가 신고했는지는 보이지 않아요</span>
              </div>
            </div>

            <div style={{ display: "flex", gap: 9 }}>
              <button
                className="btn line"
                style={{ flex: 1, justifyContent: "center" }}
                onClick={() => onClose()}
              >
                취소
              </button>
              <button
                className="btn primary"
                style={{ flex: 1, justifyContent: "center" }}
                onClick={() =>
                  setDone(submitReport({ ...subject, reason, by: "익명" }))
                }
              >
                신고하기
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
