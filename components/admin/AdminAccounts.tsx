"use client";

import { useEffect, useRef, useState } from "react";
import { useAdmin } from "@/lib/admin/useAdmin";
import type { ToolResult } from "@/lib/admin/run";
import type { AdminAccount } from "@/lib/admin/seed";
import { Icon } from "@/components/Icon";
import { SkRegion, Sk } from "@/components/Skeleton";
import { toast } from "@/components/ds/Toaster";
import { toneOf } from "@/lib/admin/run";
import { Select } from "@/components/ds/Select";
import { StepUpModal } from "./StepUpModal";
import { FormModal } from "./FormModal";

/**
 * 운영자 계정 — 권한 정책 화면의 계정 관리 탭.
 *
 * "누가 백오피스에 들어올 수 있고, 무엇을 할 수 있는가"를 여기서 관리한다.
 * 계정별 역할(뷰어→운영자→최고 운영자)이 곧 계정별 권한 세팅이다 — 역할을
 * 바꾸면 역할 정책 탭의 규칙이 그 계정에 그대로 적용된다.
 *
 * 역할 변경·정지는 고위험(재인증) — 잘못 누르면 동료가 잠기는 조치라
 * 실행 직전에 본인 확인을 한 번 더 거친다. 최고 운영자 계정은 화면에서
 * 바꿀 수 없다(복구 불능 방지 — 역할 정책의 SUPER 잠금과 같은 이유).
 */
const ROLE_LABEL: Record<AdminAccount["role"], string> = {
  super: "최고 운영자",
  admin: "운영자",
  viewer: "뷰어",
};

const ROLE_OPTIONS: Array<{ value: AdminAccount["role"]; label: string; sub: string }> = [
  { value: "viewer", label: "뷰어", sub: "열람만" },
  { value: "admin", label: "운영자", sub: "조치 가능" },
  { value: "super", label: "최고 운영자", sub: "모든 권한" },
];

