"use client";

import { useEffect, useRef, useState } from "react";
import { useAdmin } from "@/lib/admin/useAdmin";
import type { ToolResult } from "@/lib/admin/run";
import type { PolicyRow } from "@/lib/admin/seed";
import { Icon } from "@/components/Icon";
import { SkRegion } from "@/components/Skeleton";
import { toast } from "@/components/ds/Toaster";
import {
  POLICY_FOOT_NOTE,
  POLICY_GROUPS,
  POLICY_ROLES,
  PolicyMatrixSk,
  policyPermIconOf,
} from "./PolicyStatic";
import { StepUpModal } from "./StepUpModal";

/**
 * 권한 정책 — P1 역할별 권한 문법으로 편집한다.
 *
 * 매트릭스 표(역할 4열 × 권한 11행)는 "어느 칸을 눌러야 하는지"부터 헤맸다.
 * P1처럼 좌측에서 역할 하나를 고르고, 우측에서 그 역할이 할 수 있는 일을
 * 그룹별 토글로 켜고 끈다. 저장은 역할 옆 고정 슬롯 버튼 — 안 저장된 역할은
 * 레일에 점(앰버)이 남는다.
 *
 * 잠금·거절·완료 안내는 전부 우측 하단 토스트다 — 본문 배너는 레이아웃을
 * 흔들고 다음 클릭 때도 남아 있다(P1 안내 문법).
 *
 * 권한을 바꾸는 건 다른 모든 게이트의 근거를 바꾸는 일이라 저장에 재인증이
 * 붙는다. 익명 리뷰 작성자 조회만 화면에서 열 수 없다 — "설정으로 못 푸는
 * 것이 있다"는 게 이 화면이 보여줄 가장 중요한 사실이다.
 */

/** 게스트 인덱스 — pl-1(열람) 외에는 잠긴다. 서비스 쪽 게이트와 연동된 규칙 */
const GUEST = 0;
/** 최고 운영자 인덱스 — 권한을 뺄 수 없다(복구 불능 방지) */
const SUPER = 3;

function lockMessage(row: PolicyRow, roleIndex: number): string | null {
  if (row.locked) return row.lockNote ?? "이 권한은 화면에서 바꿀 수 없어요.";
  // 게스트는 열람만 — 작성·조치를 열어주면 익명 스팸을 막을 방법이 사라진다
  if (roleIndex === GUEST && row.id !== "pl-1")
    return "게스트에게는 열람 외 권한을 줄 수 없어요 — 계정 없이 쓴 글은 책임을 물을 수 없어요.";
  // 최고 운영자는 모든 권한을 가진다 — 여기서 빼면 복구할 사람이 없어진다
  if (roleIndex === SUPER)
    return "최고 운영자 권한은 뺄 수 없어요 — 잘못 잠갔을 때 되돌릴 사람이 없어져요.";
  return null;
}

