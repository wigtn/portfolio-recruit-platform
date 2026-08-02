/**
 * 실호출 한도 카운터.
 *
 * 비로그인 데모라 누가 얼마나 쓰는지 셀 방법이 요청의 흔적뿐이고, 그래서
 * 한도가 곧 비용 방어선이다. 두 라우트(`/api/chat`, `/api/ai-answer`)가
 * 같은 알고리즘을 각자 들고 있었다 — 챗봇은 IP·세션 두 축, AI 답변은 IP
 * 한 축이라 모양만 달랐지 세는 방식은 같았다.
 *
 * 축을 배열로 받으면 하나로 합쳐진다. 한 축만 쓰는 쪽은 배열 길이가 1일
 * 뿐이다.
 *
 * ## 카운터는 인메모리다
 *
 * 서버리스 인스턴스마다 따로 세고 콜드스타트에 리셋된다. 데모 범위에서
 * 감수한 한계이고, 실서비스로 가면 Redis 같은 공유 저장소가 필요하다.
 * 값과 화면 표현은 `docs/ai-rate-limits.md`에 정리돼 있다.
 */

/** 창 하나의 길이. 두 라우트 모두 시간당으로 센다 */
export const WINDOW_MS = 60 * 60 * 1000;

export type Axis = {
  /** 무엇을 세는가. 축끼리 겹치지 않게 접두어를 붙인다("ip:", "ss:") */
  key: string;
  max: number;
  /** 걸렸을 때 방문자에게 이유를 갈라 말하기 위한 표식 */
  why: "ip" | "session";
};

export type Verdict =
  | { ok: true }
  | { ok: false; why: "ip" | "session" | "daily" };

/**
 * 한도 저장소.
 *
 * 라우트마다 하나씩 만든다. 챗봇과 AI 답변은 상한이 다르고, 한쪽을 많이
 * 썼다고 다른 쪽이 막히면 안 된다 — 저장소를 나눠야 축도 나뉜다.
 */
export function createQuota(dailyMax: number) {
  const hits = new Map<string, number[]>();
  let daily = { day: "", count: 0 };

  const windowCount = (key: string, now: number): number => {
    const list = (hits.get(key) ?? []).filter((at) => now - at < WINDOW_MS);
    hits.set(key, list);
    return list.length;
  };

  /**
   * 축을 한꺼번에 본다. 하나라도 상한을 넘으면 막는다.
   *
   * 허용할 때만 모든 축에 자국을 남긴다. 막힌 요청이 카운트를 늘리면
   * 한 번 막힌 방문자가 영영 못 들어온다.
   */
  return function allow(axes: Axis[], now: number): Verdict {
    /* 일일 리셋은 KST(UTC+9) 자정 기준. 한국 데모라 UTC 자정(=KST 오전
       9시)에 끊기면 업무 시작 시각에 리셋되는 꼴이다. now에 9시간을 더해
       KST 달력 날짜를 만든다 */
    const today = new Date(now + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
    if (daily.day !== today) daily = { day: today, count: 0 };
    if (daily.count >= dailyMax) return { ok: false, why: "daily" };

    for (const axis of axes) {
      if (windowCount(axis.key, now) >= axis.max) {
        return { ok: false, why: axis.why };
      }
    }
    for (const axis of axes) {
      const list = hits.get(axis.key) ?? [];
      list.push(now);
      hits.set(axis.key, list);
    }
    daily.count += 1;

    // 메모리 누수 방지 — 창 밖으로 벗어난 엔트리는 접근 시점에 걷어낸다
    if (hits.size > 4000) {
      for (const [key, list] of hits) {
        if (list.every((at) => now - at >= WINDOW_MS)) hits.delete(key);
      }
    }
    return { ok: true };
  };
}
