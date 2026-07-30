"use client";

import Link from "next/link";
import { type CSSProperties, useEffect, useMemo, useState } from "react";
import { loadState } from "@/lib/admin/overlay";
import { keywordHref } from "@/lib/seed/feed";
import { Icon } from "./Icon";

type Keyword = {
  rank: number;
  word: string;
  delta: "up" | "down" | "same" | "new";
  value: string;
};

const ORDER_CYCLES = [
  [0, 1, 2, 3, 4],
  [0, 2, 1, 4, 3],
  [1, 0, 2, 3, 4],
  [1, 2, 0, 4, 3],
] as const;

function currentTime() {
  return new Intl.DateTimeFormat("ko-KR", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date());
}

export function LiveKeywords({ keywords: source }: { keywords: Keyword[] }) {
  const [cycle, setCycle] = useState(0);
  const [updatedAt, setUpdatedAt] = useState("");
  // 큐레이션 "제외 키워드" — 운영자가 뺀 키워드는 집계에 올리지 않는다.
  // 이 필터가 없으면 백오피스의 제외 조치가 어디에도 나타나지 않는 거짓 기능이 된다.
  const [blocked, setBlocked] = useState<string[]>([]);

  useEffect(() => {
    setBlocked(loadState().curation.blockedKeywords);
    const updateClock = () => setUpdatedAt(currentTime());
    updateClock();
    const clock = window.setInterval(updateClock, 30_000);
    const ranking = window.setInterval(
      () => setCycle((value) => value + 1),
      5_000,
    );
    return () => {
      window.clearInterval(clock);
      window.clearInterval(ranking);
    };
  }, []);

  const keywords = useMemo(
    () => source.filter((item) => !blocked.includes(item.word)),
    [source, blocked],
  );

  const { ordered, previousPositions } = useMemo(() => {
    const order = ORDER_CYCLES[cycle % ORDER_CYCLES.length];
    const previous =
      ORDER_CYCLES[(cycle - 1 + ORDER_CYCLES.length) % ORDER_CYCLES.length];
    return {
      ordered: order.map((index) => keywords[index]).filter(Boolean),
      previousPositions: new Map<number, number>(
        previous.map((keywordIndex, position) => [keywordIndex, position]),
      ),
    };
  }, [cycle, keywords]);

  return (
    <div className="card live-keywords">
      <h4>
        <span className="live-keywords-title">
          <i aria-hidden />
          실시간 인기 키워드
        </span>
        <span className="mini">{updatedAt || "현재 시각 확인 중"}</span>
      </h4>
      <div className="trend" aria-live="polite" aria-atomic="true">
        {ordered.map((item, index) => {
          const sourceIndex = keywords.indexOf(item);
          const previousPosition = previousPositions.get(sourceIndex) ?? index;
          const movement =
            cycle === 0
              ? item.delta
              : previousPosition > index
                ? "up"
                : previousPosition < index
                  ? "down"
                  : "same";
          const distance = Math.abs(previousPosition - index);

          return (
            <Link
              className={`tr live-tr move-${movement}`}
              key={`${cycle}-${item.word}`}
              href={keywordHref(item.word)}
              style={{ "--row-delay": `${index * 45}ms` } as CSSProperties}
            >
              <span className="rk">{index + 1}</span>
              <span className="kw">{item.word}</span>
              <span className={`dir ${movement}`}>
                {movement === "up" ? <Icon name="up" /> : null}
                {movement === "down" ? <Icon name="down" /> : null}
                {movement === "new"
                  ? "NEW"
                  : movement === "same"
                    ? "—"
                    : distance || item.value}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
