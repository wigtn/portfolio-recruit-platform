"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";

/**
 * StepUp 재인증 모달 — 시안 정본 `.stepup-ov`/`.stepup` 구조 그대로.
 *
 * 모듈이 STEP_UP_REQUIRED로 거절했을 때만 열린다. 데모 코드는 000000이고,
 * 틀린 코드를 넣으면 "코드가 일치하지 않아 처리되지 않았습니다"로 남는다 —
 * 조치가 실제로 적용되지 않았다는 걸 보여주는 게 이 화면의 요점이다.
 */
const DEMO_CODE = "000000";

export function StepUpModal({
  onVerified,
  onCancel,
}: {
  onVerified: () => void;
  onCancel: () => void;
}) {
  const [code, setCode] = useState("");
  // 코드 불일치 시 패널을 흔든다 — P1 실패 문법(uk-shake). 끝나면 클래스를
  // 걷어야 다음 실패에도 다시 흔들린다.
  const [shake, setShake] = useState(false);
  /* 코드 불일치는 인라인으로 돌려놨다(사용자 지적: 어색하다).

     검증 알림은 대체로 토스트가 맞다 — 폼이 화면 밖일 수 있고, 배너는
     레이아웃을 흔든다. 그런데 여기는 여섯 칸을 노려보는 중이라 눈이 이미
     그 자리에 있다. 알림만 우하단으로 보내면 시선이 두 번 움직이고,
     흔들림(uk-shake)과 문구가 따로 놀아 무엇이 틀렸는지 늦게 안다.

     규칙보다 그 자리에서 무엇이 읽히는지가 먼저다. */
  const [error, setError] = useState<string | null>(null);
  // P1 Modal 등장 — 이중 rAF 후 is-enter 해제(단일 rAF면 트랜지션 생략)
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => setEntered(true));
    });
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
    };
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  const digits = Array.from({ length: 6 }, (_, index) => code[index] ?? "");

  return (
    <div
      className={entered ? "stepup-ov" : "stepup-ov is-enter"}
      role="dialog"
      aria-modal
    >
      <div
        className={shake ? "stepup uk-shake" : "stepup"}
        onAnimationEnd={(event) => {
          if (event.animationName === "uk-shake") setShake(false);
        }}
      >
        <div className="lk">
          <Icon name="lock" />
        </div>
        <h3>본인 확인을 한 번 더 해주세요</h3>
        <div className="desc">
          블라인드, 삭제 같은 중요한 작업이라 재인증이 필요해요.
        </div>

        <label className="codebox" style={{ cursor: "text" }}>
          {digits.map((digit, index) => (
            <span
              key={index}
              className={index === code.length ? "f" : undefined}
            >
              {digit || (index === code.length ? "|" : "")}
            </span>
          ))}
          <input
            autoFocus
            inputMode="numeric"
            value={code}
            maxLength={6}
            onChange={(event) => {
              setCode(event.target.value.replace(/\D/g, "").slice(0, 6));
              setError(null);
            }}
            style={{
              position: "absolute",
              opacity: 0,
              width: 1,
              height: 1,
            }}
          />
        </label>

        {error ? (
          <div className="stepup-err" role="alert">
            <Icon name="alert" />
            {error}
          </div>
        ) : null}

        <div className="hint">
          체험용 코드는 <b>{DEMO_CODE}</b>, 다른 숫자를 넣으면 어떻게 되는지도
          확인해보세요
        </div>


        <div className="acts">
          <button
            className="btn line"
            style={{ flex: 1, justifyContent: "center" }}
            onClick={onCancel}
          >
            취소
          </button>
          <button
            className="btn primary"
            style={{ flex: 1, justifyContent: "center" }}
            onClick={() => {
              if (code === DEMO_CODE) onVerified();
              else {
                setError("코드가 일치하지 않아 처리되지 않았습니다");
                setShake(true);
                setCode(""); // 다시 입력할 수 있게 비운다
              }
            }}
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
