"use client";

import { useEffect, useRef, useState } from "react";
import {
  AGENT_DONE_EVENT,
  AGENT_EVENT,
  type AgentStep,
} from "@/lib/demo/chat-targets";

/**
 * 에이전트 커서.
 *
 * 챗봇이 "백오피스에서 보실 수 있어요"라고 말하는 것과, 커서가 화면을 가로질러
 * 가서 메뉴를 짚고 누르는 것은 다른 물건이다. 후자는 조작할 수 있다는 걸
 * 증명하지만 전자는 주장에 그친다.
 *
 * 그래서 사람이 마우스를 쓰는 것과 같은 순서를 밟는다. 대상까지 곡선으로
 * 이동하고, 도착해서 한 박자 쉬고, 누르면 물결이 퍼진다. 순간이동하면 무슨
 * 일이 일어났는지 눈이 못 따라간다. 이동에 시간이 걸려야 시선이 따라온다.
 *
 * 실제로 누른다. 흉내만 내면 화면은 그대로인데 커서만 춤추는 꼴이 된다.
 *
 * 안내하는 동안에도 방문자는 직접 조작할 수 있어야 하므로 pointer-events는
 * 두지 않는다. 안내가 조작을 막으면 안내가 아니다.
 */
type Pos = { x: number; y: number };
type Ring = { top: number; left: number; width: number; height: number };

const TRAVEL_MS = 760;
const SETTLE_MS = 260;

export function AgentCursor() {
  const [pos, setPos] = useState<Pos | null>(null);
  const [ring, setRing] = useState<Ring | null>(null);
  const [label, setLabel] = useState("");
  const [pressing, setPressing] = useState(false);
  const last = useRef<Pos | null>(null);

  useEffect(() => {
    let alive = true;
    let hideTimer = 0;

    const sleep = (ms: number) =>
      new Promise<void>((resolve) => window.setTimeout(resolve, ms));

    /** 대상이 나타날 때까지 잠깐 기다린다. 라우팅 직후엔 아직 없다 */
    const find = async (selector: string) => {
      const deadline = Date.now() + 2200;
      for (;;) {
        const found = document.querySelector(selector);
        if (found) {
          const rect = found.getBoundingClientRect();
          if (rect.width > 0 || rect.height > 0) return found as HTMLElement;
        }
        if (Date.now() > deadline) return null;
        await sleep(120);
      }
    };

    const run = async (event: Event) => {
      const step = (event as CustomEvent<AgentStep>).detail;
      window.clearTimeout(hideTimer);

      const target = await find(step.selector);
      if (!target || !alive) return;

      // 화면 밖이면 먼저 데려온다. 커서만 움직이면 빈 곳을 짚는다
      const before = target.getBoundingClientRect();
      if (before.top < 80 || before.bottom > window.innerHeight - 80) {
        target.scrollIntoView({ block: "center", behavior: "smooth" });
        await sleep(560);
      }
      if (!alive) return;

      const rect = target.getBoundingClientRect();
      const to = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };

      // 처음 등장할 땐 화면 오른쪽 아래(챗봇이 있는 쪽)에서 나온다
      if (!last.current) {
        last.current = {
          x: window.innerWidth - 90,
          y: window.innerHeight - 120,
        };
        setPos(last.current);
        await sleep(40);
      }

      /* 먼저 커서만 움직인다.

         전에는 테두리와 문구를 출발과 동시에 띄웠다. 그러면 커서가 아직 날아가는
         중인데 목적지에는 이미 설명이 떠 있어서, 둘이 따로 노는 것처럼 보였다.
         사람이 가리킬 때도 손이 닿은 뒤에 말한다. */
      setPos(to);
      last.current = to;
      await sleep(TRAVEL_MS);
      if (!alive) return;

      // 도착. 이제 짚는다
      const pad = 8;
      const now = target.getBoundingClientRect();
      setRing({
        top: now.top - pad,
        left: now.left - pad,
        width: now.width + pad * 2,
        height: now.height + pad * 2,
      });
      setLabel(step.note ?? "");
      await sleep(SETTLE_MS);
      if (!alive) return;

      if (step.click) {
        setPressing(true);
        await sleep(180);
        // 흉내가 아니라 진짜로 누른다
        target.click();
        await sleep(220);
        if (!alive) return;
        setPressing(false);
      }

      /* 여기서 끝났다고 알린다. 챗봇은 이 신호를 받고 설명을 띄운다.
         고정 시간으로 어림하면 화면이 느린 날 설명이 먼저 나온다 */
      window.dispatchEvent(new CustomEvent(AGENT_DONE_EVENT));

      hideTimer = window.setTimeout(() => {
        setRing(null);
        setLabel("");
        setPos(null);
      }, step.hold ?? 2600);
    };

    window.addEventListener(AGENT_EVENT, run);
    return () => {
      alive = false;
      window.removeEventListener(AGENT_EVENT, run);
      window.clearTimeout(hideTimer);
    };
  }, []);

  if (!pos && !ring) return null;

  const below = ring ? ring.top + ring.height + 80 < window.innerHeight : true;

  return (
    <div className="agc" aria-hidden>
      {ring ? (
        <span
          className="agc-ring"
          style={{
            top: ring.top,
            left: ring.left,
            width: ring.width,
            height: ring.height,
          }}
        />
      ) : null}

      {ring && label ? (
        <span
          className={below ? "agc-note" : "agc-note is-up"}
          style={{
            top: below ? ring.top + ring.height + 12 : ring.top - 12,
            left: Math.max(12, Math.min(ring.left, window.innerWidth - 300)),
          }}
        >
          {label}
        </span>
      ) : null}

      {pos ? (
        <span
          className={pressing ? "agc-dot is-press" : "agc-dot"}
          style={{ transform: `translate3d(${pos.x}px, ${pos.y}px, 0)` }}
        >
          <svg viewBox="0 0 24 24" className="agc-arrow">
            <path d="M5 3l14 8.5-6.2 1.4L9.9 19z" />
          </svg>
          {pressing ? <i className="agc-wave" /> : null}
        </span>
      ) : null}
    </div>
  );
}
