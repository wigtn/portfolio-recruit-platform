import { Icon } from "./Icon";

/**
 * 등급 배지 — "Lv.4 필드리더"가 맨 텍스트로 앉아 있으면 등급이 자산으로
 * 안 읽힌다. 레벨 숫자를 티어 색 칩으로, 이름을 그 옆에 세운다.
 *
 * 티어 램프는 인디고 단일 축이다(초록 금지·색 남발 금지 — r4 규칙).
 * Lv.1은 무채색에서 시작해 올라갈수록 짙어지고, 최고 등급(Lv.5)만
 * 채워진 인디고 + 수상 아이콘 — "여기가 꼭대기"라는 신호는 하나면 된다.
 */
const MAX_LEVEL = 5;

function parseGrade(grade: string): { level: number | null; name: string } {
  const match = grade.match(/^Lv\.(\d+)\s*(.*)$/);
  if (!match) return { level: null, name: grade };
  return { level: Number(match[1]), name: match[2] };
}

export function LevelBadge({
  grade,
  muted = false,
}: {
  /** "Lv.4 필드리더" 형식 — 형식 밖 문자열은 그대로 이름만 표시 */
  grade: string;
  /** 정지 회원 등 — 티어 색을 걷고 가라앉힌다 */
  muted?: boolean;
}) {
  const { level, name } = parseGrade(grade);

  return (
    <span
      className={[
        "lvbadge",
        level ? `is-l${Math.min(level, MAX_LEVEL)}` : "is-l1",
        muted ? "is-muted" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      title={grade}
    >
      {level ? (
        <b className="lvbadge-n">
          {level >= MAX_LEVEL ? <Icon name="award" /> : null}
          Lv.{level}
        </b>
      ) : null}
      {name ? <span className="lvbadge-nm">{name}</span> : null}
    </span>
  );
}
