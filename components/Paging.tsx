"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

/**
 * 페이지 이동 — 화면을 **전혀** 움직이지 않는다.
 *
 * Next.js는 라우팅 때마다 문서 최상단으로 스크롤한다. 목록 맨 아래 페이저를
 * 눌렀는데 히어로·필터를 지나 꼭대기로 튕기면, 다음 페이지를 보려고 그만큼
 * 다시 내려와야 한다. 연속으로 넘길 때 이게 제일 거슬린다.
 *
 * 그래서 기본 스크롤을 끄고(scroll={false}) 아무 보정도 하지 않는다. 처음에는
 * 목록 첫 줄로 되돌리는 보정을 뒀는데, 그것도 결국 시점이 움직이는 것이라
 * 연속 클릭을 방해했다. 지금은 커서 밑에서 내용만 갈린다.
 *
 * 이게 성립하는 전제는 **페이저가 제자리에 있는 것**이다. 목록 높이가 페이지
 * 마다 달라지면 버튼이 커서 밑에서 달아난다 — 그건 CSS(.feed-fixed)가 행
 * 높이와 목록 최소 높이를 못 박아 막는다. 둘은 한 쌍으로 봐야 한다.
 *
 * 버튼은 현재 페이지가 속한 블록만 그린다(visible). 페이지 수만큼 다 그리면
 * 좁은 폭에서 줄이 넘치고, 그러다 페이저 높이가 바뀌면 그 순간 버튼이 커서
 * 밑에서 달아난다. 안 움직이려고 만든 물건이 스스로 움직이는 셈이 된다.
 *
 * href는 서버(page.tsx)가 qs()로 만들어 넘긴다. 함수는 클라이언트 경계를
 * 못 넘으므로 계산된 문자열만 받는다.
 */
export function Paging({
  current,
  hrefs,
  visible,
}: {
  /** 1-based 현재 페이지 */
  current: number;
  /** 1페이지부터 순서대로 담긴 이동 주소 */
  hrefs: string[];
  /** 버튼으로 그릴 페이지 번호(1-based). 없으면 전부 그린다 */
  visible?: number[];
}) {
  const router = useRouter();
  const pages = hrefs.length;
  const numbers = visible ?? hrefs.map((_, index) => index + 1);

  const go = (href: string) => (event: React.MouseEvent) => {
    // 새 탭·다운로드 등 브라우저 기본 동작은 가로채지 않는다
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) {
      return;
    }
    event.preventDefault();
    router.push(href, { scroll: false });
  };

  return (
    <div className="paging">
      {current > 1 ? (
        <Link
          href={hrefs[current - 2]}
          scroll={false}
          onClick={go(hrefs[current - 2])}
          aria-label="이전 페이지"
        >
          ‹
        </Link>
      ) : (
        <button disabled aria-label="이전 페이지">
          ‹
        </button>
      )}

      {numbers.map((number: number) => {
        const href = hrefs[number - 1];
        return (
          <Link
            key={number}
            className={number === current ? "on" : undefined}
            href={href}
            scroll={false}
            onClick={go(href)}
            aria-current={number === current ? "page" : undefined}
          >
            {number}
          </Link>
        );
      })}

      {current < pages ? (
        <Link
          href={hrefs[current]}
          scroll={false}
          onClick={go(hrefs[current])}
          aria-label="다음 페이지"
        >
          ›
        </Link>
      ) : (
        <button disabled aria-label="다음 페이지">
          ›
        </button>
      )}
    </div>
  );
}
