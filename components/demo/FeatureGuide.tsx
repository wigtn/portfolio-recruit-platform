"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import {
  clearGuideTour,
  GUIDE_TOUR_EVENT,
  guideTourOf,
  loadGuideTour,
  saveGuideTour,
  type GuideTourState,
} from "@/lib/demo/feature-guide";
import {
  DEMO_FEATURES,
  DEMO_PROGRESS_EVENT,
  loadProgress,
  type DemoFeature,
} from "@/lib/demo/progress";

/**
 * 기능 체험 안내 러너 — 대본(feature-guide.ts)을 화면 위에 올린다.
 *
 * 에이전트 커서(AgentCursor)와는 주체가 다르다. 그쪽은 챗봇이 **자기가**
 * 움직이며 누르는 시연이고, 여기는 **방문자가 직접** 누르게 만드는 안내다.
 * 그래서 커서 대신 테두리와 말풍선만 두고, 진행은 방문자의 실제 행동
 * (클릭·실동작 완료 신호)이 만든다. 안내가 조작을 막으면 안내가 아니므로
 * 어둠막도 pointer-events도 두지 않는다.
 *
 * 화면 이동을 견딘다. 걸음마다 자기 화면(path)이 적혀 있고 상태는
 * sessionStorage에 있으므로, 클라이언트 라우팅이든 전체 리로드든 도착한
 * 화면에서 제 걸음을 다시 편다. 지금 화면이 걸음의 화면이 아니면 "길잡이"
 * 말풍선이 이동 버튼을 내민다 — 여러 화면을 왕복하는 체험의 이음새다.
 */

type Ring = { top: number; left: number; width: number; height: number };

/** 추적 주기 — 스크롤·레이아웃 이동을 테두리가 따라간다 */
const TRACK_MS = 160;
/** 대상 탐색 주기와 상한. 라우팅·모달 직후엔 대상이 아직 없다 */
const FIND_MS = 240;
const FIND_LIMIT_MS = 4200;
/** optional 걸음은 짧게 보고 없으면 걸음 자체를 접는다 */
const FIND_OPTIONAL_MS = 1600;
/** 경로 불일치를 길잡이로 판정하기까지의 유예 — 라우팅 중 깜빡임 방지 */
const WAY_MS = 1000;
/** 완료 말풍선이 머무는 시간 */
const FINALE_MS = 6500;

const FEATURE_TITLE = new Map<DemoFeature, string>(
  DEMO_FEATURES.map((feature) => [feature.id, feature.title]),
);

