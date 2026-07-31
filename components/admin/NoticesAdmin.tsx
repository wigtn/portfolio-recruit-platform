"use client";

import { useState } from "react";
import { SmoothHeight } from "@/components/ds/SmoothHeight";
import { useAdmin } from "@/lib/admin/useAdmin";
import type { Notice } from "@/lib/admin/seed";
import { Icon } from "@/components/Icon";
import { ResultNote } from "./ResultNote";
import { FormModal } from "./FormModal";
import { Overlay } from "./Overlay";
import { SkRows, SkToolbar } from "./AdminSkeleton";
import {
  ColumnResizeProvider,
  GridToolbar,
  SortHeader,
  useFlipRows,
  useSortChain,
} from "./grid";

/**
 * 공지 · 정책 — 탭·작성·수정·내리기·고정이 실제로 동작한다.
 * 내리기만 중위험이다 — 이용자가 보던 안내가 서비스 화면에서 즉시 사라진다.
 * 상단 고정 토글은 공지 탭에만 있다 — 사용자 공지 목록이 pinned로 정렬되므로
 * 내리기가 지운 고정을 되살릴 방법이 화면에 있어야 한다.
 */

const SORT_LABELS: Record<string, string> = {
  title: "제목",
  place: "노출 위치",
  date: "게시일",
  status: "상태",
};

const SORT_GETTERS: Record<string, (row: Notice) => unknown> = {
  title: (row) => row.title,
  place: (row) => row.place,
  date: (row) => row.date,
  status: (row) => row.status,
};

const KINDS: Array<{ key: Notice["kind"]; label: string; place: string }> = [
  { key: "notice", label: "공지사항", place: "공지사항" },
  { key: "faq", label: "자주 묻는 질문", place: "자주 묻는 질문" },
  { key: "terms", label: "약관, 정책", place: "푸터, 약관" },
];

const FIELDS = [
  {
    key: "title",
    label: "제목",
    required: true,
    placeholder: "예: 리뷰 운영정책 개정 안내",
  },
  {
    key: "body",
    label: "내용",
    required: true,
    textarea: true,
    placeholder: "이용자에게 보이는 문구를 적어주세요",
  },
];

type Editing = { mode: "create" } | { mode: "edit"; row: Notice };

