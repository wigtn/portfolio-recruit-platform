"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import { NotificationBell } from "@/components/NotificationBell";
import { RoleSwitch } from "@/components/demo/RoleSwitch";
import { useRipple } from "@/components/ds/useRipple";
import { NavCount } from "./NavCount";

/**
 * 백오피스 셸 — P1 StaffShell 구조 이식.
 *
 * 다크 사이드바(.aside 시안)를 걷어내고 P1 문법으로 간다:
 * - 라이트 사이드바 240px ↔ 64px 아이콘 레일 접기(localStorage 유지)
 * - sticky 헤더 h-48 3존(좌 여백 / 중앙 현재 메뉴 / 우 알림·역할)
 * - ≤900px는 가로 스크롤 바 대신 상단 바 + 드로어(2단 마운트, 280ms 퇴장)
 *
 * 사이드바는 레이아웃에서 1회만 렌더된다 — 페이지 전환 시 재마운트 없이
 * 콘텐츠만 교체돼야 접기 상태·스크롤 위치가 흔들리지 않는다.
 */

/** 접기 상태 저장 키 — P1 'staff-nav-collapsed' 관례를 이 앱 이름으로 옮겼다 */
const COLLAPSE_KEY = "admin-nav-collapsed";
/** 드로어 퇴장(ms) — CSS transition(0.28s)과 같아야 움직임이 잘리지 않는다 */
const DRAWER_EXIT = 280;

export type AdminNavGroup = {
  title: string;
  items: Array<{
    href: string;
    icon: string;
    label: string;
    count?: "reports" | "evidence" | "questions";
  }>;
};

/**
 * 현재 경로의 메뉴 1개 — 최장 prefix 매칭(P1 resolvePageTitle 문법).
 * /admin은 모든 하위 경로의 prefix라, 더 긴 href가 있으면 그쪽이 이긴다.
 */
function resolveActive(pathname: string, groups: AdminNavGroup[]) {
  let hit: AdminNavGroup["items"][number] | null = null;
  for (const group of groups) {
    for (const item of group.items) {
      const match =
        pathname === item.href || pathname.startsWith(`${item.href}/`);
      if (match && (!hit || item.href.length > hit.href.length)) hit = item;
    }
  }
  return hit;
}

/* 스프라이트에 없는 셸 전용 아이콘 — 시안 원칙(이모지 금지, 인라인 SVG)대로 그린다 */
function BurgerIcon() {
  return (
    <svg className="ic ico" viewBox="0 0 24 24" aria-hidden>
      <line x1="4" y1="7" x2="20" y2="7" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="17" x2="20" y2="17" />
    </svg>
  );
}

/** P1 PanelLeftClose/Open — 화살표가 접힐 방향을 가리킨다 */
function PanelIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <svg className="ic ico" viewBox="0 0 24 24" aria-hidden>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <line x1="9" y1="4" x2="9" y2="20" />
      {collapsed ? (
        <polyline points="13.5,9 16.5,12 13.5,15" />
      ) : (
        <polyline points="17,9 14,12 17,15" />
      )}
    </svg>
  );
}

/**
 * "사용자 화면으로" — 백오피스에서 서비스 화면(/)으로 나가는 문.
 * 헤더 우측(알림 벨 옆)에 상시 노출되고, 모바일 드로어에선 하단 항목으로도
 * 접근된다. 사이드바 접힘과 무관하게 헤더에 있으니 레일 상태를 안 탄다.
 */
function SiteLink({ onNavigate }: { onNavigate?: () => void }) {
  const ripple = useRipple<HTMLAnchorElement>(onNavigate);
  return (
    <Link
      className="phd-site"
      href="/"
      title="사용자 화면으로 이동"
      onClick={ripple}
    >
      {/* i-view(눈) — "운영자가 이용자 눈으로 본다"는 뜻이 계속 이어진다 */}
      <Icon name="view" />
      <span className="phd-site-w">사용자 화면</span>
    </Link>
  );
}

function Brand({ compact }: { compact?: boolean }) {
  const ripple = useRipple<HTMLAnchorElement>();
  return (
    <Link className="pbrand" href="/admin" title="백오피스 홈" onClick={ripple}>
      <span className="mark">W</span>
      {compact ? null : <span className="pbrand-w">백오피스</span>}
    </Link>
  );
}

