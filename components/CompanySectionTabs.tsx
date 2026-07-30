import Link from "next/link";

/**
 * 회사 리뷰 구획 탭 — 목록(/companies)과 비교(/compare)는 한 구획의 두 얼굴.
 * GNB에는 회사 리뷰 하나만 걸고, 화면 전환은 여기 탭이 맡는다.
 */
export function CompanySectionTabs({ active }: { active: "list" | "compare" }) {
  return (
    <div className="dtabs cotabs">
      <Link className={active === "list" ? "on" : undefined} href="/companies">
        회사 목록
      </Link>
      <Link
        className={active === "compare" ? "on" : undefined}
        href="/compare"
      >
        회사 비교
      </Link>
    </div>
  );
}
