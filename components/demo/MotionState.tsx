"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * 화면이 지금 움직이는 중인가를 문서에 표시한다.
 *
 * 애플의 리퀴드 글래스가 60fps를 지키는 방법 중 하나가 "움직일 때는 싸게,
 * 멈추면 제대로"다. 흐린 배경을 캐시해 두고, 배경이 움직이지 않으면 다시
 * 계산하지 않는다. 저해상도로 흐린 뒤 확대해 쓰기도 한다.
 *
 * 브라우저는 그 둘 다 우리에게 열어 주지 않는다. CSS의 backdrop-filter는
 * 요소가 움직이거나 그 뒤가 바뀔 때마다 해당 영역을 **전체 해상도로** 다시
 * 칠하고 다시 흐린다. 화면 하단에 고정된 탭바는 스크롤하는 내내 그 일을
 * 겪는다 — 뒤로 콘텐츠가 계속 흐르기 때문이다.
 *
 * 캐시를 못 만들면 흐림의 값을 낮추는 수밖에 없다. 스크롤이 도는 동안에는
 * 반경을 줄이고, 손을 떼면 원래대로 돌린다. 움직이는 화면에서 흐림의 정도를
 * 알아보는 눈은 없다 — 멈춘 화면에서만 보인다.
 *
 * 클래스는 문서 루트에 붙인다. 이걸 읽는 쪽(탭바·패널)이 여럿이고, 각자
 * 스크롤을 듣게 하면 리스너가 화면 수만큼 늘어난다.
 */
const IDLE_MS = 140;

export function MotionState() {
  const pathname = usePathname();

  /* 화면을 옮기는 순간도 "움직이는 중"이다.

     탭을 눌러 페이지가 갈릴 때 최악 프레임이 333ms까지 튄다(실측). 그
     구간은 스타일 재계산과 재조정이 메인 스레드를 잡고 있는데, 하필
     그때 화면에 고정된 판들이 전체 해상도로 다시 흐려진다.

     스크롤과 같은 처방을 쓴다 — 전환이 끝날 때까지만 흐림을 얇게. */
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("is-moving-view");
    const timer = window.setTimeout(
      () => root.classList.remove("is-moving-view"),
      420,
    );
    return () => {
      window.clearTimeout(timer);
      root.classList.remove("is-moving-view");
    };
  }, [pathname]);

  useEffect(() => {
    const root = document.documentElement;
    let timer = 0;
    let moving = false;

    const stop = () => {
      moving = false;
      root.classList.remove("is-moving-view");
    };

    const onScroll = () => {
      if (!moving) {
        moving = true;
        root.classList.add("is-moving-view");
      }
      window.clearTimeout(timer);
      /* 손을 뗀 뒤 잠깐 기다렸다 되돌린다. 스크롤은 관성으로 이어지는데
         마지막 이벤트에서 바로 켜면 아직 흐르는 화면에 흐림이 돌아온다. */
      timer = window.setTimeout(stop, IDLE_MS);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.clearTimeout(timer);
      stop();
    };
  }, []);

  return null;
}
