"use client";

import { useEffect, useState } from "react";
import { LevelBadge } from "@/components/LevelBadge";
import { Icon } from "@/components/Icon";
import { SmoothHeight } from "@/components/ds/SmoothHeight";
import { useAdmin } from "@/lib/admin/useAdmin";
import type { Evidence } from "@/lib/admin/seed";
import { Sk } from "@/components/Skeleton";
import { ResultNote } from "./ResultNote";
import { SkRows, SkToolbar, ROW_H } from "./AdminSkeleton";
import {
  ColumnResizeProvider,
  GridToolbar,
  SortHeader,
  useFlipRows,
  useSortChain,
} from "./grid";

/**
 * 증빙 검토 — 시안 정본 13번 `.reviewgrid`(큐 표 + 증빙 패널).
 *
 * 승인·반려는 중위험이라 재인증을 요구하지 않는다(신고·정지와 다른 지점). 대신 **반려 사유는
 * 신청자에게 그대로 보이므로** 비워두면 진행하지 않는다 — 마이페이지의 "반려되면 사유가
 * 여기에 표시돼요" 자리로 이어지는 값이다.
 *
 * 승인하면 회원 관리의 등급·이력도 함께 올라간다(run.ts evidence.approve).
 */

const SORT_LABELS: Record<string, string> = {
  applied: "신청일",
  nick: "닉네임",
  change: "등급 변경",
  files: "증빙",
};

const SORT_GETTERS: Record<string, (row: Evidence) => unknown> = {
  applied: (row) => row.applied,
  nick: (row) => row.nick,
  change: (row) => row.change,
  files: (row) => row.files,
};

type EvidenceTab = "대기" | "승인" | "반려";

