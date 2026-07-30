"use client";

import { useState } from "react";
import { ROLE_LABEL, useRole } from "@/lib/demo/role";
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
        className={role === "admin" ? "pill" : "pill ghost"}
        onClick={() => setOpen(true)}
      >
        {ROLE_LABEL[role]} ▾
      </button>
      {open || firstVisit ? <RoleModal onClose={() => setOpen(false)} /> : null}
    </>
  );
}
