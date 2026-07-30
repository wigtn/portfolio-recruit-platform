"use client";

import { resetDemoExperience } from "@/lib/demo/progress";

/**
 * 데모 초기화 — 이 브라우저의 체험 기록을 지운다.
 * 방문자마다 깨끗한 상태에서 시작할 수 있어야 하므로 오버레이를 비우고 새로고침한다.
 */
export function DemoResetButton() {
  return (
    <button
      className="rbtn"
      onClick={() => {
        resetDemoExperience();
        window.location.reload();
      }}
    >
      데모 초기화
    </button>
  );
}
