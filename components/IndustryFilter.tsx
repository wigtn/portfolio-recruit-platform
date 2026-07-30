"use client";

import { useRouter } from "next/navigation";
import { Select } from "./ds/Select";

/**
 * 업종 필터 — 고정 pill 나열을 검색·선택형 드롭다운으로.
 *
 * 업종이 6개를 넘어 늘어나면 pill 줄은 접히고, 원하는 업종을 눈으로
 * 찾아야 한다. 드롭다운은 검색으로 바로 좁히고, 업종별 회사 수를
 * sub로 보여줘 "고르기 전에 무엇이 몇 개인지"를 알려준다.
 */
export function IndustryFilter({
  value,
  items,
  q,
  sort,
}: {
  value: string;
  items: Array<{ name: string; count: number }>;
  q: string;
  sort: string;
}) {
  const router = useRouter();
  return (
    <Select
      className="industry-select"
      value={value}
      ariaLabel="업종 선택"
      searchable
      searchPlaceholder="업종 검색"
      options={items.map((item) => ({
        value: item.name,
        label: item.name,
        sub: `${item.count}곳`,
      }))}
      onChange={(next) => {
        router.push(
          `/companies?${new URLSearchParams({ industry: next, q, sort })}`,
        );
      }}
    />
  );
}
