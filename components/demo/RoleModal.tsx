"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import { ROLE_LABEL, useRole, type Role } from "@/lib/demo/role";
import { Icon } from "@/components/Icon";

/** 시안 정본 20번 — .modalwrap > .modal > .roles */
const ROLES: Array<{ key: Role; icon: string; desc: string }> = [
  { key: "guest", icon: "view", desc: "둘러보기만 · 회사 리뷰는 일부만" },
  { key: "member", icon: "users", desc: "글·리뷰 작성 · 전체 열람" },
  { key: "admin", icon: "bot", desc: "백오피스 · 모더레이션" },
];

export function RoleModal({
  onClose,
  redirectAdmin = true,
}: {
  onClose?: () => void;
  /** 운영자 선택 시 백오피스로 이동(기본). 제자리에서 권한만 필요한 흐름
      (글 화면의 안전 강도 변경 등)은 false로 잔류한다. */
  redirectAdmin?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { role, setRole, dismissFirstVisit } = useRole();
  const [picked, setPicked] = useState<Role>(
    role === "guest" ? "member" : role,
  );
  // 포털 — 호출부가 어디든(admin 사이드바 안 포함) body에 띄운다.
  // sticky 사이드바는 스태킹 컨텍스트라, 그 안에 렌더된 모달은 z를 아무리
  // 올려도 본문 표(z3 thead)에 지는 구조적 함정이 있었다.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
    <div className="modalwrap">
      <div
        className="modal role-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="role-modal-title"
      >
        <h3 id="role-modal-title">어떤 역할로 체험해볼까요?</h3>
        <div className="msub">
          이 데모는 로그인 없이 역할만 바꿔서 화면을 둘러볼 수 있어요
        </div>

        <div className="roles">
          {ROLES.map((item) => (
            <button
              key={item.key}
              className={picked === item.key ? "role on" : "role"}
              onClick={() => setPicked(item.key)}
            >
              <div className="ri">
                <Icon name={item.icon} />
              </div>
              <div className="rn">{ROLE_LABEL[item.key]}</div>
              <div className="rd">{item.desc}</div>
            </button>
          ))}
        </div>

        <div className="modal-actions">
          <button
            className="btn line"
            style={{ flex: 1, justifyContent: "center" }}
            onClick={() => {
              dismissFirstVisit();
              onClose?.();
            }}
          >
            이대로 둘러보기
          </button>
          <button
            className="btn primary"
            style={{ flex: 1, justifyContent: "center" }}
            onClick={() => {
              setRole(picked);
              onClose?.();
              // 운영자로 로그인하면 곧장 백오피스로 — 운영자의 홈은 거기다.
              // 이미 admin 화면이면(게이트에서 전환) 자리 유지.
              if (
                redirectAdmin &&
                picked === "admin" &&
                !pathname.startsWith("/admin")
              ) {
                router.push("/admin");
              }
            }}
          >
            {picked === "admin"
              ? "운영자로 시작"
              : `${ROLE_LABEL[picked]}으로 시작`}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
