import { NextResponse } from "next/server";
import { ApiCode, CODE_MESSAGE, CODE_STATUS, type ApiFail } from "./codes";

/**
 * 라우트가 응답을 만드는 한 가지 방법.
 *
 * 전에는 라우트마다 NextResponse.json을 직접 부르며 모양을 조금씩 다르게
 * 만들었다. 상태 코드도 손으로 골랐다. 여기를 거치면 코드와 상태와 기본
 * 문구가 한 짝으로 붙는다.
 */
export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, code: ApiCode.OK, data }, init);
}

export function fail(
  code: Exclude<ApiCode, "OK">,
  options?: { message?: string; detail?: Record<string, unknown> },
) {
  const body: ApiFail = {
    ok: false,
    code,
    message: options?.message ?? CODE_MESSAGE[code],
    ...(options?.detail ? { detail: options.detail } : {}),
  };
  return NextResponse.json(body, { status: CODE_STATUS[code] });
}

/**
 * 바깥 서비스 호출에 상한을 건다.
 *
 * 상한은 **첫 응답까지**만 건다. fetch는 헤더가 오면 resolve하므로 타이머도
 * 그때 풀리고, 본문 스트림은 상한에 걸리지 않는다. 막고 싶은 건 "시작조차
 * 못 하는" 경우지 "오래 말하는" 경우가 아니다.
 *
 * 이게 없으면 바깥이 늘어질 때 우리 라우트가 그대로 붙들리고, 브라우저의
 * await도 같이 멈춘다. 방문자는 아무 설명 없이 잠긴 화면을 본다.
 */
export async function callUpstream(
  run: (signal: AbortSignal) => Promise<Response>,
  ms = 15000,
): Promise<Response> {
  const guard = new AbortController();
  const timer = setTimeout(() => guard.abort(), ms);
  try {
    return await run(guard.signal);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * 호출 한도.
 *
 * ai-answer와 chat이 같은 코드를 각자 들고 있었다. 상한 값만 다르고 로직은
 * 글자까지 같았다. 저장소는 프로세스 메모리다. 서버리스 다중 인스턴스에서는
 * 인스턴스별로 따로 세지만, 상한이 보수적이라 총액 방어에는 충분하다.
 */
export function createLimiter(options: {
  perIp: number;
  daily: number;
  windowMs?: number;
}) {
  const windowMs = options.windowMs ?? 60 * 60 * 1000;
  const hits = new Map<string, number[]>();
  let day = { at: "", count: 0 };

  return function allow(ip: string, now = Date.now()) {
    const today = new Date(now).toISOString().slice(0, 10);
    if (day.at !== today) day = { at: today, count: 0 };
    if (day.count >= options.daily) {
      return { ok: false as const, why: "daily" as const };
    }

    const mine = (hits.get(ip) ?? []).filter((at) => now - at < windowMs);
    if (mine.length >= options.perIp) {
      return { ok: false as const, why: "ip" as const };
    }

    mine.push(now);
    hits.set(ip, mine);
    day.count += 1;

    // 메모리 누수 방지. 오래된 항목은 접근 시점에 걷어낸다
    if (hits.size > 2000) {
      for (const [key, list] of hits) {
        if (list.every((at) => now - at >= windowMs)) hits.delete(key);
      }
    }
    return { ok: true as const };
  };
}

/** 요청자 구분. 프록시 뒤에서는 헤더를 봐야 한다 */
export function clientIp(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local"
  );
}
