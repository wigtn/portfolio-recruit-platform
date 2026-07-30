"use client";

import { useEffect, useState } from "react";
import { loadUser, USER_CHANGE_EVENT } from "@/lib/demo/user";

/**
 * 답변 수 표시 — 시드 기본값 + 내가 단 답변(대댓글 포함)을 어느 화면에서든.
 * 글 상세에서 답변을 달면 목록·인기글의 숫자도 함께 오른다(LikeCount와
 * 같은 계약: 서버는 기본값, 마운트 후 내 몫을 얹고 변경 이벤트를 구독).
 */
export function CommentCount({
  postId,
  base,
}: {
  postId?: string;
  base: number;
}) {
  const [mine, setMine] = useState(0);

  useEffect(() => {
    if (!postId) return;
    const sync = () =>
      setMine(loadUser().answers.filter((item) => item.postId === postId).length);
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
