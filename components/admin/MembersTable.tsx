"use client";

import { useState } from "react";
import { LevelBadge } from "@/components/LevelBadge";
import { SmoothHeight } from "@/components/ds/SmoothHeight";
import { useAdmin } from "@/lib/admin/useAdmin";
import type { Member } from "@/lib/admin/seed";
import { Icon } from "@/components/Icon";
import { Select } from "@/components/ds/Select";
import { ResultNote } from "./ResultNote";
import { StepUpModal } from "./StepUpModal";
import { ConfirmDialog } from "./ConfirmDialog";
import { SkRows, SkMcard, SkToolbar } from "./AdminSkeleton";
import { Overlay } from "./Overlay";
import {
  ColumnResizeProvider,
  GridToolbar,
  SortHeader,
  useFlipRows,
  useSortChain,
  useVisitedRows,
} from "./grid";

/**
 * 회원 관리 — 검색·필터·상세·제재가 실제로 동작한다.
 * 정지·해제는 고위험이라 재인증을 거친다(신고 처리와 같은 게이트).
 * 정지는 되돌리기 어려운 제재라 실행 전 확인 다이얼로그(사유 수정 가능)를 한 번 더 거치고,
 * 스팸 계정 여러 개는 체크박스로 골라 한 번에 정지한다 — step-up 게이트는 그대로다.
 */

/**
 * 계정 마스킹 — 익명 서비스라 운영자에게도 전체 아이디를 보여주지 않는다.
 * 로컬 파트 앞 2자 + 도메인 앞 2자만 남긴다: sales@naver.com → sa***@na***.com
 */
function maskEmail(email: string): string {
  const [local = "", domain = ""] = email.split("@");
  const [host = "", ...tld] = domain.split(".");
  const maskedLocal =
    local.slice(0, 2) + "*".repeat(Math.min(5, Math.max(2, local.length - 2)));
  const maskedHost =
    host.slice(0, 2) + "*".repeat(Math.min(4, Math.max(1, host.length - 2)));
  return `${maskedLocal}@${maskedHost}${tld.length ? `.${tld.join(".")}` : ""}`;
}

/** 등급 사다리 — 수동 조정 옵션. LevelBadge 표기와 같은 문자열 계약 */
const GRADES = [
  "Lv.1 신입",
  "Lv.2 현직",
  "Lv.3 리뷰어",
  "Lv.4 필드리더",
  "Lv.5 세일즈마스터",
];

/** 정지 사유 기본값 — 신고 누적이면 그 횟수가 사유에 남는다 */
const suspendReason = (row: Member) =>
  row.reported ? `신고 ${row.reported}회 누적 — 정지` : "정책 위반 — 정지";

type Filter = "all" | "verified" | "suspended";

/* 정렬 키 → 비교값. 모듈 상수로 두는 게 중요하다 — 매 렌더 새 객체를 넘기면
   정렬이 매번 다시 돈다. 화면에 보이는 글자가 아니라 "정렬돼야 하는 값"을
   꺼낸다: 활동은 "글 12 · 댓글 40" 같은 문자열이라 숫자만 뽑아 더한다. */
const SORT_LABELS: Record<string, string> = {
  nick: "회원",
  grade: "등급",
  activity: "활동",
  status: "상태",
  joined: "가입일",
};

const activityScore = (row: Member) =>
  (row.activity.match(/\d+/g) ?? []).reduce(
    (sum, part) => sum + Number(part),
    0,
  );

const SORT_GETTERS: Record<string, (row: Member) => unknown> = {
  nick: (row) => row.nick,
  grade: (row) => row.grade,
  activity: activityScore,
  status: (row) => row.status,
  joined: (row) => row.joined,
};

const FILTERS: Array<{ key: Filter; label: string }> = [
  { key: "all", label: "전체" },
  { key: "verified", label: "인증" },
  { key: "suspended", label: "정지" },
];

