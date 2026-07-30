"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * 헤더 GNB — 실재 화면 단위의 평탄한 링크만 건다.
 *
 * 드롭다운 서브메뉴는 없앴다(사용자 지시): 게시판·공지 종류는 같은 화면
 * 안에서 탭/쿼리로 바뀌는 상태라, 트리로 갈라 봤자 의미가 없다.
 * 활성 표시는 pathname prefix 기준.
 */
const MENU: Array<{ label: string; href: string; match: string }> = [
  { label: "커뮤니티", href: "/community", match: "/community" },
  { label: "회사 리뷰", href: "/companies", match: "/companies" },
  { label: "채용공고", href: "/jobs", match: "/jobs" },
  { label: "공지", href: "/notices", match: "/notices" },
];

export function NavMenu() {
  const pathname = usePathname();
  const isOn = (item: (typeof MENU)[number]) =>
    pathname === item.match ||
    pathname.startsWith(`${item.match}/`) ||
    // 회사 비교는 회사 리뷰의 탭 — GNB에선 회사 리뷰가 켜진다
    (item.match === "/companies" && pathname.startsWith("/compare"));

  return (
    <div className="links">
      {MENU.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          className={isOn(item) ? "on" : undefined}
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}
