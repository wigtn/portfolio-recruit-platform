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
  //  이메일(Resend REST)이 1순위, 웹훅이 2순위다. 이메일 실패 시 웹훅으로
  //  폴백해 리드를 지킨다. 둘 다 없으면 성공으로 위장하지 않는다 —
  //  사용자는 접수됐다고 믿는데 리드가 유실되는 게 최악이다.
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

  // 1순위: contact@wigtn.com 직접 발송
  if (resendKey) {
    try {
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
      if (response.ok) {
        return NextResponse.json({ ok: true, requestId, channel: "email" });
      }
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
    // 이메일이 실패해도 웹훅이 있으면 아래로 폴백한다
    if (!webhook) {
      return NextResponse.json(
        {
          ok: false,
          error: "지금 접수가 어려워요. 잠시 후 다시 시도해주세요.",
        },
        { status: 502 },
      );
    }
  }

  /* 2순위: 웹훅

     슬랙은 받는 형식이 정해져 있다. text나 blocks가 아니면 400
     invalid_payload로 거절한다. 우리 형식을 그대로 보내면 붙지 않는다.
     그래서 주소를 보고 슬랙이면 슬랙 말로 바꿔 보낸다.

     주소로 판별하는 이유는, 설정을 하나 더 만들면 웹훅 주소와 형식이
     따로 놀 수 있어서다. 슬랙 주소를 넣었는데 형식이 generic이면 아무 일도
     안 일어나고, 무엇이 잘못됐는지도 안 보인다. 주소가 곧 형식이면 어긋날
     자리가 없다. */
  const toSlack = /(^|\.)hooks\.slack\.com$/i.test(
    (() => {
      try {
        return new URL(webhook!).hostname;
      } catch {
        return "";
      }
    })(),
  );

  const lead = {
    receivedAt,
    name: body.name,
    contact: body.contact,
    company: body.company,
    modules: body.modules,
    message,
  };

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
    if (!response.ok) {
      console.error("[contact] 발송 실패", {
        requestId,
        reason: "webhook_rejected",
        status: response.status,
      });
      return NextResponse.json(
        {
          ok: false,
          error: "지금 접수가 어려워요. 잠시 후 다시 시도해주세요.",
        },
        { status: 502 },
      );
    }
  } catch {
    console.error("[contact] 발송 실패", {
      requestId,
      reason: "webhook_unreachable",
    });
    return NextResponse.json(
      { ok: false, error: "지금 접수가 어려워요. 잠시 후 다시 시도해주세요." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true, requestId, channel: "webhook" });
}