export function AdminAccounts() {
  const admin = useAdmin();
  const [query, setQuery] = useState("");
  const [invite, setInvite] = useState(false);
  const toasted = useRef<ToolResult | null>(null);

  // 조치 결과 안내 — PolicyMatrix와 같은 토스트 문법
  useEffect(() => {
    const res = admin.result;
    if (!res || toasted.current === res) return;
    toasted.current = res;
    if (!res.ok && res.code === "STEP_UP_REQUIRED") return;
    toast(res.message, { tone: toneOf(res) });
  }, [admin.result]);

  if (!admin.state) {
    return (
      <SkRegion label="운영자 계정">
        <AdminAccountsSk />
      </SkRegion>
    );
  }

  const rows = admin.state.admins;
  const needle = query.trim().toLowerCase();
  const shown = rows.filter(
    (row) =>
      !needle ||
      `${row.handle} ${row.name} ${ROLE_LABEL[row.role]}`
        .toLowerCase()
        .includes(needle),
  );

  /** 최고 운영자 보호 — 마지막 활성 super는 역할·상태를 바꿀 수 없다 */
  const lockNote = (row: AdminAccount): string | null => {
    const activeSupers = rows.filter(
      (item) => item.role === "super" && item.status === "활성",
    );
    if (
      row.role === "super" &&
      activeSupers.length <= 1 &&
      activeSupers.some((item) => item.id === row.id)
    ) {
      return "마지막 최고 운영자예요, 여기서 바꾸면 되돌릴 사람이 없어져요.";
    }
    return null;
  };

  return (
    <>
      <div className="dashgrid" style={{ marginBottom: 0 }}>
        <div className="tablecard" style={{ gridColumn: "1 / -1" }}>
          <div className="tabletop">
            <h4>운영자 계정</h4>
            <span className="tcnt">{rows.length}명</span>
            <form
              className="search"
              style={{ maxWidth: 220, flex: "none", marginLeft: "auto" }}
              onSubmit={(event) => event.preventDefault()}
            >
              <Icon name="search" />
              <input
                value={query}
                placeholder="아이디, 이름 검색"
                aria-label="운영자 계정 검색"
                onChange={(event) => setQuery(event.target.value)}
              />
            </form>
            <button
              className="btn primary sm"
              style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
              onClick={() => setInvite(true)}
            >
              <Icon name="plus" />
              운영자 초대
            </button>
          </div>

          <table className="dtable">
            <thead>
              <tr>
                <th>계정</th>
                <th>역할 (권한 세트)</th>
                <th>2단계 인증</th>
                <th>마지막 접속</th>
                <th>상태</th>
                <th style={{ textAlign: "right" }}>조치</th>
              </tr>
            </thead>
            <tbody>
              {shown.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", color: "var(--ink-4)" }}>
                    “{query.trim()}” 결과가 없어요
                  </td>
                </tr>
              ) : (
                shown.map((row) => {
                  const locked = lockNote(row);
                  return (
                    <tr key={row.id}>
                      <td>
                        <span className="u">
                          <span className="av">{row.name.slice(0, 1)}</span>
                          <span>
                            <b style={{ display: "block", fontWeight: 700 }}>
                              {row.handle}
                            </b>
                            <small style={{ color: "var(--ink-4)" }}>
                              {row.name}
                            </small>
                          </span>
                        </span>
                      </td>
                      <td>
                        <Select
                          className="rolesel"
                          value={row.role}
                          ariaLabel={`${row.handle} 역할 변경`}
                          options={ROLE_OPTIONS}
                          onChange={(next) => {
                            if (next === row.role) return;
                            if (locked) {
                              toast(locked, { tone: "info" });
                              return;
                            }
                            void admin.act("admin.role", row.id, {
                              reason: `역할 변경, ${row.handle}`,
                              payload: { role: next },
                            });
                          }}
                        />
                      </td>
                      <td>
                        <span className={row.twoFA ? "bs ok" : "bs neu"}>
                          {row.twoFA ? "사용" : "미사용"}
                        </span>
                      </td>
                      <td>{row.lastActive}</td>
                      <td>
                        <span
                          className={
                            row.status === "활성"
                              ? "bs ok"
                              : row.status === "정지"
                                ? "bs no"
                                : "bs neu"
                          }
                        >
                          {row.status}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        {row.status === "정지" ? (
                          <button
                            className="tbtn"
                            disabled={admin.busy}
                            onClick={() =>
                              void admin.act("admin.activate", row.id, {
                                reason: `계정 활성화, ${row.handle}`,
                              })
                            }
                          >
                            해제
                          </button>
                        ) : (
                          <button
                            className="tbtn warn"
                            disabled={admin.busy || row.status === "초대됨"}
                            title={
                              locked
                                ? "잠긴 계정이에요"
                                : row.status === "초대됨"
                                  ? "접속 전 계정이에요"
                                  : "계정 정지"
                            }
                            onClick={() => {
                              if (locked) {
                                toast(locked, { tone: "info" });
                                return;
                              }
                              void admin.act("admin.suspend", row.id, {
                                reason: `계정 정지, ${row.handle}`,
                              });
                            }}
                          >
                            정지
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          <p className="polfoot" style={{ margin: "10px 14px 12px" }}>
            <Icon name="lock" /> 역할 변경, 정지는 실행 직전에 본인 확인을 한 번
            더 해요, 마지막 최고 운영자 계정은 바꿀 수 없어요
          </p>
        </div>
      </div>

      {invite ? (
        <FormModal
          title="운영자 초대"
          submitLabel="초대 보내기"
          fields={[
            {
              key: "handle",
              label: "이메일 (로그인 아이디)",
              placeholder: "name@demo.wigtn.dev",
              required: true,
            },
            { key: "name", label: "이름", placeholder: "홍길동", required: true },
            {
              key: "role",
              label: "역할",
              options: ["뷰어", "운영자"],
              select: true,
              placeholder: "역할 선택",
              required: true,
            },
          ]}
          onCancel={() => setInvite(false)}
          onSubmit={(values) => {
            setInvite(false);
            void admin.act("admin.invite", `adm-${Date.now()}`, {
              reason: `운영자 초대, ${values.handle}`,
              payload: {
                handle: values.handle,
                name: values.name,
                role: values.role === "운영자" ? "admin" : "viewer",
              },
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

/** 스켈레톤 미러 — 헤더·컬럼은 정적, 행 데이터 자리만 shimmer(행높이 동일) */
export function AdminAccountsSk() {
  return (
    <div className="dashgrid" style={{ marginBottom: 0 }}>
      <div className="tablecard" style={{ gridColumn: "1 / -1" }}>
        <div className="tabletop">
          <h4>운영자 계정</h4>
          <span className="tcnt">
            <Sk w={32} h={14} />
          </span>
          <span style={{ maxWidth: 220, flex: "none", marginLeft: "auto" }}>
            <Sk w={220} h={34} r={8} />
          </span>
          <Sk w={96} h={30} r={8} />
        </div>
        <table className="dtable">
          <thead>
            <tr>
              <th>계정</th>
              <th>역할 (권한 세트)</th>
              <th>2단계 인증</th>
              <th>마지막 접속</th>
              <th>상태</th>
              <th style={{ textAlign: "right" }}>조치</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, index) => (
              <tr key={index}>
                <td>
                  <span className="u">
                    <Sk w={28} h={28} r={14} />
                    <span>
                      <Sk w={168} h={14} />
                      <Sk w={48} h={11} style={{ marginTop: 4 }} />
                    </span>
                  </span>
                </td>
                <td>
                  <Sk w={128} h={30} r={8} />
                </td>
                <td>
                  <Sk w={44} h={20} r={6} />
                </td>
                <td>
                  <Sk w={64} h={13} />
                </td>
                <td>
                  <Sk w={44} h={20} r={6} />
                </td>
                <td style={{ textAlign: "right" }}>
                  <Sk w={44} h={26} r={7} style={{ marginLeft: "auto" }} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="polfoot" style={{ margin: "10px 14px 12px" }}>
          <Icon name="lock" /> 역할 변경, 정지는 실행 직전에 본인 확인을 한 번 더
          해요, 마지막 최고 운영자 계정은 바꿀 수 없어요
        </p>
      </div>
    </div>
  );
}
