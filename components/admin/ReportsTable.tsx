"use client";

import { useState } from "react";
import { SmoothHeight } from "@/components/ds/SmoothHeight";
import { useAdmin } from "@/lib/admin/useAdmin";
import {
  REASON,
  TABS,
  actionsOf,
  badgeOf,
  tabOf,
  type Tab,
} from "@/lib/admin/reports";
import type { Report } from "@/lib/admin/seed";
import { Icon } from "@/components/Icon";
import { StepUpModal } from "./StepUpModal";
import { ReportDetail } from "./ReportDetail";
import { ResultNote } from "./ResultNote";
import { ConfirmDialog } from "./ConfirmDialog";
import { SkRows, SkMcard, SkToolbar } from "./AdminSkeleton";
import {
  ColumnResizeProvider,
  GridToolbar,
  SortHeader,
  useFlipRows,
  useSortChain,
  useVisitedRows,
} from "./grid";

/**
 * 신고 처리 표 — 실제로 동작한다.
 *
 * 조치를 누르면 backoffice-frame이 권한 → step-up → 멱등을 순서대로 검사한다.
 * 재인증 전이면 STEP_UP_REQUIRED로 거절당하고 그때 모달이 열린다. 통과한 조치만
 * 이 브라우저의 오버레이에 반영되고 감사 기록에 남는다 — 서버로는 아무것도 안 간다.
 *
 * 블라인드·삭제·인증 취소는 되돌리기 어려운 조치라 실행 전 확인 다이얼로그를 한 번
 * 더 거친다(사유 수정 가능). step-up이 화면당 1회로 접힌 뒤에도 단일 클릭으로
 * 파괴적 조치가 나가지 않게 하는 장치다.
 *
 * 행을 누르면 신고된 원문이 열린다. 내용을 못 보면 블라인드할지 반려할지 판단할 수 없다.
 */
/* 신고 표 정렬 — "누적"은 숫자 그대로, 나머지는 글자순.
   심각도(누적 신고 수)로 훑고 유형으로 좁히는 게 실제 처리 순서다. */
const SORT_LABELS: Record<string, string> = {
  target: "신고 대상",
  kind: "유형",
  count: "누적",
  status: "상태",
};

const SORT_GETTERS: Record<string, (row: Report) => unknown> = {
  target: (row) => row.target,
  kind: (row) => row.kind,
  count: (row) => row.count,
  status: (row) => row.status,
};

/** 파괴적 조치의 확인 문구 — 무엇이 어떻게 되는지 대상 이름으로 말한다 */
const CONFIRM_DESC: Record<string, (target: string) => string> = {
  "report.blind": (target) =>
    `"${target}"이(가) 서비스 화면에서 가려져요. 복원하기 전까지 이용자에게 보이지 않아요.`,
  "report.delete": (target) =>
    `"${target}"이(가) 삭제 처리돼요. 이용자 화면에서 사라져요.`,
  "report.revoke": (target) =>
    `"${target}"의 실적 인증이 취소돼요. 작성 회원의 인증 표시가 사라져요.`,
};

/** 정렬 헤더 한 칸 — 다중 정렬 순번 계산이 매번 같아서 여기로 모은다 */
function Th({
  sortKey,
  label,
  sort,
}: {
  sortKey: string;
  label: string;
  sort: ReturnType<typeof useSortChain<Report>>;
}) {
  return (
    <SortHeader
      label={label}
      sortKey={sortKey}
      sort={sort.sortOf(sortKey)}
      onSort={sort.onSort}
      order={
        sort.chain.length > 1
          ? sort.chain.findIndex((e) => e.key === sortKey) + 1 || undefined
          : undefined
      }
    />
  );
}

type Confirm = {
  tool: string;
  ids: string[];
  title: string;
  desc: string;
  label: string;
  reason: string;
};

