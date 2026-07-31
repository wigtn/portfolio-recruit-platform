import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

const originalWebhook = process.env.CONTACT_WEBHOOK_URL;
const originalResendKey = process.env.WIGTN_RESEND_API_KEY;

function request(body: unknown, headers?: HeadersInit) {
  return new Request("http://localhost/api/contact", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

afterEach(() => {
  if (originalWebhook === undefined) {
    delete process.env.CONTACT_WEBHOOK_URL;
  } else {
    process.env.CONTACT_WEBHOOK_URL = originalWebhook;
  }
  if (originalResendKey === undefined) {
    delete process.env.WIGTN_RESEND_API_KEY;
  } else {
    process.env.WIGTN_RESEND_API_KEY = originalResendKey;
  }
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("문의 API", () => {
  it("필드 타입이 잘못된 JSON은 400으로 거절한다", async () => {
    const response = await POST(
      request({ name: null, contact: { email: "x@example.com" } }),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ ok: false });
  });

  it("실제 전달 채널이 없으면 성공으로 위장하지 않는다", async () => {
    delete process.env.CONTACT_WEBHOOK_URL;
    delete process.env.WIGTN_RESEND_API_KEY;

    const response = await POST(
      request({ name: "테스터", contact: "tester@example.com" }),
    );

    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ ok: false });
  });

  it("웹훅 성공 시 살균된 내용과 요청 식별자를 전달한다", async () => {
    delete process.env.WIGTN_RESEND_API_KEY;
    process.env.CONTACT_WEBHOOK_URL = "https://webhook.example.test/contact";
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(
      request({
        name: "테스터",
        contact: "tester@example.com",
        company: "WIGTN",
        modules: ["채용", "채용"],
        message: "<script>alert(1)</script>",
      }),
    );
    const result = await response.json();
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const forwarded = JSON.parse(String(init.body));

    expect(response.status).toBe(200);
    expect(result).toMatchObject({ ok: true });
    expect(result.requestId).toEqual(expect.any(String));
    expect(forwarded.lead.modules).toEqual(["채용"]);
    expect(forwarded.lead.message).toContain("&lt;script&gt;");
    expect(forwarded.lead.message).not.toContain("<script>");
  });

  it("본문 크기 제한을 넘으면 웹훅 전에 413으로 거절한다", async () => {
    delete process.env.WIGTN_RESEND_API_KEY;
    process.env.CONTACT_WEBHOOK_URL = "https://webhook.example.test/contact";
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(
      request(
        { name: "테스터", contact: "tester@example.com" },
        { "content-length": String(33 * 1024) },
      ),
    );

    expect(response.status).toBe(413);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("이메일 키가 있으면 수신자 주소로 직접 발송한다", async () => {
    process.env.WIGTN_RESEND_API_KEY = "unit-test-key";
    delete process.env.CONTACT_WEBHOOK_URL;
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(
      request({
        name: "테스터",
        contact: "tester@example.com",
        message: "<b>안녕하세요</b> 문의합니다",
      }),
    );
    const result = await response.json();
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const mail = JSON.parse(String(init.body));

    expect(response.status).toBe(200);
    expect(result).toMatchObject({ ok: true, channel: "email" });
    expect(url).toBe("https://api.resend.com/emails");
    expect(mail.to).toEqual(["contact@wigtn.com"]);
    expect(mail.reply_to).toBe("tester@example.com");
    // 살균: 태그가 이스케이프돼 발송된다
    expect(mail.html).not.toContain("<b>안녕하세요</b>");
  });

  it("이메일 실패 시 웹훅으로 폴백해 리드를 지킨다", async () => {
    process.env.WIGTN_RESEND_API_KEY = "unit-test-key";
    process.env.CONTACT_WEBHOOK_URL = "https://webhook.example.test/contact";
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 500 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(
      request({ name: "테스터", contact: "tester@example.com" }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      ok: true,
      channel: "webhook",
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("이메일만 설정된 상태에서 발송 실패하면 502로 정직하게 알린다", async () => {
    process.env.WIGTN_RESEND_API_KEY = "unit-test-key";
    delete process.env.CONTACT_WEBHOOK_URL;
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 500 }));
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(
      request({ name: "테스터", contact: "tester@example.com" }),
    );

    expect(response.status).toBe(502);
    expect(await response.json()).toMatchObject({ ok: false });
  });
});

/**
 * 슬랙은 받는 형식이 정해져 있다.
 *
 * text나 blocks가 아니면 400 invalid_payload로 거절한다. 우리 형식을 그대로
 * 보내면 붙지 않는데, 그 실패는 조용하다. 폼은 502를 내고 로그에만 남는다.
 * 형식이 어긋나는 순간을 여기서 잡는다.
 */
describe("슬랙 웹훅", () => {
  it("슬랙 주소면 슬랙 말로 바꿔 보낸다", async () => {
    delete process.env.WIGTN_RESEND_API_KEY;
    process.env.CONTACT_WEBHOOK_URL =
      "https://hooks.slack.com/services/T000/B000/xxxx";
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response("ok", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(
      request({
        name: "테스터",
        contact: "tester@example.com",
        company: "WIGTN",
        modules: ["채용"],
        message: "<script>alert(1)</script>문의드립니다",
      }),
    );
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const sent = JSON.parse(String(init.body));

    expect(response.status).toBe(200);
    // text가 있어야 알림 목록과 미리보기에 한 줄이 뜬다
    expect(sent.text).toContain("테스터");
    expect(Array.isArray(sent.blocks)).toBe(true);
    // 우리 형식은 섞이지 않는다. 슬랙은 모르는 최상위 키를 만나면 거절한다
    expect(sent.lead).toBeUndefined();

    const flat = JSON.stringify(sent);
    expect(flat).toContain("tester@example.com");
    // 살균을 지난 뒤라도 꺾쇠는 남지 않는다
    expect(flat).not.toContain("<script>");
  });

  it("슬랙이 아니면 원래 형식 그대로 보낸다", async () => {
    delete process.env.WIGTN_RESEND_API_KEY;
    process.env.CONTACT_WEBHOOK_URL = "https://webhook.example.test/contact";
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    await POST(
      request({
        name: "테스터",
        contact: "tester@example.com",
        company: "",
        modules: [],
        message: "문의",
      }),
    );
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const sent = JSON.parse(String(init.body));

    expect(sent.lead).toBeDefined();
    expect(sent.blocks).toBeUndefined();
  });
});
