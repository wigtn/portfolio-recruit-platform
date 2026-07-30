"use client";

import { useEffect, useRef, useState } from "react";
import { Select } from "./ds/Select";
import { COMPANIES, SALES_AXES, type Company } from "@/lib/seed/companies";
import { Icon } from "./Icon";
import { NumberTicker } from "./NumberTicker";

/**
 * 회사 비교 — 두 회사를 같은 항목으로 나란히 놓는다.
 *
 * 두 가지 모드로 쓴다.
 * - 홈(`interactive={false}`): **대표 예시 한 벌**. 고르는 UI 없이 기능이
 *   무엇인지만 보여준다. 화면에 들어오면 막대가 차오르고 수치가 올라간다.
 * - 비교 페이지(`interactive`): 두 회사를 직접 골라 비교한다.
 *
 * 나열은 비교가 아니다 — 같은 축을 옆에 두고 어느 쪽이 위인지 바로 보여야 한다.
 *
 * 승패 표시에서 주의할 점: `성과압박`은 `reverse` 축이라 **낮을수록 좋다.**
 * 이걸 놓치면 압박이 심한 회사가 이긴 것처럼 칠해진다.
 */
type Row = {
  label: string;
  left: number;
  right: number;
  /** 화면에 쓰는 문자열(연봉처럼 숫자 그대로 못 쓰는 경우) */
  leftText?: string;
  rightText?: string;
  /** 낮을수록 좋은 항목 */
  reverse?: boolean;
  /** 5점 척도 막대를 그릴지 */
  bar?: boolean;
  note?: string;
  /** 표시 소수 자릿수. 평점·축은 1자리, 건수는 0자리 */
  decimals?: number;
};

function buildRows(a: Company, b: Company): Row[] {
  const money = (c: Company) =>
    `${c.salaryLow.toLocaleString()}~${c.salaryHigh.toLocaleString()}`;
  return [
    { label: "평점", left: a.score, right: b.score, decimals: 1 },
    {
      label: "영업직 연봉",
      left: (a.salaryLow + a.salaryHigh) / 2,
      right: (b.salaryLow + b.salaryHigh) / 2,
      leftText: money(a),
      rightText: money(b),
      note: "만원",
    },
    {
      label: "리뷰",
      left: a.reviewCount,
      right: b.reviewCount,
      leftText: a.reviewCount.toLocaleString(),
      rightText: b.reviewCount.toLocaleString(),
      note: "건",
    },
    ...SALES_AXES.map((axis) => ({
      label: axis.label,
      left: a.axes[axis.key],
      right: b.axes[axis.key],
      reverse: "reverse" in axis ? Boolean(axis.reverse) : false,
      bar: true,
      decimals: 1,
    })),
  ];
}

function winner(row: Row): "left" | "right" | null {
  if (row.left === row.right) return null;
  const leftWins = row.reverse ? row.left < row.right : row.left > row.right;
  return leftWins ? "left" : "right";
}

function Picker({
  value,
  exclude,
  onChange,
  side,
}: {
  value: Company;
  exclude: string;
  onChange: (slug: string) => void;
  side: string;
}) {
  return (
    <div className="cmp-pick">
      <span className="cmp-picktop">
        <span className="cmp-logo">
          <img src={value.logo} alt="" />
        </span>
        <Select
          className="cmp-select2"
          searchable
          searchPlaceholder="회사 검색"
          ariaLabel={`${side} 회사 선택`}
          value={value.slug}
          onChange={onChange}
          options={COMPANIES.filter((c) => c.slug !== exclude).map((c) => ({
            value: c.slug,
            label: c.name,
            sub: `${c.industry} · ${c.region}`,
          }))}
        />
      </span>
      <small>
        {value.industry} · {value.region}
      </small>
      {/* 어포던스 — 이름이 곧 셀렉트라는 걸 모르는 사람을 위한 한 줄 */}
      <span className="cmp-pickhint">
        <Icon name="swap" />
        눌러서 회사 바꾸기
      </span>
    </div>
  );
}

