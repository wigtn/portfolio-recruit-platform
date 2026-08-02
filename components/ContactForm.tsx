"use client";

import { useState } from "react";
import { Select } from "./ds/Select";
import { toast } from "./ds/Toaster";

/**
 * 자주 오는 분야.
 *
 * 첫 회신에 무엇을 담을지가 여기서 갈린다. 커머스면 결제와 정산, 채용이면
 * 지원자 관리가 먼저 걸린다.
 *
 * 목록에 가두지 않는다. 업종은 우리가 다 알 수 없고, 목록에 없다고 못 적으면
 * 그 문의는 "기타"로 뭉개진다. 마지막 칸이 직접 입력인 이유다.
 */
/**
 * 문의 내용 작성 틀.
 *
 * 빈 칸을 마주하면 무엇을 적어야 할지 몰라 한 줄로 끝내거나 그냥 닫는다.
 * 그렇다고 항목을 필수로 만들면 문턱이 올라가 아예 안 보낸다.
 *
 * 그래서 틀만 준다. 누르면 뼈대가 들어가고 지우고 자유롭게 써도 된다.
 * 항목을 셋으로 묶은 이유는, 첫 회신에 견적 범위를 적으려면 그 셋이면
 * 되기 때문이다. 더 물으면 상담 요청이 아니라 설문이 된다.
 */
const TEMPLATES = [
  {
    label: "새로 만들어요",
    body: `무엇을 만들고 싶은지
-

지금 어떻게 하고 있는지
-

언제까지 필요한지
- `,
  },
  {
    label: "지금 걸 고쳐요",
    body: `지금 쓰는 것
-

무엇이 불편한지
-

언제까지 필요한지
- `,
  },
  {
    label: "아직 정하는 중",
    body: `풀고 싶은 문제
-

누가 쓰게 되는지
-

궁금한 점
- `,
  },
];

const DIRECT = "직접 입력";
const DOMAINS = [
  "채용, 커리어",
  "커머스, 쇼핑몰",
  "교육, 강의",
  "의료, 헬스케어",
  "부동산, 중개",
  "금융, 자산",
  "물류, 유통",
  "커뮤니티, 콘텐츠",
  "사내 시스템",
  DIRECT,
];

/**
 * 상담 폼 — 시안 정본 09번 `.formcard` 구조 그대로.
 *
 * r4 서버 예외 ②(실접수). "데모라 전송되지 않습니다" 문구는 전환 지점을 무력화하므로 쓰지 않는다.
 * POST /api/contact로 실제 접수한다 — 데모에서 유일하게 서버로 나가는 쓰기다.
 */
