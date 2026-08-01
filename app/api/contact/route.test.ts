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
  delete process.env.CONTACT_SITE;
  delete process.env.CONTACT_SITE_URL;
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

/* 이 라우트는 포폴마다 복사돼 간다. 받는 메일함과 슬랙 채널은 하나인데
   보내는 사이트는 여럿이라, 출처가 빠지면 첫 회신에서 "어느 화면 보셨어요"를
   되물어야 한다. 두 채널 모두에서 확인한다. */
describe("요청 출처", () => {
  it("메일 제목과 본문에 사이트가 들어간다", async () => {
    process.env.WIGTN_RESEND_API_KEY = "unit-test-key";
    process.env.CONTACT_SITE = "테스트 포폴";
    process.env.CONTACT_SITE_URL = "https://example.test";
    delete process.env.CONTACT_WEBHOOK_URL;
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await POST(request({ name: "테스터", contact: "t@example.com" }));
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const mail = JSON.parse(String(init.body));

    expect(mail.subject).toContain("테스트 포폴");
    expect(mail.html).toContain("요청 출처");
    expect(mail.html).toContain("https://example.test");
  });

  it("슬랙 미리보기 한 줄에도 사이트가 들어간다", async () => {
    delete process.env.WIGTN_RESEND_API_KEY;
    process.env.CONTACT_SITE = "테스트 포폴";
    process.env.CONTACT_WEBHOOK_URL =
      "https://hooks.slack.com/services/T000/B000/xxxx";
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response("ok", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await POST(request({ name: "테스터", contact: "t@example.com" }));
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const sent = JSON.parse(String(init.body));

    // 열어보기 전에 어느 건인지 알아야 하므로 text에 있어야 한다
    expect(sent.text).toContain("테스트 포폴");
  });
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
        domain: "채용, 커리어",
        message: "<script>alert(1)</script>",
      }),
    );
    const result = await response.json();
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const forwarded = JSON.parse(String(init.body));

    expect(response.status).toBe(200);
    expect(result).toMatchObject({ ok: true });
    expect(result.requestId).toEqual(expect.any(String));
    expect(forwarded.lead.domain).toBe("채용, 커리어");
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

  /* 연락처는 메일 HTML에서 유일하게 href 속성 안으로 들어가는 값이다.
     꺾쇠만 막고 따옴표를 두면 속성을 닫고 나와 <a>에 임의 속성을 붙일 수
     있다 — 본문이 아니라 링크가 통로다. */
  it("따옴표가 섞인 연락처가 링크 속성을 깨고 나오지 못한다", async () => {
    process.env.WIGTN_RESEND_API_KEY = "unit-test-key";
    delete process.env.CONTACT_WEBHOOK_URL;
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(
      request({
        name: "테스터",
        contact: `tester@example.com" onmouseover="steal()`,
      }),
    );
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const mail = JSON.parse(String(init.body));

    expect(response.status).toBe(200);
    /* 속성이 열리지 않는다. `onmouseover=`라는 글자 자체는 남는다 —
       &quot; 뒤의 그냥 글자라서. 위험한 건 진짜 따옴표가 붙은 형태다. */
    expect(mail.html).not.toContain('onmouseover="');
    expect(mail.html).not.toContain('example.com" ');
    // 값 자체는 글자로 남아 담당자가 무엇이 들어왔는지 볼 수 있다
    expect(mail.html).toContain("&quot;");
    // 형태가 아니면 링크로도, 답장 주소로도 쓰지 않는다
    expect(mail.html).not.toContain("mailto:");
    expect(mail.reply_to).toBeUndefined();
  });

  it("이메일 형태가 아닌 연락처는 답장 주소로 쓰지 않는다", async () => {
    process.env.WIGTN_RESEND_API_KEY = "unit-test-key";
    delete process.env.CONTACT_WEBHOOK_URL;
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    // @는 있지만 주소가 아니다. 그대로 넣으면 Resend가 메일 전체를 거절한다
    await POST(request({ name: "테스터", contact: "카톡 @tester 로 주세요" }));
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const mail = JSON.parse(String(init.body));

    expect(mail.reply_to).toBeUndefined();
    expect(mail.html).not.toContain("mailto:");
    expect(mail.html).toContain("카톡 @tester 로 주세요");
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
        domain: "채용, 커리어",
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
        message: "문의",
      }),
    );
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const sent = JSON.parse(String(init.body));

    expect(sent.lead).toBeDefined();
    expect(sent.blocks).toBeUndefined();
  });
});

/**
 * 둘 다 보내는지.
 *
 * 예전에는 이메일이 성공하면 그 자리에서 끝내고 웹훅은 타지 않았다.
 * 폴백이라 의도한 동작이었지만, 슬랙은 지금 알아채라고 있고 메일은 나중에
 * 찾으라고 있어서 역할이 다르다. 하나가 됐다고 다른 하나를 건너뛰면 둘 중
 * 하나의 목적이 사라진다.
 *
 * 되돌아가도 겉으로는 멀쩡해 보인다. 폼은 200을 내고 메일도 온다. 슬랙만
 * 조용히 안 온다. 그래서 여기서 고정한다.
 */
describe("발송 채널", () => {
  it("메일이 성공해도 웹훅을 함께 보낸다", async () => {
    process.env.WIGTN_RESEND_API_KEY = "test-key";
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
        message: "문의",
      }),
    );
    const result = await response.json();
    const urls = fetchMock.mock.calls.map((c) => String(c[0]));

    expect(response.status).toBe(200);
    expect(urls).toContain("https://api.resend.com/emails");
    expect(urls.some((u) => u.includes("hooks.slack.com"))).toBe(true);
    expect(result.channels).toEqual(["email", "webhook"]);
  });

  it("한쪽이 죽어도 접수는 성공이다", async () => {
    process.env.WIGTN_RESEND_API_KEY = "test-key";
    process.env.CONTACT_WEBHOOK_URL = "https://webhook.example.test/contact";
    const fetchMock = vi.fn(async (url: string) =>
      String(url).includes("resend")
        ? new Response(null, { status: 500 })
        : new Response(null, { status: 204 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(
      request({
        name: "테스터",
        contact: "tester@example.com",
        company: "",
        message: "문의",
      }),
    );
    const result = await response.json();

    // 리드는 이미 손에 들어왔다. 슬랙이 잠깐 죽었다고 실패를 보여줄 이유가 없다
    expect(response.status).toBe(200);
    expect(result.channels).toEqual(["webhook"]);
  });

  it("둘 다 죽으면 성공으로 위장하지 않는다", async () => {
    process.env.WIGTN_RESEND_API_KEY = "test-key";
    process.env.CONTACT_WEBHOOK_URL = "https://webhook.example.test/contact";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 500 })),
    );

    const response = await POST(
      request({
        name: "테스터",
        contact: "tester@example.com",
        company: "",
        message: "문의",
      }),
    );

    expect(response.status).toBe(502);
  });
});
