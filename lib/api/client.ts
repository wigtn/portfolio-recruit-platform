import axios, { AxiosError } from "axios";
import {
  ApiCode,
  CODE_MESSAGE,
  type ApiFail,
  type ApiResult,
} from "./codes";

/**
 * 브라우저에서 우리 API를 부르는 한 가지 방법.
 *
 * 전에는 화면마다 fetch를 직접 쓰고, 실패를 각자 다르게 읽었다. 어떤 곳은
 * `res.ok`를 보고, 어떤 곳은 헤더를 보고, 어떤 곳은 본문의 `fallback` 필드를
 * 봤다. 새 화면을 붙일 때마다 그 판단을 다시 썼고, 그래서 조금씩 달랐다.
 *
 * axios로 옮기면서 실패를 한 곳에서 코드로 번역한다. 호출부는 `result.ok`만
 * 보고, 필요하면 `result.code`로 분기한다. try/catch를 화면마다 두지 않는다.
 *
 * 스트리밍은 axios로 받지 않는다. 브라우저 axios는 XHR 기반이라 응답을 조각
 * 단위로 흘려주지 못한다. 흐르는 답변은 fetch를 그대로 쓰고(streamPost),
 * 그 대신 실패 번역만 같은 규칙을 태운다.
 */
const http = axios.create({
  baseURL: "/api",
  timeout: 20000,
  headers: { "content-type": "application/json" },
});

/** 어떤 실패든 우리 코드로 옮긴다. 화면은 이 코드만 안다 */
function translate(error: unknown): ApiFail {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<Partial<ApiFail>>;

    // 서버가 우리 규격으로 답했으면 그대로 쓴다
    const body = axiosError.response?.data;
    if (body && typeof body === "object" && "code" in body && body.code) {
      return {
        ok: false,
        code: body.code as ApiCode,
        message: body.message ?? CODE_MESSAGE[body.code as ApiCode],
        detail: body.detail,
      };
    }

    if (axiosError.code === "ECONNABORTED") {
      return {
        ok: false,
        code: ApiCode.UPSTREAM_FAILED,
        message: "응답이 너무 늦어요. 잠시 뒤에 다시 시도해주세요.",
      };
    }

    const status = axiosError.response?.status ?? 0;
    if (status === 429) {
      return {
        ok: false,
        code: ApiCode.RATE_LIMITED,
        message: CODE_MESSAGE.RATE_LIMITED,
      };
    }
    if (status >= 500 || status === 0) {
      return {
        ok: false,
        code: ApiCode.UPSTREAM_FAILED,
        message: CODE_MESSAGE.UPSTREAM_FAILED,
      };
    }
    return {
      ok: false,
      code: ApiCode.BAD_REQUEST,
      message: CODE_MESSAGE.BAD_REQUEST,
    };
  }

  return {
    ok: false,
    code: ApiCode.INTERNAL,
    message: CODE_MESSAGE.INTERNAL,
  };
}

export async function post<T>(
  path: string,
  body?: unknown,
  options?: { signal?: AbortSignal },
): Promise<ApiResult<T>> {
  try {
    const response = await http.post(path, body, { signal: options?.signal });
    const data = response.data;
    // 서버가 규격을 지켰으면 그대로. 아니면 통째로 data로 감싼다
    if (data && typeof data === "object" && "ok" in data) {
      return data as ApiResult<T>;
    }
    return { ok: true, code: "OK", data: data as T };
  } catch (error) {
    // 중단은 실패가 아니다. 부른 쪽이 스스로 끊은 것이라 그대로 던진다
    if (axios.isCancel(error)) throw error;
    return translate(error);
  }
}

/**
 * 흐르는 응답. 브라우저 axios가 못 하는 일이라 fetch를 쓴다.
 *
 * 응답이 스트림이면 reader를, JSON이면 파싱된 본문을 돌려준다. 어느 쪽인지
 * 부른 쪽이 헤더를 다시 확인하지 않아도 되게 여기서 갈라 준다.
 */
export type StreamReply<T> =
  | { kind: "stream"; body: ReadableStream<Uint8Array> }
  | { kind: "json"; data: T }
  | { kind: "fail"; fail: ApiFail };

export async function streamPost<T>(
  path: string,
  body: unknown,
  options?: { signal?: AbortSignal },
): Promise<StreamReply<T>> {
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: options?.signal,
    });
  } catch (error) {
    if ((error as Error)?.name === "AbortError") throw error;
    return {
      kind: "fail",
      fail: {
        ok: false,
        code: ApiCode.UPSTREAM_FAILED,
        message: CODE_MESSAGE.UPSTREAM_FAILED,
      },
    };
  }

  const type = response.headers.get("content-type") ?? "";
  if (type.includes("application/json")) {
    const data = await response.json();
    if (data && typeof data === "object" && data.ok === false) {
      return { kind: "fail", fail: data as ApiFail };
    }
    return { kind: "json", data: data as T };
  }

  if (!response.ok || !response.body) {
    return {
      kind: "fail",
      fail: {
        ok: false,
        code: ApiCode.UPSTREAM_FAILED,
        message: CODE_MESSAGE.UPSTREAM_FAILED,
      },
    };
  }
  return { kind: "stream", body: response.body };
}
