"use client";

import Link from "next/link";
import { applyTheme, THEMES } from "@/lib/demo/theme";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/Icon";
import { useRole } from "@/lib/demo/role";
import { resetDemoExperience } from "@/lib/demo/progress";
import {
  announcePanel,
  DEMO_FEATURES,
  DEMO_OPEN_CHAT_EVENT,
  DEMO_PANEL_OPEN_EVENT,
  DEMO_PROGRESS_EVENT,
  loadDemoTheme,
  loadProgress,
  markProgress,
  saveDemoTheme,
  type DemoFeature,
} from "@/lib/demo/progress";

/* 목록 정본은 progress.ts의 DEMO_FEATURES — 사본을 두면 contact 화면의
   체험 요약과 여기가 조용히 갈린다(실제로 갈렸었다). */
const FEATURES = DEMO_FEATURES;

/* 라우트 도착은 "둘러봄"이지 "해봄"이 아니다. 완료(done)는 실동작 훅
   (markProgress — 신고 제출, 재인증 통과, 정책 저장 등)만 만든다.
   예외 둘: 대시보드·처리 기록은 "보는 것"이 곧 체험이라 방문이 완료다.
   ⚠ write가 /community/[^/]+에 먼저 삼켜지지 않게 구체적인 패턴이 앞. */
const ROUTE_VISITS: Array<[RegExp, DemoFeature]> = [
  [/^\/community\/write$/, "content-safety"],
  [/^\/community\/[^/]+$/, "ai-answer"],
  [/^\/companies\/[^/]+$/, "company-review"],
  [/^\/my$/, "evidence"],
  [/^\/badges$/, "evidence"],
  [/^\/admin\/reports$/, "step-up"],
  [/^\/admin\/policies$/, "policy"],
  [/^\/admin\/questions$/, "question"],
  [/^\/admin\/curation$/, "curation"],
];
const ROUTE_DONE: Array<[RegExp, DemoFeature]> = [
  [/^\/admin\/audit$/, "audit"],
  [/^\/admin$/, "dashboard"],
];

/* 둘러봄 기록 — 진행률(progress.ts)과 별도 키. wigtn-demo- 접두라 초기화에 쓸려간다 */
const VISITED_KEY = "wigtn-demo-guide-visited-v1";

function loadVisited(): Set<DemoFeature> {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(VISITED_KEY) ?? "[]");
    return new Set(Array.isArray(parsed) ? (parsed as DemoFeature[]) : []);
  } catch {
    return new Set();
  }
}

/** 이 브라우저의 체험 기록을 지우고 처음 상태로 되돌린다 */
function resetDemo() {
  resetDemoExperience();
  window.location.reload();
}

