"use client";

import { useRef, useState } from "react";
import { SmoothHeight } from "@/components/ds/SmoothHeight";
import { useAdmin } from "@/lib/admin/useAdmin";
import {
  IMPORT_TEMPLATE,
  parseCompanyImport,
  type ImportResult,
} from "@/lib/admin/import";
import type { Company } from "@/lib/admin/seed";
import { Icon } from "@/components/Icon";
import { toast } from "@/components/ds/Toaster";
import { CompanyLogo } from "./CompanyLogo";
import { ResultNote } from "./ResultNote";
import { StepUpModal } from "./StepUpModal";
import { FormModal } from "./FormModal";
import { ConfirmDialog } from "./ConfirmDialog";
import { SkRows, SkMcard, SkToolbar } from "./AdminSkeleton";
import {
  ColumnResizeProvider,
  GridToolbar,
  SortHeader,
  useFlipRows,
  useSortChain,
} from "./grid";

/**
 * 회사 관리 — 등록·수정·병합·노출·일괄 업로드가 전부 실제로 동작한다.
 *
 * 병합만 고위험이다(리뷰가 옮겨 붙고 원래 회사가 사라져 되돌릴 수 없다).
 * 등록·수정·노출은 되돌리기 쉬워 재인증을 걸지 않는다.
 */

const FIELDS = [
  { key: "name", label: "회사명", required: true, placeholder: "예: ◇◇테크" },
  { key: "industry", label: "업종", required: true, placeholder: "예: IT" },
  { key: "region", label: "지역", required: true, placeholder: "예: 판교" },
];

type Editing = { mode: "create" } | { mode: "edit"; row: Company };

/* 회사 표 정렬 — 리뷰 수·평점은 숫자로, 나머지는 글자순.
   중복 정리는 "리뷰 적은 쪽을 큰 쪽에 합치는" 판단이라 리뷰 수 정렬이 실제로 쓰인다. */
const SORT_LABELS: Record<string, string> = {
  name: "회사",
  industry: "업종 · 지역",
  reviews: "리뷰",
  score: "평점",
  status: "상태",
};

const SORT_GETTERS: Record<string, (row: Company) => unknown> = {
  name: (row) => row.name,
  industry: (row) => `${row.industry} ${row.region}`,
  reviews: (row) => row.reviews,
  // 평점 없는 회사(rating: null)는 방향과 무관하게 항상 뒤로 — ui-kit 정렬 코어가 처리한다
  score: (row) => row.rating,
  status: (row) => row.status,
};