export function NoticesAdmin() {
  const [query, setQuery] = useState("");
  const admin = useAdmin();
  const [kind, setKind] = useState<Notice["kind"]>("notice");
  const [editing, setEditing] = useState<Editing | null>(null);
  const [reading, setReading] = useState<Notice | null>(null);

  const sort = useSortChain<Notice>(SORT_GETTERS);

  const all = admin.state?.notices ?? [];
  const matched = all.filter((row) => row.kind === kind);
  const rows = sort.sortRows(matched);
  const registerRow = useFlipRows(rows);
  const current = KINDS.find((item) => item.key === kind)!;

  const live = (row: Notice) =>
    row.status === "노출중" || row.status === "시행중";

  return (
    <>
      <ResultNote result={admin.result} />

      <div className="tablecard">
        <div className="tabletop">
          <h4>문서 목록</h4>
          <div
            className="search"
            style={{ maxWidth: 220, flex: "none", marginLeft: "auto" }}
          >
            <Icon name="search" />
            <input
              value={query}
              placeholder="제목 검색"
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <div className="seg" style={{ marginLeft: 0 }}>
            {KINDS.map((item) => (
              <button
                key={item.key}
                className={kind === item.key ? "on" : undefined}
                onClick={() => setKind(item.key)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <button
            className="btn primary sm"
            style={{ flex: "none" }}
            onClick={() => setEditing({ mode: "create" })}
          >
            <Icon name="plus" /> 새로 작성
          </button>
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
          <ColumnResizeProvider storageKey="admin-notices">
            <table className="dtable">
              <thead>
                <tr>
                  {(
                    [
                      ["title", "제목"],
                      ["place", "노출 위치"],
                      ["date", "게시일"],
                      ["status", "상태"],
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
                  {/* 컬럼 폭은 스켈레톤 시점에 실측·고정된다(ColumnResize) —
                    수정·고정 해제·내리기 세 버튼(실측 179px + 셀 패딩 32px)이
                    들어갈 자리를 미리 잡아야 도착 후 버튼이 카드 밖으로 밀리지 않는다 */}
                  <th style={{ width: 212 }}>조치</th>
                </tr>
              </thead>
              <tbody>
                {/* 기본 탭(공지사항) 3행 — loading.tsx 미러와 같은 실측값 */}
                {!admin.state ? (
                  <SkRows cols={5} rows={3} rowHs={[52.2, 52.2, 51.2]} />
                ) : null}
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    ref={(el) => registerRow(row.id, el)}
                    style={{ cursor: "pointer" }}
                    onClick={() => setReading(row)}
                  >
                    <td>
                      <b>{row.title}</b>
                      {row.pinned ? (
                        <span className="bs neu" style={{ marginLeft: 7 }}>
                          고정
                        </span>
                      ) : null}
                    </td>
                    <td>{row.place}</td>
                    <td>{row.date}</td>
                    <td>
                      <span className={live(row) ? "bs ok" : "bs neu"}>
                        {row.status}
                      </span>
                    </td>
                    <td onClick={(event) => event.stopPropagation()}>
                      {/* 버튼 3개 행에서 글자가 세로로 꺾였다("내리기"→내/리/기) —
                        .tbtn에 nowrap 규칙이 없어서다. globals.css는 타 레인
                        소유라 버튼마다 nowrap을 박는다 — auto 테이블 레이아웃이
                        min-content만큼 조치 열을 넓혀 전 행이 한 줄로 선다 */}
                      <div className="tact">
                        <button
                          className="tbtn"
                          style={{ whiteSpace: "nowrap" }}
                          onClick={() => setEditing({ mode: "edit", row })}
                        >
                          수정
                        </button>
                        {/* 고정 토글 — 공지 탭 + 노출 중 문서만. 내림 문서를 고정해도 보이지 않는다 */}
                        {row.kind === "notice" && live(row) ? (
                          <button
                            className="tbtn"
                            disabled={admin.busy}
                            onClick={() =>
                              admin.act(
                                row.pinned ? "notice.unpin" : "notice.pin",
                                row.id,
                                {
                                  reason: row.pinned
                                    ? "상단 고정 해제"
                                    : "안내 우선 노출, 상단 고정",
                                },
                              )
                            }
                            style={{ whiteSpace: "nowrap" }}
                          >
                            {row.pinned ? "고정 해제" : "고정"}
                          </button>
                        ) : null}
                        {live(row) ? (
                          <button
                            className="tbtn no"
                            style={{ whiteSpace: "nowrap" }}
                            disabled={admin.busy}
                            onClick={() =>
                              admin.act("notice.unpublish", row.id, {
                                reason: "운영자 판단, 노출 중단",
                              })
                            }
                          >
                            내리기
                          </button>
                        ) : (
                          <button
                            className="tbtn ok"
                            style={{ whiteSpace: "nowrap" }}
                            disabled={admin.busy}
                            onClick={() =>
                              admin.act("notice.publish", row.id, {
                                reason: "재노출",
                              })
                            }
                          >
                            노출
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {admin.state && rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      style={{ padding: "34px 0", textAlign: "center" }}
                    >
                      <div style={{ fontWeight: 700, marginBottom: 4 }}>
                        {current.label}이 아직 없어요
                      </div>
                      <div style={{ fontSize: 12.5, color: "var(--ink-3)" }}>
                        새로 작성으로 첫 문서를 등록해보세요
                      </div>
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </ColumnResizeProvider>
        </SmoothHeight>
      </div>

      {reading ? (
        <Overlay onClose={() => setReading(null)}>
          <div className="modal detail">
            <div className="dhd">
              <div className="dtags">
                <span className="bs neu">{reading.place}</span>
                <span className={live(reading) ? "bs ok" : "bs neu"}>
                  {reading.status}
                </span>
                <button
                  className="dx"
                  onClick={() => setReading(null)}
                  aria-label="닫기"
                >
                  <Icon name="x" />
                </button>
              </div>
              <h3>{reading.title}</h3>
              <div className="dmeta">{reading.date} 게시</div>
            </div>
            <div className="dbody">
              <div className="dlabel">이용자에게 보이는 내용</div>
              <div className="dsrc">{reading.body}</div>
            </div>
            <div className="dacts">
              <span className="grow">수정하면 처리 기록에 남아요</span>
              <button className="btn line" onClick={() => setReading(null)}>
                닫기
              </button>
              <button
                className="btn primary"
                onClick={() => {
                  setEditing({ mode: "edit", row: reading });
                  setReading(null);
                }}
              >
                수정
              </button>
            </div>
          </div>
        </Overlay>
      ) : null}

      {editing ? (
        <FormModal
          title={
            editing.mode === "create" ? `${current.label} 작성` : "문서 수정"
          }
          sub={
            editing.mode === "create"
              ? "등록하면 바로 노출돼요"
              : "수정 내용은 즉시 반영돼요"
          }
          fields={FIELDS}
          initial={
            editing.mode === "edit"
              ? { title: editing.row.title, body: editing.row.body }
              : undefined
          }
          submitLabel={editing.mode === "create" ? "등록" : "저장"}
          busy={admin.busy}
          onCancel={() => setEditing(null)}
          onSubmit={async (values) => {
            const now = new Date();
            const date = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, "0")}.${String(now.getDate()).padStart(2, "0")}`;
            // id를 제목에서 만들면 같은 제목 재등록 때 React key가 충돌한다
            const res =
              editing.mode === "create"
                ? await admin.act(
                    "notice.create",
                    `nt-${crypto.randomUUID().slice(0, 8)}`,
                    {
                      reason: `${current.label} 등록`,
                      payload: {
                        ...values,
                        kind,
                        place: current.place,
                        date,
                      },
                    },
                  )
                : await admin.act("notice.update", editing.row.id, {
                    reason: "문서 내용 수정",
                    payload: values,
                  });
            if (res.ok) setEditing(null);
          }}
        />
      ) : null}
    </>
  );
}
