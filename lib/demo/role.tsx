"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { markProgress } from "./progress";

/**
 * 역할 전환 — 데모의 로그인 대체 장치.
 *
 * 시안 20번: "이 데모는 로그인 없이 역할만 바꿔서 화면을 둘러볼 수 있어요".
 * `로그인`이라는 말을 쓰지 않는다.
 *
 * 이 값이 관리자 게이트의 권한 판정으로 이어진다 — 게스트·회원으로 관리자 조치를 시도하면
 * backoffice-frame이 PERMISSION_DENIED로 거절한다. 역할이 곧 권한이라는 걸 보여주는 장치다.
 */

export type Role = "guest" | "member" | "admin";

export const ROLE_LABEL: Record<Role, string> = {
  guest: "게스트",
  member: "일반 회원",
  admin: "운영자",
};

const KEY = "wigtn-demo-role-v1";

type RoleContext = {
  role: Role;
  setRole: (role: Role) => void;
  /** 첫 방문이면 역할 선택 모달을 띄운다 */
  firstVisit: boolean;
  dismissFirstVisit: () => void;
};

const Ctx = createContext<RoleContext | null>(null);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<Role>("guest");
  const [firstVisit, setFirstVisit] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(KEY);
    // 알 수 없는 값이 남아 있으면 게스트로 되돌린다 — 권한 판정에 쓰이는 값이라 검증한다
    if (saved === "guest" || saved === "member" || saved === "admin") {
      setRoleState(saved);
    } else {
      if (saved) window.localStorage.removeItem(KEY);
      setFirstVisit(true);
    }
  }, []);

  const setRole = useCallback((next: Role) => {
    setRoleState(next);
    window.localStorage.setItem(KEY, next);
    setFirstVisit(false);
    markProgress("role");
  }, []);

  const dismissFirstVisit = useCallback(() => {
    // "이대로 둘러보기" — 게스트로 저장해 다음 방문엔 안 묻는다
    window.localStorage.setItem(KEY, "guest");
    setFirstVisit(false);
  }, []);

  return (
    <Ctx.Provider value={{ role, setRole, firstVisit, dismissFirstVisit }}>
      {children}
    </Ctx.Provider>
  );
}

export function useRole() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useRole은 RoleProvider 안에서만 쓸 수 있어요");
  return ctx;
}