/** 수치는 굴러 올라온다 — 값이 도착했다는 걸 알리는 신호다 */
function Value({
  value,
  decimals,
  live,
}: {
  value: number;
  decimals: number;
  live: boolean;
}) {
  if (!live) return <>{(0).toFixed(decimals)}</>;
  return (
    <NumberTicker
      value={value}
      format={(v) =>
        decimals > 0 ? v.toFixed(decimals) : Math.round(v).toLocaleString()
      }
    />
  );
}

/** 고를 수 없는 자리 — 예시에는 셀렉트 화살표가 없어야 한다 */
function Fixed({ value }: { value: Company }) {
  return (
    <div className="cmp-pick">
      <span className="cmp-picktop">
        <span className="cmp-logo">
          <img src={value.logo} alt="" />
        </span>
        <b className="cmp-name">{value.name}</b>
      </span>
      <small>
        {value.industry} · {value.region}
      </small>
    </div>
  );
}

export function CompanyCompare({
  interactive = false,
  animate = false,
  initial = [COMPANIES[0].slug, COMPANIES[1].slug],
}: {
  /** 회사를 고를 수 있게 할지 — 홈은 예시라 고르지 않는다 */
  interactive?: boolean;
  /** 화면에 들어올 때 막대·수치를 살릴지 */
  animate?: boolean;
  initial?: [string, string];
}) {
  const [leftSlug, setLeftSlug] = useState(initial[0]);
  const [rightSlug, setRightSlug] = useState(initial[1]);
  // animate가 아니면 처음부터 최종 상태다(비교 페이지는 값이 바로 보여야 한다)
  const [live, setLive] = useState(!animate);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!animate) return;
    const node = rootRef.current;
    if (!node) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setLive(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setLive(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [animate]);

  const left = COMPANIES.find((c) => c.slug === leftSlug) ?? COMPANIES[0];
  const right = COMPANIES.find((c) => c.slug === rightSlug) ?? COMPANIES[1];
  const rows = buildRows(left, right);

  return (
    <div className={live ? "cmp is-live" : "cmp"} ref={rootRef}>
      <div className="cmp-head">
        {interactive ? (
          <Picker
            value={left}
            exclude={right.slug}
            side="왼쪽"
            onChange={setLeftSlug}
          />
        ) : (
          <Fixed value={left} />
        )}
        <span className="cmp-vs" aria-hidden>
          vs
        </span>
        {interactive ? (
          <Picker
            value={right}
            exclude={left.slug}
            side="오른쪽"
            onChange={setRightSlug}
          />
        ) : (
          <Fixed value={right} />
        )}
      </div>

      <dl className="cmp-rows">
        {rows.map((row, index) => {
          const win = winner(row);
          return (
            <div className="cmp-row" key={row.label}>
              <dd className={win === "left" ? "cmp-v is-win" : "cmp-v"}>
                <b>
                  {row.leftText ?? (
                    <Value
                      value={row.left}
                      decimals={row.decimals ?? 0}
                      live={live}
                    />
                  )}
                </b>
                {row.note ? <small>{row.note}</small> : null}
                {row.bar ? (
                  <span className="cmp-bar">
                    <span
                      style={{
                        width: live ? `${(row.left / 5) * 100}%` : "0%",
                        transitionDelay: `${index * 70}ms`,
                      }}
                    />
                  </span>
                ) : null}
              </dd>
              <dt className="cmp-k">
                {row.label}
                {row.reverse ? <em>낮을수록 좋음</em> : null}
              </dt>
              <dd className={win === "right" ? "cmp-v is-win" : "cmp-v"}>
                <b>
                  {row.rightText ?? (
                    <Value
                      value={row.right}
                      decimals={row.decimals ?? 0}
                      live={live}
                    />
                  )}
                </b>
                {row.note ? <small>{row.note}</small> : null}
                {row.bar ? (
                  <span className="cmp-bar">
                    <span
                      style={{
                        width: live ? `${(row.right / 5) * 100}%` : "0%",
                        transitionDelay: `${index * 70}ms`,
                      }}
                    />
                  </span>
                ) : null}
              </dd>
            </div>
          );
        })}
      </dl>
    </div>
  );
}
