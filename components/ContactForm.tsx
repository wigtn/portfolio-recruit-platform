"use client";

import { useEffect, useState } from "react";
import { Select } from "./ds/Select";
import { toast } from "./ds/Toaster";
import {
  loadDemoInquiries,
  saveDemoInquiry,
  type DemoInquiry,
} from "@/lib/demo/inquiries";

const CATEGORIES = [
  "화면 사용성",
  "회사 리뷰",
  "커뮤니티",
  "채용공고",
  "AI 기능",
  "기타",
];

const TEMPLATES = [
  { label: "좋았던 점", body: "좋았던 점\n- " },
  { label: "불편한 점", body: "불편했던 점\n- \n\n개선 제안\n- " },
  { label: "궁금한 점", body: "궁금한 기능\n- " },
];

export function ContactForm() {
  const [category, setCategory] = useState("");
  const [message, setMessage] = useState("");
  const [inquiries, setInquiries] = useState<DemoInquiry[]>([]);

  useEffect(() => setInquiries(loadDemoInquiries()), []);

  const submit = () => {
    if (!category) {
      toast("문의 종류를 선택해주세요.", { tone: "warn" });
      return;
    }
    const text = message.trim();
    if (!text) {
      toast("데모에서 확인할 문의 내용을 적어주세요.", { tone: "warn" });
      return;
    }
    const now = new Date();
    const inquiry: DemoInquiry = {
      id: crypto.randomUUID(),
      category,
      message: text,
      at: `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, "0")}.${String(now.getDate()).padStart(2, "0")}`,
    };
    saveDemoInquiry(inquiry);
    setInquiries(loadDemoInquiries());
    setMessage("");
    toast("데모 문의사항을 이 브라우저에 저장했어요.", { tone: "success" });
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
        데모 문의사항 남기기
      </h2>
      <p
        style={{
          fontSize: "13.5px",
          color: "var(--ink-3)",
          marginBottom: 22,
        }}
      >
        포트폴리오를 둘러보며 확인하고 싶은 내용을 기록해보세요.
      </p>

      <div className="safenote" style={{ marginBottom: 18 }}>
        <div>
          <b>개인정보를 받지 않는 체험용 기능이에요</b>
          <span>
            입력 내용은 이 브라우저에만 저장되며 WIGTN이나 외부 서비스로
            전송되지 않아요.
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
          ariaLabel="데모 문의 종류 선택"
          placeholder="어떤 화면에 관한 내용인가요"
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
          placeholder="이 데모에서 확인하고 싶은 내용을 적어주세요"
        />
      </div>

      <div className="formsubmit">
        <span className="formsubmit-note">실제 문의나 상담으로 접수되지 않아요</span>
        <button className="btn primary formsubmit-btn" type="button" onClick={submit}>
          데모 문의 저장
        </button>
      </div>

      {inquiries.length ? (
        <div className="demo-inquiries" aria-live="polite">
          <h3>이 브라우저에 저장한 문의</h3>
          {inquiries.map((inquiry) => (
            <div className="demo-inquiry" key={inquiry.id}>
              <div>
                <span className="tag neu">{inquiry.category}</span>
                <span>{inquiry.at}</span>
              </div>
              <p>{inquiry.message}</p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
