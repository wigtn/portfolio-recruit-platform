"use client";

import { useState } from "react";
import { useRole } from "@/lib/demo/role";
import { RoleModal } from "./demo/RoleModal";
import { Icon } from "./Icon";

/**
 * 게스트 리뷰 게이트 — 역할 모달이 "게스트: 회사 리뷰는 일부만"이라고
 * 약속하는 자리다. 그 약속을 지키는 곳은 여기 하나뿐이니 문구를 바꿀 때
 * 같이 본다(홈 마퀴는 서비스 소개용이라 의도적으로 열어 둔다).
 *
 * 첫 건은 그대로 보여준다. 전부 가리면 무엇을 여는 것인지 알 수 없어
 * 전환할 이유가 생기지 않는다 — 맛보기 한 건이 게이트의 핵심이다.
 *
 * **가리는 방식이 중요하다.** 잘라내거나 서서히 사라지게 하면 "리뷰가 없는
 * 회사"로 읽힌다. 리뷰는 끝까지 다 그리고 흐리게만 만든다 — 카드가 몇 장
 * 어떤 길이로 쌓여 있는지 보여야 "저기 뭔가 있다"가 성립하고, 그게 로그인할
 * 이유가 된다. 본문을 지우지 않으므로 마크업은 회원과 같고, 역할을 바꾸면
 * 즉시 원래대로 돌아온다.
 */
export function GuestReviewGate({
  count,
  children,
}: {
  /** 가려진 리뷰 건수 — 무엇을 여는지 숫자로 말한다 */
  count: number;
  children: React.ReactNode;
}) {
  const { role, setRole } = useRole();
  const [open, setOpen] = useState(false);

  if (role !== "guest") return <>{children}</>;

  return (
    <div className="gate">
      <div className="gate-veil" aria-hidden>
        {children}
      </div>

      {/* 카드는 흐린 더미 위에 얹혀 함께 스크롤된다 — 화면에 고정해 버리면
          리뷰가 얼마나 남았는지 가늠할 수 없다 */}
      <div className="gate-card">
        <span className="gate-ic">
          <Icon name="lock" />
        </span>
        <strong>나머지 리뷰 {count}건은 로그인해야 볼 수 있어요</strong>
        <p>
          지금은 <b>게스트</b>로 보고 있어요. 이 데모는 비밀번호 없이 계정만
          바꿔 로그인합니다.
        </p>

        <div className="gate-acts">
          {/* 한 번에 열리는 길을 먼저 준다 — 모달을 한 겹 더 거치게 하면
              "볼 수 있다"는 확신이 서기 전에 이탈한다 */}
          <button className="btn primary" onClick={() => setRole("member")}>
            일반 회원으로 로그인
            <Icon name="arrow" />
          </button>
          <button className="gate-other" onClick={() => setOpen(true)}>
            <Icon name="swap" />
            다른 계정으로 로그인
          </button>
        </div>
      </div>

      {open ? <RoleModal onClose={() => setOpen(false)} /> : null}
    </div>
  );
}
