"use client";

import { useState } from "react";
import { PolicyMatrix } from "./PolicyMatrix";
import { AdminAccounts } from "./AdminAccounts";
import { PolicyRiskSection } from "./PolicyStatic";

/**
 * 권한 정책의 세 얼굴 — 역할 정책 · 운영자 계정 · 보안 규칙.
 *
 * 한 화면에 전부 쌓았더니 "무엇부터 보는 화면인지"가 없었다. 관심사가
 * 다른 세 덩이(역할별 규칙 편집 / 계정별 권한 세팅 / 재인증 장치 설명)를
 * 탭으로 갈라, 각 탭이 한 가지 질문에만 답하게 한다.
 */
const TABS = [
  { key: "roles", label: "역할 정책" },
  { key: "accounts", label: "운영자 계정" },
  { key: "security", label: "보안 규칙" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export function PolicyTabs() {
  const [tab, setTab] = useState<TabKey>("roles");
  return (
    <>
      <div className="seg poltabs" role="tablist" aria-label="권한 정책 영역">
        {TABS.map((item) => (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={tab === item.key}
            className={tab === item.key ? "on" : undefined}
            onClick={() => setTab(item.key)}
          >
            {item.label}
          </button>
        ))}
      </div>
      {tab === "roles" ? (
        <PolicyMatrix />
      ) : tab === "accounts" ? (
        <AdminAccounts />
      ) : (
        <PolicyRiskSection />
      )}
    </>
  );
}
