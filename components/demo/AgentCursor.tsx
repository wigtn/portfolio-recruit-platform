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
/* 도착해서 짚기까지의 숨. 260ms였는데, 커서가 멈추자마자 테두리가 뜨고
   바로 눌러 버려서 눈이 "어디에 도착했는지"를 읽기 전에 다음 일이
   일어났다(실기기 지적: 사람 눈으로 못 쫓아간다). 멈춤 - 인지 - 행동
   사이에 박자가 있어야 손으로 가리키는 것처럼 읽힌다. */
const SETTLE_MS = 560;
/** 추적 주기. 대상이 움직이면 테두리와 커서가 따라간다 */
const TRACK_MS = 160;

export function AgentCursor() {
  const [pos, setPos] = useState<Pos | null>(null);
  const [ring, setRing] = useState<Ring | null>(null);
  const [label, setLabel] = useState("");
  const [pressing, setPressing] = useState(false);
  /* 도착했는가. 도착 전에는 긴 곡선(0.76s)으로 날고, 도착한 뒤의 보정은
     짧게(0.22s) 따라붙는다. 추적 보정까지 긴 곡선을 쓰면 대상이 조금만
     움직여도 커서가 한참을 미끄러진다 */
  const [arrived, setArrived] = useState(false);
  const last = useRef<Pos | null>(null);

  useEffect(() => {
    let alive = true;
    let hideTimer = 0;
    let trackTimer = 0;
    /* 진행 중인 안내의 세대 번호. 새 안내가 시작되면 값이 바뀌고, 이전
       안내의 남은 걸음(find 대기·비행 sleep)이 깨어나도 자기 세대가 아니면
       그대로 빠진다. alive는 언마운트만 막는다 — 안내가 빠르게 이어질 때
       이전 run이 새 run의 테두리를 지우는 경합은 세대로만 막을 수 있다. */
    let epoch = 0;

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
      window.clearInterval(trackTimer);
      setRing(null);
      setLabel("");
      setPos(null);
      setArrived(false);
      last.current = null;
    };

    /** 대상의 지금 자리로 테두리를 그린다. 뷰포트 안으로 자르는 것 포함 */
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

    /* 대상을 계속 따라간다.

       테두리를 한 번 그리고 끝내면, 그 뒤에 일어나는 모든 움직임 — 목 로딩이
       끝나며 밀리는 레이아웃, 방문자의 스크롤, 이미지 도착 — 이 테두리를
       허공에 남긴다. "좌표가 안 맞는다"로 보이는 것의 대부분이 이것이다.
       측정이 틀린 게 아니라 측정한 뒤에 화면이 움직인 것이다.

       잡고 있던 노드가 문서에서 빠지면 **같은 셀렉터로 다시 찾는다.**
       스켈레톤이 본문으로 갈릴 때 React는 같은 자리에 새 노드를 놓는다 —
       짚던 자리는 그대로인데 노드만 바뀐 경우다. 이때 거둬 버리면 안내가
       중간에 사라진 것으로 보인다(실측: 역할 전환 직후 1.5초 만에 소멸).
       다시 찾아도 없으면 그때가 정말 화면이 넘어간 것이니 거둔다. */
    const follow = (target: HTMLElement, selector: string) => {
      window.clearInterval(trackTimer);
      let node = target;
      trackTimer = window.setInterval(() => {
        if (!node.isConnected) {
          const again = document.querySelector(selector);
          if (!(again instanceof HTMLElement)) {
            clear();
            return;
          }
          node = again;
        }
        const rect = node.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) {
          clear();
          return;
        }
        setRing(ringOf(rect));
        const center = {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        };
        const was = last.current;
        if (
          !was ||
          Math.abs(was.x - center.x) > 1 ||
          Math.abs(was.y - center.y) > 1
        ) {
          setPos(center);
          last.current = center;
        }
      }, TRACK_MS);
    };

    const run = async (event: Event) => {
      const step = (event as CustomEvent<AgentStep>).detail;
      const mine = ++epoch;
      /* 이 세대가 아직 최신이고 컴포넌트도 살아 있는가 */
      const fresh = () => alive && epoch === mine;
      window.clearTimeout(hideTimer);
      window.clearInterval(trackTimer);
      setArrived(false);

      const target = await find(step.selector);
      if (!fresh()) return;
      /* 못 찾으면 거두고 끝낸다.

         예전에는 그냥 return이었다. 그런데 바로 위에서 hideTimer를 껐으므로,
         이전 단계의 커서와 테두리가 지울 사람 없이 화면에 남았다 — "가이드가
         끝났는데 커서가 그대로"의 정체다. 대상이 없으면 안내할 것도 없다. */
      if (!target) {
        clear();
        return;
      }
      if (!fresh()) return;

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
      if (!fresh()) return;

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
      if (!fresh()) return;

      /* 도착. **지금** 자리를 다시 잰다.

         출발할 때 잰 좌표는 0.76초 전 것이다. 그 사이 목 로딩이 끝나며
         레이아웃이 밀렸으면 커서는 옛 자리에, 테두리는 새 자리에 그려져
         둘이 어긋난다(실기기 지적: 좌표가 디테일하게 안 맞는다). 도착
         시점에 한 번 더 재서 커서를 바로잡고, 테두리도 같은 rect로 그린다.

         테두리를 뷰포트 안으로 자르는 이유: 대상이 화면보다 넓거나(가로
         스크롤 표) 한쪽 끝에 붙어 있으면 rect 그대로의 테두리가 화면 밖으로
         나가 한쪽 변이 보이지 않는다. */
      const now = target.getBoundingClientRect();
      const center = {
        x: now.left + now.width / 2,
        y: now.top + now.height / 2,
      };
      setArrived(true);
      if (
        Math.abs(center.x - to.x) > 1 ||
        Math.abs(center.y - to.y) > 1
      ) {
        setPos(center);
        last.current = center;
      }
      setRing(ringOf(now));
      setLabel(step.note ?? "");
      /* 여기서부터는 대상을 따라간다. 짚고 있는 동안에도 화면은 움직인다 */
      follow(target, step.selector);
      await sleep(SETTLE_MS);
      if (!fresh()) return;

      if (step.click) {
        setPressing(true);
        await sleep(220);
        // 흉내가 아니라 진짜로 누른다
        target.click();
        await sleep(340);
        if (!fresh()) return;
        setPressing(false);
      }

      /* 여기서 끝났다고 알린다. 챗봇은 이 신호를 받고 설명을 띄운다.
         고정 시간으로 어림하면 화면이 느린 날 설명이 먼저 나온다 */
      window.dispatchEvent(new CustomEvent(AGENT_DONE_EVENT));

      hideTimer = window.setTimeout(() => {
        if (fresh()) clear();
      }, step.hold ?? 2600);
    };

    window.addEventListener(AGENT_EVENT, run);
    return () => {
      alive = false;
      window.removeEventListener(AGENT_EVENT, run);
      window.clearTimeout(hideTimer);
      window.clearInterval(trackTimer);
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
          className={[
            "agc-dot",
            arrived ? "is-track" : "",
            pressing ? "is-press" : "",
          ]
            .filter(Boolean)
            .join(" ")}
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
