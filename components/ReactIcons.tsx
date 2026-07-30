/**
 * 글 반응 전용 인라인 아이콘 — 스프라이트(<use>)는 내부 요소에 손댈 수 없어
 * 로티식 요소 단위 모션(선 그리기·순차 팝·깃발 흔들림)이 불가능하다.
 * 여기 아이콘들은 path/원 하나하나에 클래스를 달아 CSS 키프레임으로 움직인다.
 * 전부 회전·채움·대시뿐 — 레이아웃 크기는 1px도 변하지 않는다.
 */
export function LikeIcon() {
  return (
    <svg
      className="ri ri-like"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path
        className="ri-thumb"
        d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"
      />
    </svg>
  );
}

export function BookmarkIcon() {
  return (
    <svg
      className="ri ri-bookmark"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path
        className="ri-mark"
        d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"
      />
    </svg>
  );
}

export function ShareIcon() {
  return (
    <svg
      className="ri ri-share"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle className="ri-node ri-n1" cx="18" cy="5" r="3" />
      <circle className="ri-node ri-n2" cx="6" cy="12" r="3" />
      <circle className="ri-node ri-n3" cx="18" cy="19" r="3" />
      <line className="ri-wire ri-w1" x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line className="ri-wire ri-w2" x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}

export function FlagIcon() {
  return (
    <svg
      className="ri ri-flag"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path
        className="ri-cloth"
        d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"
      />
      <line className="ri-pole" x1="4" y1="22" x2="4" y2="15" />
    </svg>
  );
}
