"use client";

import { useState } from "react";
import { Icon } from "@/components/Icon";
import { toast } from "@/components/ds/Toaster";
import { Overlay, useOverlayClose } from "./Overlay";

/**
 * 파괴적 조치 확인 다이얼로그 — 삭제·병합·정지·블라인드처럼 되돌리기 어려운 조치 공용.
 *
 * step-up(본인 확인)과는 역할이 다르다: step-up은 "당신이 맞는지"를, 이 다이얼로그는
 * "지금 무슨 일이 일어나는지"를 확인한다. step-up이 화면 세션당 1회로 접히고 나면
 * 고위험 조치가 단일 클릭이 되던 구멍을 여기가 막는다.
 *
 * 사유가 필요한 조치는 여기서 함께 받는다 — 기본 사유를 채워 두되 고칠 수 있게 한다.
 * 사유는 감사 기록에 그대로 남으므로 비워두면 진행하지 않는다.
 */
export function ConfirmDialog({
  title,
  desc,
  confirmLabel,
  initialReason,
  busy,
  onCancel,
  onConfirm,
}: {
  title: string;
  /** 무엇이 어떻게 되는지 — 대상 이름을 넣어 문장으로 쓴다 */
  desc: string;
  confirmLabel: string;
  /** 넘기면 사유 입력 필드가 생긴다(수정 가능한 기본값). 비우면 진행 불가 */
  initialReason?: string;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: (reason?: string) => void;
}) {
  return (
    <Overlay onClose={onCancel}>
      <ConfirmForm
        title={title}
        desc={desc}
        confirmLabel={confirmLabel}
        initialReason={initialReason}
        busy={busy}
        onConfirm={onConfirm}
      />
    </Overlay>
  );
}

/** Overlay 컨텍스트(퇴장 애니메이션 닫기)를 쓰려고 폼만 한 겹 분리했다 */
function ConfirmForm({
  title,
  desc,
  confirmLabel,
  initialReason,
  busy,
  onConfirm,
}: {
  title: string;
  desc: string;
  confirmLabel: string;
  initialReason?: string;
  busy?: boolean;
  onConfirm: (reason?: string) => void;
}) {
  const close = useOverlayClose();
  const needReason = initialReason !== undefined;
  const [reason, setReason] = useState(initialReason ?? "");
  // 진행 불가(사유 비움)면 패널을 흔든다 — P1 실패 문법(uk-shake).
  // 애니메이션이 끝나면 클래스를 걷어 다음 실패에도 다시 흔들리게 한다.
  const [shake, setShake] = useState(false);

  return (
    <form
      className={shake ? "modal form uk-shake" : "modal form"}
      onAnimationEnd={(event) => {
        if (event.animationName === "uk-shake") setShake(false);
      }}
      onSubmit={(event) => {
        event.preventDefault();
        if (needReason && !reason.trim()) {
          toast("사유를 적어주세요, 처리 기록에 그대로 남아요.", { tone: "warn" });
          setShake(true);
          return;
        }
        onConfirm(needReason ? reason.trim() : undefined);
      }}
    >
      <h3>{title}</h3>
      <div className="msub">{desc}</div>

      {needReason ? (
        <div className="field">
          <label>
            사유{" "}
            <span style={{ fontWeight: 400, color: "var(--ink-4)" }}>
              (처리 기록에 남아요)
            </span>
          </label>
          <textarea
            className="in"
            value={reason}
            onChange={(event) => {
              setReason(event.target.value);
            }}
          />
        </div>
      ) : null}


      <div className="facts">
        <button type="button" className="btn line" onClick={close}>
          취소
        </button>
        <button className="btn primary" type="submit" disabled={busy}>
          {confirmLabel}
        </button>
      </div>
    </form>
  );
}
