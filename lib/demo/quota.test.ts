/**
 * 한도 카운터 계약.
 *
 * 값은 라우트가 정하고 세는 방식만 여기 있다. 지키는 것은 셋이다 —
 * 축은 AND, 막힌 요청은 카운트를 늘리지 않는다, 창이 지나면 풀린다.
 */

import { describe, expect, it } from "vitest";
import { createQuota, WINDOW_MS, type Axis } from "./quota";

const ip = (max: number): Axis => ({ key: "ip:1.2.3.4", max, why: "ip" });
const ss = (max: number): Axis => ({ key: "ss:abc", max, why: "session" });

describe("한도 카운터", () => {
  it("상한까지 허용하고 그 뒤로 막는다", () => {
    const allow = createQuota(1000);
    const now = 1_000_000;
    expect(allow([ip(2)], now).ok).toBe(true);
    expect(allow([ip(2)], now).ok).toBe(true);
    expect(allow([ip(2)], now)).toEqual({ ok: false, why: "ip" });
  });

  it("축은 AND — 하나만 넘쳐도 막고, 이유를 그 축으로 말한다", () => {
    const allow = createQuota(1000);
    const now = 1_000_000;
    allow([ip(5), ss(1)], now);
    expect(allow([ip(5), ss(1)], now)).toEqual({ ok: false, why: "session" });
  });

  it("막힌 요청은 카운트를 늘리지 않는다", () => {
    /* 늘리면 한 번 막힌 방문자가 영영 못 들어온다 */
    const allow = createQuota(1000);
    const now = 1_000_000;
    allow([ip(1)], now);
    for (let i = 0; i < 10; i += 1) allow([ip(1)], now);
    // 창이 지나면 정확히 처음 1건만 만료되면 된다
    expect(allow([ip(1)], now + WINDOW_MS + 1).ok).toBe(true);
  });

  it("창이 지나면 풀린다", () => {
    const allow = createQuota(1000);
    const now = 1_000_000;
    allow([ip(1)], now);
    expect(allow([ip(1)], now + WINDOW_MS - 1).ok).toBe(false);
    expect(allow([ip(1)], now + WINDOW_MS + 1).ok).toBe(true);
  });

  it("일일 총량은 축보다 먼저 막고 daily로 답한다", () => {
    const allow = createQuota(1);
    const now = 1_000_000;
    expect(allow([ip(99)], now).ok).toBe(true);
    expect(allow([ip(99)], now)).toEqual({ ok: false, why: "daily" });
  });

  it("일일 총량은 KST 자정에 풀린다", () => {
    const allow = createQuota(1);
    /* 2026-08-02 14:00 KST = 05:00 UTC */
    const kstAfternoon = Date.UTC(2026, 7, 2, 5, 0, 0);
    expect(allow([ip(99)], kstAfternoon).ok).toBe(true);
    expect(allow([ip(99)], kstAfternoon).ok).toBe(false);
    /* 같은 UTC 날짜지만 KST로는 다음 날(2026-08-03 00:30 KST = 15:30 UTC) */
    const kstNextDay = Date.UTC(2026, 7, 2, 15, 30, 0);
    expect(allow([ip(99)], kstNextDay).ok).toBe(true);
  });

  it("저장소가 다르면 서로를 막지 않는다", () => {
    const chat = createQuota(1000);
    const answer = createQuota(1000);
    const now = 1_000_000;
    chat([ip(1)], now);
    expect(chat([ip(1)], now).ok).toBe(false);
    expect(answer([ip(1)], now).ok).toBe(true);
  });
});
