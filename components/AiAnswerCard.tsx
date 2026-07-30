"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  SAFETY_DESC,
  SAFETY_LABEL,
  SAFETY_STAT,
  type GuardedTerm,
  type SafetyLevel,
} from "@/lib/seed/posts";
import { loadState } from "@/lib/admin/overlay";
import { bumpAiRuns, loadAiRuns } from "@/lib/demo/user";
import { markProgress } from "@/lib/demo/progress";
import { Icon } from "./Icon";
import { toast } from "./ds/Toaster";
import { SmoothHeight } from "./ds/SmoothHeight";
import { splitByGuarded } from "@/lib/demo/ai-parts";

/**
 * AI 참고 답변 — 시안 정본 05번 `.aicard` 구조 그대로.
 * .aihd(배지·한도·강도·접기) → .aifoldable(.airesp/.aitext + .evchips + .guardstrip) → .demotip
 *
 * r4 재설계(변경 1번): "위험하게 썼다 순화"가 아니라 **생성 과정을 노출**하고
 * **관리자 설정(안전 강도)이 결과를 바꾸는 것**으로 통제를 보여준다.
 * 질문확인 → 스트리밍(원문) → 안전 재검사 → 제자리 교정 → 게시(스트림 착지).
 * 게시된 답변은 회원 답변이 달려도 접지 않는다(사용자 지시).
 */

type Stage = "idle" | "checking" | "streaming" | "rescan" | "fixing" | "posted";

/** 단계별 마이크로 작업 문구 — 파이프라인이 지금 뭘 하는지 구체적으로 */
const SUBTASKS: Partial<Record<Stage, string[]>> = {
  checking: [
    "글 본문과 댓글 맥락을 읽고 있어요",
    "질문 의도를 분류하고 있어요 — 신규 개척 · 프로세스 문의",
    "참고할 현직자 리뷰 범위를 대조하고 있어요",
  ],
  rescan: [
    "생성된 문장에서 실명 패턴을 검사하고 있어요",
    "출처가 확인되지 않은 수치를 찾고 있어요",
    "회사명·개인정보 노출 여부를 살피고 있어요",
  ],
  fixing: [
    "위험 표현을 안전한 표현으로 바꾸고 있어요",
    "표현 수위를 안전 강도 설정에 맞추고 있어요",
  ],
};

