"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

/**
 * 모달 껍데기 — 배경 클릭·Esc로 닫히는 동작을 한 곳에 모았다.
 * 모달마다 따로 달면 하나씩 빠뜨린다(공지 모달만 Esc가 안 먹던 게 그 경우다).
 *
 * P1 Modal의 등장/퇴장이 여기 얹힌다:
 * - 등장: render → **이중 rAF** → is-enter 해제. 단일 rAF면 시작 스타일이
 *   같은 프레임에 커밋돼 트랜지션이 통째로 생략된다(P1 원본 코멘트).
 * - 퇴장: is-closing 200ms 후에 onClose(언마운트). 취소 버튼도 이 경로를
 *   타야 하므로 useOverlayClose()로 애니메이션 닫기를 나눠준다.
 */

const EXIT_MS = 200;

const OverlayCloseContext = createContext<(() => void) | null>(null);

/** 모달 내부 버튼용 — 퇴장 애니메이션을 거쳐 닫는다(없으면 즉시 닫기) */
export function useOverlayClose(fallback?: () => void) {
  const contextClose = useContext(OverlayCloseContext);
  return contextClose ?? fallback ?? (() => {});
}

export function Overlay({
  onClose,
  children,
}: {
  onClose: () => void;
  children: React.ReactNode;
}) {
  const [phase, setPhase] = useState<"enter" | "open" | "closing">("enter");
  const closeTimer = useRef<number | undefined>(undefined);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => setPhase("open"));
    });
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
      window.clearTimeout(closeTimer.current);
    };
  }, []);

  const requestClose = useCallback(() => {
    // 이미 닫히는 중이면 타이머를 다시 걸지 않는다(이중 클릭·Esc 연타)
    setPhase((current) => {
      if (current === "closing") return current;
      closeTimer.current = window.setTimeout(() => closeRef.current(), EXIT_MS);
      return "closing";
    });
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") requestClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [requestClose]);

  return (
    <div
      className={`modalwrap is-${phase}`}
      role="dialog"
      aria-modal
      onClick={(event) => {
        if (event.target === event.currentTarget) requestClose();
      }}
    >
      <OverlayCloseContext.Provider value={requestClose}>
        {children}
      </OverlayCloseContext.Provider>
    </div>
  );
}
