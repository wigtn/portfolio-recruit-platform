/**
 * 이니셜 아바타 — 시안은 `.av`를 빈 회색 원으로 그렸는데, 실제 화면에서는
 * "이미지가 안 떴다"로 읽힌다. 사진이 없는 서비스이므로 빈 원 대신 이니셜을 넣어
 * 같은 자리를 정보로 바꾼다.
 *
 * 색은 인디고 램프 위에서만 3단계로 흔든다 — 목록에서 한 덩어리로 보이지 않을
 * 만큼만 다르고, DESIGN-SPEC §1 "단일 액션 색"을 벗어나지 않는다.
 */

/**
 * 이름 → 표시 이니셜.
 *
 * `chars`로 글자 수를 정한다 — 이름이 바로 옆에 오는 작은 아바타(피드 행)에서
 * 2글자를 쓰면 "김영 김영업"처럼 더듬는 것으로 읽힌다.
 */
export function initialsOf(name: string, chars: 1 | 2 = 2): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";

  const words = trimmed.split(/\s+/);
  const latin = /^[A-Za-z]/;
  if (chars === 2 && words.length > 1 && latin.test(words[0])) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  if (latin.test(trimmed)) return trimmed.slice(0, chars).toUpperCase();

  // "익명의 영업인" 같은 구절은 첫 단어에서만 딴다
  return words[0].slice(0, chars);
}

/** 이름이 같으면 항상 같은 톤이 나오도록 — 렌더마다 색이 바뀌면 사람으로 안 읽힌다. */
function toneOf(name: string): number {
  let hash = 0;
  for (let index = 0; index < name.length; index += 1) {
    hash = (hash * 31 + name.charCodeAt(index)) % 997;
  }
  return hash % 3;
}

const MIX = ["10%", "16%", "23%"];

export function Avatar({
  name,
  className = "av",
  title,
  chars = 2,
  fallback = "initials",
}: {
  name: string;
  /** 시안 클래스를 그대로 받는다 (.av / .pav / .lgc …) */
  className?: string;
  title?: string;
  chars?: 1 | 2;
  fallback?: "initials" | "icon";
}) {
  return (
    <span
      className={className}
      title={title ?? name}
      aria-hidden
      style={
        fallback === "initials"
          ? {
              background: `color-mix(in oklab, var(--accent) ${MIX[toneOf(name)]}, #fff)`,
            }
          : undefined
      }
    >
      {fallback === "icon" ? <Icon name="user" /> : initialsOf(name, chars)}
    </span>
  );
}
import { Icon } from "./Icon";
