import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * CSS가 참조하는 keyframes는 어딘가에 정의돼 있어야 한다.
 *
 * 이 테스트가 생긴 이유: 모듈 쇼케이스 CSS를 일괄 삭제할 때 이름에 "mod"가
 * 들어간다는 이유로 `search-modal-in`과 `ds-modal-reveal`까지 지워졌다.
 * 참조는 그대로 남아서 검색 모달과 역할·신고·StepUp 모달의 등장 연출만
 * 조용히 죽었다 — 기능 테스트는 전부 통과했고, 리뷰에서야 잡혔다.
 *
 * 죽은 애니메이션은 화면이 깨지지 않아 눈으로도 잘 안 걸린다. 그래서 사람이
 * 아니라 대조로 막는다.
 */

const ROOT = join(__dirname, "..");

/** 애니메이션 단축 속성에서 이름이 아닌 토큰들 — 타이밍·키워드는 제외한다 */
const NOT_A_NAME = new Set([
  "none",
  "infinite",
  "linear",
  "ease",
  "ease-in",
  "ease-out",
  "ease-in-out",
  "alternate",
  "alternate-reverse",
  "both",
  "forwards",
  "backwards",
  "normal",
  "reverse",
  "running",
  "paused",
  "step-start",
  "step-end",
]);

function read(path: string): string {
  const full = join(ROOT, path);
  return existsSync(full) ? readFileSync(full, "utf8") : "";
}

/** keyframes를 정의할 수 있는 모든 출처 — 앱, 벤더 시안, ui-kit 패키지 */
const SOURCES = [
  "app/globals.css",
  "lib/vendor/r4/reference.css",
  "node_modules/@wigtn/ui-kit/src/tokens/motion-keyframes.css",
];

function definedNames(): Set<string> {
  const names = new Set<string>();
  for (const src of SOURCES) {
    for (const m of read(src).matchAll(/@keyframes\s+([\w-]+)/g)) {
      names.add(m[1]);
    }
  }
  return names;
}

/** animation / animation-name 선언에서 이름 후보를 뽑는다 */
function referencedNames(css: string): Set<string> {
  const names = new Set<string>();
  for (const decl of css.matchAll(/animation(?:-name)?\s*:\s*([^;}]+)[;}]/g)) {
    for (const token of decl[1].split(/[,\s]+/)) {
      const name = token.trim();
      if (!name || NOT_A_NAME.has(name)) continue;
      // var(...), 시간(0.3s), 숫자, cubic-bezier(...) 등은 이름이 아니다
      if (!/^[a-zA-Z][\w-]*$/.test(name)) continue;
      names.add(name);
    }
  }
  return names;
}

describe("CSS keyframes 참조 무결성", () => {
  it("globals.css가 참조하는 keyframes는 전부 정의돼 있다", () => {
    const defined = definedNames();
    const missing = [...referencedNames(read("app/globals.css"))]
      .filter((name) => !defined.has(name))
      .sort();
    expect(missing).toEqual([]);
  });

  it("모듈 쇼케이스 잔재가 스타일에 남아 있지 않다", () => {
    // 상담 페이지에서 걷어낸 섹션의 클래스가 CSS에만 남으면 죽은 코드가 된다
    const css = read("app/globals.css");
    expect(css).not.toMatch(/\.mod(show|row|card|grid|rows)/);
  });
});
