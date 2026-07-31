"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { Sk, SkRegion, useMockLoading } from "@/components/Skeleton";
import {
  DEMO_FEATURES,
  DEMO_OPEN_CHAT_EVENT,
  DEMO_PROGRESS_EVENT,
  loadProgress,
  type DemoFeature,
} from "@/lib/demo/progress";

/**
 * 방금 보신 것들 — 체험 히스토리 기반 신뢰 요약.
 *
 * 원래는 "4/11 체험"이 하드코딩된 정적 목록이라 아무 것도 안 본 방문자에게도
 * 4개가 체크돼 있었다. 데모 위젯과 같은 진행도(loadProgress)를 읽어 실제로
 * 본 것만 체크한다 — 11개 전부를 늘어놓는 이유는 "안 본 것"이 dim으로 남아
 * 다음에 볼 것을 알려주기 때문이다(항목을 누르면 해당 화면으로 간다).
 */

/** 스켈레톤 제목 폭 — 같은 폭이 반복되면 목록으로 안 읽힌다 */
const SK_W = [
  "44%",
  "36%",
  "58%",
  "40%",
  "30%",
  "34%",
  "42%",
  "50%",
  "32%",
  "56%",
  "38%",
];

/**
 * 행 실측 높이.
 *
 * 스켈레톤이 실물과 같은 높이를 잡아야 데이터가 와도 화면이 안 밀린다.
 * compact는 좌측 고정 레일용이다. 9개 항목을 기본 높이로 세우면 카드가 화면
 * 높이를 넘어서 레일 안에 스크롤바가 생긴다. 레일은 끝까지 따라오는 물건이라
 * 그 안에서 또 스크롤하게 만들면 두 개의 스크롤이 겹친다.
 */
const ROW_H = { normal: 62.6, normalLast: 61.6, compact: 44, compactLast: 43 };

export function SeenCard({ compact = false }: { compact?: boolean } = {}) {
  const [progress, setProgress] = useState<Set<DemoFeature> | null>(null);

  // 홈과 같은 강제 지연 — 체크 상태가 빈 목록 뒤에 튀어 들어오지 않게 한다
  const delaying = useMockLoading();
  const loading = delaying || progress === null;

  useEffect(() => {
    setProgress(loadProgress());
    // 데모 위젯과 같은 신호를 듣는다 — 이 화면에 온 것 자체도 진행도를 바꾼다
    const sync = () => setProgress(loadProgress());
    window.addEventListener(DEMO_PROGRESS_EVENT, sync);
    return () => window.removeEventListener(DEMO_PROGRESS_EVENT, sync);
  }, []);

  const done = progress ?? new Set<DemoFeature>();

  return (
    <div className={compact ? "card seen-compact" : "card"}>
      <h4>
        방금 보신 것들{" "}
        <span className="mini">
          {loading ? (
            // .uk-sk는 display:block — 인라인 자리에선 명시해야 h4 높이가 안 튄다
            <Sk
              w={44}
              h={11}
              style={{ display: "inline-block", verticalAlign: "middle" }}
            />
          ) : (
            `${done.size}/${DEMO_FEATURES.length} 체험`
          )}
        </span>
      </h4>
      {loading ? (
        <SkRegion label="체험 진행도">
          {DEMO_FEATURES.map((feature, index) => (
            <div
              className="titem"
              key={feature.id}
              aria-hidden
              // Sk는 block이라 strut이 없다 — 실물과 같은 행 높이를 못 박는다
              style={{
                height:
                  index === DEMO_FEATURES.length - 1
                    ? compact
                      ? ROW_H.compactLast
                      : ROW_H.normalLast
                    : compact
                      ? ROW_H.compact
                      : ROW_H.normal,
                boxSizing: "border-box",
              }}
            >
              <span className="tic">
                <Icon name="check" />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{ height: 20, display: "flex", alignItems: "center" }}
                >
                  <Sk w={SK_W[index % SK_W.length]} h={12} />
                </div>
                <div
                  style={{
                    height: 19.8,
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <Sk w="64%" h={11} />
                </div>
              </div>
            </div>
          ))}
        </SkRegion>
      ) : (
        DEMO_FEATURES.map((feature) => {
          const seen = done.has(feature.id);
          const cls = seen
            ? "titem sk-arrive-soft"
            : "titem dim sk-arrive-soft";
          const inner = (
            <>
              <span className="tic">
                <Icon name={seen ? "check" : "lock"} />
              </span>
              <div>
                <b>{feature.title}</b>
                <span>{feature.description}</span>
              </div>
            </>
          );
          /* 라우트가 없는 항목(챗봇)은 이 화면에서 바로 열어준다 */
          return feature.action === "chat" ? (
            <button
              className={cls}
              key={feature.id}
              onClick={() =>
                window.dispatchEvent(new CustomEvent(DEMO_OPEN_CHAT_EVENT))
              }
            >
              {inner}
            </button>
          ) : (
            <Link className={cls} key={feature.id} href={feature.href}>
              {inner}
            </Link>
          );
        })
      )}
    </div>
  );
}
