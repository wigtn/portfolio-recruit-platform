"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ROLE_LABEL, useRole } from "@/lib/demo/role";
import { RoleModal } from "./demo/RoleModal";
import { Icon } from "./Icon";
import { DEMO_PROFILE, levelFor } from "@/lib/demo/profile";
import { myEvidenceStatus } from "@/lib/demo/submit";
import { announceMenuOpen, MENU_OPEN_EVENT } from "@/lib/demo/notifications";

/**
 * 헤더 계정 버튼 — 프로필 아바타 하나만 놓고, 누르면 메뉴가 열린다.
 *
 * 이전에는 "일반 회원 ▾" 알약이 헤더 폭을 잡아먹었다. 역할 이름은 메뉴 안으로
 * 들여보내고 헤더에는 아바타만 남긴다.
 *
 * 아바타는 이니셜이 아니라 기본 사람 아이콘이다 — 실제 프로필 사진이 없는
 * 서비스에서 헤더에 글자를 넣으면 한글 baseline 때문에 원 안에서 미묘하게
 * 떠 보인다. 아이콘은 그런 문제가 없다.
 *
 * 역할 전환 자체는 기존 RoleModal이 그대로 맡는다(권한 판정에 쓰이는 값이라
 * 선택 UI를 두 벌로 만들지 않는다).
 */
export function AccountMenu() {
  const { role, firstVisit } = useRole();
  const [open, setOpen] = useState(false);
  const [modal, setModal] = useState(false);
  // 등급은 증빙 승인에 따라 바뀐다 — 마이·실적 인증과 같은 정본(levelFor)을 탄다
  const [level, setLevel] = useState<string>(DEMO_PROFILE.level);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLevel(levelFor(myEvidenceStatus()?.status));
  }, [open]);

  // 바깥 클릭·Esc·다른 헤더 메뉴(알림) 열림이면 닫는다
  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const onOther = (event: Event) => {
      if ((event as CustomEvent).detail !== "account") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener(MENU_OPEN_EVENT, onOther);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener(MENU_OPEN_EVENT, onOther);
    };
  }, [open]);

  /** 이름·등급은 마이 화면과 같은 정본에서 읽는다 — 두 곳이 어긋나면 안 된다 */
  const IDENTITY: Record<string, { name: string; sub: string }> = {
    guest: { name: "게스트", sub: "로그인 없이 둘러보는 중" },
    member: { name: DEMO_PROFILE.name, sub: level },
    admin: { name: DEMO_PROFILE.name, sub: "운영자 권한" },
  };
  const who = IDENTITY[role] ?? IDENTITY.guest;

  return (
    <div className="acct" ref={wrapRef}>
      <button
        className={open ? "acct-btn is-open" : "acct-btn"}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`계정 메뉴, ${ROLE_LABEL[role]}`}
        onClick={() => {
          const next = !open;
          setOpen(next);
          // 알림 쪽이 듣고 닫는다 — 헤더 드롭다운은 하나만 열린다
          if (next) announceMenuOpen("account");
        }}
      >
        <span className="acct-av" aria-hidden>
          <Icon name="user" />
        </span>
      </button>

      {open ? (
        <div className="acct-menu" role="menu">
          <div className="acct-head">
            <span className="acct-av lg" aria-hidden>
              <Icon name="user" />
            </span>
            <div className="acct-who">
              <b>{who.name}</b>
              <span>{who.sub}</span>
            </div>
          </div>

          <Link
            className="acct-item"
            role="menuitem"
            href="/my"
            onClick={() => setOpen(false)}
          >
            <Icon name="user" />내 정보
          </Link>

          {role === "admin" ? (
            <Link
              className="acct-item"
              role="menuitem"
              href="/admin"
              onClick={() => setOpen(false)}
            >
              <Icon name="chart" />
              백오피스
            </Link>
          ) : null}

          <div className="acct-div" />

          <button
            className="acct-item"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              setModal(true);
            }}
          >
            <Icon name="swap" />
            계정 변경
          </button>
        </div>
      ) : null}

      {modal || firstVisit ? (
        <RoleModal onClose={() => setModal(false)} />
      ) : null}
    </div>
  );
}
