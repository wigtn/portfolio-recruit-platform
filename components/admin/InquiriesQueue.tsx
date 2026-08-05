"use client";

import { useEffect, useRef, useState } from "react";
import { useAdmin } from "@/lib/admin/useAdmin";
import type { InquiryRow } from "@/lib/admin/seed";
import { Icon } from "@/components/Icon";
import { Sk } from "@/components/Skeleton";
import { toast } from "@/components/ds/Toaster";
import { INQUIRY_ROW_HS } from "@/app/admin/inquiries/loading";
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
 * 1:1 문의 큐 — 사용자 /contact 접수가 이 화면으로 들어온다.
 *
 * 질문 관리(QuestionsQueue)와 같은 문법이다: 왼쪽 큐에서 고르고, 오른쪽에서
 * 원문을 읽고, 그 자리에서 답한다(run.ts inquiry.answer — 감사 기록에 남는다).
 * 답변은 문의자의 알림 벨과 /contact 내 문의 내역으로 즉시 돌아간다 —
 * 신고·증빙과 같은 왕복이 이 화면의 요점이다.
 *
 * 답변은 저위험이다: append고 데모 초기화로 되돌아간다. 대신 문의자에게
 * 그대로 보이는 글이라 빈 답변은 화면에서 막는다.
 *
 * 실서비스 모듈로 뗄 때 슬랙·메일 발송은 답변 등록 지점(run.ts)에 붙는다 —
 * 이 화면은 저장소가 어디든 그대로 재사용된다.
 */

const SORT_LABELS: Record<string, string> = {
  category: "분류",
  message: "문의",
  by: "문의자",
  at: "접수",
};

const SORT_GETTERS: Record<string, (row: InquiryRow) => unknown> = {
  category: (row) => row.category,
  message: (row) => row.message,
  by: (row) => row.by,
  at: (row) => row.at,
};

type InquiryTab = "대기" | "답변완료";

/** ISO 시각 → 처리 기록과 같은 "MM.DD HH:mm" 표기 */
function fmtAt(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(date.getMonth() + 1)}.${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function InquiriesQueue() {
  const admin = useAdmin();
  const [selected, setSelected] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [tab, setTab] = useState<InquiryTab>("대기");
  const [initialised, setInitialised] = useState(false);
  const textRef = useRef<HTMLTextAreaElement>(null);

  const sort = useSortChain<InquiryRow>(SORT_GETTERS);

  const all = admin.state?.inquiries ?? [];
  const open = all.filter((row) => row.status === "대기");
  const done = all.filter((row) => row.status === "답변완료");
  const rows = sort.sortRows(tab === "대기" ? open : done);
  const registerRow = useFlipRows(rows);
  const current = all.find((row) => row.id === selected) ?? null;

  // 오버레이가 처음 도착했을 때 대기 큐의 첫 문의(가장 최근 접수)를 선택해 둔다
  useEffect(() => {
    if (!admin.state || initialised) return;
    setInitialised(true);
    setSelected(
      admin.state.inquiries.find((row) => row.status === "대기")?.id ?? null,
    );
  }, [admin.state, initialised]);

  /** 탭 전환 — 선택·작성 중 입력도 그 탭 기준으로 옮긴다 */
  function switchTab(next: InquiryTab) {
    setTab(next);
    setSelected((next === "대기" ? open : done)[0]?.id ?? null);
    setText("");
    admin.setResult(null);
  }

  async function submit() {
    if (!current) return;
    const value = text.trim();
    if (!value) {
      toast("답변 내용을 입력해주세요, 문의자에게 그대로 보여요", {
        tone: "warn",
      });
      textRef.current?.focus();
      return;
    }
    const res = await admin.act("inquiry.answer", current.id, {
      reason: "1:1 문의 답변",
      payload: { text: value },
    });
    if (res.ok) setText("");
  }

  return (
    <>
      {/* 성공·게이트 거절 모두 ResultNote가 토스트로 낸다 — 본문 높이를 흔들지 않는다 */}
      <ResultNote
        result={admin.result}
        where="문의자의 알림 벨과 1:1 문의 내역"
      />

      <div className="reviewgrid">
        <div className="tablecard">
          <div className="tabletop">
            <h4>문의 큐</h4>
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
              total={all.length}
              filtered={rows.length}
              chain={sort.chain}
              labels={SORT_LABELS}
              onReset={sort.reset}
            />
          ) : (
            <SkToolbar />
          )}
          <ColumnResizeProvider storageKey="admin-inquiries">
            <table className="dtable">
              <thead>
                <tr>
                  {(
                    [
                      ["category", "분류"],
                      ["message", "문의"],
                      ["by", "문의자"],
                      ["at", "접수"],
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
                  <SkRows cols={4} rows={3} rowHs={INQUIRY_ROW_HS} />
                ) : null}
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    ref={(el) => registerRow(row.id, el)}
                    onClick={() => {
                      setSelected(row.id);
                      setText("");
                      admin.setResult(null);
                    }}
                    style={{
                      cursor: "pointer",
                      background:
                        row.id === selected ? "var(--accent-soft)" : undefined,
                    }}
                  >
                    <td>
                      <span className="bs neu">{row.category}</span>
                    </td>
                    <td className="prev">
                      <b>{row.message}</b>
                    </td>
                    <td>{row.by}</td>
                    <td>{row.at}</td>
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
                          ? "답변을 기다리는 문의가 없어요"
                          : "아직 답변한 문의가 없어요"}
                      </div>
                      <div style={{ fontSize: 12.5, color: "var(--ink-3)" }}>
                        {tab === "대기"
                          ? "사용자가 1:1 문의를 접수하면 여기에 쌓여요"
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
            /* 스켈레톤 — 문의 패널과 같은 구성(제목·정보 3행·원문·답변 폼·버튼) */
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
              <h4>{current.category} 문의</h4>
              <div className="evinfo">
                <div className="row">
                  <span className="k">문의자</span>
                  <span className="v">{current.by}</span>
                </div>
                <div className="row">
                  <span className="k">접수</span>
                  <span className="v">{current.at}</span>
                </div>
                <div className="row">
                  <span className="k">상태</span>
                  <span className="v">{current.status}</span>
                </div>
              </div>

              {/* 문의 원문 — 판단 근거라 화면을 떠나지 않고 읽는다 */}
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
                {current.message.split("\n").map((paragraph, index) => (
                  <p key={`${index}-${paragraph}`} style={{ margin: "0 0 8px" }}>
                    {paragraph}
                  </p>
                ))}
              </div>

              {current.status === "답변완료" && current.answer ? (
                <div className="field" style={{ marginTop: 14 }}>
                  <label>
                    등록한 답변{" "}
                    <span style={{ fontWeight: 400, color: "var(--ink-4)" }}>
                      {current.answeredAt
                        ? `(${fmtAt(current.answeredAt)})`
                        : null}
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
                    {current.answer}
                  </div>
                </div>
              ) : (
                <>
                  <div className="field" style={{ marginTop: 14 }}>
                    <label>
                      운영자 답변{" "}
                      <span style={{ fontWeight: 400, color: "var(--ink-4)" }}>
                        (등록 즉시 문의자 알림으로 돌아가요)
                      </span>
                    </label>
                    <textarea
                      ref={textRef}
                      className="in"
                      value={text}
                      onChange={(event) => setText(event.target.value)}
                      placeholder="문의에 대한 답변을 적어주세요."
                    />
                  </div>
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
              왼쪽 큐에서 문의를 선택하세요.
            </p>
          )}
        </div>
      </div>
    </>
  );
}
