/**
 * 공통 응답 코드.
 *
 * 라우트마다 실패를 다른 모양으로 돌려주고 있었다. 어떤 곳은 `{ok:false,error}`,
 * 어떤 곳은 `{fallback:true}`, 어떤 곳은 상태 코드만. 호출부는 그때그때 다른
 * 방식으로 받아서, 새 화면을 붙일 때마다 실패 처리를 처음부터 다시 썼다.
 *
 * 코드를 정해 두면 호출부가 "무엇이 일어났는지"로 분기할 수 있다. 문구는
 * 화면이 정하고, 코드는 서버가 정한다. 이 둘을 섞으면 문구를 고칠 때마다
 * 분기가 깨진다.
 */
export const ApiCode = {
  OK: "OK",
  /** 요청이 규격에 안 맞는다. 보낸 쪽 문제 */
  BAD_REQUEST: "BAD_REQUEST",
  /** 기능은 있는데 이 배포에 열쇠가 없다. 데모는 폴백으로 이어간다 */
  NOT_CONFIGURED: "NOT_CONFIGURED",
  /** 호출 한도를 넘었다. 시간이 지나면 풀린다 */
  RATE_LIMITED: "RATE_LIMITED",
  /** 바깥 서비스가 실패했거나 늦었다 */
  UPSTREAM_FAILED: "UPSTREAM_FAILED",
  /** 우리 잘못. 예상 못 한 오류 */
  INTERNAL: "INTERNAL",
} as const;

export type ApiCode = (typeof ApiCode)[keyof typeof ApiCode];

/** 코드별 기본 HTTP 상태. 라우트가 매번 고르지 않게 한 곳에 둔다 */
export const CODE_STATUS: Record<ApiCode, number> = {
  OK: 200,
  BAD_REQUEST: 400,
  // 준비 안 된 것은 실패가 아니다. 데모는 폴백으로 계속 굴러가야 하므로 200
  NOT_CONFIGURED: 200,
  RATE_LIMITED: 429,
  UPSTREAM_FAILED: 502,
  INTERNAL: 500,
};

/**
 * 화면에 그대로 띄울 수 있는 기본 문구.
 *
 * 라우트가 문구를 직접 쓰면 같은 상황에 화면마다 다른 말이 나온다. 특별히
 * 할 말이 있을 때만 라우트가 덮어쓴다.
 */
export const CODE_MESSAGE: Record<ApiCode, string> = {
  OK: "",
  BAD_REQUEST: "요청을 읽지 못했어요.",
  NOT_CONFIGURED: "지금은 준비된 내용으로 안내해드릴게요.",
  RATE_LIMITED: "잠시 뒤에 다시 시도해주세요.",
  UPSTREAM_FAILED: "지금 연결이 원활하지 않아요. 잠시 뒤에 다시 시도해주세요.",
  INTERNAL: "예상치 못한 문제가 생겼어요.",
};

export type ApiFail = {
  ok: false;
  code: ApiCode;
  message: string;
  /** 호출부가 분기에 쓸 수 있는 부가 정보 */
  detail?: Record<string, unknown>;
};

export type ApiOk<T> = { ok: true; code: "OK"; data: T };
export type ApiResult<T> = ApiOk<T> | ApiFail;

export function isFail<T>(result: ApiResult<T>): result is ApiFail {
  return result.ok === false;
}
