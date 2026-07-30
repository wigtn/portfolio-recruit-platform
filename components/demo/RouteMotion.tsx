"use client";

import { usePathname } from "next/navigation";

/**
 * 홈은 영역별 스켈레톤이 "오는 중"을 이미 말한다. 그 위에 페이지 통짜 페이드인까지
 * 얹으면 신호가 두 번 나고, 스켈레톤이 페이드 뒤에 가려 로딩 처리 자체가 안 보인다.
 * 그래서 홈에서는 페이지 등장 모션을 걷어낸다.
 *
 * 백오피스(/admin)도 전면 제외 — 라우트마다 loading.tsx 미러 스켈레톤이 이미
 * 신호를 주는 데다, 이 팝(위로 떠올랐다 정착)이 화면 전체를 움직여서 "카드들이
 * 올라갔다 내려온다"로 보였다. 백오피스는 위치·크기가 변하는 진입 전면 금지
 * (사용자 지시) — 스켈레톤 → 실물 페이드가 유일한 전환이다.
 */
const NO_PAGE_MOTION = new Set(["/"]);

export function RouteMotion({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const animated =
    !NO_PAGE_MOTION.has(pathname) && !pathname.startsWith("/admin");
  return (
    <div
      className={animated ? "route-motion uk-pop-in" : "route-motion"}
      key={pathname}
    >
      {children}
    </div>
  );
}
