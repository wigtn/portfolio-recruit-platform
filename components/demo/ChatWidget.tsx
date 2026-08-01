"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import { AiAvatar } from "@/components/AiFace";
import { Thinking } from "./Thinking";
import {
  DEMO_SCRIPT,
  FALLBACK,
  GREETING,
  INTENTS,
  intentById,
  resolveScripted,
  type ChatIntent,
} from "@/lib/demo/chat";
import {
  announcePanel,
  DEMO_FEATURES,
  DEMO_OPEN_CHAT_EVENT,
  DEMO_PANEL_OPEN_EVENT,
  loadProgress,
  markProgress,
  resetDemoExperience,
  saveDemoTheme,
} from "@/lib/demo/progress";
import { useRouter } from "next/navigation";
import { useRole } from "@/lib/demo/role";
import { applyTheme, THEME_LABEL } from "@/lib/demo/theme";
import {
  AGENT_DONE_EVENT,
  AGENT_EVENT,
  TARGET_BY_ID,
} from "@/lib/demo/chat-targets";
import {
  ADMIN_SCREENS,
  COMPANY_LABEL,
  ROLE_LABEL_KO,
  withRo,
  SCREEN_LABEL,
  SCREEN_PATH,
  repairArgs,
  TOOL_RUNNING,
  TOOL_SPECS,
  type ScreenId,
  type ToolCall,
} from "@/lib/demo/chat-tools";
import { guard } from "@/lib/demo/chat-guard";
import { findJob, findPost } from "@/lib/demo/chat-find";
import { loadUser, saveUser, toggleIn } from "@/lib/demo/user";
import { submitEvidence } from "@/lib/demo/submit";
import { announceMenuOpen } from "@/lib/demo/notifications";
import {
  COMPOSE_DONE_EVENT,
  COMPOSE_EVENT,
  COMPOSE_TICK_EVENT,
} from "@/lib/demo/compose";

/**
 * 상담 챗봇. 우측 하단 플로팅. **열면 대화가 스스로 흘러간다.**
 *
 * 방문자에게 먼저 타이핑을 요구하면 대부분 그냥 닫는다. 무엇을 물어야 할지 모르기
 * 때문이다. 그래서 저희가 먼저 묻고 답하는 걸 재생으로 보여준다(DEMO_SCRIPT 순서).
 *
 * 자동 재생은 스크립트 답변만 쓴다. 매번 같아야 데모로 쓸 수 있고, 열기만 해도
 * 토큰이 나가면 비용 방어가 무너진다. 방문자가 직접 물으면 그때 `/api/chat`을 타고,
 * 키가 없거나 한도를 넘으면 스크립트로 되돌아온다. 어느 쪽이든 답이 없는 경우는 없다.
 *
 * 사용자가 개입하면(입력·칩·건너뛰기) 재생은 즉시 멈춘다. 재생이 사용자와 다투면
 * 그건 자동화가 아니라 방해다.
 *
 * 위치는 체험 가이드(.demowidget) 왼쪽 옆이다. 가이드 자리는 사용자 지시로 정해진
 * 것이라 건드리지 않고 나란히 선다.
 */

type Msg = {
  id: number;
  role: "user" | "bot";
  text: string;
  links?: ChatIntent["links"];
  /** 실호출로 받은 답변인지. 배지 표시용 */
  live?: boolean;
  /** 질문에 대한 답변인지. 인사말에는 출처 배지를 붙이지 않는다 */
  reply?: boolean;
  streaming?: boolean;
  /** 방문자가 중간에 멈춘 답변. 잘린 이유를 밝혀야 오해가 없다 */
  stopped?: boolean;
  /** 아직 차례가 안 온 질문. 보낸 건 맞는데 답은 나중이다 */
  waiting?: boolean;
  /** 챗봇이 화면을 실제로 조작했을 때 남기는 자국 */
  action?: string;
  /** 답을 만들기까지 거친 걸음. 같은 말풍선 안에 쌓인다 */
  steps?: Step[];
  /* 잘못된 상황을 알리는 쪽지. 답변이 아니라 알림이라 생김새가 달라야
     한다. 답변처럼 보이면 방문자는 그게 대답인 줄 알고 읽는다 */
  notice?: "timeout" | "failed" | "offline";
};

/**
 * 답변 한 건이 거친 걸음.
 *
 * 도구를 부를 때마다 말풍선을 새로 만들면 대화가 조각난다. 방문자가 한 번
 * 물었는데 답이 다섯 덩이로 흩어지고, 그중 넷은 "열었어요" 한 줄짜리다.
 * 한 말풍선 안에 걸음을 쌓고 그 아래 답을 붙이면 한 번의 대답으로 읽힌다.
 */
type Step = {
  key: number;
  /** 도구 이름. 없으면 모델이 곁들인 말이다 */
  tool?: string;
  say?: string;
  /** 실행 결과 한 줄. 끝나야 채워진다 */
  note?: string;
  done: boolean;
  /** 못 했다. 성공과 같은 체크를 붙이면 됐다고 읽힌다 */
  failed?: boolean;
};

/** 도구 하나의 결과. 됐는지 안 됐는지를 말과 함께 돌려준다 */
type ToolResult = { ok: boolean; note: string };

/**
 * 답변 한 건을 쓰는 손잡이.
 *
 * put은 글자가 있을 때만 말풍선을 만든다. seal은 흐름을 닫는다. 두 번 닫아도
 * 없는 걸 닫아도 아무 일 없다. 그래서 끝나는 길마다 다르게 뒤처리할 필요가
 * 없고, 마지막에 한 번 seal하면 로더가 남을 수 없다.
 */
type AnswerWriter = {
  put(text: string, extra?: Partial<Msg>): void;
  /** 모델이 곁들인 말을 걸음으로 남긴다 */
  say(text: string): void;
  /** 도구를 시작한다. 걸음이 하나 늘고 그 걸음이 도는 상태가 된다 */
  startStep(tool: string): void;
  /** 방금 시작한 걸음을 닫는다. note는 실행 결과 한 줄 */
  endStep(note?: string, failed?: boolean): void;
  /** 방금 시작한 걸음을 없앤다. 자국을 남길 일이 아니었을 때 */
  dropStep(): void;
  seal(extra?: Partial<Msg>): void;
};

const OPEN_KEY = "wigtn-demo-chat-opened-v1";

/* 재생 속도. 읽으면서 따라올 수 있어야 한다.
   글 상세의 AI 답변(22ms에 2글자)은 "생성 중"을 보여주는 연출이라 빨라도 되지만,
   여기는 읽어야 하는 내용이다. 초당 약 24자. 눈으로 좇을 수 있는 속도로 낮췄다.
   답변을 읽는 시간은 흐르는 동안 벌고, 끝난 뒤 한 박자 더 쉰다. */
const CHAR_MS = 42;
/** 바닥에서 이만큼 안쪽이면 "붙어 있다"로 본다 */
const STICK_SLACK = 48;
const CHARS_PER_TICK = 1;
const BEAT_BEFORE_TYPING = 900;
const TYPING_DOTS_MS = 1000;
const BEAT_AFTER_ANSWER = 2600;
/** 실호출 응답을 화면에 흘리는 속도. 도착 속도와 무관하게 이 박자로 보여준다 */
const LIVE_CHAR_MS = 30;
const wait = (ms: number) =>
  new Promise<void>((resolve) => window.setTimeout(resolve, ms));

/**
 * 서버에 묻는다. **첫 응답까지만** 기한을 둔다.
 *
 * 길이 제한이 아니다. 한 글자라도 시작한 답은 끝까지 흐르게 두고, 시작조차
 * 못 한 연결만 끊는다. 응답이 영영 안 오면 로더가 영원히 돌고 멈춤 버튼만
 * 살아 있는 화면이 남는다. 그건 답이 긴 게 아니라 고장이다.
 *
 * 방문자가 누른 중단도 같이 먹인다. 기한과 중단이 따로 놀면 멈추라고 했는데
 * 요청은 계속 살아 있는 상태가 된다.
 */
async function askServer(
  body: unknown,
  outer: AbortSignal,
): Promise<Response | null> {
  const guard = new AbortController();
  const relay = () => guard.abort();
  outer.addEventListener("abort", relay);
  const deadline = window.setTimeout(() => guard.abort(), FIRST_BYTE_MS);
  try {
    return await fetch("/api/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: guard.signal,
    });
  } catch {
    return null;
  } finally {
    window.clearTimeout(deadline);
    outer.removeEventListener("abort", relay);
  }
}

/**
 * 조건이 참이 될 때까지 기다린다.
 *
 * 화면이 붙는 시점을 초로 어림하면 느린 날엔 매번 빗나간다. 무엇을 기다리는지
 * 직접 물어보는 편이 정확하다. 상한을 넘으면 false를 돌려주고, 부른 쪽이
 * 무엇이 안 됐는지 말한다. 조용히 넘어가지 않는다.
 */
