"use client";

import { useEffect, useState } from "react";
import { Icon } from "./Icon";
import { SALES_AXES, type Company } from "@/lib/seed/companies";
import {
  loadMyReviews,
  scoreWithMine,
  subscribeMyReviews,
} from "@/lib/demo/reviews";

export function CompanyReviewCount({
  company,
}: {
  company: Pick<Company, "slug" | "reviewCount">;
}) {
  const [mine, setMine] = useState(0);

  useEffect(() => {
    const sync = () => setMine(loadMyReviews(company.slug).length);
    sync();
    return subscribeMyReviews(sync);
  }, [company.slug]);

  return <>{company.reviewCount + mine}</>;
}

export function CompanyReviewSummary({ company }: { company: Company }) {
  const [mine, setMine] = useState<ReturnType<typeof loadMyReviews>>([]);

  useEffect(() => {
    const sync = () => setMine(loadMyReviews(company.slug));
    sync();
    return subscribeMyReviews(sync);
  }, [company.slug]);

  const score = mine.length ? scoreWithMine(company, mine) : company.score;

  return (
    <div className="scorebox">
      <div className="big">{score.toFixed(1)}</div>
      <div className="stars">
        <StarBar score={score} />
      </div>
      <div className="cnt">
        전, 현직 영업직 리뷰 <b><CompanyReviewCount company={company} /></b>건
      </div>
      <div
        className="ratings"
        style={{
          marginTop: 16,
          paddingTop: 16,
          borderTop: "1px solid var(--line)",
        }}
      >
        {SALES_AXES.map((axis) => (
          <div className="rate" key={axis.key}>
            <span className="k">{axis.label}</span>
            <span className="bar">
              <span
                style={{ width: `${(company.axes[axis.key] / 5) * 100}%` }}
              />
            </span>
            <span className="v">{company.axes[axis.key].toFixed(1)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StarBar({ score }: { score: number }) {
  const stars = Array.from({ length: 5 });
  return (
    <span className="starbar">
      <span className="base">
        {stars.map((_, index) => (
          <Icon key={index} name="star" filled />
        ))}
      </span>
      <span className="fill" style={{ width: `${(score / 5) * 100}%` }}>
        {stars.map((_, index) => (
          <Icon key={index} name="star" filled />
        ))}
      </span>
    </span>
  );
}
