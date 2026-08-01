/**
 * 서비스 내비게이션 정본.
 *
 * 헤더 GNB와 하단 탭바가 같은 목적지를 가리키는데 활성 판정을 따로 구현하면
 * 두 곳이 어긋난다. "회사 비교(/compare)를 보고 있으면 회사 리뷰가 켜진다"
 * 같은 예외는 특히 그렇다. 한쪽에만 넣으면 같은 화면에서 헤더는 켜져 있고
 * 탭바는 꺼져 있는 상태가 된다.
 *
 * 그래서 목록도 판정도 여기 한 곳에 둔다.
 */

export type NavItem = {
  /** 헤더에서 쓰는 이름 */
  label: string;
  /** 탭바에서 쓰는 짧은 이름. 320px에서 다섯 칸이면 칸당 64px이라 긴 이름이
      들어가지 않는다 */
  short: string;
  href: string;
  /** 활성 판정 기준 경로 */
  match: string;
  icon: string;
};

/** 헤더 GNB. 실재 화면 단위의 평탄한 링크만 건다 */
export const MAIN_NAV: NavItem[] = [
  {
    label: "커뮤니티",
    short: "커뮤니티",
    href: "/community",
    match: "/community",
    icon: "comment",
  },
  {
    label: "회사 리뷰",
    short: "회사리뷰",
    href: "/companies",
    match: "/companies",
    icon: "building",
  },
  {
    label: "채용공고",
    short: "채용공고",
    href: "/jobs",
    match: "/jobs",
    icon: "briefcase",
  },
  {
    label: "공지",
    short: "공지",
    href: "/notices",
    match: "/notices",
    icon: "notice",
  },
];

/**
 * 하단 탭바.
 *
 * 헤더 GNB와 구성이 다르다. 탭바는 상시 왕복하는 목적지만 담는 자리다.
 *
 * - 공지는 뺐다. 방문 빈도가 낮고, 성격상 알림과 계정 메뉴에 속하는 정보다.
 * - 내 정보는 넣었다. GNB에는 없지만 반복 진입점이고, 앱형 탭바에서 마지막
 *   칸은 관례적으로 내 정보 자리다.
 * - 홈을 넣은 이유는 모바일에서 홈으로 돌아갈 길이 헤더 로고 하나뿐이라서다.
 */
export const TAB_NAV: NavItem[] = [
  { label: "홈", short: "홈", href: "/", match: "/", icon: "home" },
  MAIN_NAV[0],
  MAIN_NAV[1],
  MAIN_NAV[2],
  { label: "내 정보", short: "내 정보", href: "/my", match: "/my", icon: "user" },
];

/**
 * 지금 이 항목이 켜져 있는가.
 *
 * 홈은 정확히 일치할 때만 켜진다. 접두어로 보면 모든 화면에서 홈이 켜진다.
 */
export function isActive(pathname: string, match: string): boolean {
  if (match === "/") return pathname === "/";
  if (pathname === match || pathname.startsWith(`${match}/`)) return true;
  // 회사 비교는 회사 리뷰의 탭이다. 목적지가 같으므로 같이 켜진다
  return match === "/companies" && pathname.startsWith("/compare");
}
