/**
 * 익명 방문자 식별 계약.
 *
 * 서명 없이는 쿠키 값이 곧 위조 가능한 카운터 열쇠가 된다. 서명 왕복이
 * 실제로 같은 신원을 알아보는지, 위조를 새 신원으로 떨구는지, 비밀이 없을 때
 * IP 축만으로 degrade하는지를 확인한다.
 */

import { afterEach, describe, expect, it } from "vitest";
import { anon, clientIp } from "./anon";

const SECRET = "test-secret-please-ignore-0123456789";
const req = (headers: Record<string, string> = {}) =>
  new Request("http://localhost/api/chat", { method: "POST", headers });
const cookieValue = (setCookie: string) =>
  /wigtn_anon=([^;]+)/.exec(setCookie)?.[1] ?? "";

afterEach(() => {
  delete process.env.WIGTN_COOKIE_SECRET;
});

describe("clientIp", () => {
  it("x-forwarded-for의 첫 홉만 신뢰한다", () => {
    expect(clientIp(req({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" }))).toBe(
      "1.2.3.4",
    );
    expect(clientIp(req({ "x-forwarded-for": "  9.9.9.9  " }))).toBe("9.9.9.9");
  });

  it("xff가 없으면 x-real-ip, 그것도 없으면 local", () => {
    expect(clientIp(req({ "x-real-ip": "8.8.8.8" }))).toBe("8.8.8.8");
    expect(clientIp(req())).toBe("local");
  });
});

describe("익명 쿠키", () => {
  it("비밀이 없으면 쿠키 축을 접고 IP 축만으로 degrade한다", () => {
    const result = anon(req());
    expect(result.id).toBeNull();
    expect(result.setCookie).toBeUndefined();
  });

  it("쿠키가 없으면 서명된 쿠키를 새로 발급한다", () => {
    process.env.WIGTN_COOKIE_SECRET = SECRET;
    const result = anon(req());
    expect(result.id).toBeTruthy();
    expect(result.setCookie).toBeTruthy();
    // 위조·탈취를 줄이는 속성이 빠지면 안 된다
    expect(result.setCookie).toContain("HttpOnly");
    expect(result.setCookie).toContain("Secure");
    expect(result.setCookie).toContain("SameSite=Lax");
  });

  it("서명이 맞는 쿠키는 같은 신원으로 알아보고 재발급하지 않는다", () => {
    process.env.WIGTN_COOKIE_SECRET = SECRET;
    const issued = anon(req());
    const back = anon(req({ cookie: `wigtn_anon=${cookieValue(issued.setCookie!)}` }));
    expect(back.id).toBe(issued.id);
    expect(back.setCookie).toBeUndefined();
  });

  it("서명이 위조된 쿠키는 무시하고 새 신원을 발급한다", () => {
    process.env.WIGTN_COOKIE_SECRET = SECRET;
    const issued = anon(req());
    const value = cookieValue(issued.setCookie!);
    // 서명 한 글자를 비틀면 검증이 깨져야 한다
    const forged = value.slice(0, -1) + (value.endsWith("A") ? "B" : "A");
    const result = anon(req({ cookie: `wigtn_anon=${forged}` }));
    expect(result.setCookie).toBeTruthy();
    expect(result.id).not.toBe(issued.id);
  });
});