export function ReportsTable() {
  const [query, setQuery] = useState("");
  const admin = useAdmin();
  const [tab, setTab] = useState<Tab>("open");
  const [detail, setDetail] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<Confirm | null>(null);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());

  const state = admin.state;
  const all = state?.reports ?? [];
  const sort = useSortChain<Report>(SORT_GETTERS);
  const { visited, visit } = useVisitedRows("admin-reports-visited");

  const needle = query.trim().toLowerCase();
  const matched = all.filter(
    (row) =>
      tabOf(row) === tab &&
      (!needle ||
        `${row.target} ${row.reason} ${row.kind}`
          .toLowerCase()
          .includes(needle)),
  );
  const rows = sort.sortRows(matched);
  const registerRow = useFlipRows(rows);
  const open = state ? all.filter((row) => tabOf(row) === "open").length : 0;
  const current = detail
    ? (all.find((row) => row.id === detail) ?? null)
    : null;
  const selectedInTab = rows.filter((row) => selected.has(row.id));

  async function doAct(tool: string, ids: string[], reason?: string) {
    const res = await admin.actMany(tool, ids, {
      reason: reason ?? REASON[tool] ?? "운영자 조치",
    });
    if (res?.ok) {
      setDetail(null);
      setSelected((prev) => {
        const next = new Set(prev);
        for (const id of ids) next.delete(id);
        return next;
      });
    }
  }

  /** 조치 진입점 — 파괴적 조치는 확인 다이얼로그부터, 나머지는 바로 게이트로 */
  function requestAct(tool: string, row: Report, label: string) {
    const descOf = CONFIRM_DESC[tool];
    if (!descOf) {
      void doAct(tool, [row.id]);
      return;
    }
    setConfirm({
      tool,
      ids: [row.id],
      title: `${label}할까요?`,
      desc: descOf(row.target),
      label,
      reason: REASON[tool] ?? "운영자 조치",
    });
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

      {/* 목록과 같은 오버레이에서 센다 — 카드만 굳어 있으면 표와 숫자가 어긋난다 */}
      <div className="mrow">
        {state ? (
          <>
            <div className="mcard">
              <div className="mk">미처리</div>
              <div className="mv">
                {open} {open ? <small className="up">주의</small> : null}
              </div>
            </div>
            <div className="mcard">
              <div className="mk">전체 접수</div>
              <div className="mv">{all.length}</div>
            </div>
            <div className="mcard">
              <div className="mk">자동 블라인드</div>
              <div className="mv">
                {all.filter((row) => row.status === "임시 블라인드").length}
              </div>
            </div>
            <div className="mcard">
              <div className="mk">반려</div>
              <div className="mv">
                {all.filter((row) => row.status === "반려").length}
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
          <h4>신고 목록</h4>
          <div
            className="search"
            style={{ maxWidth: 220, flex: "none", marginLeft: "auto" }}
          >
            <Icon name="search" />
            <input
              value={query}
              placeholder="신고 대상, 사유 검색"
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <div className="seg" style={{ marginLeft: 0 }}>
            {TABS.map((item) => (
              <button
                key={item.key}
                className={tab === item.key ? "on" : undefined}
                onClick={() => setTab(item.key)}
              >
                {item.label}
                {item.key === "open" && open ? ` ${open}` : ""}
              </button>
            ))}
          </div>
        </div>
        {state ? (
          <GridToolbar
            total={all.length}
            filtered={rows.length}
            chain={sort.chain}
            labels={SORT_LABELS}
            onReset={sort.reset}
            selection={{
              count: selectedInTab.length,
              actions: (
                <button
                  className="tbtn no"
                  disabled={admin.busy}
                  onClick={() =>
                    setConfirm({
                      tool: "report.reject",
                      ids: selectedInTab.map((row) => row.id),
                      title: `${selectedInTab.length}건을 일괄 반려할까요?`,
                      desc: "선택한 신고가 전부 반려 처리돼요. 신고된 콘텐츠는 그대로 노출돼요.",
                      label: "일괄 반려",
                      reason: REASON["report.reject"],
                    })
                  }
                >
                  일괄 반려
                </button>
              ),
              onClear: () => setSelected(new Set()),
            }}
          />
        ) : (
          <SkToolbar />
        )}

        <SmoothHeight>
          <ColumnResizeProvider storageKey="admin-reports">
            <table className="dtable">
              {/* 컬럼 순서는 시안 그대로 둔다 — "사유"는 문장이라 정렬해도 의미가 없어
                정렬 가능 컬럼에서 뺀다. 심각도(누적)로 훑고 유형으로 좁히는 게 실제 처리 순서다. */}
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
                  <Th sortKey="target" label="신고 대상" sort={sort} />
                  <Th sortKey="kind" label="유형" sort={sort} />
                  <th>사유</th>
                  <Th sortKey="count" label="누적" sort={sort} />
                  <Th sortKey="status" label="상태" sort={sort} />
                  <th>조치</th>
                </tr>
              </thead>
              <tbody>
                {/* 4행 = 기본 탭(미처리) 시드 수 — loading.tsx 미러와 같은 실측값 */}
                {!state ? (
                  <SkRows cols={7} rows={4} rowHs={[52.2, 52.2, 52.2, 51.2]} />
                ) : null}
                {rows.map((row) => (
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
                        aria-label={`${row.target} 선택`}
                        checked={selected.has(row.id)}
                        onChange={() => toggleRow(row.id)}
                      />
                    </td>
                    <td className="prev">{row.target}</td>
                    <td>
                      <span className="bs neu">{row.kind}</span>
                    </td>
                    <td>{row.reason}</td>
                    <td>
                      <b>{row.count}</b>회
                    </td>
                    <td>
                      <span className={badgeOf(row.status)}>{row.status}</span>
                    </td>
                    {/* 조치는 행 클릭(상세 열기)과 겹치므로 전파를 막는다 */}
                    <td onClick={(event) => event.stopPropagation()}>
                      <div className="tact">
                        {actionsOf(row).map((action) => (
                          <button
                            key={action.tool}
                            className={action.danger ? "tbtn no" : "tbtn"}
                            disabled={admin.busy}
                            onClick={() =>
                              requestAct(action.tool, row, action.label)
                            }
                          >
                            {action.label}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
                {state && rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      style={{ padding: "34px 0", textAlign: "center" }}
                    >
                      <div style={{ fontWeight: 700, marginBottom: 4 }}>
                        {tab === "open"
                          ? "처리할 신고가 없어요"
                          : "처리한 신고가 아직 없어요"}
                      </div>
                      <div style={{ fontSize: 12.5, color: "var(--ink-3)" }}>
                        {tab === "open"
                          ? "새 신고가 접수되면 여기에 쌓여요"
                          : "미처리 탭에서 조치하면 여기로 옮겨져요"}
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
        <ReportDetail
          report={current}
          busy={admin.busy}
          onClose={() => setDetail(null)}
          onAct={(tool: string) => {
            const action = actionsOf(current).find(
              (item) => item.tool === tool,
            );
            requestAct(tool, current, action?.label ?? "조치");
          }}
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
            void doAct(target.tool, target.ids, reason);
          }}
        />
      ) : null}

      {admin.pending ? (
        <StepUpModal onCancel={admin.cancelPending} onVerified={admin.resume} />
      ) : null}
    </>
  );
}

export type { Report };
