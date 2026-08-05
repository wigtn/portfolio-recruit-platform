"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Company } from "@/lib/seed/companies";
import { CompanyReviewCount } from "./CompanyReviewSummary";

/**
 * 기업 상세 리뷰/연봉 탭 — 서버 내비게이션 없이 즉시 전환.
 *
 * 탭이 Link(?tab=)였을 때는 클릭마다 서버 왕복 + 페이지 전환 모션이 통째로
 * 다시 돌아 무거웠다. 패널 둘 다 서버가 미리 그려 내려주고, 여기는 보여줄
 * 쪽만 고른다 — 전환은 위치 이동 없는 짧은 페이드 하나뿐이다.
 * 깊은 링크(?tab=salary)는 초기값으로만 쓰고, 전환 시 주소만 조용히 맞춘다.
 *
 * 프로필 밴드(로고·팔로우)와 좌측 통계 카드는 서버 렌더 그대로 children으로
 * 받는다 — 클라이언트는 어느 패널을 보일지만 안다.
 */
export function CompanyTabs({
  slug,
  initial,
  company,
  salaryCount,
  header,
  scorebox,
  reviews,
  salary,
}: {
  slug: string;
  initial: "reviews" | "salary";
  company: Pick<Company, "slug" | "reviewCount">;
  salaryCount: number;
  header: React.ReactNode;
  scorebox: React.ReactNode;
  reviews: React.ReactNode;
  salary: React.ReactNode;
}) {
  const [tab, setTab] = useState<"reviews" | "salary">(initial);

  // 링크 내비게이션(?tab=)도 탭을 바꾼다 — 연봉 탭 안의 "리뷰 전체 보기"
  // 같은 내부 링크가 상태를 두고 주소만 바꾸는 문제를 막는다
  const params = useSearchParams();
  useEffect(() => {
    setTab(params.get("tab") === "salary" ? "salary" : "reviews");
  }, [params]);

  const pick = (next: "reviews" | "salary") => {
    if (next === tab) return;
    setTab(next);
    // 서버 왕복 없이 주소만 동기화 — 새로고침·공유 시 같은 탭이 열린다
    window.history.replaceState(
      null,
      "",
      next === "salary"
        ? `/companies/${slug}?tab=salary`
        : `/companies/${slug}`,
    );
  };

  return (
    <>
      <div className="cprofile">
        {header}
        <div className="dtabs">
          <button
            type="button"
            className={tab === "reviews" ? "on" : undefined}
            onClick={() => pick("reviews")}
          >
            리뷰{" "}
            <span className="ct">
              <CompanyReviewCount company={company} />
            </span>
          </button>
          <button
            type="button"
            className={tab === "salary" ? "on" : undefined}
            onClick={() => pick("salary")}
          >
            연봉 <span className="ct">{salaryCount}</span>
          </button>
        </div>
      </div>

      <div className="sec">
        <div className="statgrid">
          {scorebox}
          <div className="reviewbox">
            {/* key로 리마운트 — 페이드만 다시 돈다(이동·크기 변화 없음) */}
            <div className="tabfade" key={tab}>
              {tab === "salary" ? salary : reviews}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