export function FeatureGuide() {
  const pathname = usePathname();
  const router = useRouter();

  const [tour, setTour] = useState<GuideTourState | null>(null);
  /** seek = 대상 찾는 중(아무것도 안 그림), point = 테두리+말풍선,
      float = 대상을 못 찾음(떠 있는 말풍선), way = 길잡이(화면 이동) */
  const [phase, setPhase] = useState<"seek" | "point" | "float" | "way">(
    "seek",
  );
  const [ring, setRing] = useState<Ring | null>(null);
  const [finale, setFinale] = useState<{
    feature: DemoFeature;
    done: boolean;
  } | null>(null);

  /* advance/stop이 이벤트 리스너에서 불려도 최신 상태를 보게 한다 */
  const tourRef = useRef(tour);
  tourRef.current = tour;

  const stop = useCallback(() => {
    clearGuideTour();
    setTour(null);
    setRing(null);
    setPhase("seek");
  }, []);

  const advance = useCallback(() => {
    const current = tourRef.current;
    if (!current) return;
    const steps = guideTourOf(current.feature);
    const next = current.step + 1;
    setRing(null);
    setPhase("seek");
    if (next >= steps.length) {
      /* 대본 끝 — 체크가 실제로 켜졌는지는 진행도가 말한다. 건너뛰기로
         내려온 경우 "완료"라고 우기지 않는다 */
      clearGuideTour();
      setTour(null);
      setFinale({
        feature: current.feature,
        done: loadProgress().has(current.feature),
      });
      return;
    }
    /* 전체 리로드(<a href> 이동)보다 먼저 남아야 하므로 동기로 저장한다 */
    const state = { ...current, step: next };
    saveGuideTour(state);
    setTour(state);
  }, []);

  /* 시작 신호와 저장분 복원 — 리로드로 마운트가 새로 되면 이어서 안내한다 */
  useEffect(() => {
    setTour(loadGuideTour());
    const onStart = () => {
      setFinale(null);
      setTour(loadGuideTour());
      setRing(null);
      setPhase("seek");
    };
    window.addEventListener(GUIDE_TOUR_EVENT, onStart);
    return () => window.removeEventListener(GUIDE_TOUR_EVENT, onStart);
  }, []);

  /* 완료 말풍선은 잠깐 머물다 스스로 걷힌다 */
  useEffect(() => {
    if (!finale) return;
    const timer = window.setTimeout(() => setFinale(null), FINALE_MS);
    return () => window.clearTimeout(timer);
  }, [finale]);

  /* 걸음 하나의 생애 — 찾고, 짚고, 진행 신호를 듣는다 */
  useEffect(() => {
    if (!tour) return;
    const steps = guideTourOf(tour.feature);
    const step = steps[tour.step];
    if (!step) {
      stop();
      return;
    }

    let findTimer = 0;
    let trackTimer = 0;
    let wayTimer = 0;
    let scrolled = false;

    /* 지금 화면이 이 걸음의 화면이 아니다 — 유예 뒤 길잡이를 편다.
       유예가 없으면 걸음이 넘어가고 라우팅이 끝나기 전의 한 박자마다
       길잡이가 깜빡인다 */
    if (!step.path.test(pathname)) {
      setRing(null);
      setPhase("seek");
      wayTimer = window.setTimeout(() => setPhase("way"), WAY_MS);
      return () => window.clearTimeout(wayTimer);
    }

    const ringOf = (rect: DOMRect): Ring => {
      const pad = 8;
      const left = Math.max(4, rect.left - pad);
      const top = Math.max(4, rect.top - pad);
      return {
        top,
        left,
        width: Math.min(rect.width + pad * 2, window.innerWidth - left - 4),
        height: Math.min(rect.height + pad * 2, window.innerHeight - top - 4),
      };
    };

    /* 짚는 동안 대상을 따라간다. 노드가 갈리면(스켈레톤→본문) 같은 셀렉터로
       다시 찾고, 정말 사라졌으면 탐색부터 다시 — 모달이 닫힌 경우다 */
    const track = (target: HTMLElement) => {
      let node = target;
      window.clearInterval(trackTimer);
      trackTimer = window.setInterval(() => {
        if (!node.isConnected) {
          const again = document.querySelector(step.selector);
          if (!(again instanceof HTMLElement)) {
            window.clearInterval(trackTimer);
            setRing(null);
            setPhase("seek");
            seek();
            return;
          }
          node = again;
        }
        const rect = node.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) return;
        setRing(ringOf(rect));
      }, TRACK_MS);
    };

    const found = (target: HTMLElement) => {
      const rect = target.getBoundingClientRect();
      /* 화면 밖이면 먼저 데려온다 — 말풍선만 허공에 뜨면 안내가 아니다 */
      const offV = rect.top < 80 || rect.bottom > window.innerHeight - 80;
      const offH = rect.left < 8 || rect.right > window.innerWidth - 8;
      if (!scrolled && (offV || offH)) {
        scrolled = true;
        target.scrollIntoView({
          block: "center",
          inline: "nearest",
          behavior: "smooth",
        });
      }
      setRing(ringOf(target.getBoundingClientRect()));
      setPhase("point");
      track(target);
    };

    const seek = () => {
      const deadline =
        Date.now() + (step.optional ? FIND_OPTIONAL_MS : FIND_LIMIT_MS);
      window.clearInterval(findTimer);
      findTimer = window.setInterval(() => {
        const el = document.querySelector(step.selector);
        if (el instanceof HTMLElement) {
          const rect = el.getBoundingClientRect();
          if (rect.width > 0 || rect.height > 0) {
            window.clearInterval(findTimer);
            found(el);
            return;
          }
        }
        if (Date.now() > deadline) {
          window.clearInterval(findTimer);
          /* 없는 게이트(이미 운영자)는 걸음이 스스로 빠진다. 그 외에는
             떠 있는 말풍선으로 내려앉아 다음 버튼을 내민다 — 지점 하나가
             낡아도 안내 전체가 죽지 않는다 */
          if (step.optional) advance();
          else setPhase("float");
        }
      }, FIND_MS);
    };

    seek();

    /* 진행 신호 — 걸음 방식에 맞는 것 하나만 듣는다 */
    const onAct = (event: Event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest(step.selector)) {
        /* 대상이 <a>면 전체 리로드가 곧 온다 — advance가 동기로 저장한다 */
        advance();
      }
    };
    const onDone = () => {
      if (!tour.wasDone && loadProgress().has(tour.feature)) advance();
    };
    if (step.advance === "act") {
      document.addEventListener("click", onAct, true);
    } else if (step.advance === "done") {
      window.addEventListener(DEMO_PROGRESS_EVENT, onDone);
      /* 클릭과 리스너 부착 사이에 신호가 먼저 지나갔을 수 있다 */
      onDone();
    }

    return () => {
      window.clearInterval(findTimer);
      window.clearInterval(trackTimer);
      window.clearTimeout(wayTimer);
      document.removeEventListener("click", onAct, true);
      window.removeEventListener(DEMO_PROGRESS_EVENT, onDone);
    };
  }, [tour, pathname, advance, stop]);

  /* ── 그리기 ── */

  if (finale) {
    const title = FEATURE_TITLE.get(finale.feature) ?? "체험";
    return (
      <div className="ftg" aria-live="polite">
        <button
          type="button"
          className="ftg-note is-dock ftg-finale"
          onClick={() => setFinale(null)}
        >
          <span className={finale.done ? "ftg-fic is-done" : "ftg-fic"}>
            <Icon name={finale.done ? "check" : "flag"} />
          </span>
          <span>
            {finale.done ? (
              <>
                <b>{title}</b> 체험 완료! 가이드 목록에 체크가 켜졌어요.
              </>
            ) : (
              <>
                <b>{title}</b> 안내를 마쳤어요. 실행까지 마치면 목록에 체크가
                켜져요.
              </>
            )}
          </span>
        </button>
      </div>
    );
  }

  if (!tour) return null;
  const steps = guideTourOf(tour.feature);
  const step = steps[tour.step];
  if (!step) return null;
  const title = FEATURE_TITLE.get(tour.feature) ?? "체험 안내";

  /* 길잡이 — 다음 걸음이 다른 화면에 있다 */
  if (phase === "way") {
    return (
      <div className="ftg" aria-live="polite">
        <div className="ftg-note is-dock">
          <div className="ftg-head">
            <span className="cb">데모</span>
            <b>{title}</b>
            <span className="ftg-count">
              {tour.step + 1}/{steps.length}
            </span>
            <button
              type="button"
              className="ftg-x"
              aria-label="안내 종료"
              onClick={stop}
            >
              <Icon name="x" />
            </button>
          </div>
          <p>{step.arrive ?? "다음 안내가 다른 화면에서 이어져요."}</p>
          <div className="ftg-acts">
            <button
              type="button"
              className="ftg-next"
              onClick={() => router.push(step.at)}
            >
              화면으로 이동
              <Icon name="arrow" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "seek") return null;

  const anchor = phase === "point" ? ring : null;
  /* 아래 공간이 모자라면 위로 편다 */
  const below = anchor
    ? anchor.top + anchor.height + 170 < window.innerHeight
    : true;
  const noteStyle = anchor
    ? {
        top: below ? anchor.top + anchor.height + 12 : anchor.top - 12,
        left: Math.max(12, Math.min(anchor.left, window.innerWidth - 336)),
      }
    : undefined;

  return (
    <div className="ftg" aria-live="polite">
      {anchor ? (
        <span
          className="ftg-ring"
          style={{
            top: anchor.top,
            left: anchor.left,
            width: anchor.width,
            height: anchor.height,
          }}
        />
      ) : null}
      <div
        className={["ftg-note", anchor ? (below ? "" : "is-up") : "is-dock"]
          .filter(Boolean)
          .join(" ")}
        style={noteStyle}
      >
        <div className="ftg-head">
          <span className="cb">데모</span>
          <b>{title}</b>
          <span className="ftg-count">
            {tour.step + 1}/{steps.length}
          </span>
          <button
            type="button"
            className="ftg-x"
            aria-label="안내 종료"
            onClick={stop}
          >
            <Icon name="x" />
          </button>
        </div>
        <p>
          {phase === "float"
            ? "이 걸음의 화면 요소를 찾지 못했어요. 이미 지나갔다면 다음으로 넘어가세요."
            : step.note}
        </p>
        <div className="ftg-acts">
          {step.advance === "next" || phase === "float" ? (
            <button type="button" className="ftg-next" onClick={advance}>
              {tour.step + 1 >= steps.length ? "안내 마치기" : "다음"}
              <Icon name="arrow" />
            </button>
          ) : (
            <>
              <span className="ftg-hint">
                {step.advance === "act"
                  ? "직접 눌러보세요"
                  : "실행을 마치면 자동으로 넘어가요"}
              </span>
              <button type="button" className="ftg-skip" onClick={advance}>
                건너뛰기
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