async function waitFor(is: () => boolean, limit: number): Promise<boolean> {
  const until = Date.now() + limit;
  while (Date.now() < until) {
    if (is()) return true;
    await wait(120);
  }
  return is();
}

/** 화면에 남길 시각. 글쓰기 화면이 쓰는 형식과 같다 */
function stamp() {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(now.getMonth() + 1)}.${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

/**
 * 화면이 자리를 잡을 때까지 기다린다.
 *
 * 라우팅은 주소만 바꾸고 끝나지 않는다. 새 화면이 그려지고 목 로딩이 끝나야
 * 짚을 대상이 생긴다. 그 시점을 시간으로 어림하면 매번 어긋나므로, 두 프레임
 * 연속으로 문서 높이가 그대로일 때 "자리 잡았다"로 본다.
 */
function settled(limit = 2500) {
  return new Promise<void>((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      window.clearTimeout(guard);
      resolve();
    };

    /* 상한을 setTimeout으로 따로 건다.
       rAF 안에서만 시간을 재면 탭이 배경으로 내려간 순간 rAF가 멈추고, 검사도
       같이 멈춰 영원히 기다린다. 실제로 그렇게 걸렸다. 백그라운드에서도 도는
       타이머가 반드시 하나 있어야 한다. */
    const guard = window.setTimeout(finish, limit);

    let stableFor = 0;
    let lastHeight = -1;
    const tick = () => {
      if (done) return;
      const height = document.body.scrollHeight;
      stableFor = height === lastHeight ? stableFor + 1 : 0;
      lastHeight = height;
      if (stableFor >= 3) {
        finish();
        return;
      }
      window.requestAnimationFrame(tick);
    };
    window.requestAnimationFrame(tick);
  });
}
/** 밀린 분량을 몇 틱에 나눠 따라잡을지. 작을수록 급하게 몰아 찍는다 */
const CATCH_UP = 45;

/** 방금 도착한 것으로 취급할 꼬리 길이. AI 참고 답변과 같은 값이다 */
const TAIL = 12;
/** 한 요청에서 이어 돌릴 도구 걸음 수 상한. 안내 하나에는 이면 충분하다 */
const MAX_STEPS = 6;
/* 다음 걸음을 물었을 때 **첫 응답**까지 기다릴 시간.
   답변 길이 제한이 아니다. 한 글자라도 시작하면 끝까지 흐르게 둔다.
   라우트가 도구 판단 12초, 답변 시작 15초를 스스로 재므로 그 뒤에 선다.
   여기가 먼저 끊으면 멀쩡한 응답을 죽인다. */
const FIRST_BYTE_MS = 30000;
/** 답을 기다리는 동안 세워 두는 걸음. 실제 도구가 아니라 표시용이다 */
const WRAP_STEP = "__wrap";

/** 서버가 도구를 쓰기로 했을 때 돌려주는 모양 */
type ChatReply = {
  tools?: Array<{ id: string; name: string; args: Record<string, string> }>;
  say?: string;
  fallback?: boolean;
};
/** 문장이 끝났다고 볼 부호 */
const SENTENCE_END = ".!?…\n";

/**
 * 확정된 부분과 쓰는 중인 부분을 가른다.
 *
 * 문장이 끝나면 그 문장은 더 바뀌지 않는다. 끝난 문장까지 계속 그라데이션에
 * 묶어 두면 다 나온 글을 아직 만들고 있는 것처럼 보이고, 읽으려는 사람의
 * 눈을 계속 흔든다. 종결 부호를 만나는 순간 거기까지는 평범한 글자로 놓는다.
 */
function splitSettled(text: string): [string, string] {
  let cut = -1;
  for (let i = text.length - 1; i >= 0; i -= 1) {
    if (SENTENCE_END.includes(text[i])) {
      cut = i;
      break;
    }
  }
  if (cut < 0) return ["", text];
  // 종결 부호 뒤 공백까지 확정으로 넘긴다. 공백만 남아 깜빡이면 지저분하다
  let end = cut + 1;
  while (end < text.length && (text[end] === " " || text[end] === "\n")) {
    end += 1;
  }
  return [text.slice(0, end), text.slice(end)];
}

/**
 * 흐르는 본문.
 *
 * AI 참고 답변(AiAnswerCard)이 쓰는 질감을 그대로 가져온다. 글자가 통짜로
 * 튀어나오면 "이미 있던 문자열을 잘라 보여주는 것"으로 읽힌다. 꼬리 열두
 * 글자만 블러에서 선명해지며 붙어야 방금 만들어지는 것처럼 보인다.
 *
 * 그라데이션은 **아직 쓰는 중인 문장에만** 건다. 끝난 문장은 바로 선명해진다.
 *
 * key에 길이를 물리는 게 핵심이다. 글자가 늘 때마다 React가 새 노드로 보고
 * 애니메이션을 다시 재생한다. 같은 key면 한 번 재생하고 끝난다.
 */
function StreamText({ text, streaming }: { text: string; streaming: boolean }) {
  if (!streaming || text.length === 0) return <>{text}</>;
  const [settled, pending] = splitSettled(text);
  if (!pending) return <>{settled}</>;
  const cut = Math.max(0, pending.length - TAIL);
  return (
    <>
      {settled}
      <span className="chatstream">
        {pending.slice(0, cut)}
        <i className="tk" key={text.length}>
          {pending.slice(cut)}
        </i>
      </span>
    </>
  );
}