export function AiAnswerCard({
  postId,
  draft,
  guarded,
  onPosted,
}: {
  postId: string;
  draft: string;
  guarded: GuardedTerm[];
  onPosted?: () => void;
}) {
  const [level, setLevel] = useState<SafetyLevel>("basic");
  const [stage, setStage] = useState<Stage>("idle");
  const [typed, setTyped] = useState(0);
  const [fixed, setFixed] = useState(false);
  const [quota, setQuota] = useState(3);
  const [settingsOpen, setSettingsOpen] = useState(false);
  // 실생성(OpenAI) 경로 — 스트리밍 중 원문과, 완료 후 파이프라인용 파츠
  const [liveText, setLiveText] = useState<string | null>(null);
  // 생성 말풍선 — 답변이 달릴 자리에 인라인으로 뜬다. 게시되면 잠깐
  // 체크를 보여준 뒤 걷히고, 같은 자리에 답변 줄이 착지한다.
  const [panelOpen, setPanelOpen] = useState(false);
  // 한도 차단 화면 — 소진 직후가 아니라 "다음 시도"에서 켠다.
  // 마지막 생성 결과까지 덮어버리면 방금 쓴 한도가 억울해진다.
  const [blocked, setBlocked] = useState(false);
  // 시연 유도 코치 — 트리거 옆 글래스 말풍선. 닫으면 기억한다(Coach 규약)
  const [coachOpen, setCoachOpen] = useState(false);
  useEffect(() => {
    setCoachOpen(!window.localStorage.getItem("wigtn-demo-coach-ai-flow"));
  }, []);
  const [liveParts, setLiveParts] = useState<string[] | null>(null);
  const timers = useRef<number[]>([]);
  const aborter = useRef<AbortController | null>(null);

  // 관리자 화면(AI 운영)에서 정한 강도·한도가 여기에 적용된다 — 같은 오버레이를 읽는다
  useEffect(() => {
    const { ai } = loadState();
    setLevel(ai.safety);
    setQuota(Math.max(0, ai.quota - loadAiRuns()));
  }, []);

  const clearTimers = useCallback(() => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const parts = draft.split(/(\{\d\})/);
  const fullText = parts
    .map((part) => {
      const match = /^\{(\d)\}$/.exec(part);
      return match ? guarded[Number(match[1])].raw : part;
    })
    .join("");

  /* 게시 이후 공통 마무리 — 시드/실생성 경로가 같은 문으로 나간다 */
  const finish = useCallback(
    (countsAgainstQuota: boolean) => {
      setStage("posted");
      // 자동으로 닫지 않는다(사용자 지시) — 결과를 읽고 ×로 직접 닫으면
      // 그 자리에 답변 줄이 착지한다.
      if (countsAgainstQuota) {
        setQuota((left) => Math.max(0, left - 1));
        bumpAiRuns();
      }
      markProgress("ai-answer");
      onPosted?.();
    },
    [onPosted],
  );

  /** 시드 초안 연출 — 키가 없거나 실호출이 막혔을 때의 경로(기존 규격 그대로) */
  const playSeeded = useCallback(
    (countsAgainstQuota: boolean) => {
      const at = (ms: number, fn: () => void) =>
        timers.current.push(window.setTimeout(fn, ms));

      // 질문 확인 단계 — 작업 로그 세 문구가 읽힐 시간을 준다
      at(3000, () => setStage("streaming"));
      // 30ms에 2글자 — 원 규격(22ms)보다 살짝 여유를 줘 읽으며 따라오게
      const start = 3000;
      for (let i = 0; i <= fullText.length; i += 2) {
        at(start + (i / 2) * 30, () => setTyped(i));
      }
      const typeDone = start + (fullText.length / 2) * 30 + 400;
      at(typeDone, () => setStage("rescan"));
      // 재검사·치환도 로그 문구가 다 돌 만큼 — 빨리 끝나면 뭘 했는지 안 읽힌다
      at(typeDone + 3000, () => setStage("fixing"));
      at(typeDone + 4600, () => setFixed(true));
      at(typeDone + 5600, () => finish(countsAgainstQuota));
    },
    [finish, fullText.length],
  );

  const play = useCallback(async () => {
    if (quota <= 0) {
      setBlocked(true);
      return;
    }
    const countsAgainstQuota = quota > 0;
    clearTimers();
    aborter.current?.abort();
    setStage("checking");
    setTyped(0);
    setFixed(false);
    setLiveText(null);
    setLiveParts(null);

    const at = (ms: number, fn: () => void) =>
      timers.current.push(window.setTimeout(fn, ms));

    // ── 실호출 시도 — 키가 있으면 진짜 OpenAI 스트림이 들어온다 ──
    try {
      const controller = new AbortController();
      aborter.current = controller;
      const res = await fetch("/api/ai-answer", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ postId }),
        signal: controller.signal,
      });

      if (res.status === 429) {
        const data = (await res.json()) as { error?: string };
        toast(data.error ?? "실호출 한도에 도달했어요 — 예시로 재생해요.", {
          tone: "info",
        });
        playSeeded(countsAgainstQuota);
        return;
      }

      if (res.ok && res.headers.get("x-ai-source") === "openai" && res.body) {
        setStage("streaming");
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let acc = "";
        // 실스트림은 도착분을 그대로 붙인다 — 전체가 먼저 뜨는 일이 없다
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          acc += decoder.decode(value, { stream: true });
          setLiveText(acc);
        }
        // 재검사 파이프라인은 파츠 구조를 먹는다 — 실텍스트를 같은 모양으로
        setLiveParts(splitByGuarded(acc, guarded));
        at(400, () => setStage("rescan"));
        at(3400, () => setStage("fixing"));
        at(5000, () => setFixed(true));
        at(6000, () => finish(countsAgainstQuota));
        return;
      }
      // fallback: true(키 없음) 또는 업스트림 장애 — 시드 연출
    } catch {
      /* 네트워크 실패도 데모를 멈추지 않는다 */
    }
    playSeeded(countsAgainstQuota);
  }, [clearTimers, finish, guarded, playSeeded, postId, quota]);

  const playing = stage !== "idle" && stage !== "posted";

  /* 실시간 작업 로그 — 단계마다 무엇을 하는지 문구가 굴러가고,
     생성 단계는 글자 수가 실제로 올라간다 */
  const [subIdx, setSubIdx] = useState(0);
  useEffect(() => {
    setSubIdx(0);
    if (!playing) return;
    const list = SUBTASKS[stage] ?? [];
    if (list.length < 2) return;
    const timer = window.setInterval(
      () => setSubIdx((index) => (index + 1) % list.length),
      1250,
    );
    return () => window.clearInterval(timer);
  }, [stage, playing]);

  /* 순차 연출 인덱스 — 재검사는 위험 토큰을 하나씩 스캔하고,
     치환은 하나씩 바꾼다. 로그 문구와 텍스트 위 연출이 함께 움직인다. */
  const [scanIdx, setScanIdx] = useState(-1);
  const [fixIdx, setFixIdx] = useState(-1);
  useEffect(() => {
    const count = Math.max(1, guarded.length);
    if (stage === "rescan") {
      setScanIdx(0);
      const stepMs = Math.max(650, 2400 / count);
      const timer = window.setInterval(
        () => setScanIdx((index) => Math.min(index + 1, count)),
        stepMs,
      );
      return () => window.clearInterval(timer);
    }
    if (stage === "fixing") {
      setFixIdx(0);
      const stepMs = Math.max(550, 1400 / count);
      const timer = window.setInterval(
        () => setFixIdx((index) => Math.min(index + 1, count)),
        stepMs,
      );
      return () => window.clearInterval(timer);
    }
    if (stage === "idle" || stage === "checking") {
      setScanIdx(-1);
      setFixIdx(-1);
    }
  }, [stage, guarded.length]);

  const charCount = liveText !== null ? liveText.length : typed;
  const subText =
    stage === "streaming"
      ? `리뷰 근거로 문장을 쓰는 중 · ${charCount.toLocaleString()}자`
      : ((SUBTASKS[stage] ?? [])[subIdx] ?? "");
  const stepOf: Record<string, number> = {
    checking: 1,
    streaming: 2,
    rescan: 3,
    fixing: 4,
    posted: 5,
  };
  const step = stepOf[stage] ?? 0;

  return (
    <>
      {/* ① AI 답변 — 게시되는 순간 회원 답변과 같은 한 줄로 즉시 목록에
          선다(말풍선이 열려 있어도 동시에 보인다 — 말풍선은 과정·컨트롤,
          이 줄이 실제 게시물이다). 사람이 답을 달아도 접지 않는다(사용자 지시). */}
      {stage === "posted" ? (
        <div className="comment is-in ai-comment ai-land">
          <span className="aiav">
            <Icon name="bot" />
            {/* 착지 스파클 — 게시 순간 한 번 떠올랐다 사라진다 */}
            <span className="aispark" aria-hidden>
              <i style={{ "--a": "-40deg" } as React.CSSProperties} />
              <i style={{ "--a": "18deg" } as React.CSSProperties} />
              <i style={{ "--a": "72deg" } as React.CSSProperties} />
            </span>
          </span>
          <div className="cbody">
            <div className="cwho">
              <span className="ainick">AI 참고 답변</span>
              <span>참고용 · 방금 생성</span>
            </div>
            <div className="ctext">
              <PostedStream
                parts={liveParts ?? parts}
                guarded={guarded}
                level={level}
              />
            </div>
            <div className="aistat">
              <Icon name="shield" />
              {SAFETY_STAT[level]} · 회사 실명·미확인 수치는 담지 않아요
            </div>
          </div>
        </div>
      ) : null}

      {/* ② 트리거 — 중앙의 필 버튼 하나로 존재감을 준다. 오른쪽 글래스
          말풍선이 "여기가 AI 시연"임을 유도한다(닫으면 기억). */}
      {!panelOpen ? (
        <div className="aitrigger">
          <span className="acw">
          <button
            type="button"
            className="aicall"
            aria-label={
              stage === "posted"
                ? "AI 참고 답변 다시 생성"
                : "AI 참고 답변 생성"
            }
            onClick={() => {
              setPanelOpen(true);
              setCoachOpen(false);
              if (quota > 0) {
                setBlocked(false);
                void play();
              } else {
                setBlocked(true);
              }
            }}
          >
            <span className="aiplaybtn">
              <Icon name="bot" />
            </span>
            <span className="aicall-t">
              <b>AI 참고 답변 {stage === "posted" ? "다시 생성" : "생성"}</b>
              <small>실시간 생성 → 안전 재검사까지 지켜보세요</small>
            </span>
          </button>

          {coachOpen && stage !== "posted" ? (
            <span className="aicoach" role="note">
              <span className="cb">데모</span>
              <span className="ctxt">
                AI가 댓글을 쓰고 <b>위험 표현을 재검사</b>하는 과정이 실시간으로
                보여요
              </span>
              <button
                type="button"
                aria-label="안내 닫기"
                onClick={() => {
                  window.localStorage.setItem("wigtn-demo-coach-ai-flow", "1");
                  setCoachOpen(false);
                }}
              >
                <Icon name="x" />
              </button>
            </span>
          ) : null}
          </span>
        </div>
      ) : null}

      {/* ③ 생성 말풍선 — 답변이 달릴 바로 그 자리에서, AI가 실시간으로
          쓰고 재검사하는 과정이 보인다. 재생 중엔 보더 빔 + 오로라. */}
      {panelOpen ? (
        <div className="comment is-in aiwrap">
          <span className={playing ? "aiav is-think" : "aiav"}>
            <Icon name="bot" />
          </span>
          <div
            className={
              playing ? "aibubble aifloat is-playing" : "aibubble aifloat"
            }
          >
            <i className="aftail" aria-hidden />
            {/* 빔은 상시 마운트 — 끝나면 언마운트로 뚝 끊기지 않고
                opacity로 잦아든다(CSS .aifloat:not(.is-playing) 참조) */}
            <span className="uk-border-beam" aria-hidden />

            <div className="afhd">
              <b>
                {playing
                  ? stage === "checking"
                    ? "질문을 확인하는 중"
                    : stage === "streaming"
                      ? "답변을 쓰는 중"
                      : "안전 재검사 중"
                  : stage === "posted"
                    ? "답변을 게시했어요"
                    : "AI 참고 답변"}
              </b>
              {stage === "posted" && !playing ? (
                <span className="afdone">
                  <Icon name="check" />
                </span>
              ) : null}

              <button
                type="button"
                className="afclose"
                aria-label="말풍선 닫기"
                onClick={() => setPanelOpen(false)}
              >
                <Icon name="x" />
              </button>
            </div>

            {blocked ? (
              /* 소진 오버레이 — 아래 내용은 블러로 눕고, 중앙이 말한다 */
              <div className="afblock" role="status">
                <b>오늘 체험 완료</b>
                <span>AI 생성 한도를 모두 사용했어요 — 내일 다시 열려요</span>
              </div>
            ) : null}

            <SmoothHeight>
            <div
              className={[
                "aflive",
                blocked ? "is-blur" : "",
                stage === "rescan" ? "is-scanning" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {stage === "checking" ? (
                <span className="afwait">질문과 리뷰 범위를 읽고 있어요…</span>
              ) : liveText !== null && liveParts === null ? (
                /* 실스트림 — 꼬리 토큰이 블러에서 선명해지며 붙는다 */
                <>
                  {liveText.slice(0, Math.max(0, liveText.length - 12))}
                  <i className="tk" key={liveText.length}>
                    {liveText.slice(Math.max(0, liveText.length - 12))}
                  </i>
                  {stage === "streaming" ? <span className="cur" /> : null}
                </>
              ) : stage === "idle" ? (
                <span className="afwait">
                  재생을 누르면 생성 과정이 여기 보여요
                </span>
              ) : (
                <Answer
                  parts={liveParts ?? parts}
                  guarded={guarded}
                  level={level}
                  typed={typed}
                  stage={stage}
                  fixed={fixed}
                  scanIdx={scanIdx}
                  fixIdx={fixIdx}
                  real={liveParts !== null}
                />
              )}
            </div>
            </SmoothHeight>

            {/* 실시간 작업 로그 — 한 줄 고정 높이(크기 불변), 문구만 교체 */}
            <div className="aisub" aria-live="polite">
              {playing && !blocked ? (
                <>
                  <i className="aisub-dot" />
                  <span key={subText} className="aisub-t">
                    {subText}
                  </span>
                </>
              ) : null}
            </div>

            {/* 파이프라인 — 아이콘 스텝. 라벨 막대 대신 아이콘 칩과
                채워지는 연결선으로 말한다 */}
            <div
              className={
                blocked
                  ? "aistep is-blur"
                  : playing
                    ? "aistep is-live"
                    : "aistep"
              }
            >
              <span className="airail" aria-hidden>
                <i
                  style={{
                    width: `${(Math.min(Math.max(step - 1, 0), 3) / 3) * 100}%`,
                  }}
                />
              </span>
              {[
                { n: 1, icon: "search", label: "질문 확인" },
                { n: 2, icon: "bot", label: "생성" },
                { n: 3, icon: "shield", label: "안전 재검사" },
                { n: 4, icon: "check", label: "게시" },
              ].map((node) => (
                <span
                  key={node.n}
                  className={`aistep-item${
                    stage === "posted" || step > node.n
                      ? " done"
                      : step === node.n
                        ? " on"
                        : ""
                  }`}
                >
                  <span className="ainode">
                    <Icon name={node.icon} />
                  </span>
                  <em>{node.label}</em>
                </span>
              ))}
            </div>

            {/* 컨트롤 — 전부 버튼형. 안전 강도도 여기(헤더에선 정렬이 떠 보였다) */}
            {!blocked ? (
              <div className="afctl">
                <button
                  type="button"
                  className="afgo"
                  disabled={playing}
                  onClick={() => void play()}
                >
                  <Icon name="play" filled />
                  {playing
                    ? "생성 중…"
                    : stage === "posted"
                      ? "다시 생성"
                      : "생성"}
                </button>
                <span className="afchip">
                  남은 생성 <b>{Math.max(0, quota)}</b>회
                </span>
              {/* 안전 강도 — 이 화면에서만 적용되는 데모 설정. 역할 게이트
                  없이 바로 바꿔본다(사용자 지시). 백오피스 정본은 안 건드린다. */}
              <span className="demo-control">
                <button
                  className="demotrigger"
                  type="button"
                  aria-expanded={settingsOpen}
                  onClick={() => setSettingsOpen((value) => !value)}
                >
                  <Icon name="gauge" />
                  안전 강도 <b>{SAFETY_LABEL[level]}</b>
                </button>
                {settingsOpen ? (
                  <div
                    className="demotip"
                    role="dialog"
                    aria-label="AI 안전 강도 설정"
                  >
                    <div className="tiphd">
                      <span className="demo">데모 전용</span>
                      <span className="tt">안전 강도 설정</span>
                      <button
                        className="tipclose"
                        type="button"
                        aria-label="안전 강도 설정 닫기"
                        onClick={() => setSettingsOpen(false)}
                      >
                        <Icon name="x" />
                      </button>
                    </div>
                    <div className="note">
                      원래는 <b>관리자 운영 화면</b> 설정이지만, 이 화면에서는
                      역할 없이 바로 바꿔볼 수 있어요. 바꾼 뒤{" "}
                      <b>다시 생성</b>을 누르면 재검사 결과가 달라져요.
                    </div>
                    <div className="dcseg">
                      {(["loose", "basic", "strict"] as const).map((key) => (
                        <button
                          type="button"
                          key={key}
                          className={level === key ? "on" : undefined}
                          onClick={() => setLevel(key)}
                        >
                          {SAFETY_LABEL[key]}
                        </button>
                      ))}
                    </div>
                    <div className="dcr">
                      현재 <b>{SAFETY_LABEL[level]}</b> · {SAFETY_DESC[level]}
                    </div>
                  </div>
                ) : null}
              </span>

            </div>
            ) : (
              /* 한도 소진 — 하단은 상담 요청 버튼 하나만(사용자 지시) */
              <div className="afctl is-blocked">
                <a className="afcta" href="/contact">
                  이런 AI 기능이 필요하시면 — 상담 요청
                  <Icon name="arrow" />
                </a>
              </div>
            )}
          </div>
        </div>
      ) : null}

    </>
  );
}

/** 게시 답변 렌더 — 단어가 순서대로 블러에서 맺히며 보라빛 → 잉크로
    정착한다(AI SaaS식 텍스트 스트림). 레이아웃은 처음부터 최종 크기 —
    페인트(투명도·블러·색)만 시차로 움직여 주변을 밀지 않는다. */
function PostedStream({
  parts,
  guarded,
  level,
}: {
  parts: string[];
  guarded: GuardedTerm[];
  level: SafetyLevel;
}) {
  let word = 0;
  const delayOf = () => {
    const delay = `${word * 42}ms`;
    word += 1;
    return delay;
  };
  return (
    <>
      {parts.map((part, index) => {
        const match = /^\{(\d)\}$/.exec(part);
        if (match) {
          return (
            <span
              className="guarded masked aiw"
              key={index}
              style={{ "--d": delayOf() } as React.CSSProperties}
            >
              {guarded[Number(match[1])][level]}
            </span>
          );
        }
        return part.split(/(\s+)/).map((chunk, chunkIndex) =>
          !chunk ? null : /^\s+$/.test(chunk) ? (
            <span key={`${index}-${chunkIndex}`}>{chunk}</span>
          ) : (
            <i
              className="aiw"
              key={`${index}-${chunkIndex}`}
              style={{ "--d": delayOf() } as React.CSSProperties}
            >
              {chunk}
            </i>
          ),
        );
      })}
    </>
  );
}

/** 초안 렌더 — 위험 표현만 단계에 따라 다르게 그린다(감지→취소선→치환) */
function Answer({
  parts,
  guarded,
  level,
  typed,
  stage,
  fixed,
  scanIdx = -1,
  fixIdx = -1,
  real = false,
}: {
  parts: string[];
  guarded: GuardedTerm[];
  level: SafetyLevel;
  typed: number;
  stage: Stage;
  fixed: boolean;
  /** 재검사 스캔이 지금 짚고 있는 위험 토큰 순번 */
  scanIdx?: number;
  /** 치환이 완료된 토큰 수(그 순번은 취소선 진행 중) */
  fixIdx?: number;
  /** 실생성 텍스트(스트림 완료 후) — 타이핑 카운터를 쓰지 않는다 */
  real?: boolean;
}) {
  let consumed = 0;
  let guardOrder = -1; // 등장 순서 — 스캔·치환이 이 순번을 하나씩 짚는다
  const streaming = !real && stage === "streaming";
  // 질문 확인 단계에서는 아직 아무것도 안 나왔다 — 전체 텍스트가 한 번
  // 번쩍 떴다가 타이핑이 다시 시작되던 플래시의 원인이 여기였다.
  const preStream = !real && stage === "checking";

  return (
    <>
      {parts.map((part, index) => {
        const match = /^\{(\d)\}$/.exec(part);
        const term = match ? guarded[Number(match[1])] : null;
        const text = term ? term.raw : part;
        const start = consumed;
        consumed += text.length;

        const visible = preStream
          ? 0
          : streaming
            ? Math.max(0, typed - start)
            : text.length;
        if (visible <= 0) return null;

        if (!term) {
          const shown = text.slice(0, visible);
          // 타이핑 전선(이 조각이 아직 다 안 나온 상태) — 꼬리 12자가
          // 블러에서 선명해지며 붙는다. AI 서비스식 스트리밍 질감.
          if (streaming && visible < text.length) {
            const cut = Math.max(0, shown.length - 12);
            return (
              <span key={index}>
                {shown.slice(0, cut)}
                <i className="tk" key={typed}>
                  {shown.slice(cut)}
                </i>
              </span>
            );
          }
          return <span key={index}>{shown}</span>;
        }

        guardOrder += 1;
        const order = guardOrder;

        // 최종 상태 — 전부 치환 완료
        if (fixed || stage === "posted") {
          return (
            <span className="guarded masked" key={index}>
              {term[level]}
            </span>
          );
        }
        if (stage === "fixing") {
          // 하나씩 바뀐다: 이미 지난 순번은 치환 완료, 지금 순번은 취소선
          if (order < fixIdx) {
            return (
              <span className="guarded masked" key={index}>
                {term[level]}
              </span>
            );
          }
          return (
            <span
              key={index}
              className={order === fixIdx ? "guarded striking" : "guarded flagged"}
            >
              {text.slice(0, visible)}
            </span>
          );
        }
        if (stage === "rescan") {
          // 스캔 커서가 토큰을 하나씩 짚는다 — 지나간 것은 표식만 남는다
          return (
            <span
              key={index}
              className={
                order === scanIdx
                  ? "guarded scan"
                  : order < scanIdx
                    ? "guarded flagged"
                    : "guarded"
              }
            >
              {text.slice(0, visible)}
            </span>
          );
        }
        return (
          <span className="guarded" key={index}>
            {text.slice(0, visible)}
          </span>
        );
      })}
      {streaming ? <span className="cur" /> : null}
    </>
  );
}
