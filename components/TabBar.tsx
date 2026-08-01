"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
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
  /* 유리알이 흐르는 동안에만 참. 액체 표현(굴절 렌즈·색분산 테·환경 반사)과
     탭바의 탄력·림라이트가 이 값에 걸린다.

     멈춰 있을 때까지 유리로 두면 두 가지가 나빠진다. 눈에는, 아무 일도
     없는데 계속 반짝이는 판이 남아 시선을 끈다. 성능에는, backdrop-filter와
     background-position 애니메이션이 매 프레임 돈다. 애플의 탭바도 이동
     중에만 액체고 멈추면 평범한 색이다. */
  const [moving, setMoving] = useState(false);

  /* 백오피스에는 세우지 않는다. 이미 사이드바와 버거 메뉴가 있어서 같은
     목적지가 두 벌이 되고, 탭 다섯 칸으로 담을 수 있는 구조도 아니다 */
  if (pathname.startsWith("/admin")) return null;

  /* 활성 칸 인덱스 — 유리알 하나가 이 값을 따라 흐른다. 칸마다 켜고
     끄면 자리가 순간이동하는데, 하나가 이동해야 "같은 물건이 옮겨간다"로
     읽힌다. 탭 밖 화면(-1)에서는 유리알을 숨긴다 */
  const activeIndex = TAB_NAV.findIndex((item) =>
    isActive(pathname, item.match),
  );

  return (
    <nav
      className={moving ? "tabbar is-moving" : "tabbar"}
      aria-label="주요 화면"
    >
      <ul
        style={
          {
            "--ti": Math.max(activeIndex, 0),
            "--tabs": TAB_NAV.length,
          } as React.CSSProperties
        }
      >
        <LiquidPill activeIndex={activeIndex} onMoving={setMoving} />
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

/**
 * 액체 유리알 — CSS 트랜지션 대신 스프링을 직접 적분한다.
 *
 * 트랜지션은 위치만 알고 속도를 모른다. 액체처럼 보이려면 "지금 얼마나
 * 빠른가"가 모양에 들어가야 한다: 빠를수록 진행 방향으로 길어지고(관성),
 * 부피를 지키느라 세로로 얇아지며(비압축성), 바닥이 끌리는 만큼 몸이
 * 앞으로 쏠린다(마찰). 감쇠는 임계 근처라 도착하면 조용히 멎는다 —
 * 멈춘 뒤 반복해 흔들리는 잔진동은 두지 않는다(사용자 지시).
 */
function LiquidPill({
  activeIndex,
  onMoving,
}: {
  activeIndex: number;
  /** 흐르는 동안만 true. 액체 표현과 탭바 탄력이 여기 걸린다 */
  onMoving: (moving: boolean) => void;
}) {
  const pillRef = useRef<HTMLLIElement>(null);
  const beadRef = useRef<HTMLElement>(null);
  const sim = useRef({ x: -1, v: 0, raf: 0 });

  useEffect(() => {
    const pill = pillRef.current;
    const bead = beadRef.current;
    if (!pill || !bead) return;
    const s = sim.current;
    const target = Math.max(activeIndex, 0);
    // 첫 마운트는 이동이 아니다 — 제자리에서 시작한다
    if (s.x < 0) s.x = target;

    /* 멈출 땐 조용히 멎는다 — 착지 잔진동은 뺐다(사용자 지시) */
    const still = () => {
      s.x = target;
      s.v = 0;
      pill.style.transform = `translateX(${target * 100}%)`;
      bead.style.transform = "";
      bead.style.setProperty("--envx", String(target));
      onMoving(false);
    };
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      still();
      return;
    }
    /* 이미 제자리면 아무 일도 없다 — 리렌더마다 출렁이면 액체가 아니라 고장이다 */
    if (Math.abs(s.x - target) < 0.002 && Math.abs(s.v) < 0.02) {
      still();
      return;
    }

    cancelAnimationFrame(s.raf);
    onMoving(true);
    let last = performance.now();
    const tick = (now: number) => {
      // 프레임이 밀려도 폭주하지 않게 dt 상한 — 물리 적분의 기본 안전장치
      const dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;
      const K = 190; // 강성 — 갈 곳으로 당기는 힘
      const C = 26; // 감쇠 — 임계 근처. 도착점에서 반복해 흔들리지 않는다
      s.v += (-K * (s.x - target) - C * s.v) * dt;
      s.x += s.v * dt;

      if (Math.abs(s.v) < 0.02 && Math.abs(s.x - target) < 0.002) {
        still();
        return;
      }
      const speed = Math.abs(s.v);
      /* 속도 → 변형. 늘어난 만큼 얇아져 넓이(부피)가 대강 보존된다 */
      const stretch = Math.min(speed * 0.055, 0.38);
      /* 속도 → 기울임. 바닥이 끌리고 몸이 앞서는 방향(위가 진행 방향) */
      const lean = Math.max(-9, Math.min(9, s.v * 2.2));
      pill.style.transform = `translateX(${s.x * 100}%)`;
      bead.style.transform = `skewX(${-lean}deg) scale(${1 + stretch}, ${1 / (1 + stretch * 0.85)})`;
      // 환경 반사 위치 — 렌즈가 훑는 만큼 반사가 반대쪽으로 흐른다
      bead.style.setProperty("--envx", s.x.toFixed(4));
      s.raf = requestAnimationFrame(tick);
    };
    s.raf = requestAnimationFrame(tick);
    /* 도중에 언마운트되면 still()이 못 돌아 is-moving이 남는다 — 유리와
       탄력이 켜진 채로 굳는다. 정리 시점에 반드시 내린다 */
    return () => {
      cancelAnimationFrame(s.raf);
      onMoving(false);
    };
  }, [activeIndex, onMoving]);

  return (
    <li
      ref={pillRef}
      className={activeIndex < 0 ? "tabbar-pill is-off" : "tabbar-pill"}
      aria-hidden
    >
      <i ref={beadRef} className="bead" />
    </li>
  );
}