type Confirm = {
  ids: string[];
  title: string;
  desc: string;
  reason: string;
  /** 실행할 조치 — 정지 외에 강제 탈퇴도 같은 확인 절차를 탄다 */
  tool: "member.suspend" | "member.expel";
  label: string;
};

export function MembersTable() {
  const admin = useAdmin();
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [detail, setDetail] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<Confirm | null>(null);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const sort = useSortChain<Member>(SORT_GETTERS);
  const { visited, visit } = useVisitedRows("admin-members-visited");

  const all = admin.state?.members ?? [];
  const needle = query.trim().toLowerCase();
  const filtered = all.filter((row) => {
    const suspended = row.status === "정지";
    if (filter === "verified" && (!row.verified || suspended)) return false;
    if (filter === "suspended" && !suspended) return false;
    if (needle && !`${row.nick} ${row.email}`.toLowerCase().includes(needle))
      return false;
    return true;
  });
  const rows = sort.sortRows(filtered);
  // 정렬로 자리가 바뀐 행은 이전 위치에서 미끄러져 온다 — 어디로 갔는지 눈이 따라간다
  const registerRow = useFlipRows(rows);

  const current = detail
    ? (all.find((row) => row.id === detail) ?? null)
    : null;
  const suspendedCount = all.filter((row) => row.status === "정지").length;
  // 일괄 정지는 아직 정상인 회원에게만 의미가 있다 — 이미 정지된 선택은 건너뛴다
  const suspendTargets = rows.filter(
    (row) => selected.has(row.id) && row.status !== "정지",
  );

  async function runConfirm(tool: string, ids: string[], reason: string) {
    const res = await admin.actMany(tool, ids, { reason });
    if (res?.ok) {
      setDetail(null);
      setSelected((prev) => {
        const next = new Set(prev);
        for (const id of ids) next.delete(id);
        return next;
      });
    }
  }

  function toggleRow(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) => {
      const allChecked =
        rows.length > 0 && rows.every((row) => prev.has(row.id));
      const next = new Set(prev);
      for (const row of rows) {
        if (allChecked) next.delete(row.id);
        else next.add(row.id);
      }
      return next;
    });
  }

  return (
    <>
      <ResultNote result={admin.result} />

      <div className="mrow">
        {admin.state ? (
          <>
            <div className="mcard">
              <div className="mk">총 회원</div>
              <div className="mv">{all.length}</div>
            </div>
            <div className="mcard">
              <div className="mk">인증 회원</div>
              <div className="mv">
                {all.filter((row) => row.verified).length}
              </div>
            </div>
            <div className="mcard">
              <div className="mk">신고 누적</div>
              <div className="mv">
                {all.filter((row) => row.reported > 0).length}
              </div>
            </div>
            <div className="mcard">
              <div className="mk">정지</div>
              <div className="mv">
                {suspendedCount}{" "}
                {suspendedCount ? <small className="up">제재중</small> : null}
              </div>
            </div>
          </>
        ) : (
          <>
            <SkMcard />
            <SkMcard />
            <SkMcard />
            <SkMcard />
          </>
        )}
      </div>

      <div className="tablecard">
        <div className="tabletop">
          <h4>회원 목록</h4>
          {/* 검색은 검색 대상(목록) 옆에 — 페이지 머리에 떠 있으면 무엇을
              거르는지 시선이 한 번 끊긴다 */}
          <div
            className="search"
            style={{ maxWidth: 220, flex: "none", marginLeft: "auto" }}
          >
            <Icon name="search" />
            <input
              value={query}
              placeholder="활동명·계정 검색"
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
        </div>
        {admin.state ? (
          <GridToolbar
            total={all.length}
            filtered={rows.length}
            chain={sort.chain}
            labels={SORT_LABELS}
            onReset={sort.reset}
            selection={{
              count: selected.size,
              unit: "명",
              actions: (
                <button
                  className="tbtn no"
                  disabled={admin.busy || suspendTargets.length === 0}
                  onClick={() =>
                    setConfirm({
                      ids: suspendTargets.map((row) => row.id),
                      title: `${suspendTargets.length}명을 일괄 정지할까요?`,
                      desc: `${suspendTargets
                        .map((row) => row.nick)
                        .join(
                          ", ",
                        )} — 정지하면 글·리뷰 작성이 막히고 처리 기록에 남아요.`,
                      reason: "정책 위반 — 일괄 정지",
                      tool: "member.suspend",
                      label: "정지",
                    })
                  }
                >
                  일괄 정지
                </button>
              ),
              onClear: () => setSelected(new Set()),
            }}
          />
        ) : (
          <SkToolbar />
        )}

        <SmoothHeight>
          <ColumnResizeProvider storageKey="admin-members">
            <table className="dtable">
              <thead>
                <tr>
                  <th style={{ width: 34 }}>
                    <input
                      type="checkbox"
                      aria-label="현재 목록 전체 선택"
                      checked={
                        rows.length > 0 &&
                        rows.every((row) => selected.has(row.id))
                      }
                      onChange={toggleAll}
                    />
                  </th>
                  {(
                    [
                      ["nick", "계정"],
                      ["grade", "등급"],
                      ["activity", "활동"],
                      ["status", "상태"],
                      ["joined", "가입일"],
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
                  <th>조치</th>
                </tr>
              </thead>
              <tbody>
                {/* loading.tsx 미러와 같은 실측값 — 마지막 행은 구분선이 없어 1px 낮다 */}
                {!admin.state ? (
                  <SkRows
                    cols={7}
                    rows={6}
                    rowHs={[61.8, 61.8, 61.8, 61.8, 61.8, 60.8]}
                  />
                ) : null}
                {rows.map((row) => {
                  const suspended = row.status === "정지";
                  return (
                    <tr
                      key={row.id}
                      ref={(el) => registerRow(row.id, el)}
                      className={visited.has(row.id) ? "is-visited" : undefined}
                      style={{ cursor: "pointer" }}
                      onClick={() => {
                        visit(row.id);
                        setDetail(row.id);
                      }}
                    >
                      {/* 선택은 행 클릭(상세 열기)과 겹치므로 전파를 막는다 */}
                      <td onClick={(event) => event.stopPropagation()}>
                        <input
                          type="checkbox"
                          aria-label={`${row.nick} 선택`}
                          checked={selected.has(row.id)}
                          onChange={() => toggleRow(row.id)}
                        />
                      </td>
                      <td>
                        {/* 익명 서비스 — 계정은 마스킹, 활동명은 아래 보조 줄.
                            전 행 2줄 고정이라 행높이가 들쭉거리지 않는다 */}
                        <span className="macct">
                          <b>{maskEmail(row.email)}</b>
                          <span className="mnick">
                            {row.nick}
                            {row.reported ? (
                              <span className="bs no">신고 {row.reported}</span>
                            ) : null}
                          </span>
                        </span>
                      </td>
                      <td>
                        <LevelBadge grade={row.grade} muted={suspended} />
                      </td>
                      <td>{row.activity}</td>
                      <td>
                        <span
                          className={
                            row.status === "탈퇴"
                              ? "bs neu"
                              : suspended
                                ? "bs no"
                                : "bs ok"
                          }
                        >
                          {row.status}
                        </span>
                      </td>
                      <td>{row.joined}</td>
                      <td onClick={(event) => event.stopPropagation()}>
                        <div className="tact">
                          <button
                            className="tbtn"
                            onClick={() => {
                              visit(row.id);
                              setDetail(row.id);
                            }}
                          >
                            상세
                          </button>
                          <SuspendButton
                            row={row}
                            busy={admin.busy}
                            onAct={admin.act}
                            onSuspend={(target) =>
                              setConfirm({
                                ids: [target.id],
                                title: `${target.nick}님을 정지할까요?`,
                                desc: "정지하면 글·리뷰 작성이 막혀요. 이의 제기가 수용되면 해제할 수 있어요.",
                                reason: suspendReason(target),
                                tool: "member.suspend",
                                label: "정지",
                              })
                            }
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {admin.state && rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      style={{ padding: "34px 0", textAlign: "center" }}
                    >
                      <div style={{ fontWeight: 700, marginBottom: 4 }}>
                        {needle
                          ? `“${query}” 검색 결과가 없어요`
                          : filter === "suspended"
                            ? "정지된 회원이 없어요"
                            : "인증 회원이 없어요"}
                      </div>
                      <div style={{ fontSize: 12.5, color: "var(--ink-3)" }}>
                        다른 조건으로 찾아보세요
                      </div>
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </ColumnResizeProvider>
        </SmoothHeight>
      </div>

      {current ? (
        <MemberDetail
          member={current}
          busy={admin.busy}
          onClose={() => setDetail(null)}
          onAct={admin.act}
          onExpel={(target) =>
            setConfirm({
              ids: [target.id],
              title: `${target.nick}님을 강제 탈퇴시킬까요?`,
              desc: "탈퇴는 되돌릴 수 없어요. 작성한 글·리뷰는 익명 처리된 채 남아요.",
              reason: "중대한 정책 위반 — 강제 탈퇴",
              tool: "member.expel",
              label: "강제 탈퇴",
            })
          }
          onSuspend={(target) =>
            setConfirm({
              ids: [target.id],
              title: `${target.nick}님을 정지할까요?`,
              desc: "정지하면 글·리뷰 작성이 막혀요. 이의 제기가 수용되면 해제할 수 있어요.",
              reason: suspendReason(target),
              tool: "member.suspend",
              label: "정지",
            })
          }
        />
      ) : null}

      {confirm ? (
        <ConfirmDialog
          title={confirm.title}
          desc={confirm.desc}
          confirmLabel={confirm.label}
          initialReason={confirm.reason}
          busy={admin.busy}
          onCancel={() => setConfirm(null)}
          onConfirm={(reason) => {
            const target = confirm;
            setConfirm(null);
            void runConfirm(target.tool, target.ids, reason ?? target.reason);
          }}
        />
      ) : null}

      {admin.pending ? (
        <StepUpModal onCancel={admin.cancelPending} onVerified={admin.resume} />
      ) : null}
    </>
  );
}

type Act = ReturnType<typeof useAdmin>["act"];

function SuspendButton({
  row,
  busy,
  onAct,
  onSuspend,
}: {
  row: Member;
  busy: boolean;
  onAct: Act;
  /** 정지는 파괴적 조치라 바로 실행하지 않고 확인 다이얼로그부터 연다 */
  onSuspend: (row: Member) => void;
}) {
  if (row.status === "탈퇴") {
    return <span style={{ color: "var(--ink-4)", fontSize: 12 }}>탈퇴</span>;
  }
  const suspended = row.status === "정지";
  return suspended ? (
    <button
      className="tbtn"
      disabled={busy}
      onClick={() =>
        onAct("member.restore", row.id, {
          reason: "이의 제기 수용 — 정지 해제",
        })
      }
    >
      정지 해제
    </button>
  ) : (
    <button className="tbtn no" disabled={busy} onClick={() => onSuspend(row)}>
      정지
    </button>
  );
}

/** 회원 상세 — 제재 판단에 필요한 것만. 실명·연락처는 보여주지 않는다 */
function MemberDetail({
  member,
  busy,
  onClose,
  onAct,
  onSuspend,
  onExpel,
}: {
  member: Member;
  busy: boolean;
  onClose: () => void;
  onAct: Act;
  /** 정지는 파괴적 조치라 바로 실행하지 않고 확인 다이얼로그부터 연다 */
  onSuspend: (member: Member) => void;
  /** 강제 탈퇴 — 복구 불가라 확인 다이얼로그 + 재인증 두 겹을 거친다 */
  onExpel: (member: Member) => void;
}) {
  const suspended = member.status === "정지";
  const expelled = member.status === "탈퇴";

  return (
    <Overlay onClose={onClose}>
      <div className="modal detail">
        <div className="dhd">
          <div className="dtags">
            <span
              className={
                expelled ? "bs neu" : suspended ? "bs no" : "bs ok"
              }
            >
              {member.status}
            </span>
            <span className="bs neu">{member.grade}</span>
            {member.verified ? <span className="bs ok">인증 회원</span> : null}
            <button className="dx" onClick={onClose} aria-label="닫기">
              <Icon name="x" />
            </button>
          </div>
          <h3>{member.nick}</h3>
          <div className="dmeta">
            {maskEmail(member.email)} · {member.joined} 가입 · 마지막 접속{" "}
            {member.lastSeen}
          </div>
        </div>

        <div className="dbody">
          <div className="evinfo">
            <div className="row">
              <span className="k">활동</span>
              <span className="v">{member.activity}</span>
            </div>
            <div className="row">
              <span className="k">받은 신고</span>
              <span className="v">{member.reported}회</span>
            </div>
            <div className="row">
              <span className="k">이메일 인증</span>
              <span className="v">{member.verified ? "완료" : "미완료"}</span>
            </div>
            <div className="row">
              <span className="k">등급 조정</span>
              <span className="v">
                {/* 증빙 승인 밖의 수동 보정 — 바꾸면 즉시 저장되고 이력에 남는다 */}
                <Select
                  className="rolesel"
                  value={member.grade}
                  ariaLabel={`${member.nick} 등급 조정`}
                  options={GRADES.map((grade) => ({
                    value: grade,
                    label: grade,
                  }))}
                  onChange={(next) => {
                    if (next === member.grade || expelled) return;
                    void onAct("member.grade", member.id, {
                      reason: `수동 등급 조정 — ${member.nick}`,
                      payload: { grade: next },
                    });
                  }}
                />
              </span>
            </div>
          </div>

          <div className="dfilings">
            <div className="dlabel">활동 이력</div>
            {member.history.map((item) => (
              <div className="dfiling" key={`${item.at}-${item.what}`}>
                <span style={{ color: "var(--ink-3)" }}>{item.what}</span>
                <span className="dt">{item.at}</span>
              </div>
            ))}
          </div>

          <div className="safenote" style={{ marginTop: 16, marginBottom: 0 }}>
            <span className="si">
              <Icon name="shield" />
            </span>
            <div>
              <b>실명·연락처는 조회할 수 없어요</b>
              <span>계정도 일부 가려서 보여줘요 — 제재 판단에 필요한 활동 기록만 제공돼요</span>
            </div>
          </div>
        </div>

        <div className="dacts">
          <span className="grow">제재하면 처리 기록에 남아요</span>
          <button className="btn line" onClick={onClose}>
            닫기
          </button>
          {expelled ? null : (
            <>
              <button
                className="btn line"
                disabled={busy}
                onClick={() =>
                  onAct("member.warn", member.id, {
                    reason: "커뮤니티 가이드 위반 — 경고",
                  })
                }
              >
                경고
              </button>
              <button
                className="btn primary"
                disabled={busy}
                onClick={() =>
                  suspended
                    ? onAct("member.restore", member.id, {
                        reason: "이의 제기 수용 — 정지 해제",
                      })
                    : onSuspend(member)
                }
              >
                {suspended ? "정지 해제" : "정지"}
              </button>
              <button
                className="btn danger"
                disabled={busy}
                onClick={() => onExpel(member)}
              >
                강제 탈퇴
              </button>
            </>
          )}
        </div>
      </div>
    </Overlay>
  );
}
