"use client";

import { useEffect, useState } from "react";
import { loadState, subscribeState } from "@/lib/admin/overlay";
import { openQuestions } from "@/lib/admin/seed";
import { tabOf } from "@/lib/admin/reports";

/**
 * 사이드바 배지 — 굳어 있으면 목록을 다 처리해도 8이 남아 있다.
 * 오버레이에서 실제로 세고, 0이면 배지를 감춘다. 마운트 1회로 끝내지 않고
 * 구독한다 — 조치 즉시, 다른 탭의 제출도 이 배지가 따라와야 왕복이 보인다.
 */
export function NavCount({
  of,
}: {
  of: "reports" | "evidence" | "questions" | "inquiries";
}) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const sync = () => {
      const state = loadState();
      setCount(
        of === "reports"
          ? state.reports.filter((row) => tabOf(row) === "open").length
          : of === "evidence"
            ? state.evidence.filter((row) => row.status === "대기").length
            : of === "inquiries"
              ? state.inquiries.filter((row) => row.status === "대기").length
              : openQuestions(state.answers).length,
      );
    };
    sync();
    return subscribeState(sync);
  }, [of]);

  if (!count) return null;
  return <span className="cnt">{count}</span>;
}
