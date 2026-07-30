"use client";

import { useEffect, useRef } from "react";
import type { ToolResult } from "@/lib/admin/run";
import { toast } from "@/components/ds/Toaster";

/**
 * 조치 결과 — 우측 하단 토스트로 나간다 (사용자 지시).
 *
 * 원래는 본문 배너였다: "근거가 남아야 하는 결과는 화면에 남긴다"는
 * 구분이었지만, 근거는 어차피 처리 기록 화면이 정본이고 배너는 화면
 * 높이만 흔들었다(모션 절대 규칙 위반). 이제 성공/실패 모두 토스트다.
 *
 * 인터페이스는 그대로 둔다 — 열 개 화면이 <ResultNote result={...}/>로
 * 배선돼 있어, 표현만 바꾸면 호출부는 몰라도 된다.
 */
export function ResultNote({
  result,
  where = "처리 기록",
}: {
  result: ToolResult | null;
  where?: string;
}) {
  // 같은 결과 객체로 리렌더될 때 토스트가 중복 발사되지 않게 참조로 dedupe
  const last = useRef<ToolResult | null>(null);

  useEffect(() => {
    if (!result || result === last.current) return;
    last.current = result;
    toast(
      result.ok
        ? `${result.message} — ${where}에 남았어요`
        : result.message,
      { tone: result.ok ? "success" : "error" },
    );
  }, [result, where]);

  return null;
}
