"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "./Icon";

/**
 * 코치마크 — 시안 `.coachwrap > .coach`. 닫으면 다시 안 뜬다.
 *
 * 화면마다 따로 붙어 있던 걸 하나로 모았다. 안내를 닫는 X가 안 먹으면
 * 데모 내내 같은 말풍선이 따라다녀서 오히려 방해가 된다.
 */
export function Coach({
  id,
  children,
  after,
  cta,
}: {
  /** 닫힘 여부를 기억할 키 */
  id: string;
  children: React.ReactNode;
  /** 대상 아래에 붙는 말풍선이면 true(시안 .coachwrap.after) */
  after?: boolean;
  /** 다음 행동 — 안내로 끝내지 않고 바로 데려간다 */
  cta?: { label: string; href: string };
}) {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (window.localStorage.getItem(`wigtn-demo-coach-${id}`)) setOpen(false);
  }, [id]);

  if (!open) return null;

  return (
    <div className={after ? "coachwrap after" : "coachwrap"}>
      <div className={after ? "coach" : "coach up"}>
        <span className="cb">데모</span>
        <span className="ct">{children}</span>
        {cta ? (
          <Link className="cgo" href={cta.href}>
            {cta.label}
            <Icon name="arrow" />
          </Link>
        ) : null}
        <button
          className="cx"
          aria-label="안내 닫기"
          onClick={() => {
            window.localStorage.setItem(`wigtn-demo-coach-${id}`, "1");
            setOpen(false);
          }}
        >
          <Icon name="x" />
        </button>
      </div>
    </div>
  );
}
