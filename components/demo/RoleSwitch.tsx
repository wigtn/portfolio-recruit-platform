"use client";

import { useState } from "react";
import { ROLE_LABEL, useRole } from "@/lib/demo/role";
import { Icon } from "@/components/Icon";
import { RoleModal } from "./RoleModal";

/**
 * nav의 역할 pill — 누르면 역할 전환 모달이 열린다.
 * 첫 방문이면 자동으로 한 번 열린다(시안 20번).
 */
export function RoleSwitch() {
  const { role, firstVisit } = useRole();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className="acct-btn role-switch-btn"
        aria-label={`역할 전환: 현재 ${ROLE_LABEL[role]}`}
        title="역할 전환"
        onClick={() => setOpen(true)}
      >
        <span
          className={role === "admin" ? "acct-av is-admin" : "acct-av"}
          aria-hidden
        >
          <Icon name={role === "admin" ? "shield" : "user"} />
        </span>
        <span className="role-switch-label">{ROLE_LABEL[role]}</span>
        <span className="role-switch-caret" aria-hidden>
          ▾
        </span>
      </button>
      {open || firstVisit ? <RoleModal onClose={() => setOpen(false)} /> : null}
    </>
  );
}
