"use client";

import { Fragment, useState } from "react";
import { GUARD_LABEL } from "@/lib/admin/run";
import type { GuardKey } from "@/lib/admin/overlay";
import { useAdmin } from "@/lib/admin/useAdmin";
import {
  AI_LOG,
  AI_METRICS,
  SAFETY_EXAMPLE,
  type AiLogRow,
  type AiSegment,
} from "@/lib/admin/ai-log";
import { SAFETY_DESC, SAFETY_LABEL, type SafetyLevel } from "@/lib/seed/posts";
import { Icon } from "@/components/Icon";
import { Sk } from "@/components/Skeleton";
import { ResultNote } from "./ResultNote";
import { StepUpModal } from "./StepUpModal";
import {
  ColumnResizeProvider,
  GridToolbar,
  SortHeader,
  useSortChain,
} from "./grid";

/**
 * AI 운영 — 실제로 동작한다.
 *
 * 체험 호출 한도는 여기 없다 — 그건 데모(WIGTN)가 방문자에게 거는 제한이지
 * 데모 속 서비스의 운영 설정이 아니다. 값은 오버레이 기본(3회)이 그대로 쓰인다.
 *
 * 안전 강도는 이름(느슨/기본/엄격)만으로는 아무것도 설명하지 못한다 —
 * 같은 문장이 강도별로 어떻게 나가는지 3단 예시로 보여준다(사용자 지시).
 * 처리 내역도 결과만 보여주면 규칙의 의도가 안 읽힌다 — 초안 원문과
 * 적용 후를 나란히 놓는 비교 뷰다.
 */

const GUARD_ROWS: Array<{ key: GuardKey; icon: string; desc: string }> = [
  {
    key: "rule",
    icon: "shield",
    desc: "회사명 사전 · 수치 패턴 · 연락처 (토큰 0)",
  },
  { key: "moderation", icon: "bot", desc: "맥락상 비방·민감 표현 판단" },
  { key: "human", icon: "users", desc: "보류된 답변은 운영자가 최종 판단" },
];

const LEVELS: SafetyLevel[] = ["loose", "basic", "strict"];

/* 처리 내역 그리드 — 정렬 값은 화면 글자가 아니라 정렬돼야 하는 값 */
const SORT_LABELS: Record<string, string> = {
  at: "시각",
  question: "대상 질문",
  status: "AI 처리",
  rules: "적용된 안전 규칙",
};
const SORT_GETTERS: Record<string, (row: AiLogRow) => unknown> = {
  at: (row) => row.at,
  question: (row) => row.question,
  status: (row) => (row.held ? 1 : 0),
  rules: (row) => row.rules ?? "",
};