export function EvidenceReview() {
  const [query, setQuery] = useState("");
  const admin = useAdmin();
  const [selected, setSelected] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [tab, setTab] = useState<EvidenceTab>("대기");
  const [initialised, setInitialised] = useState(false);

  const sort = useSortChain<Evidence>(SORT_GETTERS);

  const all = admin.state?.evidence ?? [];
  const needle = query.trim().toLowerCase();
  const rows = sort.sortRows(
    all.filter(
      (row) =>
        row.status === tab &&
        (!needle || `${row.nick} ${row.change}`.toLowerCase().includes(needle)),
    ),
  );
  const registerRow = useFlipRows(rows);
  const current = all.find((row) => row.id === selected) ?? null;
  const count = (status: string) =>
    all.filter((row) => row.status === status).length;

  // 오버레이가 처음 도착했을 때 대기 큐의 첫 신청을 선택해 둔다
  useEffect(() => {
    if (!admin.state || initialised) return;
    setInitialised(true);
    setSelected(
      admin.state.evidence.find((row) => row.status === "대기")?.id ?? null,
    );
  }, [admin.state, initialised]);

  /** 탭 전환 — 선택도 그 탭의 첫 행으로 옮긴다. 옆 패널이 다른 탭의 신청을 계속 보여주면 안 된다 */
  function switchTab(next: EvidenceTab) {
    setTab(next);
    setSelected(all.find((row) => row.status === next)?.id ?? null);
    admin.setResult(null);
  }

  async function act(tool: "evidence.approve" | "evidence.reject") {
    if (!current) return;
    if (tool === "evidence.reject" && !reason.trim()) {
      admin.setResult({
        ok: false,
        code: "REASON_REQUIRED",
        message: "반려 사유를 적어주세요. 신청 회원에게 그대로 보여요.",
      });
      return;
    }
    const res = await admin.act(tool, current.id, {
      reason: tool === "evidence.reject" ? reason.trim() : "증빙 확인 완료",
    });
    if (res.ok) setReason("");
  }

  return (
    <>
      <ResultNote
        result={admin.result}
        where="처리 기록과 신청 회원의 마이페이지"
      />

      <div className="reviewgrid">
        <div className="tablecard">
          <div className="tabletop">
            <h4>검토 큐</h4>
            <div
              className="search"
              style={{ maxWidth: 220, flex: "none", marginLeft: "auto" }}
            >
              <Icon name="search" />
              <input
                value={query}
                placeholder="신청자·변경 검색"
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            <div className="seg" style={{ marginLeft: 0 }}>
              {(["대기", "승인", "반려"] as const).map((key) => (
                <button
                  key={key}
                  className={tab === key ? "on" : undefined}
                  onClick={() => switchTab(key)}
                >
                  {key} {count(key) || ""}
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
          <SmoothHeight>
            <ColumnResizeProvider storageKey="admin-evidence">
              <table className="dtable">
                <thead>
                  <tr>
                    {(
                      [
                        ["applied", "신청일"],
                        ["nick", "닉네임"],
                        ["change", "등급 변경"],
                        ["files", "증빙"],
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
                    <th>상태</th>
                  </tr>
                </thead>
                <tbody>
                  {/* 마지막 행은 구분선이 없어 1px 낮다 — badges loading.tsx와 동일 */}
                  {!admin.state ? (
                    <SkRows
                      cols={5}
                      rows={3}
                      rowHs={[ROW_H.evidence, ROW_H.evidence, 45.2]}
                    />
                  ) : null}
                  {rows.map((row) => (
                    <tr
                      key={row.id}
                      ref={(el) => registerRow(row.id, el)}
                      onClick={() => {
                        setSelected(row.id);
                        admin.setResult(null);
                      }}
                      style={{
                        cursor: "pointer",
                        background:
                          row.id === selected
                            ? "var(--accent-soft)"
                            : undefined,
                      }}
                    >
                      <td>{row.applied}</td>
                      <td>
                        <b>{row.nick}</b>
                      </td>
                      <td>
                        <GradeChange change={row.change} />
                      </td>
                      <td>이미지 {row.files}장</td>
                      <td>
                        <span
                          className={
                            row.status === "승인"
                              ? "bs ok"
                              : row.status === "반려"
                                ? "bs no"
                                : "bs wait"
                          }
                        >
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {admin.state && rows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        style={{ padding: "30px 0", textAlign: "center" }}
                      >
                        <div style={{ fontWeight: 700, marginBottom: 4 }}>
                          {tab === "대기"
                            ? "검토할 신청이 없어요"
                            : `${tab}한 신청이 아직 없어요`}
                        </div>
                        <div style={{ fontSize: 12.5, color: "var(--ink-3)" }}>
                          {tab === "대기"
                            ? "새 신청이 들어오면 여기에 쌓여요"
                            : "대기 탭에서 검토하면 여기로 옮겨져요"}
                        </div>
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </ColumnResizeProvider>
          </SmoothHeight>
        </div>

        <div className="card">
          {!admin.state ? (
            /* 스켈레톤 — 선택된 신청 패널과 같은 구성(제목·증빙 이미지·정보·사유·버튼) */
            <div aria-hidden>
              <h4 style={{ display: "flex", alignItems: "center" }}>
                <Sk w={160} h={16} />
              </h4>
              <div
                style={{
                  height: 168,
                  borderRadius: 10,
                  margin: "12px 0",
                  overflow: "hidden",
                }}
              >
                <Sk w="100%" h={168} r={10} />
              </div>
              <div className="evinfo">
                {[0, 1, 2].map((index) => (
                  <div className="row" key={index}>
                    <span className="k">
                      <Sk w={52} h={12} />
                    </span>
                    <span className="v">
                      <Sk w={index === 0 ? 120 : 80} h={12} />
                    </span>
                  </div>
                ))}
              </div>
              <div className="field" style={{ marginTop: 14 }}>
                <label>
                  <Sk w={180} h={12} />
                </label>
                <textarea className="in" disabled />
              </div>
              <div className="evacts" style={{ display: "flex", gap: 10 }}>
                <button
                  className="btn line"
                  style={{ flex: 1, justifyContent: "center" }}
                  disabled
                >
                  반려
                </button>
                <button
                  className="btn primary"
                  style={{ flex: 1, justifyContent: "center" }}
                  disabled
                >
                  <Icon name="check" /> 승인
                </button>
              </div>
            </div>
          ) : current ? (
            <>
              <h4>증빙 검토: {current.nick}</h4>
              <div
                style={{
                  height: 168,
                  borderRadius: 10,
                  // 증빙 이미지 자리 — 정본 토큰으로(#eef0fe=--accent-soft, #e7e9ee=--line)
                  background:
                    "linear-gradient(135deg,var(--accent-soft),var(--line))",
                  display: "grid",
                  placeItems: "center",
                  color: "var(--ink-4)",
                  margin: "12px 0",
                }}
              >
                <Icon name="image" style={{ width: 26, height: 26 }} />
              </div>

              <div className="evinfo">
                <div className="row">
                  <span className="k">등급 변경</span>
                  <span className="v">
                    <GradeChange change={current.change} />
                  </span>
                </div>
                <div className="row">
                  <span className="k">제출 증빙</span>
                  <span className="v">이미지 {current.files}장</span>
                </div>
                <div className="row">
                  <span className="k">상태</span>
                  <span className="v">{current.status}</span>
                </div>
                {current.reason ? (
                  <div className="row">
                    <span className="k">반려 사유</span>
                    <span className="v">{current.reason}</span>
                  </div>
                ) : null}
              </div>

              <div className="field" style={{ marginTop: 14 }}>
                <label>
                  반려 사유{" "}
                  <span style={{ fontWeight: 400, color: "var(--ink-4)" }}>
                    (신청 회원에게 그대로 보여요)
                  </span>
                </label>
                <textarea
                  className="in"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="예: 제출한 이미지에서 회사명이 확인되지 않아요."
                />
              </div>

              <div className="evacts" style={{ display: "flex", gap: 10 }}>
                <button
                  className="btn line"
                  style={{ flex: 1, justifyContent: "center" }}
                  disabled={admin.busy || current.status !== "대기"}
                  onClick={() => act("evidence.reject")}
                >
                  반려
                </button>
                <button
                  className="btn primary"
                  style={{ flex: 1, justifyContent: "center" }}
                  disabled={admin.busy || current.status !== "대기"}
                  onClick={() => act("evidence.approve")}
                >
                  <Icon name="check" /> 승인
                </button>
              </div>
            </>
          ) : (
            <p style={{ color: "var(--ink-4)", fontSize: 13 }}>
              왼쪽 큐에서 신청을 선택하세요.
            </p>
          )}
        </div>
      </div>
    </>
  );
}

/** "Lv.3 리뷰어 → Lv.4 필드리더" 문자열을 배지 쌍으로 — 승급이 눈으로 읽힌다 */
function GradeChange({ change }: { change: string }) {
  const parts = change.split("→").map((part) => part.trim());
  if (parts.length !== 2) return <>{change}</>;
  return (
    <span className="gradechange">
      <LevelBadge grade={parts[0]} />
      <Icon name="arrow" />
      <LevelBadge grade={parts[1]} />
    </span>
  );
}
