"use client";

import { useEffect, useMemo, useState } from "react";
import { loadState, subscribeState } from "@/lib/admin/overlay";
import type { JobRow } from "@/lib/admin/seed";
import { COMPANIES } from "@/lib/seed/companies";
import type { JobWithCompany } from "@/lib/seed/jobs";
import { JobCard } from "./JobCard";
import { JobCardSkeleton, SkRegion, useMockLoading } from "./Skeleton";
import { Icon } from "./Icon";
import { Select } from "./ds/Select";
import { INDUSTRIES } from "@/lib/seed/companies";

/**
 * 채용공고 목록 — 백오피스 채용 관리와 같은 오버레이가 정본이다.
 * 운영자가 마감하면 여기서 "마감"으로 표시되고, 등록하면 맨 앞에 새 카드가
 * 선다. 검색은 직무·회사·조건을 함께 뒤진다.
 */
function toCard(row: JobRow): (JobWithCompany & { closed?: boolean }) | null {
  const company = COMPANIES.find((item) => item.slug === row.companySlug);
  if (!company) return null;
  return {
    id: row.id,
    companySlug: row.companySlug,
    title: row.title,
    employment: row.employment,
    career: row.career,
    daysLeft: row.daysLeft,
    payLow: row.payLow,
    payHigh: row.payHigh,
    conditions: [],
    responsibilities: [],
    requirements: [],
    preferred: [],
    workplace: "",
    process: [],
    company,
    closed: row.status === "마감",
  } as JobWithCompany & { closed?: boolean };
}

export function JobsBoard() {
  const [rows, setRows] = useState<JobRow[] | null>(null);
  const [query, setQuery] = useState("");
  const [industry, setIndustry] = useState("전체");
  const [employment, setEmployment] = useState("전체");
  const delaying = useMockLoading();
  const loading = delaying || rows === null;

  useEffect(() => {
    const sync = () => setRows(loadState().jobs);
    sync();
    return subscribeState(sync);
  }, []);

  const needle = query.trim().toLowerCase();
  const cards = useMemo(
    () =>
      (rows ?? [])
        .map(toCard)
        .filter((card): card is JobWithCompany & { closed?: boolean } =>
          Boolean(card),
        )
        .filter(
          (card) =>
            (industry === "전체" || card.company.industry === industry) &&
            (employment === "전체" || card.employment === employment) &&
            (!needle ||
              `${card.title} ${card.company.name} ${card.employment} ${card.career}`
                .toLowerCase()
                .includes(needle)),
        )
        // 노출중이 앞, 마감이 뒤 — 마감 공고도 기록으로 남는다
        .sort((a, b) => Number(a.closed ?? false) - Number(b.closed ?? false)),
    [rows, needle, industry, employment],
  );
  const openCount = (rows ?? []).filter(
    (row) => row.status === "노출중",
  ).length;

  return (
    <>
      <div className="filterbar">
        {/* 필터와 검색은 한 묶음 — 떨어뜨리면 같은 일(거르기)이 흩어져 보인다 */}
        <Select
          className="industry-select"
          value={industry}
          ariaLabel="업종 선택"
          searchable
          searchPlaceholder="업종 검색"
          options={INDUSTRIES.map((name) => ({ value: name, label: name }))}
          onChange={setIndustry}
        />
        <div className="seg">
          {["전체", "정규직", "계약직"].map((option) => (
            <button
              key={option}
              type="button"
              className={employment === option ? "on" : undefined}
              onClick={() => setEmployment(option)}
            >
              {option}
            </button>
          ))}
        </div>
        <form
          className="search"
          onSubmit={(event) => event.preventDefault()}
          style={{ maxWidth: 260, flex: "none" }}
        >
          <Icon name="search" />
          <input
            value={query}
            placeholder="직무 · 회사로 검색"
            aria-label="채용공고 검색"
            onChange={(event) => setQuery(event.target.value)}
          />
        </form>
        <span className="jobsopen" style={{ marginLeft: "auto" }}>
          채용 중 <b>{loading ? "—" : openCount}</b>건
        </span>
      </div>

      {loading ? (
        <SkRegion label="채용공고">
          <div className="cgrid">
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <JobCardSkeleton key={index} />
            ))}
          </div>
        </SkRegion>
      ) : cards.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: 40 }}>
          <p style={{ fontWeight: 700, marginBottom: 4 }}>
            “{query.trim()}” 결과가 없어요
          </p>
          <p style={{ fontSize: 12.5, color: "var(--ink-3)" }}>
            다른 직무나 회사명으로 찾아보세요
          </p>
        </div>
      ) : (
        <div className="cgrid sk-arrive">
          {cards.map((card) => (
            <JobCard key={card.id} job={card} closed={card.closed} />
          ))}
        </div>
      )}
    </>
  );
}
