"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useAdmin } from "@/lib/admin/useAdmin";
import {
  QUESTION_SEED,
  openQuestions,
  type QuestionRow,
} from "@/lib/admin/seed";
import type { Post } from "@/lib/seed/posts";
import { Icon } from "@/components/Icon";
import { Sk } from "@/components/Skeleton";
import { toast } from "@/components/ds/Toaster";
import { QUESTION_ROW_HS } from "@/app/admin/questions/loading";
import { ResultNote } from "./ResultNote";
import { SkRows, SkToolbar } from "./AdminSkeleton";
import {
  ColumnResizeProvider,
  GridToolbar,
  SortHeader,
  useFlipRows,
  useSortChain,
} from "./grid";

/**
 * 답변 없는 질문 큐 — 대시보드의 "답변 없는 질문"이 백오피스 밖(커뮤니티 목록)으로
 * 내보내던 것을 안에서 끝내는 화면이다. 질문 원문을 보고, 그 자리에서 운영자
 * 답변을 등록한다(run.ts question.answer — 감사 기록에 남는다).
 *
 * 등록하면 사용자 글 상세(PostAnswers)가 오버레이 answers를 병합해 "운영자"
 * 배지로 즉시 보여준다 — 목업이 아니라 왕복이 실제로 돈다는 게 이 화면의 요점.
 *
 * 답변은 저위험이다: 시드를 바꾸지 않는 append고 데모 초기화로 되돌아간다.
 * 대신 사용자에게 그대로 보이는 글이라 빈 답변은 화면에서 막는다.
 */

const SORT_LABELS: Record<string, string> = {
  title: "제목",
  board: "게시판",
  age: "경과",
  views: "조회수",
};

const SORT_GETTERS: Record<string, (row: QuestionRow) => unknown> = {
  title: (row) => row.title,
  board: (row) => row.board,
  age: (row) => row.ageMinutes,
  views: (row) => row.views,
};

type QuestionTab = "대기" | "답변완료";

/**
 * AI 초안을 답변 폼에 채울 문장으로 푼다 — {0} 자리는 안전강도 "기본"의
 * 치환값으로 메운다(실명 노출 없이). 굵게 표식(**)은 입력창에선 문자 그대로
 * 보여 오타처럼 읽히므로 걷어낸다.
 */
function draftFill(post: Post) {
  return post.aiDraft
    .replace(
      /\{(\d+)\}/g,
      (_, index) => post.guarded[Number(index)]?.basic ?? "",
    )
    .replace(/\*\*/g, "");
}

