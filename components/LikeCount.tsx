"use client";

import { useEffect, useState } from "react";
import { loadUser, USER_CHANGE_EVENT } from "@/lib/demo/user";

/**
 * 도움돼요 수 표시 — 시드 기본값 + 내 반응(+1)을 어느 화면에서든 같게.
 *
 * 글 상세에서 도움돼요를 누르면 목록·인기글·캐러셀의 숫자도 함께 올라야
 * "실제로 동작한다"가 성립한다. 서버는 기본값을 그리고, 마운트 후 내
 * 반응을 얹는다(하이드레이션 불일치 방지). 이후에는 변경 이벤트를 구독.
 */
export function LikeCount({ postId, base }: { postId?: string; base: number }) {
  const [mine, setMine] = useState(0);

  useEffect(() => {
    if (!postId) return;
    const sync = () => setMine(loadUser().likes.includes(postId) ? 1 : 0);
    sync();
    window.addEventListener(USER_CHANGE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(USER_CHANGE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [postId]);

  return <>{base + mine}</>;
}
