"use client";

import { useState } from "react";

/**
 * 상담 폼 — 시안 정본 09번 `.formcard` 구조 그대로.
 *
 * r4 서버 예외 ②(실접수). "데모라 전송되지 않습니다" 문구는 전환 지점을 무력화하므로 쓰지 않는다.
 * POST /api/contact로 실제 접수한다 — 데모에서 유일하게 서버로 나가는 쓰기다.
 */
export function ContactForm() {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (sent) {
    return (
      <div className="formcard">
        <h2
          style={{
            fontSize: 20,
            fontWeight: 850,
            letterSpacing: "-.03em",
            marginBottom: 6,
          }}
        >
          요청이 접수되었어요.
        </h2>
        <p style={{ fontSize: "13.5px", color: "var(--ink-3)" }}>
          1영업일 안에 연락드릴게요.
        </p>
      </div>
    );
  }

  return (
    <form
      className="formcard"
      onSubmit={async (event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        setSending(true);
        setError(null);
        try {
          const response = await fetch("/api/contact", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              name: form.get("name"),
              contact: form.get("contact"),
              company: form.get("company"),
              message: form.get("message"),
            }),
          });
          const data = (await response.json()) as {
            ok: boolean;
            error?: string;
          };
          if (!data.ok) throw new Error(data.error ?? "접수하지 못했어요.");
          setSent(true);
        } catch (err) {
          setError(err instanceof Error ? err.message : "접수하지 못했어요.");
        } finally {
          setSending(false);
        }
      }}
    >
      <h2
        style={{
          fontSize: 20,
          fontWeight: 850,
          letterSpacing: "-.03em",
          marginBottom: 6,
        }}
      >
        이런 서비스, 우리 사업으로 만들기
      </h2>
      <p
        style={{
          fontSize: "13.5px",
          color: "var(--ink-3)",
          marginBottom: 22,
        }}
      >
        아래 정보를 남겨주시면 담당자가 연락드려요
      </p>

      <div className="field">
        <label>
          이름<span className="req">*</span>
        </label>
        <input className="in" name="name" placeholder="담당자 성함" required />
      </div>
      <div className="field">
        <label>
          연락처<span className="req">*</span>
        </label>
        <input
          className="in"
          name="contact"
          placeholder="이메일 또는 휴대폰"
          required
        />
      </div>
      <div className="field">
        <label>회사, 직책</label>
        <input
          className="in"
          name="company"
          placeholder="예: WIGTN / 신사업팀"
        />
      </div>

      <div className="field">
        <label>문의 내용</label>
        <textarea
          className="in"
          name="message"
          placeholder="구현하고 싶은 서비스를 자유롭게 적어주세요"
        />
      </div>

      {error ? (
        <div className="safenote warn" style={{ marginBottom: 14 }}>
          <b>{error}</b>
        </div>
      ) : null}

      <div
        className="formactions"
        style={{ alignItems: "center", justifyContent: "space-between" }}
      >
        <span style={{ fontSize: 12, color: "var(--ink-4)" }}>
          이 요청은 실제로 접수돼요, 1영업일 내 연락드려요
        </span>
        <button className="btn primary" type="submit" disabled={sending}>
          {sending ? "전송 중…" : "상담 요청 보내기"}
        </button>
      </div>
    </form>
  );
}
