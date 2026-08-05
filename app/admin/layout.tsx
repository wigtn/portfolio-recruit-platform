import { AdminGate } from "@/components/admin/AdminGate";
import { AdminShell, type AdminNavGroup } from "@/components/admin/AdminShell";
import { RouteMotion } from "@/components/demo/RouteMotion";

/**
 * 관리자 셸 — P1 StaffShell 구조(components/admin/AdminShell.tsx)로 재조립.
 * 사이드바 11메뉴는 4그룹(운영 / 회원·인증 / 콘텐츠·데이터 / 감사·보안)으로 통일.
 *
 * 레이아웃(서버)은 내비 데이터만 소유한다 — 접기·드로어·활성 판정 같은
 * 상태는 전부 클라이언트 셸의 일이다(P1의 layout → StaffShell 분업 그대로).
 */
const GROUPS: AdminNavGroup[] = [
  {
    title: "운영",
    items: [
      { href: "/admin", icon: "chart", label: "대시보드" },
      { href: "/admin/ai", icon: "bot", label: "AI 운영" },
      {
        href: "/admin/reports",
        icon: "flag",
        label: "신고 처리",
        count: "reports",
      },
    ],
  },
  {
    title: "회원, 인증",
    items: [
      { href: "/admin/members", icon: "users", label: "회원 관리" },
      {
        href: "/admin/badges",
        icon: "award",
        label: "증빙 검토",
        count: "evidence",
      },
      {
        href: "/admin/inquiries",
        icon: "mail",
        label: "1:1 문의",
        count: "inquiries",
      },
    ],
  },
  {
    title: "콘텐츠, 데이터",
    items: [
      {
        href: "/admin/questions",
        icon: "comment",
        label: "질문 관리",
        // NavCount는 "questions"를 실제로 센다. AdminShell의 count 유니언은
        // 타 소유 파일이라 아직 안 넓혀졌다 — 유니언에 "questions"가 추가되면
        count: "questions",
      },
      { href: "/admin/companies", icon: "building", label: "회사 관리" },
      { href: "/admin/jobs", icon: "trending", label: "채용공고" },
      { href: "/admin/curation", icon: "layout", label: "큐레이션" },
      { href: "/admin/notices", icon: "notice", label: "공지, 정책" },
    ],
  },
  {
    title: "감사, 보안",
    items: [
      { href: "/admin/audit", icon: "doc", label: "처리 기록" },
      { href: "/admin/policies", icon: "lock", label: "권한 정책" },
    ],
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminShell groups={GROUPS}>
      {/* 열람 게이트가 셸 안쪽에 있다 — 사이드바는 남겨 "여기가 백오피스"라는 맥락을 유지한다 */}
      <RouteMotion>
        <AdminGate>{children}</AdminGate>
      </RouteMotion>
    </AdminShell>
  );
}
