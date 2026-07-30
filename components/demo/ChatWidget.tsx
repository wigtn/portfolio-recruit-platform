"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import { AiAvatar } from "@/components/AiFace";
import {
  DEMO_SCRIPT,
  FALLBACK,
  GREETING,
  INTENTS,
  intentById,
  resolveScripted,
  type ChatIntent,
} from "@/lib/demo/chat";
import { DEMO_OPEN_CHAT_EVENT, markProgress } from "@/lib/demo/progress";

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

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [beckon, setBeckon] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([
    { id: 0, role: "bot", text: GREETING },
  ]);
  const seq = useRef(1);
  /* 재생 취소용 세대 번호. 값이 바뀌면 진행 중인 루프가 스스로 빠져나온다.
     타이머 배열을 지우는 방식보다 중간 상태 갱신까지 확실히 막힌다. */
  const runId = useRef(0);
  const played = useRef(false);
  const body = useRef<HTMLDivElement>(null);
  const openPanelRef = useRef<(() => void) | null>(null);
  /* 바닥에 붙어 있나. 사용자가 올리면 false가 되고 자동 스크롤이 멈춘다 */
  const stick = useRef(true);

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
  }, [msgs]);

  function onScroll() {
    const el = body.current;
    if (!el) return;
    const gap = el.scrollHeight - el.scrollTop - el.clientHeight;
    stick.current = gap <= STICK_SLACK;
    setPinned(!stick.current);
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
    window.localStorage.setItem(OPEN_KEY, "1");
    // 처음 열 때만 자동 재생. 닫고 다시 열 때마다 처음부터 돌면 대화가 사라진다
    if (!played.current) {
      played.current = true;
      void play(true);
    }
  }
  openPanelRef.current = openPanel;

  /** 방문자가 직접 물었을 때. 여기서만 실호출을 탄다 */
  async function ask(question: string) {
    const text = question.trim();
    if (!text || busy) return;
    stop();

    push({ role: "user", text });
    setInput("");
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

    const placeholder = push({ role: "bot", text: "", streaming: true, reply: true });

    /* 준비된 답변도 자동 재생과 같은 속도로 흘린다. 출처에 따라 연출이 갈리면
       "아까는 타이핑하더니 지금은 왜 툭 나오지"로 읽힌다. */
    const scripted = async () => {
      const intent = resolveScripted(text);
      const answer = intent ? intent.answer : FALLBACK;
      const links = intent
        ? intent.links
        : [{ label: "상담 요청하기", href: "/contact" }];
      await stream(placeholder, answer, { links, live: false });
    };

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ turns }),
      });

      // 키 없음 · 한도 초과 · 업스트림 장애 → 스크립트로
      if (response.headers.get("x-ai-source") !== "openai" || !response.body) {
        await scripted();
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMsgs((prev) =>
          prev.map((msg) =>
            msg.id === placeholder ? { ...msg, text: acc, live: true } : msg,
          ),
        );
      }

      if (!acc.trim()) {
        await scripted();
        return;
      }
      setMsgs((prev) =>
        prev.map((msg) =>
          msg.id === placeholder ? { ...msg, streaming: false } : msg,
        ),
      );
    } catch {
      await scripted();
    } finally {
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
        <div className="chatpanel">
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
            aria-live="polite"
          >
            {msgs.map((msg) => (
              <div className={`bubrow ${msg.role}`} key={msg.id}>
                {msg.role === "bot" ? (
                  <AiAvatar size="sm" thinking={!!msg.streaming} />
                ) : null}
                <div className={`bub ${msg.role}`}>
                {msg.streaming && !msg.text ? (
                  <span className="dots" aria-label="답변 작성 중">
                    <i />
                    <i />
                    <i />
                  </span>
                ) : (
                  <>
                    <p>
                      {msg.text}
                      {msg.streaming ? <span className="cur" /> : null}
                    </p>
                    {msg.role === "bot" && msg.reply && !msg.streaming ? (
                      <span className={msg.live ? "src live" : "src"}>
                        {msg.live ? "AI 실시간 답변" : "준비된 답변"}
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
            <div className="chatchips">
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
              void ask(input);
            }}
          >
            <input
              value={input}
              maxLength={500}
              placeholder="직접 물어봐도 돼요"
              onChange={(event) => setInput(event.target.value)}
              onFocus={() => playing && stop()}
            />
            <button type="submit" disabled={busy || !input.trim()}>
              <Icon name="arrow" />
            </button>
          </form>

          <div className="chatnote">
            데모 상담 챗봇이에요. 금액은 요구사항을 확인한 뒤 상담에서 드려요
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
          /* AI 답변과 같은 얼굴. 일반 말풍선이면 그냥 고객센터 위젯으로 읽힌다 */
          <AiAvatar size="lg" spark={beckon} />
        )}
      </button>
    </aside>
  );
}