export function PolicyMatrix() {
  const admin = useAdmin();
  const [draft, setDraft] = useState<PolicyRow[] | null>(null);
  const [sel, setSel] = useState(0);
  // 같은 결과를 두 번 토스트하지 않기 위한 마지막 처리분 기억
  const toasted = useRef<ToolResult | null>(null);

  useEffect(() => {
    if (admin.state) setDraft(admin.state.policy);
  }, [admin.state]);

  // 조치 결과 안내 — 배너(ResultNote) 대신 토스트. STEP_UP은 재인증 모달이
  // 이미 뜨므로 여기서 겹쳐 알리지 않는다.
  useEffect(() => {
    const res = admin.result;
    if (!res || toasted.current === res) return;
    toasted.current = res;
    if (!res.ok && res.code === "STEP_UP_REQUIRED") return;
    if (!res.ok) {
      toast(res.message, { tone: "error" });
      return;
    }
    // 멱등 재실행("이미 처리된 요청")은 저장 완료로 위장하지 않는다
    if (res.message.startsWith("이미")) {
      toast(res.message, { tone: "info" });
      return;
    }
    // run.ts 공용 템플릿("~를 적용했어요")은 조사·문맥이 이 화면과 안 맞아
    // 화면 카피로 대체한다 — 어디에 기록됐는지까지 한 문장으로.
    toast("권한 정책을 저장했어요 — 변경 내역은 처리 기록에 남았어요.", {
      tone: "success",
    });
  }, [admin.result]);

  if (!draft) {
    // 오버레이 도착 전 — 구조·라벨은 정적이라 실물 마크업 그대로 자리를 잡고
    // 데이터(토글 상태) 자리만 shimmer로 채운다(전환 시 크기 변화 0).
    return (
      <SkRegion label="권한 정책">
        <PolicyMatrixSk />
      </SkRegion>
    );
  }

  const saved = admin.state?.policy ?? [];
  const savedById = new Map(saved.map((row) => [row.id, row]));
  const byId = new Map(draft.map((row) => [row.id, row]));

  // 역할별 미저장 여부 — 레일의 앰버 점. 저장은 초안 전체가 한 번에 나간다
  const dirtyByRole = POLICY_ROLES.map((_, roleIndex) =>
    draft.some(
      (row) =>
        savedById.get(row.id)?.grants[roleIndex] !== row.grants[roleIndex],
    ),
  );
  const changed = draft.filter(
    (row) =>
      JSON.stringify(row.grants) !==
      JSON.stringify(savedById.get(row.id)?.grants),
  );
  const dirty = changed.length > 0;

  const role = POLICY_ROLES[sel];

  function toggle(row: PolicyRow) {
    const locked = lockMessage(row, sel);
    if (locked) {
      // 잠금 안내는 본문이 아니라 토스트 — 시선 흐름을 안 끊고 스스로 사라진다
      toast(locked, { tone: "info" });
      return;
    }
    setDraft(
      draft!.map((item) =>
        item.id === row.id
          ? {
              ...item,
              grants: item.grants.map((grant, index) =>
                index === sel ? (grant === "yes" ? "no" : "yes") : grant,
              ) as PolicyRow["grants"],
            }
          : item,
      ),
    );
  }

  function save() {
    void admin.act("policy.save", "matrix", {
      reason: `권한 변경 — ${changed.map((row) => row.label).join(", ")}`,
      payload: {
        policy: draft,
        summary: changed.map((row) => row.label).join(", ") || "역할별 권한",
      },
    });
  }

  return (
    <>
      <div className="polgrid">
        {/* 좌: 역할 레일 — 고르면 우측이 그 역할의 권한 목록으로 바뀐다 */}
        <div className="polroles">
          {POLICY_ROLES.map((item, index) => (
            <button
              key={item.name}
              type="button"
              className={index === sel ? "polrole on" : "polrole"}
              onClick={() => setSel(index)}
            >
              <Icon name={item.icon} />
              <span className="prname">{item.name}</span>
              {dirtyByRole[index] ? (
                <span className="pdot" aria-label="저장 안 됨" />
              ) : null}
            </button>
          ))}
        </div>

        {/* 우: 선택 역할의 권한 토글 — 저장 버튼은 고정 슬롯(시프트 없음) */}
        <div className="polcard">
          <div className="polhead">
            <span className="ric">
              <Icon name={role.icon} />
            </span>
            <div className="pht">
              <b>
                {role.name} <span>{role.sub}</span>
              </b>
              <span className="psub">{role.note}</span>
            </div>
            <button
              className={
                dirty ? "btn primary sm polsave" : "btn line sm polsave"
              }
              disabled={!dirty || admin.busy}
              onClick={save}
            >
              저장
            </button>
          </div>

          <div className="polbody">
            <div className="polcols">
              {POLICY_GROUPS.map((group) => {
                const rows = group.ids
                  .map((id) => byId.get(id))
                  .filter((row): row is PolicyRow => Boolean(row));
                const onCount = rows.filter(
                  (row) => row.grants[sel] === "yes",
                ).length;
                return (
                  <section className="polgroup" key={group.name}>
                    <p className="pgh">
                      <Icon name={group.icon} /> {group.name}
                      <span className="pcount">
                        {onCount}/{rows.length}
                      </span>
                    </p>
                    <div className="pgrows">
                      {rows.map((row) => {
                        const on = row.grants[sel] === "yes";
                        const locked = lockMessage(row, sel) != null;
                        const cond = on ? row.cond?.[sel] : undefined;
                        return (
                          <div
                            className={locked ? "polrow is-locked" : "polrow"}
                            key={row.id}
                          >
                            <span className="plab">
                              <Icon name={policyPermIconOf(row)} />
                              <span className="plt">{row.label}</span>
                              {cond ? (
                                <span className="pcond">{cond}</span>
                              ) : null}
                            </span>
                            <button
                              type="button"
                              role="switch"
                              aria-checked={on}
                              aria-disabled={locked}
                              aria-label={row.label}
                              className={on ? "ptog on" : "ptog"}
                              onClick={() => toggle(row)}
                              title={
                                locked
                                  ? "잠긴 권한이에요"
                                  : "눌러서 허용/차단 전환"
                              }
                            >
                              <span className="knob" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
            <p className="polfoot">
              <Icon name="lock" /> {POLICY_FOOT_NOTE}
            </p>
          </div>
        </div>
      </div>

      {admin.pending ? (
        <StepUpModal onCancel={admin.cancelPending} onVerified={admin.resume} />
      ) : null}
    </>
  );
}