export function AiOps() {
  const admin = useAdmin();
  const [open, setOpen] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const sort = useSortChain<AiLogRow>(SORT_GETTERS);

  async function act(tool: string, id: string) {
    await admin.act(tool, id, {
      reason:
        tool === "ai.guard.off"
          ? "운영자 판단: 안전 장치 해제"
          : "AI 설정 변경",
    });
  }

  const busy = admin.busy;
  const ai = admin.state?.ai;
  const offCount = ai
    ? GUARD_ROWS.filter((row) => !ai.guards[row.key]).length
    : 0;
  const needle = query.trim().toLowerCase();
  const rows = sort.sortRows(
    AI_LOG.filter(
      (row) =>
        !needle ||
        `${row.question} ${row.rules ?? ""}`.toLowerCase().includes(needle),
    ),
  );

  const onSort = (key: string, additive?: boolean) => {
    // 펼침 행은 형제 <tr>라 정렬 이동을 따라갈 수 없다 — 접고 정렬한다
    setOpen(null);
    sort.onSort(key, additive);
  };

  return (
    <>
      <ResultNote result={admin.result} />

      <div className="dashgrid ai-config-grid">
        <div className="tablecard">
          <div className="tabletop">
            <h4>AI 안전 강도</h4>
            <span className="tabletop-side">
              현재 <b>{ai ? SAFETY_LABEL[ai.safety] : <Sk w={28} h={12} />}</b>
            </span>
          </div>
          <div className="safety-body">
            {/* 세그 버튼은 뺐다 — 예시 행 자체가 선택기다. 이름(느슨/기본/엄격)으로
                고르게 하면 결국 결과를 몰라서 못 고른다. 결과를 보고 고른다. */}
            <div
              className="safety-preview"
              role="radiogroup"
              aria-label="안전 강도: 강도별 문구 예시에서 선택"
            >
              {LEVELS.map((level) => {
                const active = ai?.safety === level;
                return (
                  <button
                    key={level}
                    role="radio"
                    aria-checked={active}
                    className={active ? "sprow on" : "sprow"}
                    disabled={busy || !ai || active}
                    title={active ? undefined : `${SAFETY_LABEL[level]}로 변경`}
                    onClick={() => act("ai.safety", level)}
                  >
                    <span className="sprow-level">{SAFETY_LABEL[level]}</span>
                    <span className="sprow-text">
                      {SAFETY_EXAMPLE.template[0]}
                      <em className={level === "loose" ? "raw" : "safe"}>
                        {SAFETY_EXAMPLE.tokens[0][level]}
                      </em>
                      {SAFETY_EXAMPLE.template[1]}
                      <em className={level === "loose" ? "raw" : "safe"}>
                        {SAFETY_EXAMPLE.tokens[1][level]}
                      </em>
                      {SAFETY_EXAMPLE.template[2]}
                    </span>
                  </button>
                );
              })}
              <p className="safety-note">
                {ai ? SAFETY_DESC[ai.safety] : <Sk w={200} h={12} />}
                <br />글 상세의 AI 참고 답변에 적용되며, 데모에선 글 화면에서도 바꿔볼 수
                있어요.
              </p>
            </div>
          </div>
        </div>

        <div className="tablecard">
          <div className="tabletop">
            <h4>안전 장치 구성</h4>
            <span
              className="tabletop-side"
              style={{ color: offCount ? "var(--hot)" : undefined }}
            >
              {offCount ? `${offCount}개 꺼짐` : "3중 방어"}
            </span>
          </div>
          <div style={{ padding: "14px 16px" }}>
            {GUARD_ROWS.map((row) => {
              const on = ai?.guards[row.key] ?? true;
              return (
                <div
                  className="qrow"
                  style={{ cursor: "default" }}
                  key={row.key}
                >
                  <span
                    className={on ? "qi" : "qi warn"}
                    style={
                      row.key === "rule" && on
                        ? { background: "var(--bg)", color: "var(--ink-3)" }
                        : undefined
                    }
                  >
                    <Icon name={row.icon} />
                  </span>
                  <span className="qn">
                    {GUARD_LABEL[row.key]}
                    <span className="qsub">{row.desc}</span>
                  </span>
                  {/* 상태 뱃지처럼 생긴 버튼은 눌러도 되는지가 안 읽힌다 —
                      권한 화면과 같은 스위치(.ptog)로 통일한다 */}
                  <button
                    type="button"
                    role="switch"
                    aria-checked={on}
                    className={on ? "ptog on" : "ptog"}
                    disabled={busy || !ai}
                    title={
                      on ? "누르면 꺼요. 재인증이 필요해요" : "누르면 켜요"
                    }
                    onClick={() =>
                      act(on ? "ai.guard.off" : "ai.guard.on", row.key)
                    }
                  >
                    <span className="knob" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 누적 지표 — 오버레이는 AI 설정만 저장하고 호출 횟수는 기록하지 않아
          실측 파생이 불가하다. 시드 근거는 lib/admin/ai-log.ts AI_METRICS 주석. */}
      <div className="mrow admin-three-stats">
        <div className="mcard">
          <div className="mk">생성한 참고 답변</div>
          <div className="mv">{AI_METRICS.generated}</div>
        </div>
        <div className="mcard">
          <div className="mk">안전 규칙 적용</div>
          <div className="mv">{AI_METRICS.ruleApplied}</div>
        </div>
        <div className="mcard">
          <div className="mk">생성 보류</div>
          <div className="mv">
            {AI_METRICS.held} <small className="up">스팸·저신뢰</small>
          </div>
        </div>
      </div>

      <div className="tablecard">
        <div className="tabletop">
          <h4>AI 처리 내역</h4>
          <span className="tabletop-side" style={{ marginLeft: 0 }}>
            초안 원문과 적용 후를 비교해요
          </span>
          <div
            className="search"
            style={{ maxWidth: 220, flex: "none", marginLeft: "auto" }}
          >
            <Icon name="search" />
            <input
              value={query}
              placeholder="질문·규칙 검색"
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
        </div>
        <GridToolbar
          total={AI_LOG.length}
          filtered={rows.length}
          chain={sort.chain}
          labels={SORT_LABELS}
          onReset={() => {
            setOpen(null);
            sort.reset();
          }}
        />
        <ColumnResizeProvider storageKey="admin-ailog">
          <table className="dtable">
            <thead>
              <tr>
                {(
                  [
                    ["at", "시각"],
                    ["question", "대상 질문"],
                    ["status", "AI 처리"],
                    ["rules", "적용된 안전 규칙"],
                  ] as const
                ).map(([key, label]) => (
                  <SortHeader
                    key={key}
                    label={label}
                    sortKey={key}
                    sort={sort.sortOf(key)}
                    onSort={onSort}
                    order={
                      sort.chain.length > 1
                        ? sort.chain.findIndex((e) => e.key === key) + 1 ||
                          undefined
                        : undefined
                    }
                  />
                ))}
                <th style={{ width: 118 }}>비교</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <Fragment key={row.id}>
                  <tr>
                    <td>{row.at}</td>
                    <td className="prev">{row.question}</td>
                    <td>
                      <span className={row.held ? "bs no" : "bs ok"}>
                        {row.held ? "생성 보류" : "참고 답변 생성"}
                      </span>
                    </td>
                    <td>
                      {row.rules ?? (
                        <span style={{ color: "var(--ink-4)" }}>
                          규칙 적용 없음
                        </span>
                      )}
                      {row.note ? ` · ${row.note}` : null}
                    </td>
                    <td>
                      {row.answer ? (
                        <button
                          className="exprow-toggle"
                          onClick={() =>
                            setOpen(open === row.id ? null : row.id)
                          }
                        >
                          {open === row.id ? "접기" : "비교 보기"}
                          <Icon
                            name={open === row.id ? "up" : "down"}
                            style={{ width: 12, height: 12 }}
                          />
                        </button>
                      ) : (
                        <span style={{ color: "var(--ink-4)", fontSize: 12 }}>
                          출력 없음
                        </span>
                      )}
                    </td>
                  </tr>
                  {row.answer && open === row.id ? (
                    <tr>
                      <td className="exp" colSpan={5}>
                        <DiffView answer={row.answer} />
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              ))}
            </tbody>
          </table>
        </ColumnResizeProvider>
      </div>

      {admin.pending ? (
        <StepUpModal onCancel={admin.cancelPending} onVerified={admin.resume} />
      ) : null}
    </>
  );
}

/**
 * 초안 ↔ 적용 후 비교 — 왼쪽은 규칙이 없었다면 나갔을 원문(위험 표현이
 * 붉게 지워짐), 오른쪽은 실제로 나간 문장(치환이 인디고로). 무엇을 왜
 * 바꿨는지가 치환 태그로 붙는다.
 */
function DiffView({ answer }: { answer: AiSegment[] }) {
  const changed = answer.filter(
    (segment): segment is Exclude<AiSegment, string> =>
      typeof segment !== "string",
  );

  if (changed.length === 0) {
    return (
      <div className="ailog-diff">
        <div className="ailog-pane is-applied" style={{ gridColumn: "1 / -1" }}>
          <div className="ailog-pane-head">생성된 답변: 규칙 적용 없음</div>
          <p>{answer.join("")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ailog-diff">
      <div className="ailog-pane is-raw">
        <div className="ailog-pane-head">AI 초안 (규칙 적용 전)</div>
        <p>
          {answer.map((segment, index) =>
            typeof segment === "string" ? (
              segment
            ) : (
              <del key={index}>{segment.raw}</del>
            ),
          )}
        </p>
      </div>
      <div className="ailog-arrow" aria-hidden>
        <Icon name="arrow" />
      </div>
      <div className="ailog-pane is-applied">
        <div className="ailog-pane-head">실제 출력 (규칙 적용 후)</div>
        <p>
          {answer.map((segment, index) =>
            typeof segment === "string" ? (
              segment
            ) : (
              <ins key={index} title={segment.rule}>
                {segment.applied}
              </ins>
            ),
          )}
        </p>
      </div>
      <div className="ailog-legend">
        {changed.map((token, index) => (
          <span key={index}>
            <del>{token.raw}</del>
            <Icon name="arrow" />
            <ins>{token.applied}</ins>
            <small>{token.rule}</small>
          </span>
        ))}
      </div>
    </div>
  );
}
