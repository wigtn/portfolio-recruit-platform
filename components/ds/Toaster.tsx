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

/**
 * 경고 토스트로 표시할 id.
 *
 * 알림의 성격은 넷인데(안내·완료·주의·실패) ui-kit의 톤은 셋이다.
 * "필수 항목을 적어주세요"는 실패가 아니라 **아직 덜 된 것**이라, 빨강을
 * 쓰면 뭔가 망가진 것으로 읽힌다. 그렇다고 안내(파랑)로 두면 왜 안 넘어갔는지
 * 눈에 안 걸린다. 사이가 하나 필요하다.
 *
 * ui-kit은 외부 의존이라 타입을 늘릴 수 없다. 대신 매니저에는 info로 넣고
 * 여기서 id를 기억해 노랑으로 그린다 — `pos: "top"`이 이미 쓰는 방식이다.
 * 읽어 주는 역할(role)도 alert로 올린다. 화면을 안 보는 사람에게 "왜 제출이
 * 안 됐는지"는 즉시 알려야 하는 소식이다.
 */
const warnIds = new Set<string>();

/** 이 앱에서 쓰는 알림 성격. warn은 위 어댑터가 얹은 것 */
export type Tone = ToastTone | "warn";

/** 어디서든 호출하는 싱글턴 — `toast("저장했어요", { tone: "success" })`
    `pos: "top"`이면 상단 중앙에 띄운다(기본은 우측 하단). */
export function toast(
  message: string,
  opts?: Omit<ToastShowOptions, "message" | "tone"> & {
    tone?: Tone;
    pos?: "top";
  },
) {
  const { pos, tone, ...rest } = opts ?? {};
  const warn = tone === "warn";
  const id = manager.show({
    message,
    ...rest,
    ...(tone ? { tone: warn ? "info" : tone } : {}),
  });
  if (typeof id === "string") {
    if (pos === "top") topIds.add(id);
    if (warn) warnIds.add(id);
  }
  return id;
}

/* 아이콘은 성격을 한 글자로 말한다. info가 경고 삼각형(alert)을 쓰고 있어서
   안내와 주의가 같은 얼굴이었다 — 안내는 종(bell)으로 내린다. */
const TONE_ICON: Record<Tone, string> = {
  info: "bell",
  success: "check",
  warn: "alert",
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
  const render = (entry: (typeof toasts)[number]) => {
    /* 매니저는 warn을 모른다(info로 들어가 있다). 여기서 되살려 색과
       아이콘, 읽어 주는 역할을 정한다 */
    const tone: Tone = warnIds.has(entry.id) ? "warn" : entry.tone;
    return (
        <div
          key={entry.id}
          className={`ds-toast is-${tone}${entry.open ? "" : " is-out"}`}
          /* 실패와 주의는 즉시 읽어 준다 — 왜 넘어가지 않았는지는 기다렸다
             전할 소식이 아니다 */
          role={tone === "error" || tone === "warn" ? "alert" : "status"}
          onMouseEnter={() => manager.pause(entry.id)}
          onMouseLeave={() => manager.resume(entry.id)}
          onAnimationEnd={(event) => {
            if (
              event.animationName === "uk-toast-out" ||
              event.animationName === "toast-top-out"
            ) {
              manager.remove(entry.id);
              topIds.delete(entry.id);
              warnIds.delete(entry.id);
            }
          }}
        >
          <span className="ds-toast-ic">
            <Icon name={TONE_ICON[tone]} />
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
  };

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
