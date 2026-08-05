"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRole, ROLE_LABEL } from "@/lib/demo/role";
import { RoleModal } from "@/components/demo/RoleModal";
import { Icon } from "@/components/Icon";
import DashboardSk from "@/app/admin/loading";
import AiSk from "@/app/admin/ai/loading";
import AuditSk from "@/app/admin/audit/loading";
import BadgesSk from "@/app/admin/badges/loading";
import CompaniesSk from "@/app/admin/companies/loading";
import CurationSk from "@/app/admin/curation/loading";
import InquiriesSk from "@/app/admin/inquiries/loading";
import JobsSk from "@/app/admin/jobs/loading";
import MembersSk from "@/app/admin/members/loading";
import NoticesSk from "@/app/admin/notices/loading";
import PoliciesSk from "@/app/admin/policies/loading";
import QuestionsSk from "@/app/admin/questions/loading";
import ReportsSk from "@/app/admin/reports/loading";

/**
 * 백오피스 열람 게이트 — 운영자가 아니면 화면 자체를 열지 않는다.
 *
 * 조치는 이미 backoffice-frame이 PERMISSION_DENIED로 거절하지만, 실제 백오피스는
 * 열람부터 막는다 — 신고 원문·회원 활동 내역은 게스트에게 보여줄 것이 아니다.
 * 막힌 화면에서 바로 역할을 바꿔볼 수 있게 전환 CTA를 함께 둔다(데모의 요점).
 *
 * 역할은 localStorage에서 마운트 후 올라오므로, 판정 전 첫 프레임은 스켈레톤이다 —
 * 운영자에게 차단 화면이, 게스트에게 관리자 화면이 스치면 안 된다.
 */
/**
 * 판정 전 프레임의 화면별 미러 — 각 라우트 loading.tsx와 **같은 컴포넌트**를
 * 쓴다. 게이트가 범용 스켈레톤(5열 표)을 내면 화면마다 도착 순간 수십 px씩
 * 밀렸다 — 지금 경로의 실제 구조를 미러링해야 크기 변화 0이 된다.
 * 최장 prefix가 이기도록 /admin을 맨 뒤에 둔다.
 */
const ROUTE_SK: Array<[string, () => React.JSX.Element]> = [
  ["/admin/ai", AiSk],
  ["/admin/audit", AuditSk],
  ["/admin/badges", BadgesSk],
  ["/admin/companies", CompaniesSk],
  ["/admin/curation", CurationSk],
  ["/admin/inquiries", InquiriesSk],
  ["/admin/jobs", JobsSk],
  ["/admin/members", MembersSk],
  ["/admin/notices", NoticesSk],
  ["/admin/policies", PoliciesSk],
  ["/admin/questions", QuestionsSk],
  ["/admin/reports", ReportsSk],
  ["/admin", DashboardSk],
];

export function AdminGate({ children }: { children: React.ReactNode }) {
  const { role } = useRole();
  const pathname = usePathname();
  // RoleProvider의 저장값 복원(부모 effect)은 이 컴포넌트의 effect보다 늦게 돌지만,
  // 같은 커밋의 effect flush 안에서 함께 배치돼 ready=true 렌더에는 실제 역할이 온다.
  const [ready, setReady] = useState(false);
  useEffect(() => {
    // 검증 훅 — ?skfreeze로 열면 스켈레톤에 머문다. 미러와 실물의 기하를
    // 같은 조건(폰트 로딩 완료 후)에서 재는 유일한 방법이라 남겨 둔다.
    if (window.location.search.includes("skfreeze")) return;
    setReady(true);
  }, []);

  if (!ready) {
    const Mirror =
      ROUTE_SK.find(
        ([prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`),
      )?.[1] ?? DashboardSk;
    return <Mirror />;
  }

  if (role !== "admin") {
    return <GateModal role={role} pathname={pathname} />;
  }

  return <>{children}</>;
}

/**
 * 차단 안내 — 본문 문서가 아니라 **오버레이 모달**이다(사용자 지시).
 * 뒤에는 해당 화면의 스켈레톤을 깔아 "여기 뭔가 있다"는 맥락을 주되,
 * 내용은 없으니 아무것도 새지 않는다. 첫 행동(운영자로 로그인)은 원클릭.
 */
function GateModal({
  role,
  pathname,
}: {
  role: "guest" | "member";
  pathname: string;
}) {
  const { setRole } = useRole();
  const [picker, setPicker] = useState(false);

  const Mirror =
    ROUTE_SK.find(
      ([prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    )?.[1] ?? DashboardSk;

  return (
    <>
      {/* 뒤판 — 지금 경로의 스켈레톤. 모달이 주인공이라 조작 불가로 잠근다 */}
      <div aria-hidden style={{ pointerEvents: "none" }}>
        <Mirror />
      </div>

      {picker ? <RoleModal onClose={() => setPicker(false)} /> : null}

      {!picker &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="modalwrap" role="dialog" aria-modal="true">
            <div className="modal gatemodal">
              {/* 아이콘·제목·설명을 한 축(왼쪽)에 — 가운데 정렬 문단 두 개는
                  같은 말을 두 번 하며 줄바꿈만 어색하게 갈랐다 */}
              <div className="gatemodal-head">
                <span className="gate-ic">
                  <Icon name="lock" />
                </span>
                <div>
                  <h3>운영자 전용 화면이에요</h3>
                  <p>
                    신고 원문, 회원 활동 같은 운영 정보는 운영자만 볼 수 있어요.
                  </p>
                </div>
              </div>

              {/* "역할이 곧 권한"은 글이 아니라 그림으로 — 지금 역할에서
                  운영자로 건너가면 열린다는 걸 칩 스트립이 말한다 */}
              <div className="gatemodal-roles">
                <span className="gatemodal-roles-k">지금 역할</span>
                <span className="rolechip">{ROLE_LABEL[role]}</span>
                <Icon name="arrow" />
                <span className="rolechip is-target">
                  <Icon name="shield" />
                  운영자
                </span>
                <span className="gatemodal-roles-hint">
                  이 데모는 로그인 대신 역할만 바꿔요
                </span>
              </div>

              <button
                className="btn primary gatemodal-cta"
                onClick={() => setRole("admin")}
              >
                운영자로 로그인
                <Icon name="arrow" />
              </button>
              <div className="gatemodal-foot">
                <button className="gate-other" onClick={() => setPicker(true)}>
                  <Icon name="swap" />
                  다른 계정으로 로그인
                </button>
                <Link className="gatemodal-exit" href="/">
                  사용자 화면으로 돌아가기
                </Link>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
