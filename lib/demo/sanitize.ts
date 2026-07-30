/**
 * 붙여넣기 실살균 — 연출이 아니라 실제 차단.
 *
 * content-engine의 renderSanitizedHtml은 미리보기(HTML) 단계의 정본이고,
 * 여기는 **에디터에 들어오는 순간**의 1차 방어다: 실행 코드가 텍스트로라도
 * 본문에 남아 저장되는 걸 막는다. 무엇을 왜 지웠는지 돌려줘서 화면이
 * "걸러냈다"를 근거와 함께 연출할 수 있게 한다.
 */
export type SanitizeHit = {
  /** 사람이 읽는 이름 — "실행 스크립트", "이벤트 핸들러" … */
  label: string;
  /** 걸러낸 원문 조각(요약 표시용) */
  snippet: string;
};

const RULES: Array<{ pattern: RegExp; label: string }> = [
  {
    pattern: /<script\b[^>]*>[\s\S]*?<\/script\s*>/gi,
    label: "실행 스크립트",
  },
  {
    pattern: /<(iframe|object|embed)\b[^>]*>[\s\S]*?<\/\1\s*>/gi,
    label: "외부 삽입 프레임",
  },
  { pattern: /<(iframe|object|embed)\b[^>]*\/?>/gi, label: "외부 삽입 프레임" },
  { pattern: /\son\w+\s*=\s*"[^"]*"/gi, label: "이벤트 핸들러" },
  { pattern: /\son\w+\s*=\s*'[^']*'/gi, label: "이벤트 핸들러" },
  { pattern: /javascript:\s*[^\s"'>]*/gi, label: "자바스크립트 링크" },
];

export function sanitizePaste(raw: string): {
  clean: string;
  hits: SanitizeHit[];
} {
  let clean = raw;
  const hits: SanitizeHit[] = [];
  for (const rule of RULES) {
    clean = clean.replace(rule.pattern, (match) => {
      hits.push({
        label: rule.label,
        snippet: match.length > 46 ? `${match.slice(0, 46)}…` : match,
      });
      return "";
    });
  }
  // 지운 자리의 어색한 공백 정리 — 문장은 건드리지 않는다
  if (hits.length > 0) clean = clean.replace(/[ \t]+\n/g, "\n");
  return { clean, hits };
}

/** 연출용 세그먼트 — 원문을 [안전, 위험, 안전…]으로 쪼갠다.
    검역 카드가 위험 조각만 골라 스캔→취소선→소멸을 재생할 수 있게. */
export type RiskySegment = { text: string; risky: boolean; label?: string };

export function markRisky(raw: string): RiskySegment[] {
  type Span = { start: number; end: number; label: string };
  const spans: Span[] = [];
  for (const rule of RULES) {
    rule.pattern.lastIndex = 0;
    for (const match of raw.matchAll(rule.pattern)) {
      const start = match.index ?? 0;
      const end = start + match[0].length;
      // 겹치는 스팬은 먼저 잡힌 것이 이긴다(스크립트 안의 핸들러 등)
      if (!spans.some((span) => start < span.end && end > span.start)) {
        spans.push({ start, end, label: rule.label });
      }
    }
  }
  spans.sort((a, b) => a.start - b.start);

  const out: RiskySegment[] = [];
  let cursor = 0;
  for (const span of spans) {
    if (span.start > cursor)
      out.push({ text: raw.slice(cursor, span.start), risky: false });
    out.push({
      text: raw.slice(span.start, span.end),
      risky: true,
      label: span.label,
    });
    cursor = span.end;
  }
  if (cursor < raw.length) out.push({ text: raw.slice(cursor), risky: false });
  return out;
}