/** ISO 시각 → 처리 기록과 같은 "MM.DD HH:mm" 표기 */
function fmtAt(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(date.getMonth() + 1)}.${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function QuestionsQueue() {
  const admin = useAdmin();
  const [selected, setSelected] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [tab, setTab] = useState<QuestionTab>("대기");
  const [initialised, setInitialised] = useState(false);
  const textRef = useRef<HTMLTextAreaElement>(null);

  const sort = useSortChain<QuestionRow>(SORT_GETTERS);

  const answers = admin.state?.answers ?? [];
  const open = openQuestions(answers);
  const done = QUESTION_SEED.filter((row) =>
    answers.some((answer) => answer.postId === row.postId),
  );
  const rows = sort.sortRows(tab === "대기" ? open : done);
  const registerRow = useFlipRows(rows);
  const current = QUESTION_SEED.find((row) => row.postId === selected) ?? null;
  // 같은 글에 답이 여럿일 일은 UI가 막지만, 있다면 마지막 것이 최신이다
  const currentAnswer =
    answers.filter((answer) => answer.postId === selected).at(-1) ?? null;

  // 오버레이가 처음 도착했을 때 대기 큐의 첫 질문(가장 오래 방치된 것)을 선택해 둔다
  useEffect(() => {
    if (!admin.state || initialised) return;
    setInitialised(true);
    setSelected(openQuestions(admin.state.answers)[0]?.postId ?? null);
  }, [admin.state, initialised]);

  /** 탭 전환 — 선택·작성 중 입력도 그 탭 기준으로 옮긴다 */
  function switchTab(next: QuestionTab) {
    setTab(next);
    setSelected((next === "대기" ? open : done)[0]?.postId ?? null);
    setText("");
    admin.setResult(null);
  }

  async function submit() {
    if (!current) return;
    const value = text.trim();
    if (!value) {
      // 순간 안내는 배너가 아니라 토스트로 — 본문 높이를 흔들지 않는다
      toast("답변 내용을 입력해주세요, 사용자에게 그대로 보여요", {
        tone: "error",
      });
      textRef.current?.focus();
      return;
    }
    const res = await admin.act("question.answer", current.postId, {
      reason: "답변 없는 질문 처리",
      payload: { text: value },
    });
    if (res.ok) setText("");
  }

  return (
    <>
      {/* 성공·게이트 거절 모두 ResultNote가 토스트로 낸다 — 본문 높이를 흔들지 않는다 */}
      <ResultNote
        result={admin.result}
        where="처리 기록과 사용자 글 상세의 답변 목록"
      />

      <div className="reviewgrid">
        <div className="tablecard">
          <div className="tabletop">
            <h4>질문 큐</h4>
            <div className="seg">
              {(["대기", "답변완료"] as const).map((key) => (
                <button
                  key={key}
                  className={tab === key ? "on" : undefined}
                  onClick={() => switchTab(key)}
                >
                  {key} {(key === "대기" ? open : done).length || ""}
                </button>
              ))}
            </div>
          </div>
          {admin.state ? (
            <GridToolbar
              total={QUESTION_SEED.length}
              filtered={rows.length}
              chain={sort.chain}
              labels={SORT_LABELS}
              onReset={sort.reset}
            />
          ) : (
            <SkToolbar />
          )}
          <ColumnResizeProvider storageKey="admin-questions">
            <table className="dtable">
              <thead>
                <tr>
                  {(
                    [
                      ["title", "제목"],
                      ["board", "게시판"],
                      ["age", "경과"],
                      ["views", "조회수"],
                    ] as const
                  ).map(([key, label]) => (
                    <SortHeader
                      key={key}
                      label={label}
                      sortKey={key}
                      sort={sort.sortOf(key)}
                      onSort={sort.onSort}
                      order={
                        sort.chain.length > 1
                          ? sort.chain.findIndex((e) => e.key === key) + 1 ||
                            undefined
                          : undefined
                      }
                    />
                  ))}
                </tr>
              </thead>
              <tbody>
                {!admin.state ? (
                  <SkRows cols={4} rows={5} rowHs={QUESTION_ROW_HS} />
                ) : null}
                {rows.map((row) => (
                  <tr
                    key={row.postId}
                    ref={(el) => registerRow(row.postId, el)}
                    onClick={() => {
                      setSelected(row.postId);
                      setText("");
                      admin.setResult(null);
                    }}
                    style={{
                      cursor: "pointer",
                      background:
                        row.postId === selected
                          ? "var(--accent-soft)"
                          : undefined,
                    }}
                  >
                    <td>
                      <b>{row.title}</b>
                    </td>
                    <td>{row.board}</td>
                    <td>{row.at}</td>
                    <td>{row.views}</td>
                  </tr>
                ))}
                {admin.state && rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      style={{ padding: "30px 0", textAlign: "center" }}
                    >
                      <div style={{ fontWeight: 700, marginBottom: 4 }}>
                        {tab === "대기"
                          ? "답변을 기다리는 질문이 없어요"
                          : "아직 등록한 답변이 없어요"}
                      </div>
                      <div style={{ fontSize: 12.5, color: "var(--ink-3)" }}>
                        {tab === "대기"
                          ? "커뮤니티에 새 질문이 올라오면 여기에 쌓여요"
                          : "대기 탭에서 답변하면 여기로 옮겨져요"}
                      </div>
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </ColumnResizeProvider>
        </div>

        <div className="card">
          {!admin.state ? (
            /* 스켈레톤 — 질문 패널과 같은 구성(제목·정보 3행·본문 미리보기·답변 폼·버튼).
               줄 높이는 loading.tsx 미러와 같은 실측값(1440px)이다 */
            <div aria-hidden>
              <h4
                style={{
                  display: "flex",
                  alignItems: "center",
                  minHeight: 20.8,
                }}
              >
                <Sk w={200} h={15} />
              </h4>
              <div className="evinfo">
                {[0, 1, 2].map((index) => (
                  <div
                    className="row"
                    key={index}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      minHeight: index < 2 ? 37 : 36,
                    }}
                  >
                    <Sk w={52} h={12} />
                    <Sk
                      w={index === 0 ? 64 : 48}
                      h={12}
                      style={{ marginLeft: "auto" }}
                    />
                  </div>
                ))}
              </div>
              <div style={{ margin: "12px 0" }}>
                <Sk w="100%" h={132} r={10} />
              </div>
              <div className="field" style={{ marginTop: 14 }}>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    minHeight: 20.8,
                  }}
                >
                  <Sk w={180} h={12} />
                </label>
                <textarea className="in" disabled />
              </div>
              <div className="evacts" style={{ display: "flex", gap: 10 }}>
                <button
                  className="btn primary"
                  style={{ flex: 1, justifyContent: "center" }}
                  disabled
                >
                  <Icon name="check" /> 답변 등록
                </button>
              </div>
            </div>
          ) : current ? (
            <>
              <h4>{current.title}</h4>
              <div className="evinfo">
                <div className="row">
                  <span className="k">게시판</span>
                  <span className="v">{current.board}</span>
                </div>
                <div className="row">
                  <span className="k">경과</span>
                  <span className="v">{current.at}</span>
                </div>
                <div className="row">
                  <span className="k">조회수</span>
                  <span className="v">{current.views}</span>
                </div>
              </div>

              {/* 본문 미리보기 — 판단 근거라 화면을 떠나지 않고 읽는다 */}
              <div
                style={{
                  margin: "12px 0",
                  padding: "12px 14px",
                  borderRadius: 10,
                  background: "var(--bg)",
                  fontSize: 13,
                  color: "var(--ink-2)",
                  lineHeight: 1.6,
                  maxHeight: 132,
                  overflowY: "auto",
                }}
              >
                {current.post.body.split("\n\n").map((paragraph) => (
                  <p key={paragraph} style={{ margin: "0 0 8px" }}>
                    {paragraph}
                  </p>
                ))}
              </div>

              {currentAnswer ? (
                <>
                  <div className="field" style={{ marginTop: 14 }}>
                    <label>
                      등록한 답변{" "}
                      <span style={{ fontWeight: 400, color: "var(--ink-4)" }}>
                        ({fmtAt(currentAnswer.at)}, {currentAnswer.actor})
                      </span>
                    </label>
                    <div
                      style={{
                        padding: "12px 14px",
                        borderRadius: 10,
                        border: "1px solid var(--line)",
                        fontSize: 13,
                        color: "var(--ink-2)",
                        lineHeight: 1.6,
                      }}
                    >
                      {currentAnswer.text}
                    </div>
                  </div>
                  <div className="evacts" style={{ display: "flex", gap: 10 }}>
                    <Link
                      className="btn line"
                      style={{ flex: 1, justifyContent: "center" }}
                      href={`/community/${current.postId}`}
                    >
                      사용자 글 상세에서 보기
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <div className="field" style={{ marginTop: 14 }}>
                    <label>
                      운영자 답변{" "}
                      <span style={{ fontWeight: 400, color: "var(--ink-4)" }}>
                        (등록 즉시 글 상세에 운영자 배지로 보여요)
                      </span>
                    </label>
                    <textarea
                      ref={textRef}
                      className="in"
                      value={text}
                      onChange={(event) => setText(event.target.value)}
                      placeholder="질문에 대한 답변을 적어주세요."
                    />
                  </div>
                  {/* AI 채우기 버튼은 뺐다 — AI 참고 답변은 사용자 화면에서
                      자동으로 붙는 장치라, 운영자가 손으로 복제할 일이 아니다.
                      여기는 사람의 답만 다룬다. */}
                  <div className="evacts" style={{ display: "flex", gap: 10 }}>
                    <button
                      className="btn primary"
                      style={{ flex: 1, justifyContent: "center" }}
                      disabled={admin.busy}
                      onClick={submit}
                    >
                      <Icon name="check" /> 답변 등록
                    </button>
                  </div>
                </>
              )}
            </>
          ) : (
            <p style={{ color: "var(--ink-4)", fontSize: 13 }}>
              왼쪽 큐에서 질문을 선택하세요.
            </p>
          )}
        </div>
      </div>
    </>
  );
}
