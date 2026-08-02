/**
 * 문서와 코드가 어긋나지 않게 한다.
 *
 * 한도 값은 라우트 상수에 있고 설명은 docs/ai-rate-limits.md에 있다. 둘이
 * 갈라지면 다음 사람은 문서를 못 믿고 코드를 읽는데, 그럴 거면 문서가 없는
 * 편이 낫다. 상수를 고치고 문서를 안 고치면 여기서 걸린다.
 *
 * 라우트를 import하지 않고 소스를 읽는 이유: 두 라우트는 모듈 최상단에
 * 인메모리 카운터를 만들고 next/server를 끌어온다. 값 하나 보자고 그걸
 * 전부 세우는 것보다, 적힌 숫자를 그대로 비교하는 편이 정확하다.
 */

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { WINDOW_MS } from "../lib/demo/quota";

const read = (path: string) => readFileSync(path, "utf8");

/** `const NAME = 20;` 또는 `= 60 * 60 * 1000;`에서 값을 꺼낸다 */
function constOf(source: string, name: string): number {
  /* 템플릿 리터럴 안에서는 백슬래시가 한 번 먹힌다. String.raw로 쓰면
     정규식에 적은 그대로 남는다 — 처음엔 `\s`로 적었다가 `s`가 되어
     "PER_IP_MAXs*=s*"를 찾고 있었다. */
  const found = source.match(
    new RegExp(String.raw`const ${name}\s*=\s*([0-9*\s]+);`),
  );
  if (!found) throw new Error(`${name}을 찾지 못했다`);
  return found[1]
    .split("*")
    .map((part) => Number(part.trim()))
    .reduce((a, b) => a * b, 1);
}

const chat = read("app/api/chat/route.ts");
const answer = read("app/api/ai-answer/route.ts");
const doc = read("docs/ai-rate-limits.md");

describe("한도 문서가 코드와 같은 값을 말한다", () => {
  it("챗봇 IP 20 / 세션 20 / 일일 300", () => {
    expect(constOf(chat, "PER_IP_MAX")).toBe(20);
    expect(constOf(chat, "PER_SESSION_MAX")).toBe(20);
    expect(constOf(chat, "DAILY_MAX")).toBe(300);
    expect(doc).toContain("**20회 / 1시간**");
    expect(doc).toContain("**300회**");
  });

  it("AI 자동답변 IP 10 / 일일 200", () => {
    expect(constOf(answer, "PER_IP_MAX")).toBe(10);
    expect(constOf(answer, "DAILY_MAX")).toBe(200);
    expect(doc).toContain("**10회 / 1시간**");
    expect(doc).toContain("**200회**");
  });

  it("창은 1시간 — 두 라우트가 같은 카운터를 쓴다", () => {
    /* 창 길이는 이제 lib/demo/quota 하나가 갖는다. 라우트는 값만 정한다 */
    expect(WINDOW_MS).toBe(60 * 60 * 1000);
    expect(chat).toContain("createQuota(DAILY_MAX)");
    expect(answer).toContain("createQuota(DAILY_MAX)");
  });

  it("응답 계약이 문서대로다 — 챗봇 200 폴백, AI답변 429", () => {
    expect(chat).toContain("rateLimited: true");
    expect(answer).toContain("status: 429");
    expect(doc).toContain("429");
  });
});