export function CompaniesAdmin() {
  const admin = useAdmin();
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Editing | null>(null);
  const [imported, setImported] = useState<ImportResult | null>(null);
  // 병합은 되돌릴 수 없다 — 실행 전 무엇이 어디로 합쳐지는지 확인부터 받는다
  const [merging, setMerging] = useState<{
    row: Company;
    into: Company;
  } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const sort = useSortChain<Company>(SORT_GETTERS);

  const all = admin.state?.companies ?? [];
  const needle = query.trim().toLowerCase();
  const matched = needle
    ? all.filter((row) =>
        `${row.name} ${row.industry} ${row.region}`
          .toLowerCase()
          .includes(needle),
      )
    : all;
  const rows = sort.sortRows(matched);
  const registerRow = useFlipRows(rows);

  const dupes = all.filter((row) => row.status === "중복 의심").length;

  /** 중복 의심 행을 어디에 합칠지 — 같은 이름으로 시작하는 다른 회사를 찾는다 */
  function mergeTarget(row: Company) {
    return all.find(
      (other) => other.id !== row.id && other.name === row.dupeOf,
    );
  }

  async function onFile(file: File) {
    if (!/\.(csv|tsv|txt)$/i.test(file.name)) {
      setImported({
        rows: [],
        errors: [],
        fatal: `${file.name.split(".").pop()?.toUpperCase()} 파일은 브라우저에서 열 수 없어요. 엑셀에서 "CSV로 저장" 후 올려주세요.`,
      });
      return;
    }
    const parsed = parseCompanyImport(await file.text());
    setImported(parsed);
    if (parsed.rows.length) {
      await admin.act("company.import", `import-${parsed.rows.length}`, {
        reason: `${file.name} 일괄 등록`,
        payload: {
          rows: parsed.rows.map(({ name, industry, region }) => ({
            name,
            industry,
            region,
          })),
        },
      });
    }
  }

  return (
    <>
      <ResultNote result={admin.result} />

      <div className="mrow" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
        {admin.state ? (
          <>
            <div className="mcard">
              <div className="mk">등록 회사</div>
              <div className="mv">{all.length.toLocaleString()}</div>
            </div>
            <div className="mcard">
              <div className="mk">노출중</div>
              <div className="mv">
                {all.filter((row) => row.status === "노출중").length}
              </div>
            </div>
            <div className="mcard">
              <div className="mk">검토 필요 (중복·사명변경)</div>
              <div className="mv">
                {dupes} {dupes ? <small className="up">확인</small> : null}
              </div>
            </div>
          </>
        ) : (
          <>
            <SkMcard />
            <SkMcard />
            <SkMcard />
          </>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept=".csv,.tsv,.txt"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void onFile(file);
          event.target.value = "";
        }}
      />

      <div
        className="dropzone"
        onClick={() => fileRef.current?.click()}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          const file = event.dataTransfer.files?.[0];
          if (file) void onFile(file);
        }}
      >
        <Icon name="upload" />
        <div>
          <b>CSV 파일을 끌어다 놓거나 클릭해서 업로드</b>
        </div>
        <div className="sub">
          회사명 · 업종 · 지역 열 인식 · 오류는 행 단위로 알려줘요 (콜드스타트
          대량 입력)
          <br />
          <span
            style={{ color: "var(--accent)", fontWeight: 700 }}
            onClick={(event) => {
              event.stopPropagation();
              const url = URL.createObjectURL(
                new Blob(["﻿" + IMPORT_TEMPLATE], {
                  type: "text/csv;charset=utf-8",
                }),
              );
              const a = document.createElement("a");
              a.href = url;
              a.download = "회사등록_양식.csv";
              a.click();
              URL.revokeObjectURL(url);
              // 순간 안내는 토스트로 — 기록이 필요한 처리 결과(ResultNote)와 구분한다
              toast("양식을 내려받았어요 — 엑셀에서 열어 작성하세요", {
                tone: "success",
              });
            }}
          >
            양식 내려받기
          </span>
        </div>
      </div>

      {imported ? (
        <div className="tablecard importlog" style={{ padding: "14px 16px" }}>
          {imported.fatal ? (
            <div className="safenote warn" style={{ marginBottom: 0 }}>
              <span className="si">
                <Icon name="alert" />
              </span>
              <div>
                <b>{imported.fatal}</b>
              </div>
            </div>
          ) : (
            <>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: imported.errors.length ? 10 : 0,
                }}
              >
                <b style={{ fontSize: 13.5 }}>
                  {imported.rows.length}행 등록
                  {imported.errors.length
                    ? ` · ${imported.errors.length}행 건너뜀`
                    : " · 오류 없음"}
                </b>
                <button
                  className="tbtn"
                  style={{ marginLeft: "auto" }}
                  onClick={() => setImported(null)}
                >
                  닫기
                </button>
              </div>
              {imported.errors.map((error) => (
                <div className="ir" key={error.line}>
                  <span className="rowno">{error.line}행</span>
                  <span className="prev">{error.raw}</span>
                  <span className="why">{error.why}</span>
                </div>
              ))}
            </>
          )}
        </div>
      ) : null}

      <div className="tablecard">
        <div className="tabletop">
          <h4>회사 목록</h4>
          {/* 기능 버튼은 대상(목록) 카드 안에 — 페이지 머리에 떠 있으면
              무엇에 작용하는지 한 번 더 생각하게 된다 */}
          <div
            className="search"
            style={{ maxWidth: 220, flex: "none", marginLeft: "auto" }}
          >
            <Icon name="search" />
            <input
              value={query}
              placeholder="회사명 검색"
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <div style={{ display: "flex", gap: 8, flex: "none" }}>
            <button
              className="btn line sm"
              onClick={() => fileRef.current?.click()}
            >
              <Icon name="upload" /> 엑셀 일괄 업로드
            </button>
            <button
              className="btn primary sm"
              onClick={() => setEditing({ mode: "create" })}
            >
              <Icon name="plus" /> 회사 등록
            </button>
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
          <ColumnResizeProvider storageKey="admin-companies">
            <table className="dtable">
              <thead>
                <tr>
                  {(
                    [
                      ["name", "회사"],
                      ["industry", "업종 · 지역"],
                      ["reviews", "리뷰"],
                      ["score", "평점"],
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
                    병합·노출·수정 세 버튼(실측 145px + 셀 패딩 32px)이
                    들어갈 자리를 미리 잡아야 도착 후 버튼이 카드 밖으로 밀리지 않는다 */}
                  <th style={{ width: 178 }}>조치</th>
                </tr>
              </thead>
              <tbody>
                {/* loading.tsx 미러와 같은 실측값 — 마지막 행은 구분선이 없어 1px 낮다 */}
                {!admin.state ? (
                  <SkRows
                    cols={6}
                    rows={7}
                    rowHs={[52.2, 52.2, 52.2, 52.2, 52.2, 52.2, 51.2]}
                  />
                ) : null}
                {rows.map((row) => {
                  const into = mergeTarget(row);
                  return (
                    <tr key={row.id} ref={(el) => registerRow(row.id, el)}>
                      <td>
                        <CompanyLogo name={row.name} fallback={row.logo} />
                        {row.name}
                      </td>
                      <td>
                        {row.industry} · {row.region}
                      </td>
                      <td>{row.reviews}</td>
                      <td>
                        {row.rating === null ? (
                          <span style={{ color: "var(--ink-4)" }}>—</span>
                        ) : (
                          <span className="stars">
                            <Icon name="star" filled className="st1" />
                            <span className="n">{row.rating.toFixed(1)}</span>
                          </span>
                        )}
                      </td>
                      <td>
                        <span
                          className={
                            row.status === "노출중"
                              ? "bs ok"
                              : row.status === "중복 의심"
                                ? "bs wait"
                                : row.status === "숨김"
                                  ? "bs no"
                                  : "bs neu"
                          }
                        >
                          {row.status}
                        </span>
                      </td>
                      <td>
                        {/* 버튼 3개 행(중복 의심)에서 글자가 세로로 꺾였다 — .tbtn에
                          nowrap 규칙이 없어서다. globals.css는 타 레인 소유라
                          버튼마다 nowrap을 박는다 — auto 테이블 레이아웃이
                          min-content만큼 조치 열을 넓혀 전 행이 한 줄로 선다 */}
                        <div className="tact">
                          {row.status === "중복 의심" && into ? (
                            <button
                              className="tbtn no"
                              style={{ whiteSpace: "nowrap" }}
                              disabled={admin.busy}
                              title={`${into.name}에 합쳐요 — 되돌릴 수 없어요`}
                              onClick={() => setMerging({ row, into })}
                            >
                              병합
                            </button>
                          ) : null}
                          {row.status === "노출중" ? (
                            <button
                              className="tbtn"
                              style={{ whiteSpace: "nowrap" }}
                              disabled={admin.busy}
                              onClick={() =>
                                admin.act("company.hide", row.id, {
                                  reason: "운영자 판단 — 목록에서 숨김",
                                })
                              }
                            >
                              숨김
                            </button>
                          ) : (
                            <button
                              className="tbtn ok"
                              style={{ whiteSpace: "nowrap" }}
                              disabled={admin.busy}
                              onClick={() =>
                                admin.act("company.publish", row.id, {
                                  reason: "확인 완료 — 목록 노출",
                                })
                              }
                            >
                              노출
                            </button>
                          )}
                          <button
                            className="tbtn"
                            style={{ whiteSpace: "nowrap" }}
                            onClick={() => setEditing({ mode: "edit", row })}
                          >
                            수정
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {admin.state && rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      style={{ padding: "34px 0", textAlign: "center" }}
                    >
                      <div style={{ fontWeight: 700, marginBottom: 4 }}>
                        &ldquo;{query}&rdquo; 검색 결과가 없어요
                      </div>
                      <div style={{ fontSize: 12.5, color: "var(--ink-3)" }}>
                        회사 등록으로 새로 추가할 수 있어요
                      </div>
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </ColumnResizeProvider>
        </SmoothHeight>
      </div>

      {editing ? (
        <FormModal
          title={editing.mode === "create" ? "회사 등록" : "회사 정보 수정"}
          sub={
            editing.mode === "create"
              ? "등록하면 바로 목록에 노출돼요"
              : "리뷰와 평점은 그대로 유지돼요"
          }
          fields={FIELDS}
          initial={
            editing.mode === "edit"
              ? {
                  name: editing.row.name,
                  industry: editing.row.industry,
                  region: editing.row.region,
                }
              : undefined
          }
          submitLabel={editing.mode === "create" ? "등록" : "저장"}
          busy={admin.busy}
          onCancel={() => setEditing(null)}
          onSubmit={async (values) => {
            // id를 이름에서 만들면 같은 이름 재등록 때 React key가 충돌한다
            const res =
              editing.mode === "create"
                ? await admin.act(
                    "company.create",
                    `co-${crypto.randomUUID().slice(0, 8)}`,
                    {
                      reason: "신규 회사 등록",
                      payload: values,
                    },
                  )
                : await admin.act("company.update", editing.row.id, {
                    reason: "회사 정보 수정",
                    payload: values,
                  });
            if (res.ok) setEditing(null);
          }}
        />
      ) : null}

      {merging ? (
        <ConfirmDialog
          title={`${merging.into.name}에 병합할까요?`}
          desc={`${merging.row.name}의 리뷰 ${merging.row.reviews}건이 ${merging.into.name}으로 옮겨 붙고, ${merging.row.name} 항목은 사라져요. 되돌릴 수 없어요.`}
          confirmLabel="병합"
          busy={admin.busy}
          onCancel={() => setMerging(null)}
          onConfirm={() => {
            const target = merging;
            setMerging(null);
            void admin.act("company.merge", target.row.id, {
              reason: `중복 확인 — ${target.into.name}에 병합`,
              payload: { into: target.into.id },
            });
          }}
        />
      ) : null}

      {admin.pending ? (
        <StepUpModal onCancel={admin.cancelPending} onVerified={admin.resume} />
      ) : null}
    </>
  );
}
