"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MAIN_NAV, isActive } from "@/lib/demo/nav";

/**
 * 헤더 GNB — 실재 화면 단위의 평탄한 링크만 건다.
 *
 * 드롭다운 서브메뉴는 없앴다(사용자 지시): 게시판·공지 종류는 같은 화면
 * 안에서 탭/쿼리로 바뀌는 상태라, 트리로 갈라 봤자 의미가 없다.
 *
 * 목록과 활성 판정은 lib/demo/nav.ts에 있다. 하단 탭바가 같은 목적지를
 * 가리키므로, 판정을 각자 구현하면 같은 화면에서 헤더는 켜지고 탭바는
 * 꺼지는 상태가 생긴다.
 */
export function NavMenu() {
  const pathname = usePathname();

  return (
    <div className="links">
      {MAIN_NAV.map((item) => {
        const on = isActive(pathname, item.match);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={on ? "on" : undefined}
            aria-current={on ? "page" : undefined}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
