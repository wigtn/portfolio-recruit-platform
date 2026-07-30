import type { GuardedTerm } from "@/lib/seed/posts";

/**
 * 실생성 텍스트를 안전 파이프라인이 먹는 parts 배열로 — 시드 초안은
 * "{0}" 토큰이 박혀 있지만, 실제 모델 출력은 위험 표현이 원문 그대로
 * 들어온다. 각 위험 표현의 등장 위치를 찾아 같은 토큰 형태로 바꾼다.
 *
 * 반환 형태는 시드 경로와 동일: 문자열 조각과 "{i}" 토큰의 배열.
 * 재검사(감지→취소선→치환) 연출이 두 경로에서 똑같이 돈다.
 */
export function splitByGuarded(text: string, guarded: GuardedTerm[]): string[] {
  let parts: string[] = [text];
  guarded.forEach((term, index) => {
    if (!term.raw) return;
    const next: string[] = [];
    for (const part of parts) {
      if (/^\{\d\}$/.test(part)) {
        next.push(part);
        continue;
      }
      const pieces = part.split(term.raw);
      pieces.forEach((piece, j) => {
        if (piece) next.push(piece);
        if (j < pieces.length - 1) next.push(`{${index}}`);
      });
    }
    parts = next;
  });
  return parts;
}
