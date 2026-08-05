"use client";

import { useEffect, useState } from "react";
import { Select } from "./ds/Select";
import { toast } from "./ds/Toaster";
import { Icon } from "./Icon";
import { subscribeState } from "@/lib/admin/overlay";
import { myInquiries, submitInquiry } from "@/lib/demo/submit";
import { DEMO_PROFILE } from "@/lib/demo/profile";
import { useRole } from "@/lib/demo/role";
import { RoleModal } from "./demo/RoleModal";
import type { InquiryRow } from "@/lib/admin/seed";

/**
 * 1:1 문의 — W 세일즈 서비스의 고객센터 접수 폼.
 *
 * "데모 문의사항"이라는 이름은 픽션(서비스)과 현실(WIGTN) 어느 쪽에도 속하지
 * 않아 걷어냈다(리뷰 결정). 이 폼은 서비스 안의 물건이다: 접수하면 운영자
 * 문의 큐에 실제로 쌓이고, 답변이 달리면 알림 벨과 아래 내역으로 돌아온다 —
 * 신고·증빙과 같은 왕복 문법이다.
 *
 * 외부(슬랙·메일)로는 보내지 않는다. 이 브라우저의 오버레이가 전부다.
 * 실서비스 모듈로 뗄 때 발송 연동은 운영자 답변 지점(run.ts)에 붙는다.
 */

/* 분류는 백오피스 문의 큐 시드와 같은 목록 — 화면끼리 어긋나면 안 된다 */
const CATEGORIES = [
  "계정, 로그인",
  "회사 리뷰",
  "커뮤니티",
  "실적 인증",
  "채용공고",
  "기타",
];

const TEMPLATES = [
  { label: "이용 문의", body: "궁금한 기능\n- " },
  { label: "오류 신고", body: "겪은 문제\n- \n\n일어난 화면\n- " },
  { label: "개선 제안", body: "불편했던 점\n- \n\n제안\n- " },
];

export function ContactForm() {
  const { role } = useRole();
  const [category, setCategory] = useState("");
  const [message, setMessage] = useState("");
  const [mine, setMine] = useState<InquiryRow[]>([]);
  const [gateOpen, setGateOpen] = useState(false);

  useEffect(() => {
    // 답변이 달리는 쪽(백오피스)과 같은 저장소를 구독한다 — 왕복이 즉시 보인다
    const sync = () => setMine(myInquiries());
    sync();
    return subscribeState(sync);
  }, []);

  const submit = () => {
    // 문의는 내 계정의 일이다 — 게스트는 로그인(역할 전환)으로 유도한다
    if (role === "guest") {
      setGateOpen(true);
      return;
    }
    if (!category) {
      toast("문의 종류를 선택해주세요.", { tone: "warn" });
      return;
    }
    const text = message.trim();
    if (!text) {
      toast("문의 내용을 적어주세요.", { tone: "warn" });
      return;
    }
    submitInquiry({ category, message: text, by: DEMO_PROFILE.nick });
    setMessage("");
    setCategory("");
    toast("문의가 접수됐어요, 운영자가 답하면 알림으로 알려드려요.", {
      tone: "success",
    });
  };

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
        1:1 문의
      </h2>
      <p
        style={{
          fontSize: "13.5px",
          color: "var(--ink-3)",
          marginBottom: 22,
        }}
      >
        이용 중 궁금한 점을 남겨주세요, 운영자가 직접 답해드려요.
      </p>

      <div className="safenote" style={{ marginBottom: 18 }}>
        <div>
          <b>개인정보 없이 닉네임으로만 접수돼요</b>
          <span>
            체험용이라 이 브라우저에만 남고, 외부로 전송되지 않아요. 접수하면
            운영자 문의 큐에 실제로 쌓여요.
          </span>
        </div>
      </div>

      <div className="field">
        <label>
          문의 종류<span className="req">*</span>
        </label>
        <Select
          value={category}
          onChange={setCategory}
          options={CATEGORIES.map((name) => ({ value: name, label: name }))}
          ariaLabel="문의 종류 선택"
          placeholder="어떤 일에 관한 문의인가요"
        />
      </div>

      <div className="field">
        <label>
          문의 내용<span className="req">*</span>
        </label>
        <div className="msgtips">
          {TEMPLATES.map((item) => (
            <button
              key={item.label}
              type="button"
              className="msgtip"
              onClick={() =>
                setMessage((current) => (current.trim() ? current : item.body))
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
          rows={message ? 7 : 4}
          maxLength={2000}
          placeholder="궁금한 점이나 겪은 문제를 적어주세요"
        />
      </div>

      <div className="formsubmit">
        <span className="formsubmit-note">
          답변이 달리면 알림 벨로 알려드려요
        </span>
        <button
          className="btn primary formsubmit-btn"
          type="button"
          onClick={submit}
        >
          문의 접수
        </button>
      </div>

      {mine.length ? (
        <div className="demo-inquiries" aria-live="polite">
          <h3>내 문의 내역</h3>
          {mine.map((inquiry) => (
            <div
              className="demo-inquiry"
              key={inquiry.id}
              id={`inquiry-${inquiry.id}`}
            >
              <div>
                <span className="tag neu">{inquiry.category}</span>
                <span>{inquiry.at}</span>
                <span
                  className={
                    inquiry.status === "답변완료" ? "tag hot" : "tag neu"
                  }
                  style={{ marginLeft: "auto" }}
                >
                  {inquiry.status === "답변완료" ? "답변완료" : "접수됨"}
                </span>
              </div>
              <p>{inquiry.message}</p>
              {inquiry.answer ? (
                <div className="demo-inquiry-answer">
                  <div>
                    <Icon name="shield" />
                    <b>운영자 답변</b>
                  </div>
                  <p>{inquiry.answer}</p>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      {gateOpen ? <RoleModal onClose={() => setGateOpen(false)} /> : null}
    </div>
  );
}