export function DemoGuideWidget() {
  const pathname = usePathname();
  const { firstVisit } = useRole();
  const [open, setOpen] = useState(false);
  const [coach, setCoach] = useState(false);
  const [progress, setProgress] = useState<Set<DemoFeature>>(new Set());
  const [visited, setVisited] = useState<Set<DemoFeature>>(new Set());
  const [theme, setTheme] = useState("indigo");
  // 헥스 입력 초안 — 6자리가 완성될 때만 테마에 적용한다
  const [hexDraft, setHexDraft] = useState("#4f46e5");

  useEffect(() => {
    const savedTheme = loadDemoTheme() ?? "indigo";
    setTheme(savedTheme);
    applyTheme(savedTheme);
    setHexDraft(
      savedTheme.startsWith("custom:")
        ? savedTheme.slice(7)
        : (THEMES.find((item) => item.id === savedTheme)?.color ?? "#4f46e5"),
    );
    setProgress(loadProgress());
    setVisited(loadVisited());
    setCoach(!window.localStorage.getItem("wigtn-demo-coach-guide"));

    const sync = () => setProgress(loadProgress());
    window.addEventListener(DEMO_PROGRESS_EVENT, sync);
    /* 챗봇이 열리면 이쪽이 접힌다. 버튼은 양쪽 다 자리를 지킨다 — 한쪽을
       여는 순간 다른 쪽으로 가는 길이 사라지면 안 된다 */
    const onPanel = (event: Event) => {
      const owner = (event as CustomEvent<{ owner: string }>).detail?.owner;
      if (owner !== "guide") setOpen(false);
    };
    window.addEventListener(DEMO_PANEL_OPEN_EVENT, onPanel);
    return () => {
      window.removeEventListener(DEMO_PROGRESS_EVENT, sync);
      window.removeEventListener(DEMO_PANEL_OPEN_EVENT, onPanel);
    };
  }, []);

  useEffect(() => {
    const done = ROUTE_DONE.find(([pattern]) => pattern.test(pathname));
    if (done) markProgress(done[1]);
    const visit = ROUTE_VISITS.find(([pattern]) => pattern.test(pathname));
    if (visit) {
      setVisited((prev) => {
        if (prev.has(visit[1])) return prev;
        const next = new Set(prev);
        next.add(visit[1]);
        window.localStorage.setItem(VISITED_KEY, JSON.stringify([...next]));
        return next;
      });
    }
  }, [pathname]);

  const doneCount = FEATURES.filter((feature) =>
    progress.has(feature.id),
  ).length;
  const complete = doneCount >= FEATURES.length;

  const grouped = useMemo(
    () => ({
      서비스: FEATURES.filter((feature) => feature.group === "서비스"),
      "운영 왕복": FEATURES.filter((feature) => feature.group === "운영 왕복"),
    }),
    [],
  );

  return (
    <aside className="demowidget" aria-label="핵심 기능 체험 가이드">
      {coach && !open && !firstVisit ? (
        <div className="coach up guide-coach uk-pop-in">
          <span className="cb">데모</span>
          <span className="ct">
            여기 있는 <b>{FEATURES.length}가지, 전부 실제로 동작해요</b>, 눌러서 확인해보세요
          </span>
          <button
            className="cx"
            aria-label="가이드 안내 닫기"
            onClick={() => {
              window.localStorage.setItem("wigtn-demo-coach-guide", "1");
              setCoach(false);
            }}
          >
            <Icon name="x" />
          </button>
        </div>
      ) : null}

      {open ? (
        <div className="dwpanel uk-scale-in">
          <div className="dwhead">
            <span className="demo">데모</span>
            <b>핵심 기능 체험</b>
            <span className="dwprog">
              {doneCount}/{FEATURES.length}
            </span>
          </div>
          {complete ? (
            <Link
              className="dwdone"
              href="/contact"
              onClick={() => setOpen(false)}
            >
              <b>{FEATURES.length}가지를 전부 직접 확인하셨네요</b>
              <span>
                여기까지 동작하는 상태로 만들어 드려요
                <Icon name="arrow" />
              </span>
            </Link>
          ) : (
            <div className="dwsub">
              누르면 그 화면으로 가요, 실행까지 마치면 체크가 켜져요
            </div>
          )}
          <div className="dwlist">
            {(Object.keys(grouped) as Array<keyof typeof grouped>).map(
              (group) => (
                <div key={group}>
                  <div className="dwgrp">{group}</div>
                  {grouped[group].map((feature) => {
                    const done = progress.has(feature.id);
                    // 화면까지 가 봤지만 실동작은 아직 — 반쯤 밟은 상태
                    const seen = !done && visited.has(feature.id);
                    const cls = done
                      ? "titem done"
                      : seen
                        ? "titem seen"
                        : "titem";
                    const inner = (
                      <>
                        <span className="tic">
                          <Icon
                            name={done ? "check" : seen ? "view" : "arrow"}
                          />
                        </span>
                        <span>
                          <b>{feature.title}</b>
                          {/* 설명은 항상 차분한 톤 — 상태는 아이콘이 말한다 */}
                          <span className="tdesc">{feature.description}</span>
                        </span>
                      </>
                    );
                    /* 라우트가 없는 항목(챗봇)은 이동 대신 화면 위 장치를 연다 */
                    return feature.action === "chat" ? (
                      <button
                        className={cls}
                        key={feature.id}
                        onClick={() => {
                          setOpen(false);
                          window.dispatchEvent(
                            new CustomEvent(DEMO_OPEN_CHAT_EVENT),
                          );
                        }}
                      >
                        {inner}
                      </button>
                    ) : (
                      <Link className={cls} href={feature.href} key={feature.id}>
                        {inner}
                      </Link>
                    );
                  })}
                </div>
              ),
            )}
          </div>
          <div className="dwdiv" />
          <div className="dwrow">
            <b>브랜드색</b>
            {THEMES.map((item) => (
              <button
                key={item.id}
                className={theme === item.id ? "sw on" : "sw"}
                style={{ background: item.color }}
                aria-label={`${item.id} 브랜드색 적용`}
                onClick={() => {
                  setTheme(item.id);
                  applyTheme(item.id);
                  saveDemoTheme(item.id);
                  setHexDraft(item.color);
                }}
              />
            ))}
            {/* 고정 팔레트 밖 색 — 고객사 브랜드색을 그 자리에서 입혀본다 */}
            <span
              className={
                theme.startsWith("custom:") ? "sw-custom on" : "sw-custom"
              }
              title="원하는 색 직접 고르기"
            >
              <input
                type="color"
                aria-label="브랜드색 직접 선택"
                value={theme.startsWith("custom:") ? theme.slice(7) : "#4f46e5"}
                onChange={(event) => {
                  const id = `custom:${event.target.value}`;
                  setTheme(id);
                  applyTheme(id);
                  saveDemoTheme(id);
                  setHexDraft(event.target.value);
                }}
              />
            </span>
          </div>
          {/* 헥스 직접 입력 — 스와치 아래 전용 줄. 브랜드 가이드 문서의
              코드값을 그대로 붙여넣는다 */}
          <div className="dwrow dwrow-hex">
            <input
              className="sw-hex"
              value={hexDraft}
              spellCheck={false}
              maxLength={7}
              aria-label="브랜드색 헥스 코드"
              placeholder="#4F46E5"
              onChange={(event) => {
                const raw = event.target.value;
                setHexDraft(raw);
                const match = raw.trim().match(/^#?([0-9a-fA-F]{6})$/);
                if (match) {
                  const id = `custom:#${match[1].toLowerCase()}`;
                  setTheme(id);
                  applyTheme(id);
                  saveDemoTheme(id);
                }
              }}
              onBlur={() => {
                // 미완성 입력은 현재 테마 값으로 되돌린다 — 필드가 거짓말하지 않게
                setHexDraft(
                  theme.startsWith("custom:")
                    ? theme.slice(7)
                    : (THEMES.find((item) => item.id === theme)?.color ??
                        "#4f46e5"),
                );
              }}
            />
          </div>
          <div className="dwdiv" />
          {/* 띠배너에서 내려온 자리 — 초기화는 데모 장치라 여기가 맞다 */}
          <button className="dwreset" onClick={resetDemo}>
            <Icon name="swap" />
            체험 기록 초기화
          </button>
        </div>
      ) : null}

      <button
        className={[
          "fab",
          complete ? "is-complete" : "",
          coach && !open ? "is-beckon" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        type="button"
        aria-expanded={open}
        aria-label={open ? "핵심 기능 가이드 닫기" : "핵심 기능 가이드 열기"}
        onClick={() => {
          setOpen((value) => {
            // 열 때만 알린다. 닫을 때 알리면 챗봇이 괜히 한 번 더 닫힌다
            if (!value) announcePanel("guide");
            return !value;
          });
          setCoach(false);
          window.localStorage.setItem("wigtn-demo-coach-guide", "1");
        }}
      >
        {/* 진행 링 — 몇 개나 해봤는지가 버튼 자체에 그려진다(P1 게이지 문법) */}
        <svg className="fab-ring" viewBox="0 0 44 44" aria-hidden>
          <circle className="fab-ring-track" cx="22" cy="22" r="19" />
          <circle
            className="fab-ring-bar"
            cx="22"
            cy="22"
            r="19"
            style={{
              strokeDashoffset: 119.4 * (1 - doneCount / FEATURES.length),
            }}
          />
        </svg>
        <Icon name={open ? "x" : complete ? "award" : "play"} filled={!open} />
        <span className="fabb">
          {doneCount}/{FEATURES.length}
        </span>
      </button>
    </aside>
  );
}