function NavItem({
  item,
  active,
  collapsed,
  onNavigate,
}: {
  item: AdminNavGroup["items"][number];
  active: boolean;
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const ripple = useRipple<HTMLAnchorElement>(onNavigate);
  return (
    <Link
      className={active ? "pnavitem on" : "pnavitem"}
      href={item.href}
      aria-current={active ? "page" : undefined}
      // 접힘 레일에선 라벨이 사라지므로 title이 유일한 이름표다
      title={collapsed ? item.label : undefined}
      onClick={ripple}
    >
      <Icon name={item.icon} />
      <span className="pnav-label">{item.label}</span>
      {item.count ? <NavCount of={item.count} /> : null}
    </Link>
  );
}

function NavList({
  groups,
  pathname,
  collapsed,
  onNavigate,
}: {
  groups: AdminNavGroup[];
  pathname: string;
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const active = resolveActive(pathname, groups);
  return (
    <nav className="pnav">
      {groups.map((group) => (
        <div key={group.title}>
          {/* 접힘 시 CSS가 라벨을 구분선으로 바꾼다 — DOM은 그대로 둔다 */}
          <div className="pgrp">{group.title}</div>
          {group.items.map((item) => (
            <NavItem
              key={item.href}
              item={item}
              active={active?.href === item.href}
              collapsed={collapsed}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      ))}
    </nav>
  );
}

export function AdminShell({
  groups,
  children,
}: {
  groups: AdminNavGroup[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const active = resolveActive(pathname, groups);

  // 접기 — 저장값 복원은 마운트 후에만(SSR과 첫 클라이언트 렌더가 갈리면 hydration이 깨진다)
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    setCollapsed(window.localStorage.getItem(COLLAPSE_KEY) === "1");
  }, []);
  const toggleCollapsed = () =>
    setCollapsed((value) => {
      window.localStorage.setItem(COLLAPSE_KEY, value ? "0" : "1");
      return !value;
    });

  // 드로어 — 2단 마운트(render → rAF → open). 마운트와 동시에 open을 주면
  // 첫 프레임에 이미 열린 상태로 커밋돼 transition이 생략된다(P1 원본 코멘트).
  const [drawerMounted, setDrawerMounted] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const burgerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const exitTimer = useRef<number | undefined>(undefined);

  const openDrawer = () => {
    window.clearTimeout(exitTimer.current);
    setDrawerMounted(true);
    requestAnimationFrame(() => setDrawerOpen(true));
  };
  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    exitTimer.current = window.setTimeout(() => {
      setDrawerMounted(false);
      // 드로어가 사라지면 포커스가 body로 떨어진다 — 연 버튼으로 되돌린다
      burgerRef.current?.focus();
    }, DRAWER_EXIT);
  }, []);
  useEffect(() => () => window.clearTimeout(exitTimer.current), []);

  // 드로어 열림 동안: Esc 닫기 + body 스크롤 잠금 + 수동 포커스 트랩
  useEffect(() => {
    if (!drawerMounted) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeDrawer();
        return;
      }
      if (event.key !== "Tab") return;
      const focusables = panelRef.current?.querySelectorAll<HTMLElement>(
        "a[href], button:not([disabled])",
      );
      if (!focusables || focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    panelRef.current?.querySelector<HTMLElement>("a, button")?.focus();
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [drawerMounted, closeDrawer]);

  const toggleRipple = useRipple<HTMLButtonElement>(toggleCollapsed);
  const burgerRipple = useRipple<HTMLButtonElement>(openDrawer);

  return (
    <div className="pshell">
      {/* 데스크톱 사이드바 — ≤900px에선 드로어가 이 내용을 대신 든다 */}
      <aside className={collapsed ? "pside is-collapsed" : "pside"}>
        <div className="pside-top">
          <Brand compact={collapsed} />
          <button
            className="pside-toggle"
            onClick={toggleRipple}
            aria-label={collapsed ? "메뉴 펼치기" : "메뉴 접기"}
            title={collapsed ? "메뉴 펼치기" : "메뉴 접기"}
          >
            <PanelIcon collapsed={collapsed} />
          </button>
        </div>
        <NavList groups={groups} pathname={pathname} collapsed={collapsed} />
      </aside>

      <div className="pmain">
        {/* sticky 헤더 — 3존 그리드라 중앙 제목이 진짜 정중앙에 온다 */}
        <header className="phd">
          <div className="phd-zone phd-l">
            <button
              className="phd-menu"
              ref={burgerRef}
              onClick={burgerRipple}
              aria-label="관리자 메뉴 열기"
              aria-haspopup="dialog"
            >
              <BurgerIcon />
            </button>
          </div>
          <div className="phd-zone phd-c" aria-live="polite">
            {active ? <span>{active.label}</span> : null}
          </div>
          <div className="phd-zone phd-r">
            <SiteLink />
            <NotificationBell />
            <RoleSwitch />
          </div>
        </header>
        <div className="amain">{children}</div>
      </div>

      {drawerMounted ? (
        <div
          className={drawerOpen ? "pdrawer is-open" : "pdrawer"}
          role="dialog"
          aria-modal
          aria-label="관리자 메뉴"
        >
          <div className="pdrawer-scrim" onClick={closeDrawer} />
          <div className="pdrawer-panel" ref={panelRef}>
            <div className="pside-top">
              <Brand />
              <button
                className="pside-toggle"
                onClick={closeDrawer}
                aria-label="메뉴 닫기"
              >
                <Icon name="x" />
              </button>
            </div>
            <NavList
              groups={groups}
              pathname={pathname}
              onNavigate={closeDrawer}
            />
            {/* 드로어 하단 — 헤더의 "사용자 화면"이 드로어에 가려지는 동안에도
                같은 출구가 손에 닿게 한다 */}
            <div className="pdrawer-foot">
              <SiteLink onNavigate={closeDrawer} />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
