"use client";

import { useEffect, useRef, useState } from "react";
import { useAdmin } from "@/lib/admin/useAdmin";
import type { ToolResult } from "@/lib/admin/run";
import type { JobRow } from "@/lib/admin/seed";
import { COMPANIES } from "@/lib/seed/companies";
import { Icon } from "@/components/Icon";
import { Sk, SkRegion } from "@/components/Skeleton";
import { toast } from "@/components/ds/Toaster";
import { StepUpModal } from "./StepUpModal";
import { ConfirmDialog } from "./ConfirmDialog";
import { FormModal } from "./FormModal";

/**
 * 채용공고 관리 — 등록·마감·재노출·삭제가 사용자 /jobs 화면으로 그대로
 * 돌아간다(같은 오버레이). 마감하면 사용자 목록에서 "마감"으로 표시되고,
 * 등록하면 새 카드가 목록 맨 앞에 선다.
 */
export function JobsAdmin() {
  const admin = useAdmin();
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [removing, setRemoving] = useState<JobRow | null>(null);
  const toasted = useRef<ToolResult | null>(null);

  useEffect(() => {
    const res = admin.result;
    if (!res || toasted.current === res) return;
    toasted.current = res;
    if (!res.ok && res.code === "STEP_UP_REQUIRED") return;
    toast(res.message, { tone: res.ok ? "success" : "error" });
  }, [admin.result]);

  if (!admin.state) {
    return (
      <SkRegion label="채용공고">
        <JobsAdminSk />
      </SkRegion>
    );
  }

  const rows = admin.state.jobs;
  const needle = query.trim().toLowerCase();
  const shown = rows.filter(
    (row) =>
      !needle ||
      `${row.title} ${row.company} ${row.employment}`
        .toLowerCase()
        .includes(needle),
  );
  const openCount = rows.filter((row) => row.status === "노출중").length;

  return (
    <>
      <div className="dashgrid" style={{ marginBottom: 0 }}>
        <div className="tablecard" style={{ gridColumn: "1 / -1" }}>
          <div className="tabletop">
            <h4>채용공고</h4>
            <span className="tcnt">
              노출중 {openCount} · 전체 {rows.length}
            </span>
            <form
              className="search"
              style={{ maxWidth: 220, flex: "none", marginLeft: "auto" }}
              onSubmit={(event) => event.preventDefault()}
            >
              <Icon name="search" />
              <input
                value={query}
                placeholder="직무 · 회사 검색"
                aria-label="채용공고 검색"
                onChange={(event) => setQuery(event.target.value)}
              />
            </form>
            <button
              className="btn primary sm"
              style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
              onClick={() => setCreating(true)}
            >
              <Icon name="plus" />
              공고 등록
            </button>
          </div>

          <table className="dtable">
            <thead>
              <tr>
                <th>직무</th>
                <th>회사</th>
                <th>고용 · 경력</th>
                <th>제시 연봉</th>
                <th>마감</th>
                <th>상태</th>
                <th style={{ textAlign: "right" }}>조치</th>
              </tr>
            </thead>
            <tbody>
              {shown.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    style={{ textAlign: "center", color: "var(--ink-4)" }}
                  >
                    “{query.trim()}” 결과가 없어요
                  </td>
                </tr>
              ) : (
                shown.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <b style={{ fontWeight: 700 }}>{row.title}</b>
                    </td>
                    <td>{row.company}</td>
                    <td>
                      {row.employment} · {row.career}
                    </td>
                    <td style={{ fontVariantNumeric: "tabular-nums" }}>
                      {row.payLow.toLocaleString()}~
                      {row.payHigh.toLocaleString()} 만원
                    </td>
                    <td>
                      {row.daysLeft === null ? "상시" : `D-${row.daysLeft}`}
                    </td>
                    <td>
                      <span className={row.status === "노출중" ? "bs ok" : "bs neu"}>
                        {row.status}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div className="tact" style={{ justifyContent: "flex-end" }}>
                        {row.status === "노출중" ? (
                          <button
                            className="tbtn warn"
                            disabled={admin.busy}
                            onClick={() =>
                              void admin.act("job.close", row.id, {
                                reason: `공고 마감: ${row.title}`,
                              })
                            }
                          >
                            마감
                          </button>
                        ) : (
                          <button
                            className="tbtn"
                            disabled={admin.busy}
                            onClick={() =>
                              void admin.act("job.open", row.id, {
                                reason: `공고 재노출: ${row.title}`,
                              })
                            }
                          >
                            노출
                          </button>
                        )}
                        <button
                          className="tbtn no"
                          disabled={admin.busy}
                          onClick={() => setRemoving(row)}
                        >
                          삭제
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {creating ? (
        <FormModal
          title="채용공고 등록"
          submitLabel="등록"
          fields={[
            {
              key: "company",
              label: "회사",
              options: COMPANIES.map((company) => company.name),
              select: true,
              placeholder: "회사 선택",
              required: true,
            },
            {
              key: "title",
              label: "직무명",
              placeholder: "예: 엔터프라이즈 영업 (B2B SaaS)",
              required: true,
            },
            {
              key: "employment",
              label: "고용형태",
              options: ["정규직", "계약직"],
              required: true,
            },
            { key: "career", label: "요구 경력", placeholder: "예: 3년 이상" },
            { key: "payLow", label: "제시 연봉 최소(만원)", placeholder: "4200" },
            { key: "payHigh", label: "제시 연봉 최대(만원)", placeholder: "6000" },
            { key: "daysLeft", label: "마감까지 일수 (비우면 상시)", placeholder: "14" },
          ]}
          onCancel={() => setCreating(false)}
          onSubmit={(values) => {
            setCreating(false);
            const company = COMPANIES.find(
              (item) => item.name === values.company,
            );
            void admin.act("job.create", `j-${Date.now()}`, {
              reason: `공고 등록: ${values.title}`,
              payload: {
                company: values.company,
                companySlug: company?.slug ?? "",
                title: values.title,
                employment: values.employment || "정규직",
                career: values.career || "경력 무관",
                payLow: Number(values.payLow) || 0,
                payHigh: Number(values.payHigh) || 0,
                daysLeft: values.daysLeft ? Number(values.daysLeft) : null,
              },
            });
          }}
        />
      ) : null}

      {removing ? (
        <ConfirmDialog
          title={`“${removing.title}” 공고를 삭제할까요?`}
          desc="삭제하면 되돌릴 수 없어요. 사용자 화면에서도 즉시 사라져요."
          confirmLabel="삭제"
          initialReason={`공고 삭제: ${removing.title}`}
          busy={admin.busy}
          onCancel={() => setRemoving(null)}
          onConfirm={(reason) => {
            const target = removing;
            setRemoving(null);
            void admin.act("job.delete", target.id, {
              reason: reason ?? `공고 삭제: ${target.title}`,
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

/** 스켈레톤 미러 — 헤더·컬럼 정적, 행 데이터만 shimmer */
export function JobsAdminSk() {
  return (
    <div className="dashgrid" style={{ marginBottom: 0 }}>
      <div className="tablecard" style={{ gridColumn: "1 / -1" }}>
        <div className="tabletop">
          <h4>채용공고</h4>
          <span className="tcnt">
            <Sk w={92} h={14} />
          </span>
          <span style={{ maxWidth: 220, flex: "none", marginLeft: "auto" }}>
            <Sk w={220} h={34} r={8} />
          </span>
          <Sk w={92} h={30} r={8} />
        </div>
        <table className="dtable">
          <thead>
            <tr>
              <th>직무</th>
              <th>회사</th>
              <th>고용 · 경력</th>
              <th>제시 연봉</th>
              <th>마감</th>
              <th>상태</th>
              <th style={{ textAlign: "right" }}>조치</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 6 }).map((_, index) => (
              <tr key={index}>
                <td>
                  <Sk w={188} h={14} />
                </td>
                <td>
                  <Sk w={64} h={13} />
                </td>
                <td>
                  <Sk w={104} h={13} />
                </td>
                <td>
                  <Sk w={110} h={13} />
                </td>
                <td>
                  <Sk w={38} h={13} />
                </td>
                <td>
                  <Sk w={48} h={20} r={6} />
                </td>
                <td style={{ textAlign: "right" }}>
                  <Sk w={96} h={26} r={7} style={{ marginLeft: "auto" }} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