export function ContactForm() {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [domain, setDomain] = useState("");
  const [custom, setCustom] = useState("");
  const [message, setMessage] = useState("");

  /* 접수 뒤에도 폼은 그대로 둔다. 카드를 통째로 갈아끼우면 방금 무엇을
     보냈는지가 화면에서 사라지고, 한 건 더 보내려면 새로고침해야 한다.
     끝났다는 사실은 토스트로 알리고, 폼은 잠가서 두 번 눌리지 않게 한다. */
  return (
    <form
      className="formcard"
      onSubmit={async (event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        setSending(true);
        try {
          const response = await fetch("/api/contact", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              name: form.get("name"),
              contact: form.get("contact"),
              company: form.get("company"),
              // 직접 입력을 골랐으면 적은 값이 곧 도메인이다
              domain: (domain === DIRECT ? custom : domain).trim(),
              message,
            }),
          });
          const data = (await response.json()) as {
            ok: boolean;
            error?: string;
          };
          if (!data.ok) throw new Error(data.error ?? "접수하지 못했어요.");
          setSent(true);
          toast("상담 요청이 접수됐어요, 남겨주신 연락처로 회신드릴게요", {
            tone: "success",
          });
        } catch (err) {
          const reason =
            err instanceof Error ? err.message : "접수하지 못했어요.";
          /* 폼이 화면 밖에 있을 수도 있다. 실패는 특히 놓치면 안 된다 —
             인라인 배너는 폼 안에 갇히지만 토스트는 어디서든 보인다 */
          toast(reason, { tone: "error" });
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

      {/* 어느 업종의 서비스를 만들려는지.
          첫 회신에 무엇을 담을지가 여기서 갈린다. 커머스면 결제와 정산,
          채용이면 지원자 관리가 먼저 걸린다. 그래서 물어본다.

          고르게 하되 목록에 가두지 않는다. 업종은 우리가 다 알 수 없고,
          목록에 없다고 못 적으면 그 문의는 "기타"로 뭉개진다. */}
      <div className="field">
        <label>관심 분야</label>
        {/* 폭을 옆 칸들과 맞춘다. .ds-select는 inline-flex라 내용만큼만
            넓어지는데, 위아래 입력칸은 전폭이라 이 줄만 짧아 보였다 */}
        <Select
          value={domain}
          onChange={setDomain}
          options={DOMAINS.map((name) => ({ value: name, label: name }))}
          ariaLabel="관심 분야 선택"
          placeholder="어떤 업종인가요"
        />
        {domain === DIRECT ? (
          <input
            className="in"
            value={custom}
            onChange={(event) => setCustom(event.target.value)}
            placeholder="어떤 업종인지 적어주세요"
            aria-label="관심 분야 직접 입력"
            style={{ marginTop: 8 }}
            /* 서버 LIMITS.domain과 같은 값. 어긋나면 화면에서는 다 쳤는데
               서버가 조용히 잘라내는 구간이 생긴다 */
            maxLength={60}
            autoFocus
          />
        ) : null}
      </div>

      {/* 문의 내용은 여전히 선택이다.
          빈 칸을 마주하면 무엇을 적어야 할지 몰라 대충 쓰거나 그냥 닫는다.
          그렇다고 항목을 필수로 만들면 문턱이 올라가 아예 안 보낸다.

          그래서 **틀만 넣어준다.** 누르면 뼈대가 들어가고, 지우고 자유롭게
          써도 된다. 세 가지만 두는 이유는, 첫 회신에 견적 범위를 적으려면
          그 셋이면 되기 때문이다. 더 물으면 설문이 된다. */}
      <div className="field">
        <label>
          문의 내용
          <span
            style={{
              marginLeft: 6,
              fontSize: 11.5,
              fontWeight: 600,
              color: "var(--ink-4)",
            }}
          >
            선택
          </span>
        </label>
        <div className="msgtips">
          {TEMPLATES.map((item) => (
            <button
              key={item.label}
              type="button"
              className="msgtip"
              onClick={() =>
                setMessage((now) => (now.trim() ? now : item.body))
              }
            >
              {item.label}
            </button>
          ))}
        </div>
        <textarea
          className="in"
          name="message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          rows={message ? 8 : 4}
          placeholder="구현하고 싶은 서비스를 자유롭게 적어주세요. 위 버튼을 누르면 틀이 들어가요"
        />
      </div>

      {/* 안내를 위, 버튼을 아래 한 줄로. 좌우로 벌려 두면 좁은 화면에서
          줄바꿈이 어디서 일어날지에 따라 버튼이 이리저리 옮겨 다닌다.
          버튼 글자가 "전송 중…"으로 짧아질 때 폭이 줄어 자리가 밀리던 것도
          같은 이유다 — 폭을 고정한다. */}
      <div className="formsubmit">
        <span className="formsubmit-note">
          이 요청은 실제로 접수돼요
        </span>
        <button
          className="btn primary formsubmit-btn"
          type="submit"
          disabled={sending || sent}
        >
          {sending ? "전송 중…" : sent ? "접수됐어요" : "상담 요청 보내기"}
        </button>
      </div>
    </form>
  );
}
