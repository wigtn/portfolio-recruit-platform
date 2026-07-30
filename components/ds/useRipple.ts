"use client";

import { useCallback } from "react";

/**
 * 클릭 리플 — P1의 단일 소스 훅. Button·내비 항목·셸 아이콘 버튼이 전부
 * 이 훅 하나를 쓴다(컴포넌트마다 리플을 새로 짜면 퍼짐 속도가 갈라진다).
 *
 * 반환된 핸들러를 onClick에 걸면 클릭 좌표에 `span.uk-ripple`을 심고
 * 640ms 뒤 거둔다 — ui-kit `.uk-ripple`(P1 이식 keyframe)이 퍼짐을 그린다.
 * 호스트에 `position:relative; overflow:hidden`이 필요하다.
 */
export function useRipple<T extends HTMLElement>(
  onClick?: (event: React.MouseEvent<T>) => void,
  options?: { disabled?: boolean },
) {
  const disabled = options?.disabled;
  return useCallback(
    (event: React.MouseEvent<T>) => {
      if (!disabled) {
        // 모션 축소 환경에선 원소 생성 자체를 건너뛴다(ui-kit 계약의 권장 사항)
        const reduced = window.matchMedia?.(
          "(prefers-reduced-motion: reduce)",
        ).matches;
        if (!reduced) {
          const host = event.currentTarget;
          const rect = host.getBoundingClientRect();
          const size = Math.max(rect.width, rect.height);
          const ripple = document.createElement("span");
          ripple.className = "uk-ripple";
          ripple.style.width = `${size}px`;
          ripple.style.height = `${size}px`;
          ripple.style.left = `${event.clientX - rect.left - size / 2}px`;
          ripple.style.top = `${event.clientY - rect.top - size / 2}px`;
          host.appendChild(ripple);
          window.setTimeout(() => ripple.remove(), 640);
        }
      }
      onClick?.(event);
    },
    [onClick, disabled],
  );
}
