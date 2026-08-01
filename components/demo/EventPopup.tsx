"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { loadState } from "@/lib/admin/overlay";
import { Icon } from "../Icon";

/**
 * 이벤트 팝업 — 관리자 큐레이션에서 설정한 배너가 그대로 뜬다.
 *
 * 상단 띠(WIGTN이 방문자에게 하는 말)와 레이어가 다르다. 이건 데모 속 서비스가
 * 그 서비스 사용자에게 거는 이벤트라, 실제 이벤트 팝업 문법을 따른다 —
 * 드래그로 옮길 수 있고, 닫을 수 있고, "오늘 하루 보지 않기"가 있다.
 *
 * 위치는 왼쪽 아래에 잡는다. 오른쪽 아래는 체험 가이드 위젯이 이미 쓴다.
 * 레이어도 모달 아래(z 45 < .modalwrap 60)다 — 계정 전환 모달을 열었는데
 * 광고가 그 위로 올라오면 안 된다.
 */
const DISMISS_KEY = "wigtn-demo-event-popup-v1";

export function EventPopup() {
  const [banner, setBanner] = useState<string | null>(null);
  const [closed, setClosed] = useState(true);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const dragRef = useRef<{ dx: number; dy: number } | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.sessionStorage.getItem(DISMISS_KEY)) return;
    const until = window.localStorage.getItem(DISMISS_KEY);
    if (until && Number(until) > Date.now()) return;
    const name = loadState().curation.banners[0]?.name ?? null;
    if (!name) return;
    setBanner(name);
    setClosed(false);
  }, []);

  const close = (hideToday = false) => {
    /* 그냥 닫아도 다시 안 뜬다.

       예전에는 "오늘 하루 보지 않기"만 기억하고 닫기는 안 기억했다. 그래서
       화면을 옮길 때마다 같은 광고가 다시 올라왔다 — 닫았는데 또 나오면
       닫기 버튼이 일을 안 하는 것으로 읽힌다.

       둘의 차이는 기간만 남긴다. 닫기는 이 방문 동안(sessionStorage),
       오늘 하루 보지 않기는 24시간(localStorage). */
    if (hideToday) {
      window.localStorage.setItem(
        DISMISS_KEY,
        String(Date.now() + 24 * 60 * 60 * 1000),
      );
    } else {
      window.sessionStorage.setItem(DISMISS_KEY, "1");
    }
    setClosed(true);
  };

  const onPointerDown = (event: React.PointerEvent) => {
    // 버튼·링크를 누른 건 드래그가 아니다
    if ((event.target as HTMLElement).closest("a,button")) return;
    // 손가락으로 읽는 모바일에서는 카드 드래그가 페이지 스크롤을 가로챈다.
    // 위치 이동은 마우스처럼 정밀 포인터가 있는 넓은 화면에서만 제공한다.
    if (
      window.matchMedia("(max-width: 620px), (pointer: coarse)").matches
    ) {
      return;
    }
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    dragRef.current = {
      dx: event.clientX - rect.left,
      dy: event.clientY - rect.top,
    };
    setPos({ x: rect.left, y: rect.top });
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: React.PointerEvent) => {
    const drag = dragRef.current;
    const card = cardRef.current;
    if (!drag || !card) return;
    const w = card.offsetWidth;
    const h = card.offsetHeight;
    // 화면 밖으로 끌고 나가면 다시 잡을 수 없다 — 가장자리에서 멈춘다
    setPos({
      x: Math.min(
        Math.max(8, event.clientX - drag.dx),
        window.innerWidth - w - 8,
      ),
      y: Math.min(
        Math.max(8, event.clientY - drag.dy),
        window.innerHeight - h - 8,
      ),
    });
  };

  const endDrag = () => {
    dragRef.current = null;
  };

  /* 역할로 감추지 않는다.

     예전엔 게스트에게만 띄웠다. 기본 시드 배너가 "가입하면 …"이라 회원에게는
     결례라고 봤기 때문이다. 그런데 이 문구는 운영자가 큐레이션에서 정하는
     값이고, 배너가 늘 가입 권유인 것도 아니다. 그 결과 첫 화면에서 역할을
     고르는 순간 관계없는 광고가 같이 사라졌다 — 방문자에겐 버그로 읽힌다.

     문구가 대상에 맞는지는 운영자가 큐레이션에서 판단할 일이지, 이 컴포넌트가
     역할을 보고 통째로 감출 일이 아니다. */
  if (closed || !banner) return null;

  return (
    <div
      ref={cardRef}
      className="evpop"
      style={
        pos
          ? { left: pos.x, top: pos.y, right: "auto", bottom: "auto" }
          : undefined
      }
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      role="dialog"
      aria-label="이벤트 안내"
    >
      <div className="evpop-art" aria-hidden />

      <div className="evpop-body">
        <span className="evpop-tag">EVENT</span>
        <strong className="evpop-title">{banner}</strong>
        <p className="evpop-sub">회사별 평점, 연봉까지 바로 볼 수 있어요</p>
        <Link className="evpop-cta" href="/companies" onClick={() => close()}>
          리뷰 보러 가기
          <Icon name="arrow" />
        </Link>
      </div>

      {/* 닫기를 오른쪽 끝에 둔다 — 버튼 하나가 띠를 다 먹으면 글자가 왼쪽
          모서리에 붙어 정렬이 깨져 보인다. 한국 이벤트 팝업의 기본 형태다. */}
      <div className="evpop-foot">
        <button className="evpop-today" onClick={() => close(true)}>
          오늘 하루 보지 않기
        </button>
        <button className="evpop-close" onClick={() => close()}>
          닫기
          <Icon name="x" />
        </button>
      </div>
    </div>
  );
}
