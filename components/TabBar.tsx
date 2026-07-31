"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./Icon";
import { TAB_NAV, isActive } from "@/lib/demo/nav";

/**
 * 모바일 하단 탭바.
 *
 * 주 메뉴가 화면 최상단에만 있으면, 스크롤을 내린 상태에서 다른 화면으로
 * 가려고 매번 위로 올라가야 한다. 손가락이 닿는 자리에 목적지를 두면 그
 * 왕복이 사라진다.
 *
 * 바닥에 붙이지 않고 띄운다. 화면 끝에 눌러 붙은 판은 브라우저 UI의 일부처럼
 * 보이고, 그러면 페이지가 그 아래에서 잘린 것처럼 읽힌다. 떠 있으면 콘텐츠
 * 위에 얹힌 물건이라는 게 분명해진다.
 *
 * 목록과 활성 판정은 lib/demo/nav.ts를 본다. 헤더 GNB와 같은 규칙이어야
 * 같은 화면에서 둘이 어긋나지 않는다.
 */
export function TabBar() {
  const pathname = usePathname();

  /* 백오피스에는 세우지 않는다. 이미 사이드바와 버거 메뉴가 있어서 같은
     목적지가 두 벌이 되고, 탭 다섯 칸으로 담을 수 있는 구조도 아니다 */
  if (pathname.startsWith("/admin")) return null;

  return (
    <nav className="tabbar" aria-label="주요 화면">
      <ul>
        {TAB_NAV.map((item) => {
          const on = isActive(pathname, item.match);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={on ? "on" : undefined}
                aria-current={on ? "page" : undefined}
              >
                <Icon name={item.icon} />
                <span>{item.short}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
