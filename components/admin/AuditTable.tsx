"use client";

import { useEffect, useState } from "react";
import { loadState, subscribeState } from "@/lib/admin/overlay";
import type { AuditRow } from "@/lib/admin/seed";
import { Icon } from "@/components/Icon";
import { SkRows, SkToolbar, ROW_H } from "./AdminSkeleton";
import {
  ColumnResizeProvider,
  GridToolbar,
  SortHeader,
  useFlipRows,
  useSortChain,
  useWindowedRows,
} from "./grid";

/**
 * 처리 기록 — 이 브라우저의 오버레이를 읽는다.
 * 조치를 하면 여기 맨 위에 쌓인다(append-only). 지우는 버튼은 두지 않는다 —
 * 지울 수 있으면 감사 기록이 아니다.
 */

type Filter = "all" | "content" | "member" | "config";

const FILTERS: Array<{
  key: Filter;
  label: string;
  match: (row: AuditRow) => boolean;
}> = [
  { key: "all", label: "전체", match: () => true },
  {
    key: "content",
    label: "콘텐츠",
    match: (row) =>
      /블라인드|삭제|복원|반려|인증 취소|문서|큐레이션/.test(row.action),
  },
  {
    key: "member",
    label: "회원",
    match: (row) => /회원|정지|증빙/.test(row.action),
  },
  {
    key: "config",
    label: "설정",
    match: (row) => /AI|안전|한도|권한|회사/.test(row.action),
  },
];

function toCsv(rows: AuditRow[]) {
  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
  const head = ["시각", "운영자", "액션", "대상", "사유"];
  return [
    head.join(","),
    ...rows.map((row) =>
      [row.at, row.actor, row.action, row.target, row.reason]
        .map(escape)
        .join(","),
    ),
  ].join("\n");
}

const SORT_LABELS: Record<string, string> = {
  at: "시각",
  actor: "운영자",
  action: "액션",
  target: "대상",
};

const SORT_GETTERS: Record<string, (row: AuditRow) => unknown> = {
  at: (row) => row.at,
  actor: (row) => row.actor,
  action: (row) => row.action,
  target: (row) => row.target,
};

export function AuditTable() {
  const [rows, setRows] = useState<AuditRow[] | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  // 마운트 1회로 끝내지 않는다 — 다른 화면·다른 탭의 조치도 append-only로 쌓이는 게 보여야 한다
  useEffect(() => {
    const sync = () => setRows(loadState().audit);
    sync();
    return subscribeState(sync);
  }, []);

  const sort = useSortChain<AuditRow>(SORT_GETTERS);

  const all = rows ?? [];
  const match = FILTERS.find((item) => item.key === filter)!.match;
  const needle = query.trim().toLowerCase();
  const matched = all.filter(
    (row) =>
      match(row) &&
      (!needle ||
        `${row.actor} ${row.action} ${row.target} ${row.reason}`
          .toLowerCase()
          .includes(needle)),
  );
  const shown = sort.sortRows(matched);
  // 조치 기록은 운영자가 손댈 때마다 쌓여, 이 데모에서 유일하게 무한정 길어지는 표다.
  // 120행을 넘으면 보이는 구간만 그린다. 그 아래에서는 꺼져 있고 FLIP이 대신 돈다
  // (윈도잉이 켜지면 행이 재활용돼 FLIP은 의미가 없다).
  const win = useWindowedRows(shown.length, { estimateRowHeight: 45 });
  const registerRow = useFlipRows(win.active ? null : shown);

  function exportCsv() {
    // BOM을 붙여야 엑셀에서 한글이 깨지지 않는다
    const blob = new Blob(["﻿" + toCsv(shown)], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `처리기록_${shown.length}건.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <div className="tablecard">
        <div className="tabletop">
          <h4>최근 활동</h4>
          <div
            className="search"
            style={{ maxWidth: 220, flex: "none", marginLeft: "auto" }}
          >
            <Icon name="search" />
            <input
              value={query}
              placeholder="대상, 사유 검색"
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <div className="seg" style={{ marginLeft: 0 }}>
            {FILTERS.map((item) => (
              <button
                key={item.key}
                className={filter === item.key ? "on" : undefined}
                onClick={() => setFilter(item.key)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <button
            className="btn line sm"
            disabled={shown.length === 0}
            onClick={exportCsv}
          >
            CSV 내보내기 {shown.length ? `(${shown.length})` : ""}
          </button>
        </div>
        {rows ? (
          <GridToolbar
            total={all.length}
            filtered={shown.length}
            chain={sort.chain}
            labels={SORT_LABELS}
            onReset={sort.reset}
          />
        ) : (
          <SkToolbar />
        )}
        <div className="gscroll" ref={win.containerRef}>
          <ColumnResizeProvider storageKey="admin-audit">
            <table className="dtable">
              <thead>
                <tr>
                  {(
                    [
                      ["at", "시각"],
                      ["actor", "운영자"],
                      ["action", "액션"],
                      ["target", "대상"],
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
                  <th>사유</th>
                </tr>
              </thead>
              <tbody>
                {/* 시드 기본은 1행 — 스켈레톤도 1행이어야 데이터 도착 때 표가 안 밀린다 */}
                {!rows ? <SkRows cols={5} rows={1} rowH={ROW_H.audit} /> : null}
                {/* 스페이서 — 안 그린 구간의 높이를 대신 차지해 스크롤바 길이를 지킨다 */}
                {win.padTop > 0 ? (
                  <tr className="gspacer" aria-hidden>
                    <td colSpan={5} style={{ height: win.padTop }} />
                  </tr>
                ) : null}
                {shown.slice(win.start, win.end).map((row, offset) => {
                  const index = win.start + offset;
                  const key = `${row.at}-${index}`;
                  return (
                    <tr
                      key={key}
                      ref={(el) => {
                        registerRow(key, el);
                        if (offset === 0) win.measureRef(el);
                      }}
                    >
                      <td>{row.at}</td>
                      <td>
                        <b>{row.actor}</b>
                      </td>
                      <td>
                        <span className="bs neu">{row.action}</span>
                      </td>
                      <td className="prev">{row.target}</td>
                      <td>{row.reason}</td>
                    </tr>
                  );
                })}
                {win.padBottom > 0 ? (
                  <tr className="gspacer" aria-hidden>
                    <td colSpan={5} style={{ height: win.padBottom }} />
                  </tr>
                ) : null}
                {rows && shown.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      style={{ padding: "34px 0", textAlign: "center" }}
                    >
                      <div style={{ fontWeight: 700, marginBottom: 4 }}>
                        {all.length === 0
                          ? "아직 조치 기록이 없어요"
                          : "조건에 맞는 기록이 없어요"}
                      </div>
                      <div style={{ fontSize: 12.5, color: "var(--ink-3)" }}>
                        {all.length === 0
                          ? "신고 처리나 회원 제재를 하면 여기에 쌓여요"
                          : "다른 필터로 찾아보세요"}
                      </div>
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </ColumnResizeProvider>
        </div>
      </div>
    </>
  );
}
