import Link from "next/link";
import { Fragment } from "react";

/**
 * 브레드크럼 — 시안은 `<b>회사 리뷰</b> › 비교` 같은 **글자**였다.
 * 위치는 알려주는데 누르면 아무 일도 없어, 상위로 올라가려면 내비까지
 * 다시 올라가야 했다. 마지막 조각만 현재 위치로 남기고 나머지는 링크다.
 *
 * 홈은 항상 맨 앞에 둔다 — 페이지마다 시작점이 달라지면 경로로 안 읽힌다.
 */
export type CrumbItem = { label: string; href?: string };

export function Crumb({
  items,
  style,
}: {
  items: CrumbItem[];
  style?: React.CSSProperties;
}) {
  return (
    <nav className="crumb" aria-label="현재 위치" style={style}>
      <Link className="crumb-link" href="/">
        홈
      </Link>
      {items.map((item, index) => (
        <Fragment key={`${item.label}-${index}`}>
          <span className="crumb-sep" aria-hidden>
            ›
          </span>
          {item.href ? (
            <Link className="crumb-link" href={item.href}>
              {item.label}
            </Link>
          ) : (
            <span className="crumb-now" aria-current="page">
              {item.label}
            </span>
          )}
        </Fragment>
      ))}
    </nav>
  );
}
