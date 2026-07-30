"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  announceMenuOpen,
  deriveNotifications,
  loadRead,
  markRead,
  MENU_OPEN_EVENT,
  type DemoNotification,
} from "@/lib/demo/notifications";
import { DEMO_PROGRESS_EVENT } from "@/lib/demo/progress";
import { Icon } from "./Icon";

/**
 * 헤더 알림 — 신고·증빙의 처리 결과가 사용자에게 **돌아오는** 표면이다.
 *
 * FAQ가 "처리 결과는 알림으로 전달"을 약속하는데 지금까지 알림이 없었다.
 * 목록은 저장하지 않고 매번 파생 계산한다(lib/demo/notifications.ts) —
 * 여기는 열림 상태·읽음 처리만 다룬다.
 *
 * 드롭다운 껍데기는 계정 메뉴(.acct-*)와 같은 문법을 그대로 쓴다. 헤더에
 * 나란히 놓이는 두 메뉴가 다른 모양으로 열리면 딴 데서 온 것처럼 보인다.
 */

const SOURCE = "bell";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<DemoNotification[]>([]);
  const [read, setRead] = useState<Set<string>>(new Set());
  const wrapRef = useRef<HTMLDivElement>(null);

  const refresh = () => {
    setItems(deriveNotifications());
    setRead(loadRead());
  };

  // 마운트 후 + 상태가 바뀔 만한 신호(체험 진행, 다른 탭의 조치)마다 다시 센다
  useEffect(() => {
    refresh();
    window.addEventListener(DEMO_PROGRESS_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(DEMO_PROGRESS_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  // 바깥 클릭·Esc·다른 헤더 메뉴 열림이면 닫는다 (계정 메뉴와 같은 문법)
  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const onOther = (event: Event) => {
      if ((event as CustomEvent).detail !== SOURCE) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener(MENU_OPEN_EVENT, onOther);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener(MENU_OPEN_EVENT, onOther);
    };
  }, [open]);

  const unread = items.filter((item) => !read.has(item.id));

  return (
    <div className="acct" ref={wrapRef}>
      <button
        className={open ? "acct-btn is-open" : "acct-btn"}
        style={{ position: "relative" }}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={
          unread.length ? `알림 — 안 읽음 ${unread.length}개` : "알림"
        }
        onClick={() => {
          const next = !open;
          setOpen(next);
          if (next) {
            refresh();
            announceMenuOpen(SOURCE);
          }
        }}
      >
        <span className="acct-av" aria-hidden>
          <Icon name="bell" />
        </span>
        {unread.length ? (
          <span className="ntf-badge" aria-hidden>
            {unread.length > 9 ? "9+" : unread.length}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="acct-menu ntf-menu" role="menu">
          <div
            className="acct-head"
            style={{
              justifyContent: "space-between",
              padding: "8px 10px 10px",
            }}
          >
            <b style={{ fontSize: 13.5, letterSpacing: "-.02em" }}>알림</b>
            {unread.length ? (
              <button
                className="btn line sm"
                style={{ padding: "3px 9px", fontSize: 11.5 }}
                onClick={() => {
                  markRead(items.map((item) => item.id));
                  setRead(loadRead());
                }}
              >
                모두 읽음
              </button>
            ) : null}
          </div>

          {items.length === 0 ? (
            <div
              style={{
                padding: "22px 12px",
                textAlign: "center",
                fontSize: 12.5,
                color: "var(--ink-3)",
              }}
            >
              새 알림이 없어요
              <div
                style={{ fontSize: 11.5, color: "var(--ink-4)", marginTop: 4 }}
              >
                신고·증빙의 처리 결과가 여기로 와요
              </div>
            </div>
          ) : (
            items.map((item) => {
              const isRead = read.has(item.id);
              return (
                <Link
                  className="acct-item"
                  role="menuitem"
                  key={item.id}
                  href={item.href}
                  style={{ alignItems: "flex-start" }}
                  onClick={() => {
                    markRead([item.id]);
                    setRead(loadRead());
                    setOpen(false);
                  }}
                >
                  {/* 미읽음 점 — 텍스트 첫 줄에 맞춰 앉힌다 */}
                  <span
                    aria-hidden
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: 99,
                      marginTop: 5,
                      flexShrink: 0,
                      background: isRead ? "var(--line)" : "var(--accent)",
                    }}
                  />
                  <span style={{ minWidth: 0 }}>
                    <b
                      style={{
                        display: "block",
                        fontSize: 12.5,
                        fontWeight: isRead ? 650 : 800,
                        color: isRead ? "var(--ink-3)" : "var(--ink)",
                        letterSpacing: "-.01em",
                      }}
                    >
                      {item.title}
                    </b>
                    {item.body ? (
                      <span
                        style={{
                          display: "block",
                          fontSize: 11.5,
                          color: "var(--ink-4)",
                          marginTop: 2,
                          lineHeight: 1.45,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {item.body}
                      </span>
                    ) : null}
                  </span>
                </Link>
              );
            })
          )}
        </div>
      ) : null}
    </div>
  );
}
