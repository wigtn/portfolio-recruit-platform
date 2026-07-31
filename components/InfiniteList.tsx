"use client";

import { useEffect, useState } from "react";

/**
 * 무한 스크롤 — 목록 화면이 공통으로 쓰는 한 벌.
 *
 * 목록마다 관찰자를 새로 짜면 임계값·배치 크기가 화면마다 달라지고, 어떤
 * 화면은 끝을 알리지 않은 채 조용히 멈춘다. 스크롤로 더 불러오는 규칙은
 * 한 곳에만 둔다.
 *
 * 설계에서 지키는 것 세 가지:
 * - **끝을 말한다.** 다 불러오면 "여기까지"를 표시한다. 아무 말 없이 멈추면
 *   사용자는 더 있는데 안 나오는 건지 끝인 건지 알 수 없다.
 * - **한 화면 앞서 부른다.** 바닥에 닿고 나서 부르면 빈 화면을 보게 된다.
 * - **키보드·스크린리더도 끝까지 간다.** 관찰자만 두면 스크롤하지 않는
 *   사용자는 영영 다음 배치를 못 본다. 그래서 "더 보기" 버튼을 같이 둔다.
 */
export function useInfiniteCount(
  total: number,
  { step = 12, initial = 12 }: { step?: number; initial?: number } = {},
) {
  const [count, setCount] = useState(() => Math.min(initial, total));

  /* 관찰 지점은 ref 객체가 아니라 **콜백 ref**로 잡는다.
     목록 화면은 목 로딩이 끝난 뒤에야 발치를 렌더한다. ref 객체를 쓰면 관찰자
     effect가 먼저 돌면서 node가 null이라 그냥 빠져나가고, 나중에 발치가
     마운트돼도 의존성(count·total)이 그대로라 effect가 다시 돌지 않는다 —
     관찰자가 영영 안 붙어서 스크롤해도 아무 일이 없다. 노드 자체를 상태로
     들면 마운트되는 순간이 곧 의존성 변화가 된다. */
  const [sentinel, setSentinel] = useState<HTMLDivElement | null>(null);

  // 필터가 바뀌어 목록이 갈아엎히면 처음부터 다시 — 3배치를 본 상태로
  // 새 결과를 보여주면 방금 거른 조건과 어긋난 양이 한꺼번에 쏟아진다
  useEffect(() => {
    setCount(Math.min(initial, total));
  }, [total, initial]);

  const more = () => setCount((current) => Math.min(current + step, total));

  useEffect(() => {
    if (!sentinel || count >= total) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) more();
      },
      // 바닥 한 화면 전에 미리 — 스크롤이 끊기지 않게
      { rootMargin: "600px 0px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sentinel, count, total, step]);

  return { count, sentinelRef: setSentinel, more, done: count >= total };
}

/**
 * 목록 발치 — 더 부를 자리이자 끝을 알리는 자리.
 *
 * `label`은 "공고", "리뷰"처럼 세는 단위다. 숫자만 두면 무엇이 몇 개인지
 * 스크린리더에서 읽히지 않는다.
 */
export function InfiniteFoot({
  count,
  total,
  done,
  label,
  sentinelRef,
  onMore,
}: {
  count: number;
  total: number;
  done: boolean;
  label: string;
  /** useInfiniteCount가 주는 콜백 ref */
  sentinelRef: (node: HTMLDivElement | null) => void;
  onMore: () => void;
}) {
  return (
    <div className="inf-foot">
      {/* 관찰 지점은 항상 둔다 — 끝났을 때만 버튼을 감춘다 */}
      <div ref={sentinelRef} aria-hidden className="inf-sentinel" />
      {done ? (
        <p className="inf-end" role="status">
          {label} {total}건을 모두 봤어요
        </p>
      ) : (
        <>
          <p className="inf-count" role="status" aria-live="polite">
            {label} {total}건 중 {count}건
          </p>
          <button type="button" className="btn line sm" onClick={onMore}>
            더 보기
          </button>
        </>
      )}
    </div>
  );
}
