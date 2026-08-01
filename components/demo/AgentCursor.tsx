"use client";

import { useEffect, useRef, useState } from "react";
import { AiAvatar } from "@/components/AiFace";
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

    /** 커서·테두리·문구를 한꺼번에 거둔다 */
    const clear = () => {
      setRing(null);
      setLabel("");
      setPos(null);
      last.current = null;
    };

    const run = async (event: Event) => {
      const step = (event as CustomEvent<AgentStep>).detail;
      window.clearTimeout(hideTimer);

      const target = await find(step.selector);
      /* 못 찾으면 거두고 끝낸다.

         예전에는 그냥 return이었다. 그런데 바로 위에서 hideTimer를 껐으므로,
         이전 단계의 커서와 테두리가 지울 사람 없이 화면에 남았다 — "가이드가
         끝났는데 커서가 그대로"의 정체다. 대상이 없으면 안내할 것도 없다. */
      if (!target) {
        clear();
        return;
      }
      if (!alive) return;

      /* 화면 밖이면 먼저 데려온다. 커서만 움직이면 빈 곳을 짚는다.

         가로도 본다. 좁은 화면에서는 표나 탭이 옆으로 넘쳐서, 세로만 맞추면
         커서가 화면 오른쪽 밖을 가리키고 테두리도 잘린다. */
      const before = target.getBoundingClientRect();
      const offV = before.top < 80 || before.bottom > window.innerHeight - 80;
      const offH = before.left < 8 || before.right > window.innerWidth - 8;
      if (offV || offH) {
        target.scrollIntoView({
          block: "center",
          inline: "nearest",
          behavior: "smooth",
        });
        /* 스크롤이 멈출 때까지 기다린다.

           560ms를 세는 방식이었다. 부드러운 스크롤은 거리와 기기에 따라
           그보다 오래 걸리는데, 그러면 아직 흐르는 중인 좌표로 커서를
           보내고 테두리는 또 다른 시점의 좌표로 그린다 — 커서와 테두리가
           따로 노는 것으로 보인다.

           시간이 아니라 상태를 본다. 대상의 위치가 두 프레임 연속 같으면
           멈춘 것이다. 상한(1.2초)은 스크롤이 끝나지 않는 경우의 안전장치다. */
        const until = Date.now() + 1200;
        // 이름은 lastY다. 바깥에 커서 좌표를 들고 있는 ref `last`가 있어서
        // 같은 이름을 쓰면 그것을 가린다
        let lastY = Number.NaN;
        for (;;) {
          const y = target.getBoundingClientRect().top;
          if (Math.abs(y - lastY) < 0.5) break;
          if (Date.now() > until) break;
          lastY = y;
          await sleep(80);
        }
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

      /* 도착. 이제 짚는다.

         테두리를 뷰포트 안으로 자른다. 대상이 화면보다 넓거나(가로 스크롤
         표) 한쪽 끝에 붙어 있으면, 대상 rect를 그대로 쓴 테두리가 화면 밖으로
         나가 한쪽 변이 보이지 않는다. 잘린 테두리는 무엇을 가리키는지 못
         알려 준다. */
      const pad = 8;
      const now = target.getBoundingClientRect();
      const left = Math.max(4, now.left - pad);
      const top = Math.max(4, now.top - pad);
      setRing({
        top,
        left,
        width: Math.min(now.width + pad * 2, window.innerWidth - left - 4),
        height: Math.min(now.height + pad * 2, window.innerHeight - top - 4),
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

      hideTimer = window.setTimeout(clear, step.hold ?? 2600);
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

      {/* 말하는 주체가 보여야 한다. 화면 어딘가에 문구만 떠 있으면 그게
          시스템 안내인지 챗봇이 하는 말인지 알 수 없다 — 챗봇 말풍선과 같은
          얼굴을 달아 두면 "아까 그 챗봇이 지금 여기를 짚고 있다"로 읽힌다 */}
      {ring && label ? (
        <span
          className={below ? "agc-note" : "agc-note is-up"}
          style={{
            top: below ? ring.top + ring.height + 12 : ring.top - 12,
            left: Math.max(12, Math.min(ring.left, window.innerWidth - 300)),
          }}
        >
          <AiAvatar size="sm" live />
          <b>{label}</b>
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