export function ChatWidget() {
  const router = useRouter();
  const { role, setRole } = useRole();
  const [open, setOpen] = useState(false);
  const [beckon, setBeckon] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  /* 지금 돌고 있는 도구 이름. 실행 중에만 채워진다.
     사람 말 문구가 아니라 도구 이름을 담는다. 문구는 표시할 때 만들면 되고,
     이름이 있어야 어떤 궤도를 돌릴지도 같이 고를 수 있다 */
  const [running, setRunning] = useState<string | null>(null);
  /** 방금 복사한 답변 id. 잠깐만 켜졌다 꺼진다 */
  const [copied, setCopied] = useState<number | null>(null);
  /** 답변 평가. 서버로 보내지 않고 이 브라우저에만 남는다 */
  const [rated, setRated] = useState<Record<number, "up" | "down" | null>>({});
  const [pinned, setPinned] = useState(false);
  /* 일하는 중에 들어온 질문. 끊지 않고 줄을 세웠다가 차례로 답한다 */
  const [queued, setQueued] = useState<Array<{ id: number; text: string }>>([]);
  const [playing, setPlaying] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([
    { id: 0, role: "bot", text: GREETING },
  ]);
  const seq = useRef(1);
  /* 재생 취소용 세대 번호. 값이 바뀌면 진행 중인 루프가 스스로 빠져나온다.
     타이머 배열을 지우는 방식보다 중간 상태 갱신까지 확실히 막힌다. */
  const runId = useRef(0);
  /* 실호출 중단용. 답변이 길어지거나 방향이 어긋났을 때 끝까지 기다리게 두면
     대화가 아니라 재생이 된다. 지금까지 나온 만큼은 남기고 멈춘다 */
  const abort = useRef<AbortController | null>(null);
  const played = useRef(false);
  const body = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLTextAreaElement>(null);
  const openPanelRef = useRef<(() => void) | null>(null);
  /* 바닥에 붙어 있나. 사용자가 올리면 false가 되고 자동 스크롤이 멈춘다 */
  const stick = useRef(true);

  /* 지금 역할. 검문이 읽는 값이다.
     상태를 그대로 읽으면 안 된다. 도구 실행은 한 번의 요청 안에서 이어지는데,
     그 함수는 요청이 시작된 시점의 role을 붙들고 있다. 그래서 "회원으로
     바꾸고 글 써줘"를 시키면 역할은 바뀌는데 바로 다음 걸음의 검문은 여전히
     게스트로 보고 스스로를 막는다. 실제로 그랬다. */
  const roleNow = useRef(role);
  useEffect(() => {
    roleNow.current = role;
  }, [role]);

  /* 답변 말풍선이 생기는 순간 생각 중 줄은 물러난다. 걸음이든 글자든 그
     안에서 보이기 때문이다. busy 하나만 보면 둘이 같이 떠서 겹쳐 보인다 */
  const thinking = busy && !msgs.some((msg) => msg.streaming);

  /* 화면을 조작하는 중인가. 창을 투명하게 만드는 신호다.
     running을 그대로 쓰면 안 된다. 역할 전환이나 화면 이동은 몇 밀리초 만에
     끝나서, 창이 투명해지려다 마는 깜빡임만 남는다. 실제로 200ms였다.
     도구가 시작되면 켜고, 마지막 도구가 끝난 뒤 한 박자 두고 끈다. 연달아
     도는 도구 사이에서 창이 나타났다 사라졌다 하지 않게 하는 몫도 겸한다. */
  const [operating, setOperating] = useState(false);
  const settleOff = useRef<number | null>(null);
  useEffect(() => {
    if (running) {
      if (settleOff.current) window.clearTimeout(settleOff.current);
      settleOff.current = null;
      setOperating(true);
      return;
    }
    if (!operating) return;
    settleOff.current = window.setTimeout(() => setOperating(false), 620);
    return () => {
      if (settleOff.current) window.clearTimeout(settleOff.current);
    };
  }, [running, operating]);

  /* 줄 서 있던 질문을 **한꺼번에** 꺼낸다.
     하나씩 보내면 요청마다 왕복이 따로 돌고, 모델은 앞 요청을 모른 채 다음
     것을 판단한다. "커뮤니티 열어줘"와 "빨간색으로 바꿔줘"를 따로 받으면
     화면을 두 번 흔들 뿐 순서를 못 짠다.

     묶어서 넘기면 모델이 전체를 보고 순서를 매긴다. 역할을 먼저 올리고,
     화면을 열고, 그다음에 색을 입히는 식으로 한 줄기가 된다. */
  useEffect(() => {
    if (busy || !queued.length) return;
    const batch = queued;
    setQueued([]);
    // 이제 차례가 왔다. 기다린다는 표시를 걷는다
    const ids = new Set(batch.map((item) => item.id));
    setMsgs((prev) =>
      prev.map((msg) => (ids.has(msg.id) ? { ...msg, waiting: false } : msg)),
    );
    /* 하나면 그대로, 여럿이면 번호를 매겨 넘긴다. 번호가 곧 순서라는 걸
       모델이 읽는다. 말풍선은 이미 올렸으므로 다시 만들지 않는다 */
    const asked =
      batch.length === 1
        ? batch[0].text
        : batch
            .map((item, at) => `${at + 1}. ${item.text}`)
            .join("\n");
    void ask(asked, { repeat: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busy, queued]);

  /* 칩 줄은 가로 스크롤이다 — 틸트 휠·트랙패드가 없는 마우스는 넘길 수단이
     없다(실제 지적). 세로 휠을 가로 이동으로 돌려준다. React의 onWheel은
     passive라 preventDefault가 안 먹고, 칩 줄은 재생 상태에 따라 사라졌다
     다시 생기므로 콜백 ref로 마운트마다 non-passive 리스너를 단다. */
  const unbindChips = useRef<(() => void) | null>(null);
  const bindChips = useCallback((node: HTMLDivElement | null) => {
    unbindChips.current?.();
    unbindChips.current = null;
    if (!node) return;
    const onWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      if (node.scrollWidth <= node.clientWidth) return;
      node.scrollLeft += event.deltaY;
      event.preventDefault();
    };
    node.addEventListener("wheel", onWheel, { passive: false });
    unbindChips.current = () =>
      node.removeEventListener("wheel", onWheel);
  }, []);

  // 한 번도 안 열어본 방문자에게만 시선을 준다. 매번 흔들면 방해다
  useEffect(() => {
    if (!window.localStorage.getItem(OPEN_KEY)) {
      const timer = window.setTimeout(() => setBeckon(true), 4000);
      return () => window.clearTimeout(timer);
    }
  }, []);

  /* 새 말풍선·글자가 붙으면 아래로 따라가되, **사용자가 위로 올렸으면 따라가지
     않는다.** 재생은 매 틱마다 msgs를 갱신하므로 조건 없이 당기면 앞의 대화를
     다시 읽을 방법이 사라진다. 스크롤 이벤트로 "바닥에 붙어 있는지"를 기억해 둔다. */
  useEffect(() => {
    const el = body.current;
    if (!el || !stick.current) return;
    el.scrollTo({ top: el.scrollHeight });
    // 생각 중 줄도 높이를 차지한다. 붙었다 떨어질 때 같이 따라가야 한다
  }, [msgs, thinking, running]);

  function onScroll() {
    const el = body.current;
    if (!el) return;
    const gap = el.scrollHeight - el.scrollTop - el.clientHeight;
    stick.current = gap <= STICK_SLACK;
    setPinned(!stick.current);
  }

  /* 부착물(출처 줄·링크 버튼)은 답이 끝난 "뒤"에 자라며 높이를 늘린다 —
     따라가기 이펙트(msgs 기준)보다 늦어서, 성장 애니메이션이 끝나는 순간
     한 번 더 붙여야 바닥이 마저 닿는다(실제 신고: 살짝 위에 멈춤) */
  function onGrowEnd() {
    const el = body.current;
    if (!el || !stick.current) return;
    el.scrollTo({ top: el.scrollHeight });
  }

  function toBottom() {
    stick.current = true;
    setPinned(false);
    body.current?.scrollTo({ top: body.current.scrollHeight, behavior: "smooth" });
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // 언마운트 시 진행 중 재생 중단
  useEffect(() => () => void (runId.current += 1), []);

  /* 체험 가이드·상담 화면에서 "상담 챗봇" 항목을 누르면 여기로 온다.
     openPanel을 그대로 태워서 첫 진입이면 재생까지 함께 시작한다. */
  useEffect(() => {
    const onOpen = () => openPanelRef.current?.();
    window.addEventListener(DEMO_OPEN_CHAT_EVENT, onOpen);
    return () => window.removeEventListener(DEMO_OPEN_CHAT_EVENT, onOpen);
  }, []);

  /* 다른 패널이 열리면 물러난다. 겹치지 말아야 하는 건 펼쳐진 판이지
     버튼이 아니라서, 상대 fab을 숨기는 대신 이쪽이 접힌다. */
  useEffect(() => {
    const onPanel = (event: Event) => {
      const owner = (event as CustomEvent<{ owner: string }>).detail?.owner;
      if (owner !== "chat") setOpen(false);
    };
    window.addEventListener(DEMO_PANEL_OPEN_EVENT, onPanel);
    return () => window.removeEventListener(DEMO_PANEL_OPEN_EVENT, onPanel);
  }, []);

  const push = useCallback((msg: Omit<Msg, "id">) => {
    const id = seq.current++;
    setMsgs((prev) => [...prev, { ...msg, id }]);
    return id;
  }, []);

  /** 한 말풍선에 글자를 흘려 넣는다. 자동 재생과 직접 질문이 같은 코드를 탄다 */
  const stream = useCallback(
    async (
      id: number,
      answer: string,
      extra: Partial<Msg> = {},
      alive: () => boolean = () => true,
    ) => {
      const wait = (ms: number) =>
        new Promise<void>((resolve) => window.setTimeout(resolve, ms));
      const reduced = window.matchMedia?.(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      if (!reduced) {
        for (let at = 0; at <= answer.length; at += CHARS_PER_TICK) {
          if (!alive()) return false;
          const slice = answer.slice(0, at);
          setMsgs((prev) =>
            prev.map((msg) => (msg.id === id ? { ...msg, text: slice } : msg)),
          );
          await wait(CHAR_MS);
        }
      }
      if (!alive()) return false;
      setMsgs((prev) =>
        prev.map((msg) =>
          msg.id === id
            ? { ...msg, ...extra, text: answer, streaming: false }
            : msg,
        ),
      );
      return true;
    },
    [],
  );

  /** 재생 중단. 사용자가 개입했을 때 */
  const stop = useCallback(() => {
    runId.current += 1;
    setPlaying(false);
    // 흐르던 말풍선은 전문으로 확정한다(잘린 채로 남으면 고장으로 보인다)
    setMsgs((prev) =>
      prev.map((msg) =>
        msg.streaming
          ? { ...msg, streaming: false, text: msg.text || FALLBACK }
          : msg,
      ),
    );
  }, []);

  /** 대화 자동 재생. 스크립트 순서대로 묻고 답한다 */
  const play = useCallback(
    async (fromScratch = false) => {
      const id = ++runId.current;
      const alive = () => runId.current === id;
      const wait = (ms: number) =>
        new Promise<void>((resolve) => window.setTimeout(resolve, ms));

      const reduced = window.matchMedia?.(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      if (fromScratch) {
        seq.current = 1;
        setMsgs([{ id: 0, role: "bot", text: GREETING }]);
      }
      setPlaying(true);

      for (const key of DEMO_SCRIPT) {
        const intent = intentById(key);
        if (!intent?.chip || !alive()) break;

        push({ role: "user", text: intent.chip });
        await wait(reduced ? 120 : BEAT_BEFORE_TYPING);
        if (!alive()) return;

        const placeholder = push({ role: "bot", text: "", streaming: true, reply: true });
        await wait(reduced ? 120 : TYPING_DOTS_MS);
        if (!alive()) return;

        const ok = await stream(
          placeholder,
          intent.answer,
          { links: intent.links, live: false },
          alive,
        );
        if (!ok) return;

        await wait(reduced ? 200 : BEAT_AFTER_ANSWER);
      }

      if (alive()) {
        setPlaying(false);
        // 끝까지 재생됐으면 기능이 실제로 돈 것이다
        markProgress("chatbot");
      }
    },
    [push, stream],
  );

  /** 남은 대화를 한 번에. 기다리기 싫은 방문자를 위한 탈출구 */
  const skip = useCallback(() => {
    runId.current += 1;
    setPlaying(false);
    seq.current = 1;
    const all: Msg[] = [{ id: 0, role: "bot", text: GREETING }];
    let next = 1;
    for (const key of DEMO_SCRIPT) {
      const intent = intentById(key);
      if (!intent?.chip) continue;
      all.push({ id: next++, role: "user", text: intent.chip });
      all.push({
        id: next++,
        role: "bot",
        text: intent.answer,
        links: intent.links,
        reply: true,
      });
    }
    seq.current = next;
    setMsgs(all);
    markProgress("chatbot");
  }, []);

  function openPanel() {
    setOpen(true);
    setBeckon(false);
    // 가이드 패널이 열려 있으면 스스로 물러난다. 버튼은 양쪽 다 남는다
    announcePanel("chat");
    window.localStorage.setItem(OPEN_KEY, "1");
    // 처음 열 때만 자동 재생. 닫고 다시 열 때마다 처음부터 돌면 대화가 사라진다
    if (!played.current) {
      played.current = true;
      void play(true);
    }
  }
  openPanelRef.current = openPanel;

  /* 복사한 것을 알려주는 표시. 눌렀는데 아무 반응이 없으면 됐는지 알 수 없다.
     아이콘이 잠깐 체크로 바뀌고 되돌아온다 */
  function copy(id: number, text: string) {
    void navigator.clipboard?.writeText(text).then(() => {
      setCopied(id);
      window.setTimeout(
        () => setCopied((now) => (now === id ? null : now)),
        1600,
      );
    });
  }

  /* 평가는 이 브라우저에만 남긴다. 데모라 서버로 보내지 않는다.
     보내지 않는데 보낸 척하면 그게 거짓말이다 */
  function rate(id: number, value: "up" | "down") {
    setRated((prev) => ({ ...prev, [id]: prev[id] === value ? null : value }));
  }

  /** 같은 질문을 다시 태운다. 답이 마음에 안 들 때 질문을 다시 치지 않게 */
  async function regenerate(botId: number) {
    if (busy) return;
    const index = msgs.findIndex((msg) => msg.id === botId);
    if (index < 1) return;
    const question = [...msgs.slice(0, index)]
      .reverse()
      .find((msg) => msg.role === "user");
    if (!question) return;
    // 다시 만들 답변과 그 뒤는 걷어낸다. 같은 질문의 답이 두 개 쌓이면 헷갈린다
    setMsgs((prev) => prev.slice(0, index));
    await ask(question.text, { repeat: true });
  }

  /**
   * 챗봇이 화면을 실제로 움직인다.
   *
   * 말로 "백오피스에서 보실 수 있어요"라고 하는 것과, 백오피스를 열어주는 것은
   * 다른 물건이다. 이 데모의 주장이 "말한 게 실제로 돌아간다"이므로 챗봇도
   * 같은 규칙을 따른다.
   *
   * 모든 호출은 예외 없이 검문(chat-guard)을 지난다. 모델이 무엇을 하겠다고
   * 하든 여기서 허용한 것만 실제로 일어난다. 챗봇은 페이지의 글 내용을 읽으므로
   * 거기 심긴 문장이 챗봇을 조종하려 들 수 있다. 판단은 모델에게 두되 권한은
   * 코드가 쥔다.
   *
   * 실행한 뒤에는 무엇을 했는지 반드시 남긴다. 화면이 저절로 바뀌었는데 아무
   * 설명이 없으면 오작동으로 읽힌다. 막은 경우에도 이유를 남긴다. 조용히
   * 실패하면 챗봇이 고장 난 것으로 보이고, 이유를 말하면 설명이 된다.
   */
  async function runTool(
    tool: ToolCall,
    ctx: { question: string; used: number },
  ): Promise<ToolResult> {
    /* 실패도 자국을 남긴다. 다만 성공과 같은 체크로 표시하면 안 된다.
       안 된 일에 체크가 붙으면 방문자는 됐다고 읽는다 */
    const fail = (why: string): ToolResult => ({ ok: false, note: why });
    /* 자리를 잘못 찾아온 값을 먼저 접는다. 화면 자리에 지점 이름이 오면
       그 지점이 사는 화면으로 바꾼다. 검문은 그다음이다 */
    const args0 = repairArgs(tool.name, tool.args);
    const verdict = guard(tool.name, args0, TOOL_SPECS[tool.name], {
      question: ctx.question,
      role: roleNow.current,
      used: ctx.used,
    });
    if (!verdict.ok) return fail(verdict.why);

    const a = verdict.args;
    const str = (key: string) => (typeof a[key] === "string" ? a[key] : "");
    const num = (key: string) => (typeof a[key] === "number" ? a[key] : 0);

    let note = "";
    let close = false;

    switch (tool.name) {
      case "point_at": {
        const target = TARGET_BY_ID[str("target")];
        if (!target) return fail("그 지점을 찾지 못했어요.");

        /* 커서가 다 짚을 때까지 기다린다.
           고정 시간으로 어림하면 화면이 느린 날 설명이 먼저 나오고, 빠른 날엔
           커서가 멈춰 선 채로 기다린다. 끝났다는 신호를 직접 받는다.
           신호가 안 오는 경우(대상을 못 찾음)를 대비해 상한을 둔다 */
        const done = new Promise<void>((resolve) => {
          const onDone = () => {
            window.removeEventListener(AGENT_DONE_EVENT, onDone);
            window.clearTimeout(watchdog);
            resolve();
          };
          const watchdog = window.setTimeout(() => {
            window.removeEventListener(AGENT_DONE_EVENT, onDone);
            resolve();
          }, 6000);
          window.addEventListener(AGENT_DONE_EVENT, onDone);
        });

        window.dispatchEvent(
          new CustomEvent(AGENT_EVENT, {
            detail: {
              selector: target.selector,
              note: str("note"),
              click: a.click === true,
            },
          }),
        );
        await done;
        return {
          ok: true,
          note:
            a.click === true
              ? `${str("note")} (직접 눌렀어요)`
              : str("note"),
        };
      }

      case "open_screen": {
        const screen = str("screen") as ScreenId;
        /* 백오피스는 운영자만 본다. 모델이 역할 전환을 빠뜨렸으면 여기서 막고
           무엇을 먼저 해야 하는지 알려준다. 잠긴 화면으로 보내 놓고 빈 화면을
           보여주는 것보다 낫다 */
        if (ADMIN_SCREENS.has(screen) && roleNow.current !== "admin") {
          return fail(
            "백오피스는 운영자만 볼 수 있어요. 먼저 역할을 운영자로 바꿔야 합니다.",
          );
        }
        note = `${SCREEN_LABEL[screen]} 화면을 열었어요.`;
        router.push(SCREEN_PATH[screen]);
        close = true;
        break;
      }

      case "open_post": {
        const post = findPost(str("query"));
        if (!post) return fail("그 글은 찾지 못했어요.");
        note = `"${post.title}" 글을 열었어요.`;
        router.push(`/community/${post.id}`);
        close = true;
        break;
      }

      case "open_job": {
        const job = findJob(str("query"));
        if (!job) return fail("그 공고는 찾지 못했어요.");
        note = `${job.company.name}의 "${job.title}" 공고를 열었어요.`;
        router.push(`/jobs/${job.id}`);
        close = true;
        break;
      }

      case "open_company": {
        const slug = str("company");
        note = `${COMPANY_LABEL[slug]} 리뷰를 열었어요.`;
        router.push(`/companies/${slug}`);
        close = true;
        break;
      }

      case "search_site": {
        const query = str("query");
        const where = str("where");
        const label = where === "companies" ? "회사" : "커뮤니티 글";
        note = `${label}에서 "${query}"를 찾아봤어요.`;
        router.push(`/${where}?q=${encodeURIComponent(query)}`);
        close = true;
        break;
      }

      case "switch_role": {
        const next = str("role") as "guest" | "member" | "admin";
        setRole(next);
        // 다음 걸음의 검문이 곧바로 읽어야 한다. 렌더를 기다릴 수 없다
        roleNow.current = next;
        note = `${withRo(ROLE_LABEL_KO[next])} 바꿨어요. 잠겨 있던 화면이 열립니다.`;
        break;
      }

      case "set_theme": {
        const theme = str("theme");
        applyTheme(theme);
        saveDemoTheme(theme);
        note = `테마를 ${withRo(THEME_LABEL[theme])} 바꿨어요. 토큰 하나로 전 화면이 같이 바뀝니다.`;
        break;
      }

      case "set_brand_color": {
        const hex = str("hex");
        applyTheme(`custom:${hex}`);
        saveDemoTheme(`custom:${hex}`);
        note = `${hex}로 입혀봤어요. 버튼, 배지, 강조색이 전부 이 색을 따라갑니다.`;
        break;
      }

      /* 글쓰기는 화면을 열고 **그 화면의 등록 절차를 그대로 태운다.**
         상태에 직접 써넣으면 빠르지만, 그러면 살균과 권한 확인을 건너뛴 길이
         하나 생긴다. 문이 둘이면 언젠가 한쪽은 안 잠긴다. */
      case "write_post": {
        if (window.location.pathname !== "/community/write") {
          router.push("/community/write");
          await settled(2500);
        }

        /* 화면이 실제로 붙을 때까지 기다린다.
           시간만 재면 안 된다. 라우팅이 끝나도 컴포넌트가 붙고 하이드레이션이
           끝나야 신호를 받을 귀가 생긴다. 그 시점을 초로 어림했더니 느린
           날엔 매번 "화면이 열리지 않았어요"로 끝났다. 편집기가 화면에
           나타났는지를 직접 본다. */
        const ready = await waitFor(
          () => !!document.querySelector(".formcard textarea"),
          12000,
        );
        if (!ready) return fail("글쓰기 화면이 아직 열리지 않았어요.");

        const detail = {
          board: str("board"),
          title: str("title"),
          body: str("body"),
        };

        /* 그래도 받을 때까지 계속 부른다.
           이벤트는 큐에 쌓이지 않는다. 편집기가 보이는 것과 이벤트 처리기가
           붙는 것 사이에도 한 프레임이 있다. 한 번 보내고 마는 대신 답이 올
           때까지 두드린다. 받은 쪽은 첫 신호에만 반응한다. */
        /* 기다리는 기준은 시간이 아니라 **소식**이다.
           방문자가 다른 탭으로 옮기면 브라우저가 타이머를 1초 단위로 늦춘다.
           그러면 1초짜리 타이핑이 30초가 되고, 시간으로 재는 상한은 멀쩡히
           돌고 있는 일을 실패로 끊는다. 실제로 그랬다. 글쓰기 화면이 한 걸음
           쓸 때마다 보내는 신호를 받아 기한을 미룬다. 소식이 멎을 때만
           실패로 본다. 느린 것과 죽은 것은 다른 일이다. */
        const filled = new Promise<string | null>((resolve) => {
          let watchdog = 0;
          const stop = () => {
            window.clearTimeout(watchdog);
            window.removeEventListener(COMPOSE_DONE_EVENT, onDone);
            window.removeEventListener(COMPOSE_TICK_EVENT, onTick);
          };
          const onDone = (event: Event) => {
            stop();
            resolve(
              (event as CustomEvent<{ error?: string }>).detail?.error ?? null,
            );
          };
          const onTick = () => {
            window.clearTimeout(watchdog);
            watchdog = window.setTimeout(give, 9000);
          };
          const give = () => {
            stop();
            resolve("글을 쓰다가 응답이 끊겼어요.");
          };
          // 첫 신호가 올 때까지는 화면이 붙는 시간까지 넉넉히 준다
          watchdog = window.setTimeout(give, 12000);
          window.addEventListener(COMPOSE_DONE_EVENT, onDone);
          window.addEventListener(COMPOSE_TICK_EVENT, onTick);
        });

        window.dispatchEvent(new CustomEvent(COMPOSE_EVENT, { detail }));
        const knock = window.setInterval(
          () => window.dispatchEvent(new CustomEvent(COMPOSE_EVENT, { detail })),
          300,
        );
        const failed = await filled.finally(() => window.clearInterval(knock));
        if (failed) return fail(failed);
        markProgress("chatbot");
        return {
          ok: true,
          note: `"${str("title")}" 글을 등록했어요. 내 정보의 작성 글에 쌓입니다.`,
        };
      }

      case "answer_post": {
        const post = findPost(str("query"));
        if (!post) return fail("답변을 달 글을 찾지 못했어요.");
        const user = loadUser();
        saveUser({
          ...user,
          answers: [
            ...user.answers,
            {
              id: `ans-${user.answers.length + 1}`,
              postId: post.id,
              text: str("text"),
              at: stamp(),
            },
          ],
        });
        note = `"${post.title}"에 답변을 달았어요.`;
        router.push(`/community/${post.id}`);
        close = true;
        break;
      }

      case "react_post": {
        const post = findPost(str("query"));
        if (!post) return fail("그 글을 찾지 못했어요.");
        const user = loadUser();
        const like = str("action") === "like";
        const list = like ? user.likes : user.scraps;
        const already = list.includes(post.id);
        saveUser({
          ...user,
          [like ? "likes" : "scraps"]: toggleIn(list, post.id),
        });
        const what = like ? "도움돼요" : "스크랩";
        note = already
          ? `"${post.title}"의 ${what}를 해제했어요.`
          : `"${post.title}"에 ${what}를 눌렀어요. 같은 데이터를 쓰는 화면에 바로 반영됩니다.`;
        router.push(`/community/${post.id}`);
        close = true;
        break;
      }

      case "follow_company": {
        const slug = str("company");
        const user = loadUser();
        const already = user.follows.includes(slug);
        const wants = a.follow === undefined ? true : a.follow === true;
        if (already === wants) {
          return { ok: true, note: already
            ? `${COMPANY_LABEL[slug]}는 이미 팔로우 중이에요.`
            : `${COMPANY_LABEL[slug]}는 팔로우하고 있지 않아요.` };
        }
        saveUser({ ...user, follows: toggleIn(user.follows, slug) });
        note = wants
          ? `${COMPANY_LABEL[slug]}를 팔로우했어요. 홈과 내 정보에 바로 반영됩니다.`
          : `${COMPANY_LABEL[slug]} 팔로우를 해제했어요.`;
        router.push(`/companies/${slug}`);
        close = true;
        break;
      }

      case "apply_job": {
        const job = findJob(str("query"));
        if (!job) return fail("지원할 공고를 찾지 못했어요.");
        const user = loadUser();
        if (user.applied.includes(job.id)) {
          router.push(`/jobs/${job.id}`);
          await settled(2500);
          return {
            ok: true,
            note: `${job.company.name}의 "${job.title}"에는 이미 지원했어요.`,
          };
        }
        saveUser({ ...user, applied: [...user.applied, job.id] });
        note = `${job.company.name}의 "${job.title}"에 지원했어요.`;
        router.push(`/jobs/${job.id}`);
        close = true;
        break;
      }

      case "submit_evidence": {
        const files = num("files");
        submitEvidence(files);
        note = `증빙 ${files}건으로 실적 인증을 신청했어요. 운영자 화면의 검토 대기열에 실제로 쌓입니다.`;
        router.push("/admin/members");
        close = true;
        break;
      }

      case "show_notifications": {
        note = "알림함을 열었어요. 방금 한 조작이 여기에 남습니다.";
        announceMenuOpen("chat");
        break;
      }

      case "show_progress": {
        const done = loadProgress();
        const rest = DEMO_FEATURES.filter((f) => !done.has(f.id));
        note =
          rest.length === 0
            ? `${DEMO_FEATURES.length}가지를 전부 보셨어요. 이제 상담에서 구성과 일정을 잡으면 됩니다.`
            : `지금까지 ${done.size}/${DEMO_FEATURES.length}를 보셨어요. ` +
              `다음으로는 "${rest[0].title}"가 좋아요. ${rest[0].description}`;
        break;
      }

      case "reset_demo": {
        note = "체험 기록을 지웠어요. 처음 상태로 되돌립니다.";
        window.setTimeout(() => {
          resetDemoExperience();
          window.location.reload();
        }, 1400);
        break;
      }

      case "open_contact": {
        note = "상담 신청 폼으로 모셔갈게요. 연락처는 직접 적어주셔야 해요.";
        router.push("/contact#contact-form");
        close = true;
        break;
      }

      default:
        return fail("그건 제가 할 수 있는 일이 아니에요.");
    }

    markProgress("chatbot");
    /* 화면을 옮겼으면 실제로 그 화면이 그려질 때까지 기다린다.
       고정 시간으로 어림하면 느린 날엔 옛 화면의 빈 자리를 짚고, 빠른 날엔
       멀쩡히 그려진 화면 앞에서 괜히 멈춰 있다 */
    if (close) await settled(2500);
    return { ok: true, note };
  }


  /**
   * 도구를 이어서 돌린다.
   *
   * 모델이 한 걸음을 내려주면 실행하고, 무슨 일이 있었는지 되보내 다음 걸음을
   * 받는다. 더 부를 게 없으면 말로 마무리한다. 이렇게 해야 "커뮤니티 열고,
   * 페이저 짚고, 왜 안 움직이는지 설명해줘"가 한 요청으로 된다.
   *
   * 걸음 수를 막아 둔다. 모델이 같은 도구를 반복해 부르면 화면이 계속 튀고
   * 토큰도 계속 나간다. 여섯 걸음이면 안내 하나로는 충분하다.
   */
  async function runAgent(
    first: ChatReply,
    question: string,
    write: AnswerWriter,
    controller: AbortController,
  ) {
    const trace: unknown[] = [];
    let reply = first;
    /* 이번 요청에서 지금까지 실행한 도구 수. 검문이 이 숫자로 상한을 건다.
       화면이 계속 튀는 것도 사고다 */
    let done = 0;

    for (let step = 0; step < MAX_STEPS; step += 1) {
      if (controller.signal.aborted) return;

      const calls = reply.tools ?? [];
      /* 도구를 더 부르지 않는다는 건 모델이 말로 끝냈다는 뜻이다.
         그 말이 곧 답이므로 반드시 띄운다. 예전에는 여기서 그냥 빠져나가
         마지막 한마디가 통째로 사라졌다 */
      if (!calls.length) {
        if (reply.say?.trim()) {
          write.put(reply.say.trim());
          write.seal();
        }
        return;
      }

      /* 모델이 곁들인 말은 걸음마다 같은 말풍선 안에 쌓는다. 말풍선을 새로
         만들면 한 번의 대답이 다섯 덩이로 흩어진다 */
      if (reply.say?.trim()) write.say(reply.say.trim());

      trace.push({
        role: "assistant",
        content: null,
        tool_calls: calls.map((call) => ({
          id: call.id,
          type: "function",
          function: {
            name: call.name,
            arguments: JSON.stringify(call.args ?? {}),
          },
        })),
      });

      for (const call of calls) {
        if (controller.signal.aborted) break;
        /* 실행하는 동안 무엇을 하는 중인지 띄운다. 화면이 저절로 바뀌는 몇
           초를 아무 설명 없이 두면 오작동으로 읽힌다 */
        setRunning(call.name);
        write.startStep(call.name);
        const result = await runTool(
          { name: call.name, args: call.args ?? {} },
          { question, used: done },
        );
        done += 1;
        // 한 걸음마다 자국을 남긴다. 화면이 저절로 바뀌면 오작동으로 읽힌다
        write.endStep(result.note, !result.ok);
        setRunning(null);
        trace.push({
          role: "tool",
          tool_call_id: call.id,
          content: result.ok
            ? result.note
            : `실행하지 못했어요: ${result.note}`,
        });
      }

      if (controller.signal.aborted) return;

      /* 다음 걸음을 물으러 간다.

         **첫 응답까지만** 기한을 둔다. 길이 제한이 아니다. 한 글자라도
         시작한 답은 끝까지 흐르게 두고, 시작조차 못 한 연결만 끊는다.
         응답이 영영 안 오면 걸음은 다 끝났는데 멈춤 버튼과 테두리만 계속
         돌아서, 방문자 눈에는 다 된 일이 고장 난 것처럼 보인다.

         라우트가 스스로 12초(도구 판단)와 15초(답변 시작)를 재고 있으니
         그보다 넉넉히 뒤에 선다. 여기가 먼저 끊으면 정상 응답을 죽인다. */
      write.startStep(WRAP_STEP);
      const next = await askServer(
        {
          turns: [{ role: "user", content: question }],
          trace,
          // 지금 역할을 함께 보낸다. 서버가 역할에 맞는 도구만 노출하고 검문한다
          role: roleNow.current,
        },
        controller.signal,
      );
      write.dropStep();
      if (!next) {
        /* 시작조차 못 했다. 지금까지 한 것으로 마무리하되, 왜 말이 끊겼는지는
           밝힌다. 화면은 움직였는데 설명이 없으면 방문자는 자기가 뭘 잘못
           눌렀는지 되짚는다 */
        write.seal();
        push({
          role: "bot",
          text: "정리하는 말이 늦어져서 여기까지만 안내했어요.",
          notice: "timeout",
        });
        return;
      }

      if (next.headers.get("content-type")?.includes("application/json")) {
        reply = (await next.json()) as ChatReply;
        continue;
      }

      // 도구를 다 쓰고 말로 마무리한다
      if (next.body) {
        const reader = next.body.getReader();
        const decoder = new TextDecoder();
        let acc = "";
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          acc += decoder.decode(value, { stream: true });
          write.put(acc);
        }
        write.seal();
      }
      return;
    }

    /* 걸음 수 상한. 여기까지 왔는데 아무 말도 없이 끝내면 화면만 몇 번
       움직이고 대화가 끊긴 꼴이 된다 */
    write.put("여기까지 안내했어요. 더 보고 싶은 곳을 말씀해 주세요.");
    write.seal();
  }

  /**
   * 방문자가 직접 물었을 때. 여기서만 실호출을 탄다.
   *
   * repeat는 "다시 생성"이 부를 때다. 질문 말풍선은 이미 화면에 있으므로
   * 하나 더 만들면 같은 질문이 두 번 적힌다.
   */
  /**
   * 방문자가 보낸다.
   *
   * 일하는 중에 보내도 끊지 않는다. 줄을 세웠다가 끝나면 차례로 답한다.
   *
   * 예전에는 busy면 아예 안 받았다. 방문자가 엔터를 눌렀는데 아무 일도 안
   * 일어나니 입력이 먹히지 않는 줄 알고 다시 쓴다. 그렇다고 받는 즉시 하던
   * 일을 끊으면, 방금 시킨 조작이 중간에서 멈춘 화면만 남는다.
   *
   * 중단은 멈춤 버튼을 눌렀을 때만 일어난다. 그게 방문자가 명시적으로
   * "그만"이라고 말한 유일한 자리다.
   */
  function send(raw: string) {
    const text = raw.trim();
    if (!text) return;
    setInput("");
    // 자동으로 늘려둔 높이를 되돌린다. 비운 상자가 세 줄로 남으면 어색하다
    if (field.current) field.current.style.height = "auto";

    if (!busy) {
      void ask(text);
      return;
    }
    /* 말풍선은 지금 올린다. 큐에만 넣고 화면에 안 띄우면 보낸 게 맞는지
       모른 채 기다리게 된다. 줄 서 있음은 문구 없이 옅어진 색으로만 */
    const id = push({ role: "user", text, waiting: true });
    setQueued((rest) => [...rest, { id, text }]);
  }

  async function ask(question: string, options?: { repeat?: boolean }) {
    const text = question.trim();
    if (!text || busy) return;
    stop();

    if (!options?.repeat) push({ role: "user", text });
    setBusy(true);

    const turns = [
      ...msgs
        .filter((msg) => !msg.streaming)
        .map((msg) => ({
          role: msg.role === "bot" ? ("assistant" as const) : ("user" as const),
          content: msg.text,
        })),
      { role: "user" as const, content: text },
    ];

    /* 답변 말풍선은 **첫 글자가 나올 때** 만든다.
       빈 말풍선을 미리 띄워 두면 그게 곧 로더가 되는데, 그러면 끝나는 길
       열 곳이 전부 그걸 직접 치워야 한다. 한 곳만 빠뜨려도 로더가 영원히
       돌았고 실제로 세 번 그랬다. 글자가 있어야만 말풍선이 있으면 치울
       것 자체가 없다. 생각 중 표시는 아래 목록 밖에서 busy로 그린다. */
    let bubble: number | null = null;
    let stepKey = 0;

    /** 아직 말풍선이 없으면 지금 만든다. 있으면 그 자리에 이어 쓴다 */
    const edit = (change: (msg: Msg) => Msg) => {
      if (bubble === null) {
        const seed: Msg = {
          id: -1,
          role: "bot",
          text: "",
          streaming: true,
          reply: true,
          live: true,
        };
        const { id: _seedId, ...fresh } = change(seed);
        bubble = push(fresh);
        return;
      }
      const id = bubble;
      setMsgs((prev) => prev.map((msg) => (msg.id === id ? change(msg) : msg)));
    };

    const write: AnswerWriter = {
      put(value, extra) {
        if (!value) return;
        edit((msg) => ({ ...msg, text: value, ...extra }));
      },
      say(text) {
        const key = stepKey++;
        edit((msg) => ({
          ...msg,
          steps: [...(msg.steps ?? []), { key, say: text, done: true }],
        }));
      },
      startStep(tool) {
        const key = stepKey++;
        edit((msg) => ({
          ...msg,
          steps: [...(msg.steps ?? []), { key, tool, done: false }],
        }));
      },
      endStep(note, failed) {
        edit((msg) => ({
          ...msg,
          steps: (msg.steps ?? []).map((step, at, all) =>
            at === all.length - 1
              ? { ...step, note, done: true, failed }
              : step,
          ),
        }));
      },
      dropStep() {
        edit((msg) => ({ ...msg, steps: (msg.steps ?? []).slice(0, -1) }));
      },
      seal(extra) {
        if (bubble === null) return;
        const id = bubble;
        setMsgs((prev) =>
          prev.map((msg) =>
            msg.id === id
              ? {
                  ...msg,
                  streaming: false,
                  /* 끝났는데 도는 걸음이 남으면 영영 돈다. 표시용으로
                     세워 둔 마무리 걸음은 자국을 남길 것이 아니라 지운다 */
                  steps: msg.steps
                    ?.filter((step) => step.tool !== WRAP_STEP)
                    .map((step) => ({ ...step, done: true })),
                  ...extra,
                }
              : msg,
          ),
        );
      },
    };

    /* 준비된 답변도 자동 재생과 같은 속도로 흘린다. 출처에 따라 연출이 갈리면
       "아까는 타이핑하더니 지금은 왜 툭 나오지"로 읽힌다. */
    const scripted = async () => {
      /* 큐가 "1. …\n2. …"로 묶여 왔으면 낱개로 되돌린다. 묶음 문자열은
         인텐트에 절대 안 걸려 통째로 FALLBACK이 되고, 다음 질문까지 또
         FALLBACK이면 같은 사과문이 연달아 찍힌다 — "중복 메시지가 계속
         나온다"로 읽힌 실제 신고가 이것이다. 하나씩 제 답을 준다 */
      const parts = text
        .split("\n")
        .map((line) => line.replace(/^\d+\.\s*/, "").trim())
        .filter(Boolean);
      const questions = parts.length > 1 ? parts : [text];
      let missed = 0;
      for (const question of questions) {
        const intent = resolveScripted(question);
        if (!intent) missed += 1;
        /* 못 알아들은 게 연달아도 같은 전문을 반복하지 않는다 — 두 번째부터는
           한 줄로 줄인다. 같은 말이 두 번 오면 고장으로 읽힌다 */
        const answer = intent
          ? intent.answer
          : missed > 1
            ? "이 질문도 상담 요청에 함께 남겨주시면 한 번에 회신드려요."
            : FALLBACK;
        const links = intent
          ? intent.links
          : [{ label: "상담 요청하기", href: "/contact" }];
        const id =
          bubble ?? push({ role: "bot", text: "", streaming: true, reply: true });
        bubble = null; // 다음 질문은 제 말풍선을 새로 연다
        await stream(id, answer, { links, live: false });
      }
    };

    const controller = new AbortController();
    abort.current = controller;

    try {
      const response = await askServer(
        { turns, role: roleNow.current },
        controller.signal,
      );
      if (!response) {
        /* 응답이 시작조차 못 했다. 준비된 답변으로 대신하되 그 사실을 밝힌다.
           같은 질문에 다른 답이 나온 이유를 모르면 챗봇을 못 믿게 된다 */
        push({
          role: "bot",
          text: navigator.onLine
            ? "연결이 늦어서 준비된 답변으로 대신할게요."
            : "인터넷 연결이 끊긴 것 같아요. 준비된 답변으로 대신할게요.",
          notice: navigator.onLine ? "timeout" : "offline",
        });
        await scripted();
        return;
      }

      /* 도구를 쓰기로 했으면 스트림이 아니라 JSON이 온다.
         말로 설명하는 대신 화면을 직접 움직이는 쪽이 이 데모의 주장에 맞는다.

         한 번에 끝내지 않는다. 도구를 돌린 결과를 되보내 다음 걸음을 받고,
         모델이 더 부를 게 없다고 하면 그때 말로 마무리한다. "커뮤니티 열고
         페이저 짚어줘" 같은 요청이 한 번의 왕복으로는 안 되기 때문이다. */
      if (response.headers.get("content-type")?.includes("application/json")) {
        const first = (await response.json()) as ChatReply & {
          fallback?: boolean;
        };
        /* 키 없음·한도 초과도 JSON({ fallback: true })으로 온다. 이걸
           에이전트 응답으로 착각하면 도구도 말도 없어서 **아무 답이 없는**
           화면이 된다(실제 사고). 라우트의 계약대로 스크립트 답변으로 간다 */
        if (first.fallback) {
          await scripted();
          return;
        }
        await runAgent(first, text, write, controller);
        return;
      }

      // 키 없음, 한도 초과, 업스트림 장애면 스크립트로
      if (response.headers.get("x-ai-source") !== "openai" || !response.body) {
        await scripted();
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      /* 도착과 표시를 분리한다.

         네트워크 청크는 여러 글자를 한 번에 실어 온다. 받는 대로 그대로 붙이면
         글자가 뭉텅이로 튀어나오고, 꼬리 블러와 그라데이션이 채 재생되기 전에
         다음 덩어리가 덮어써서 애니메이션이 보이지 않는다.

         받는 건 받는 속도로 두고, 보여주는 건 일정한 속도로 흘린다. 다만 밀린
         분량이 쌓이면 보폭을 넓혀 따라잡는다. 응답이 다 왔는데도 한 글자씩
         찍고 있으면 그건 그것대로 답답하다. */
      let arrived = "";
      let shown = 0;
      let networkDone = false;

      /* networkDone은 반드시 finally에서 세운다. 읽기가 예외로 끝났는데 이
         플래그가 false로 남으면, 아래 표시 루프가 영원히 돌면서 중단 버튼이
         박힌 채 빈 말풍선이 남는다. 실패든 성공이든 "더 올 것이 없다"는
         사실은 같다. */
      let pumpFailed = false;
      const pump = (async () => {
        try {
          for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            arrived += decoder.decode(value, { stream: true });
          }
        } catch {
          pumpFailed = true;
        } finally {
          networkDone = true;
        }
      })();

      for (;;) {
        // 중단을 누르면 지금까지 나온 만큼만 남기고 즉시 빠져나온다
        if (controller.signal.aborted) break;
        if (shown < arrived.length) {
          const behind = arrived.length - shown;
          shown += Math.max(1, Math.ceil(behind / CATCH_UP));
          write.put(arrived.slice(0, shown));
        } else if (networkDone) {
          break;
        }
        await wait(LIVE_CHAR_MS);
      }
      await pump;
      const acc = controller.signal.aborted
        ? arrived.slice(0, shown)
        : arrived;

      /* 읽다가 끊겼는데 한 글자도 못 건졌으면 실패다. 스크립트로 넘긴다.
         일부라도 받았으면 그건 살린다. 받은 말을 지우는 게 더 나쁘다 */
      if (pumpFailed && !acc.trim()) {
        await scripted();
        return;
      }

      /* 중단은 실패가 아니다. 스크립트 답변으로 갈아치우면 "멈추라고 했는데
         다른 답이 나오는" 꼴이 된다. 나온 만큼만 남기고 끝낸다 */
      if (controller.signal.aborted) {
        write.put(acc);
        write.seal({ stopped: true });
        return;
      }

      if (!acc.trim()) {
        await scripted();
        return;
      }
      write.seal();
    } catch {
      if (controller.signal.aborted) return;
      await scripted();
    } finally {
      /* 어떤 길로 끝나든 흐르던 말풍선은 여기서 닫힌다. 위쪽 분기가 하나
         빠져도 로더가 남지 않는 유일한 지점이다 */
      write.seal();
      setRunning(null);
      if (abort.current === controller) abort.current = null;
      setBusy(false);
      // 직접 물어본 것도 체험 완료다
      markProgress("chatbot");
    }
  }

  const asked = new Set(
    msgs.filter((msg) => msg.role === "user").map((msg) => msg.text),
  );
  const chips = INTENTS.filter(
    (intent) => intent.chip && !asked.has(intent.chip),
  ).slice(0, 4);

  return (
    <aside className="chatwidget" aria-label="상담 챗봇">
      {open ? (
        /* 도구가 도는 동안(is-operating) 창이 물러난다. 정작 봐야 할 것은
           뒤에서 일어나는 일이라, 앞을 불투명한 판이 가리고 있으면 무엇이
           바뀌었는지 보이지 않는다. 물러나는 건 판이지 글이 아니다 */
        <div
          className={[
            "chatpanel",
            busy ? "is-thinking" : "",
            operating ? "is-operating" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <div className="chathead">
            <AiAvatar size="sm" thinking={playing} />
            <div className="ct">
              <b>상담 챗봇</b>
              <span>
                {playing
                  ? "대화가 재생되고 있어요"
                  : "무엇을 만들지, 얼마나 걸릴지 물어보세요"}
              </span>
            </div>
            {playing ? (
              <button className="cskip" onClick={skip}>
                건너뛰기
              </button>
            ) : (
              <button
                className="cskip"
                aria-label="대화 다시 재생"
                onClick={() => void play(true)}
              >
                <Icon name="play" />
                다시
              </button>
            )}
            <button
              className="cx"
              aria-label="상담 챗봇 닫기"
              onClick={() => {
                stop();
                setOpen(false);
              }}
            >
              <Icon name="x" />
            </button>
          </div>

          <div
            className="chatbody"
            ref={body}
            onScroll={onScroll}
            onAnimationEnd={onGrowEnd}
            aria-live="polite"
          >
            {msgs.map((msg) => (
              <div className={`bubrow ${msg.role}`} key={msg.id}>
                {msg.role === "bot" ? (
                  <AiAvatar size="sm" thinking={!!msg.streaming} />
                ) : null}
                {/* 생각 중과 답하는 중을 가른다. 생각할 땐 테두리가 돌고,
                    글자가 나오기 시작하면 테두리를 끄고 오로라만 남긴다.
                    읽는 동안 테두리가 계속 돌면 글자에서 눈이 떨어진다 */}
                <div
                  className={[
                    "bub",
                    msg.role,
                    msg.waiting ? "is-waiting" : "",
                    msg.notice ? `is-notice is-${msg.notice}` : "",
                    msg.streaming && !msg.text ? "is-thinking" : "",
                    msg.streaming && msg.text ? "is-answering" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                {msg.streaming && !msg.text && !msg.steps?.length ? (
                  <Thinking tool={running ?? undefined} />
                ) : (
                  <>
                    {/* 거쳐 온 걸음. 답 위에 쌓이고, 도는 걸음은 하나뿐이다 */}
                    {msg.steps?.length ? (
                      <span className="tsteps">
                        {msg.steps.map((step) => (
                          <span
                            className={[
                              "tstep",
                              step.done ? "is-done" : "is-live",
                              step.failed ? "is-failed" : "",
                              step.say ? "is-say" : "",
                            ]
                              .filter(Boolean)
                              .join(" ")}
                            key={step.key}
                          >
                            <span className="tstep-mark" aria-hidden>
                              {step.say ? null : step.failed ? (
                                <Icon name="alert" />
                              ) : step.done ? (
                                <Icon name="check" />
                              ) : (
                                <span className="tstep-spin" />
                              )}
                            </span>
                            <span className="tstep-say">
                              {step.say ??
                                (step.done
                                  ? (step.note ?? "실행했어요")
                                  : (TOOL_RUNNING[step.tool ?? ""] ??
                                    "작업하는 중"))}
                            </span>
                          </span>
                        ))}
                      </span>
                    ) : null}
                    {msg.text ? (
                      <p>
                        {/* 알림은 답변이 아니다. 아이콘을 앞세워 성격을
                            먼저 알린다. 글자만 있으면 답으로 읽힌다 */}
                        {msg.notice ? (
                          <Icon
                            className="noticeic"
                            name={msg.notice === "offline" ? "eyeoff" : "alert"}
                          />
                        ) : null}
                        <StreamText
                          text={msg.text}
                          streaming={!!msg.streaming}
                        />
                        {msg.streaming ? <span className="cur" /> : null}
                      </p>
                    ) : null}
                    {msg.role === "bot" && msg.reply && !msg.streaming ? (
                      <span className="bfoot">
                        <span className={msg.live ? "src live" : "src"}>
                          {msg.stopped
                            ? "여기서 멈췄어요"
                            : msg.steps?.some((step) => step.tool)
                              ? `화면을 ${msg.steps.filter((step) => step.tool).length}번 조작했어요`
                              : msg.live
                                ? "AI 실시간 답변"
                                : "준비된 답변"}
                        </span>

                        {/* 답변에 붙는 조작. 조작을 말풍선 안에 두면 대화를
                            읽는 흐름을 끊지 않는다 */}
                        <span className="bacts">
                          <button
                            className="bact"
                            aria-label="답변 복사"
                            onClick={() => copy(msg.id, msg.text)}
                          >
                            <Icon name={copied === msg.id ? "check" : "doc"} />
                          </button>
                          {/* 화면을 조작한 답은 다시 생성하지 않는다.
                              같은 조작이 한 번 더 일어나면 방문자가 보고
                              있던 화면이 이유 없이 또 움직인다 */}
                          {!msg.steps?.some((step) => step.tool) ? (
                            <button
                              className="bact"
                              aria-label="다시 생성"
                              disabled={busy}
                              onClick={() => void regenerate(msg.id)}
                            >
                              <Icon name="swap" />
                            </button>
                          ) : null}
                          <button
                            className={
                              rated[msg.id] === "up" ? "bact on" : "bact"
                            }
                            aria-label="도움이 됐어요"
                            onClick={() => rate(msg.id, "up")}
                          >
                            <Icon name="like" />
                          </button>
                          <button
                            className={
                              rated[msg.id] === "down" ? "bact on" : "bact"
                            }
                            aria-label="아쉬워요"
                            onClick={() => rate(msg.id, "down")}
                          >
                            <Icon name="flag" />
                          </button>
                        </span>
                      </span>
                    ) : null}
                    {msg.links?.length ? (
                      <div className="blinks">
                        {msg.links.map((link) => (
                          <Link
                            className="blink"
                            key={link.href}
                            href={link.href}
                            onClick={() => {
                              stop();
                              setOpen(false);
                            }}
                          >
                            {link.label}
                            <Icon name="arrow" />
                          </Link>
                        ))}
                      </div>
                    ) : null}
                  </>
                )}
                </div>
              </div>
            ))}

            {/* 생각 중은 목록의 한 칸이 아니라 목록 **밖**이다.

                안에 두면 도구를 돌리는 동안 로더가 위에 있고 결과가 아래로
                쌓여서, 다 끝난 화면 위에서 혼자 돌고 있는 그림이 된다.
                밖에 두면 언제나 마지막 줄이라 순서가 어긋나지 않는다. */}
            {thinking ? (
              <div className="bubrow bot" aria-live="polite">
                <AiAvatar size="sm" thinking />
                <div className="bub bot is-thinking">
                  <Thinking tool={running ?? undefined} />
                </div>
              </div>
            ) : null}

            {/* 위로 올려 읽는 중이면 자동 스크롤을 멈추고 복귀 버튼만 띄운다 */}
            {pinned ? (
              <button className="chatdown" onClick={toBottom}>
                <Icon name="down" />
                최신 대화로
              </button>
            ) : null}
          </div>

          {/* 재생 중에는 칩을 숨긴다. 대화가 흐르는 중에 선택지를 주면 둘이 다툰다 */}
          {!playing && chips.length ? (
            <div className="chatchips" ref={bindChips}>
              {chips.map((intent) => (
                <button
                  key={intent.id}
                  disabled={busy}
                  onClick={() => void ask(intent.chip!)}
                >
                  {intent.chip}
                </button>
              ))}
            </div>
          ) : null}

          <form
            className="chatform"
            onSubmit={(event) => {
              event.preventDefault();
              send(input);
            }}
          >
            {/* input이 아니라 textarea다. 두 줄 넘는 질문을 한 줄 상자에
                밀어 넣으면 앞이 안 보인 채로 쓰게 된다. 높이는 내용에 따라
                늘고, Enter는 전송, Shift+Enter는 줄바꿈이다 */}
            <textarea
              ref={field}
              value={input}
              rows={1}
              maxLength={500}
              placeholder="직접 물어봐도 돼요"
              onChange={(event) => {
                setInput(event.target.value);
                const el = event.target;
                el.style.height = "auto";
                el.style.height = `${Math.min(el.scrollHeight, 96)}px`;
              }}
              onFocus={() => playing && stop()}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  /* 한글 IME 조합 중의 Enter는 조합 확정 키다. 이때 보내면
                     문장이 나가고 → IME가 마지막 글자를 빈칸에 다시 커밋하고
                     → 진짜 Enter가 그 낱글자("데", "녕")를 한 번 더 보낸다.
                     실제 신고된 "끝글자 중복 전송"이 이것이다 */
                  if (event.nativeEvent.isComposing) return;
                  event.preventDefault();
                  send(input);
                }
              }}
            />
            {/* 생성 중에는 같은 자리가 중단 버튼이 된다. 버튼을 따로 두면
                멈추려고 눈으로 찾아야 하고, 그 사이 답변은 계속 흐른다 */}
            {/* 단, 생성 중이라도 글자를 치기 시작하면 그 순간 전송 버튼으로
                돌아온다(사용자 지시) — 타이핑은 "보내겠다"는 뜻이지 "멈추겠다"는
                뜻이 아니다. 보내면 줄을 서고, 입력이 비면 다시 중단 버튼이다 */}
            {busy && !input.trim() ? (
              <button
                type="button"
                className="cstop"
                aria-label="답변 중단"
                onClick={() => abort.current?.abort()}
              >
                <span className="cstop-sq" aria-hidden />
              </button>
            ) : (
              <button type="submit" disabled={!input.trim()}>
                <Icon name="arrow" />
              </button>
            )}
          </form>

          <div className="chatnote">
            상담 챗봇은 실수를 할 수 있습니다.
          </div>
        </div>
      ) : null}

      <button
        className={beckon && !open ? "chatfab is-beckon" : "chatfab"}
        type="button"
        aria-expanded={open}
        aria-label={open ? "상담 챗봇 닫기" : "상담 챗봇 열기"}
        onClick={() => {
          if (open) {
            stop();
            setOpen(false);
          } else {
            openPanel();
          }
        }}
      >
        {open ? (
          <Icon name="x" />
        ) : (
          /* AI 답변과 같은 얼굴. 일반 말풍선이면 그냥 고객센터 위젯으로 읽힌다.
             진입점은 화면에 하나뿐이고 눈에 띄어야 하므로 여기만 상시 움직인다 */
          <AiAvatar size="lg" spark={beckon} live />
        )}
      </button>
    </aside>
  );
}
