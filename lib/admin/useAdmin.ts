"use client";

import { useCallback, useEffect, useState } from "react";
import { runAdminTool, type ToolPayload, type ToolResult } from "./run";
import { loadState, subscribeState, type AdminState } from "./overlay";
import { useRole } from "@/lib/demo/role";

/**
 * 관리자 화면 공통 배선 — 화면마다 똑같이 반복되던 것을 한 곳에 모았다.
 *
 * 상태(오버레이) 읽기 · 조치 실행 · STEP_UP 거절 시 재인증 모달 열기 · 결과 배너까지가
 * 모든 백오피스 화면에서 동일하다. 판정은 여전히 backoffice-frame이 한다.
 *
 * 재인증 통과 여부(`verified`)는 화면 단위로 유지된다 — 한 번 확인했으면 그 화면에서
 * 연달아 조치할 때 매번 다시 묻지 않는다.
 */
export function useAdmin() {
  const { role } = useRole();
  const isAdmin = role === "admin";
  const [state, setState] = useState<AdminState | null>(null);
  const [verified, setVerified] = useState(false);
  const [pending, setPending] = useState<{ tool: string; id: string } | null>(
    null,
  );
  const [result, setResult] = useState<ToolResult | null>(null);
  const [busy, setBusy] = useState(false);
  // 재인증이 필요해 멈춘 조치는 입력값까지 들고 있어야 그대로 이어서 실행할 수 있다.
  // 일괄 처리 중 멈췄으면 남은 대상(restIds)도 함께 들고 있다가 통과 후 이어서 돈다.
  const [held, setHeld] = useState<{
    reason?: string;
    payload?: ToolPayload;
    idempotencyKey?: string;
    restIds?: string[];
  }>({});

  // 오버레이는 브라우저에만 있으므로 마운트 후 읽는다(SSR 불일치 방지).
  // 이후에는 구독으로 따라간다 — 다른 화면·다른 탭의 조치도 즉시 반영돼야 숫자가 맞는다.
  useEffect(() => {
    const sync = () => setState(loadState());
    sync();
    return subscribeState(sync);
  }, []);

  const act = useCallback(
    async (
      tool: string,
      id: string,
      options: {
        reason?: string;
        verified?: boolean;
        payload?: ToolPayload;
        idempotencyKey?: string;
      } = {},
    ): Promise<ToolResult> => {
      const idempotencyKey = options.idempotencyKey ?? crypto.randomUUID();
      setBusy(true);
      const res = await runAdminTool({
        tool,
        id,
        isAdmin,
        verified: options.verified ?? verified,
        idempotencyKey,
        reason: options.reason,
        payload: options.payload,
      });
      setBusy(false);
      setResult(res);

      if (!res.ok && res.code === "STEP_UP_REQUIRED") {
        setPending({ tool, id });
        setHeld({
          reason: options.reason,
          payload: options.payload,
          idempotencyKey,
        });
        return res;
      }
      if (res.ok) setState(res.state);
      return res;
    },
    [isAdmin, verified],
  );

  /**
   * 여러 대상에 같은 조치를 순서대로 적용한다(일괄 반려·일괄 정지).
   * step-up 게이트는 그대로다 — 첫 대상이 STEP_UP으로 멈추면 남은 대상을 held에
   * 걸어 두고, 재인증 통과 시 resume이 전부 이어서 실행한다.
   */
  const actMany = useCallback(
    async (
      tool: string,
      ids: string[],
      options: { reason?: string; payload?: ToolPayload } = {},
    ): Promise<ToolResult | null> => {
      let last: ToolResult | null = null;
      for (let index = 0; index < ids.length; index += 1) {
        // 멱등키는 대상마다 새로 — 키를 재사용하면 두 번째 대상부터 "이미 처리됨"이 된다
        const res = await act(tool, ids[index], options);
        last = res;
        if (!res.ok) {
          if (res.code === "STEP_UP_REQUIRED") {
            const rest = ids.slice(index + 1);
            setHeld((prev) => ({ ...prev, restIds: rest }));
          }
          return res;
        }
      }
      return last;
    },
    [act],
  );

  /** 재인증 모달에서 통과했을 때 — 막혔던 조치를 입력값 그대로 이어서 실행한다 */
  const resume = useCallback(async () => {
    if (!pending) return;
    const target = pending;
    const rest = held.restIds ?? [];
    setVerified(true);
    setPending(null);
    setHeld((prev) => ({ ...prev, restIds: undefined }));
    const res = await act(target.tool, target.id, {
      reason: held.reason,
      payload: held.payload,
      idempotencyKey: held.idempotencyKey,
      verified: true,
    });
    if (!res.ok) return;
    // 일괄 처리 중이었다면 남은 대상도 같은 검증으로 이어서 — 대상마다 새 멱등키
    for (const id of rest) {
      const next = await act(target.tool, id, {
        reason: held.reason,
        payload: held.payload,
        verified: true,
      });
      if (!next.ok) return;
    }
  }, [act, held, pending]);

  /** 게이트를 타지 않는 화면 로컬 변경(검색·탭 등)이 아니라, 저장이 필요한 직접 갱신용 */
  const replace = useCallback((next: AdminState) => setState(next), []);

  return {
    state,
    isAdmin,
    busy,
    result,
    setResult,
    act,
    actMany,
    pending,
    cancelPending: useCallback(() => setPending(null), []),
    resume,
    replace,
  };
}
