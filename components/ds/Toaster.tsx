"use client";

import { useSyncExternalStore } from "react";
import {
  createToastManager,
  type ToastShowOptions,
  type ToastTone,
} from "@wigtn/ui-kit/overlay/toast-manager";
import { Icon } from "@/components/Icon";

/**
 * 토스트 — 우측 하단 스택. P1의 안내 문법이다.
 *
 * "이 권한은 바꿀 수 없어요" 같은 잠금·거절 안내가 화면 본문에 배너로
 * 박히면 레이아웃이 흔들리고, 다음 클릭 때도 남아 있다. 토스트는 시선
 * 흐름을 안 끊고 스스로 사라진다.
 *
 * 코어는 ui-kit 토스트 매니저(무의존 store) — 여기는 React 어댑터와
 * 우측 하단 표현만 얹는다. 소멸은 2단계: dismiss(퇴장 재생) →
 * animationend에서 remove.
 */
const manager = createToastManager();

/* SSR 스냅샷은 항상 같은 참조여야 한다 — 인라인 () => []는 호출마다 새
   배열을 만들어 "getServerSnapshot should be cached" 경고를 매 렌더 띄운다 */
const EMPTY: ReturnType<typeof manager.list> = [];

/** 상단 중앙 스택 — 화면 안 사건(에디터 살균 등)의 결과 요약용.
    id 집합만 따로 들고, 렌더 시 두 컨테이너로 가른다. */
const topIds = new Set<string>();

/** 어디서든 호출하는 싱글턴 — `toast("저장했어요", { tone: "success" })`
    `pos: "top"`이면 상단 중앙에 띄운다(기본은 우측 하단). */
export function toast(
  message: string,
  opts?: Omit<ToastShowOptions, "message"> & { pos?: "top" },
) {
  const { pos, ...rest } = opts ?? {};
  const id = manager.show({ message, ...rest });
  if (pos === "top" && typeof id === "string") topIds.add(id);
  return id;
}

const TONE_ICON: Record<ToastTone, string> = {
  info: "alert",
  success: "check",
  error: "x",
};

export function Toaster() {
  const toasts = useSyncExternalStore(
    manager.subscribe,
    manager.list,
    () => EMPTY,
  );
  if (toasts.length === 0) return null;

  const bottom = toasts.filter((entry) => !topIds.has(entry.id));
  const top = toasts.filter((entry) => topIds.has(entry.id));
  const render = (entry: (typeof toasts)[number]) => (
        <div
          key={entry.id}
          className={`ds-toast is-${entry.tone}${entry.open ? "" : " is-out"}`}
          role={entry.tone === "error" ? "alert" : "status"}
          onMouseEnter={() => manager.pause(entry.id)}
          onMouseLeave={() => manager.resume(entry.id)}
          onAnimationEnd={(event) => {
            if (
              event.animationName === "uk-toast-out" ||
              event.animationName === "toast-top-out"
            ) {
              manager.remove(entry.id);
              topIds.delete(entry.id);
            }
          }}
        >
          <span className="ds-toast-ic">
            <Icon name={TONE_ICON[entry.tone]} />
          </span>
          <span className="ds-toast-msg">{entry.message}</span>
          {entry.action ? (
            <button
              className="ds-toast-act"
              onClick={() => {
                entry.action?.onAction();
                manager.dismiss(entry.id);
              }}
            >
              {entry.action.label}
            </button>
          ) : null}
          <button
            className="ds-toast-x"
            aria-label="닫기"
            onClick={() => manager.dismiss(entry.id)}
          >
            <Icon name="x" />
          </button>
        </div>
  );

  return (
    <>
      {bottom.length > 0 ? (
        <div className="ds-toaster" aria-live="polite">
          {bottom.map(render)}
        </div>
      ) : null}
      {top.length > 0 ? (
        <div className="ds-toaster is-top" aria-live="polite">
          {top.map(render)}
        </div>
      ) : null}
    </>
  );
}
