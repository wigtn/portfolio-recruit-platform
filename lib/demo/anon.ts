/**
 * 비로그인 방문자 식별. 서버 전용(node:crypto).
 *
 * 로그인이 없으니 같은 방문자를 두 가지로 알아본다. IP와, 서명된 익명 쿠키다.
 * IP만 쓰면 프록시 한 대 뒤의 여럿이 한 사람으로 묶이거나, 반대로 한 사람이
 * IP를 바꿔 여럿으로 흩어진다. 쿠키 축이 그 틈을 메운다.
 *
 * 쿠키는 서명한다. 서명이 없으면 그 값이 곧 위조 가능한 카운터 열쇠가 되어,
 * 아무 문자열이나 넣어 매 요청 새 신원으로 굴 수 있다. 서명 비밀은 환경변수
 * (WIGTN_COOKIE_SECRET)에 둔다. 없으면 쿠키 축을 접고 IP 축만으로 degrade한다.
 * 에러가 아니라 축소다 — 데모는 키가 없어도 돌아야 한다.
 *
 * ## 이 축들이 막는 것과 못 막는 것
 *
 * 저장소가 프로세스 메모리라 경계가 분명하다.
 * - 막는다: 한 인스턴스 안에서 IP를 굴리는 봇(쿠키가 따라붙는다), 쿠키를
 *   지우고 도는 봇(IP가 따라붙는다).
 * - 못 막는다: 쿠키도 지우고 IP도 바꾸는 경우. 그리고 서버리스 다중
 *   인스턴스로 카운터가 인스턴스마다 흩어지는 경우(실효 상한이 인스턴스
 *   수만큼 늘어난다). 후자는 외부 저장소 없이는 못 메우므로, 데모 범위상
 *   상한을 보수적으로 잡는 것으로 대신한다.
 */

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const COOKIE = "wigtn_anon";
const MAX_AGE = 60 * 60 * 24 * 30; // 30일

function secret(): string | null {
  return process.env.WIGTN_COOKIE_SECRET ?? null;
}

function sign(id: string, key: string): string {
  return createHmac("sha256", key).update(id).digest("base64url");
}

/**
 * 신뢰할 수 있는 클라이언트 IP.
 *
 * x-forwarded-for는 프록시들이 이어 붙인 목록이다. 우리 플랫폼이 실제 클라
 * IP를 **맨 앞**에 넣는다. 그 뒤 항목들은 클라가 심어 보낼 수 있어 신뢰하지
 * 않는다. 그래서 첫 값만 본다. 없으면 x-real-ip, 그것도 없으면 로컬로 친다.
 */
export function clientIp(request: Request): string {
  const first = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (first) return first;
  return request.headers.get("x-real-ip")?.trim() || "local";
}

function readCookie(request: Request, name: string): string | null {
  const header = request.headers.get("cookie");
  if (!header) return null;
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq < 0) continue;
    if (part.slice(0, eq).trim() === name) return part.slice(eq + 1).trim();
  }
  return null;
}

export type Anon = { id: string | null; setCookie?: string };

/**
 * 익명 신원을 읽거나 새로 발급한다.
 *
 * 쿠키 형식은 `<id>.<서명>`이다. 서명이 맞으면 그 id를 그대로 쓴다. 없거나
 * 위조면 새 id를 만들어 서명하고, 응답에 실을 Set-Cookie를 함께 돌려준다.
 * 비밀이 없으면 id 없이(IP 축만) 돌린다.
 */
export function anon(request: Request): Anon {
  const key = secret();
  if (!key) return { id: null };

  const raw = readCookie(request, COOKIE);
  if (raw) {
    const dot = raw.lastIndexOf(".");
    if (dot > 0) {
      const id = raw.slice(0, dot);
      const sig = raw.slice(dot + 1);
      const expected = sign(id, key);
      // 길이가 다르면 timingSafeEqual이 던진다. 먼저 막고 타이밍 안전 비교
      if (
        sig.length === expected.length &&
        timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
      ) {
        return { id };
      }
    }
  }

  const id = randomBytes(16).toString("base64url");
  const value = `${id}.${sign(id, key)}`;
  const setCookie =
    `${COOKIE}=${value}; Path=/; Max-Age=${MAX_AGE}; ` +
    "HttpOnly; Secure; SameSite=Lax";
  return { id, setCookie };
}
