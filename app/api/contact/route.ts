import { NextResponse } from "next/server";
import { renderSanitizedHtml } from "@wigtn/content-engine";

const MAX_BODY_BYTES = 32 * 1024;
const LIMITS = {
  name: 80,
  contact: 200,
  company: 200,
  message: 5_000,
  modules: 12,
} as const;

type Payload = {
  name: string;
  contact: string;
  company: string;
  modules: string[];
  message: string;
};

function readString(
  source: Record<string, unknown>,
  key: keyof Omit<Payload, "modules">,
  max: number,
) {
  const value = source[key];
  if (value === undefined || value === null) return "";
  if (typeof value !== "string") throw new Error(`${key}:type`);
  const trimmed = value.trim();
  if (trimmed.length > max) throw new Error(`${key}:length`);
  return trimmed;
}

function parsePayload(value: unknown): Payload {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("body:type");
  }
  const source = value as Record<string, unknown>;
  const modules = source.modules ?? [];
  if (
    !Array.isArray(modules) ||
    modules.length > LIMITS.modules ||
    modules.some((item) => typeof item !== "string" || item.length > 80)
  ) {
    throw new Error("modules:type");
  }
  return {
    name: readString(source, "name", LIMITS.name),
    contact: readString(source, "contact", LIMITS.contact),
    company: readString(source, "company", LIMITS.company),
    message: readString(source, "message", LIMITS.message),
    modules: [...new Set(modules.map((item) => item.trim()).filter(Boolean))],
  };
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    return NextResponse.json(
      { ok: false, error: "문의 내용이 너무 커요." },
      { status: 413 },
    );
  }

  let body: Payload;
  try {
    body = parsePayload(await request.json());
  } catch {
    return NextResponse.json(
      { ok: false, error: "입력 형식을 확인해주세요." },
      { status: 400 },
    );
  }

  if (!body.name || !body.contact) {
    return NextResponse.json(
      { ok: false, error: "이름과 연락처를 남겨주세요." },
      { status: 400 },
    );
  }

  let message = "";
  if (body.message) {
    try {
      message = renderSanitizedHtml({
        version: 1,
        blocks: body.message
          .split(/\n{2,}/)
          .map((text) => ({ type: "paragraph" as const, text })),
      });
    } catch {
      return NextResponse.json(
        { ok: false, error: "문의 내용을 확인해주세요." },
        { status: 400 },
      );
    }
  }

  // ── 발송 채널 ─────────────────────────────────────────────────
  //  이메일과 웹훅으로 **함께** 보낸다. 둘은 역할이 다르다 — 슬랙은 지금
  //  알아채라고 있고, 메일은 나중에 찾으라고 있다. 하나라도 닿으면 접수
  //  성공으로 본다. 둘 다 없으면 성공으로 위장하지 않는다 — 사용자는
  //  접수됐다고 믿는데 리드가 유실되는 게 최악이다.
  //  키는 보안 규약대로 WIGTN_* 환경변수로만 받는다.
  const resendKey = process.env.WIGTN_RESEND_API_KEY;
  const webhook = process.env.CONTACT_WEBHOOK_URL;
  if (!resendKey && !webhook) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "현재 상담 접수 채널을 준비 중이에요. 잠시 후 다시 시도해주세요.",
      },
      { status: 503 },
    );
  }

  const to = process.env.CONTACT_TO ?? "contact@wigtn.com";
  const requestId = crypto.randomUUID();
  const receivedAt = new Date().toISOString();

  const withTimeout = async (
    run: (signal: AbortSignal) => Promise<Response>,
  ) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8_000);
    try {
      return await run(controller.signal);
    } finally {
      clearTimeout(timeout);
    }
  };

  /* 두 채널로 **함께** 보낸다.

     예전에는 이메일이 성공하면 그 자리에서 끝내고 웹훅은 타지 않았다.
     폴백 구조였다. 그런데 둘은 역할이 다르다. 슬랙은 지금 알아채라고 있고,
     메일은 나중에 찾으라고 있다. 하나가 성공했다고 다른 하나를 건너뛰면
     둘 중 하나의 목적이 사라진다.

     같이 보내되 판정은 느슨하게 한다. **하나라도 닿으면 접수 성공**이다.
     리드는 이미 우리 손에 들어왔으므로, 슬랙이 잠깐 죽었다고 방문자에게
     실패를 보여줄 이유가 없다. 실패한 쪽은 로그에 남겨 나중에 본다.

     동시에 보내는 이유는 각각 8초 상한이 걸려 있어서다. 차례로 보내면
     둘 다 느린 날 16초를 기다리게 된다. */
  const lead = {
    receivedAt,
    name: body.name,
    contact: body.contact,
    company: body.company,
    modules: body.modules,
    message,
  };

  const sendEmail = async (): Promise<boolean> => {
    const escape = (value: string) =>
      value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;");
    const rows = [
      ["이름", body.name],
      ["연락처", body.contact],
      ["회사", body.company || "-"],
      ["관심 모듈", body.modules.join(", ") || "-"],
    ]
      .map(
        ([label, value]) =>
          `<tr><td style="padding:6px 14px 6px 0;color:#6b7280;white-space:nowrap">${label}</td><td style="padding:6px 0">${escape(value)}</td></tr>`,
      )
      .join("");
    try {
      const response = await withTimeout((signal) =>
        fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            authorization: `Bearer ${resendKey}`,
            "content-type": "application/json",
            "x-wigtn-request-id": requestId,
          },
          body: JSON.stringify({
            from:
              process.env.CONTACT_FROM ??
              "W 세일즈 데모 <onboarding@resend.dev>",
            to: [to],
            // 답장이 바로 리드에게 가도록 — 연락처가 이메일일 때만
            ...(body.contact.includes("@") ? { reply_to: body.contact } : {}),
            subject: `[상담 요청] ${body.name}${body.company ? `, ${body.company}` : ""}`,
            html: `<table style="font-size:14px;line-height:1.6">${rows}</table>${
              message
                ? `<hr style="margin:16px 0;border:0;border-top:1px solid #e5e7eb">${message}`
                : ""
            }<p style="margin-top:20px;font-size:12px;color:#9ca3af">requestId ${requestId}, ${receivedAt}</p>`,
          }),
          signal,
        }),
      );
      if (response.ok) return true;
      console.error("[contact] 이메일 발송 실패", {
        requestId,
        reason: "resend_rejected",
        status: response.status,
      });
    } catch {
      console.error("[contact] 이메일 발송 실패", {
        requestId,
        reason: "resend_unreachable",
      });
    }
    return false;
  };

  const sendWebhook = async (): Promise<boolean> => {
    /* 슬랙은 받는 형식이 정해져 있다. text나 blocks가 아니면 400
       invalid_payload로 거절한다. 우리 형식을 그대로 보내면 붙지 않는다.
       그래서 주소를 보고 슬랙이면 슬랙 말로 바꿔 보낸다.

       주소로 판별하는 이유는, 설정을 하나 더 만들면 웹훅 주소와 형식이
       따로 놀 수 있어서다. 슬랙 주소를 넣었는데 형식이 generic이면 아무 일도
       안 일어나고, 무엇이 잘못됐는지도 안 보인다. 주소가 곧 형식이면 어긋날
       자리가 없다. */
    const host = (() => {
      try {
        return new URL(webhook!).hostname;
      } catch {
        return "";
      }
    })();
    const toSlack = /(^|\.)hooks\.slack\.com$/i.test(host);

    const payload = toSlack
      ? {
          // 알림 목록과 미리보기에 뜨는 한 줄. blocks만 있으면 여기가 빈다
          text: `상담 요청, ${body.name}${body.company ? ` (${body.company})` : ""}`,
          blocks: [
            {
              type: "header",
              text: { type: "plain_text", text: "상담 요청이 들어왔어요" },
            },
            {
              type: "section",
              fields: [
                { type: "mrkdwn", text: `*이름*\n${body.name}` },
                { type: "mrkdwn", text: `*연락처*\n${body.contact}` },
                { type: "mrkdwn", text: `*회사*\n${body.company || "-"}` },
                {
                  type: "mrkdwn",
                  text: `*관심 모듈*\n${body.modules.join(", ") || "-"}`,
                },
              ],
            },
            ...(message
              ? [
                  {
                    type: "section",
                    // 본문은 살균을 거친 HTML이라 태그를 걷어내고 넘긴다
                    text: {
                      type: "mrkdwn",
                      text: message.replace(/<[^>]*>/g, "").slice(0, 2900),
                    },
                  },
                ]
              : []),
            {
              type: "context",
              elements: [
                { type: "mrkdwn", text: `${receivedAt} · ${requestId}` },
              ],
            },
          ],
        }
      : { to, lead };

    try {
      const response = await withTimeout((signal) =>
        fetch(webhook!, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-wigtn-request-id": requestId,
          },
          body: JSON.stringify(payload),
          signal,
        }),
      );
      if (response.ok) return true;
      console.error("[contact] 발송 실패", {
        requestId,
        reason: "webhook_rejected",
        status: response.status,
      });
    } catch {
      console.error("[contact] 발송 실패", {
        requestId,
        reason: "webhook_unreachable",
      });
    }
    return false;
  };

  const [emailOk, webhookOk] = await Promise.all([
    resendKey ? sendEmail() : Promise.resolve(false),
    webhook ? sendWebhook() : Promise.resolve(false),
  ]);

  const channels = [
    ...(emailOk ? ["email"] : []),
    ...(webhookOk ? ["webhook"] : []),
  ];

  if (!channels.length) {
    return NextResponse.json(
      { ok: false, error: "지금 접수가 어려워요. 잠시 후 다시 시도해주세요." },
      { status: 502 },
    );
  }

  /* channel은 예전 이름을 유지한다. 여러 곳이 성공했을 때 어느 하나를
     대표로 적어야 한다면 이메일이다. 기록으로 남는 쪽이라서. */
  return NextResponse.json({
    ok: true,
    requestId,
    channel: channels[0],
    channels,
  });
}