"use client";

import { actionsOf, badgeOf } from "@/lib/admin/reports";
import type { Report } from "@/lib/admin/seed";
import { Icon } from "@/components/Icon";
import { Overlay } from "./Overlay";

/**
 * 신고 상세 — 신고된 원문과 접수 내역을 보여준다.
 *
 * 시안에는 없던 화면이다. 목록만 있으면 제목만 보고 블라인드를 누르게 되는데,
 * 그건 운영 도구가 아니라 버튼일 뿐이다. 판단에 필요한 걸 보여주고 거기서 바로 조치한다.
 * 조치는 목록과 같은 경로(backoffice-frame 게이트)를 탄다.
 */
export function ReportDetail({
  report,
  busy,
  onClose,
  onAct,
}: {
  report: Report;
  busy: boolean;
  onClose: () => void;
  onAct: (tool: string) => void;
}) {
  return (
    <Overlay onClose={onClose}>
      <div className="modal detail">
        <div className="dhd">
          <div className="dtags">
            <span className="bs neu">{report.kind}</span>
            <span className={badgeOf(report.status)}>{report.status}</span>
            <span className="bs neu">신고 {report.count}회</span>
            <button className="dx" onClick={onClose} aria-label="닫기">
              <Icon name="x" />
            </button>
          </div>
          <h3>{report.target}</h3>
          <div className="dmeta">
            {report.author} · {report.at} 작성 · 신고 사유 {report.reason}
          </div>
        </div>

        <div className="dbody">
          <div className="dlabel">신고된 원문</div>
          <div className="dsrc">{report.body}</div>

          {report.note ? (
            <div
              className="safenote"
              style={{ marginTop: 14, marginBottom: 0 }}
            >
              <span className="si">
                <Icon name="alert" />
              </span>
              <div>
                <b>판단에 참고하세요</b>
                <span>{report.note}</span>
              </div>
            </div>
          ) : null}

          <div className="dfilings">
            <div className="dlabel">접수된 신고 {report.filings.length}건</div>
            {report.filings.map((filing) => (
              <div className="dfiling" key={`${filing.at}-${filing.by}`}>
                <span className="dw">{filing.by}</span>
                <span style={{ color: "var(--ink-3)" }}>{filing.reason}</span>
                <span className="dt">{filing.at}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="dacts">
          <span className="grow">조치하면 처리 기록에 남아요</span>
          <button className="btn line" onClick={onClose}>
            닫기
          </button>
          {actionsOf(report).map((action) => (
            <button
              key={action.tool}
              className={action.danger ? "btn primary" : "btn line"}
              disabled={busy}
              onClick={() => onAct(action.tool)}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </Overlay>
  );
}
