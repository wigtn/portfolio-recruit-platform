"use client";

/**
 * 스피너 + 페이지 로더 — P1 문법.
 *
 * 스켈레톤 절대 규칙의 예외 자리: 구조를 미러링할 수 없는 순간 전환
 * (액션 실행 중 오버레이, 버튼 내부)에만 쓴다. 화면 로딩은 스켈레톤이 정본.
 */
export function Spinner({ size = 20 }: { size?: number }) {
  return (
    <svg
      className="ds-spin"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeOpacity="0.14"
        strokeWidth="3"
      />
      <path
        d="M 21 12 A 9 9 0 0 0 12 3"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** 액션 실행 중 블로킹 오버레이 — 화면 로딩에는 쓰지 않는다(스켈레톤이 정본) */
export function ActionOverlay({ label }: { label?: string }) {
  return (
    <div className="ds-actionwait" role="status">
      <Spinner size={30} />
      {label ? <span>{label}</span> : null}
    </div>
  );
}
