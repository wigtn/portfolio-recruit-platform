import { ContactForm } from "@/components/ContactForm";
import { ContactHero } from "@/components/ContactHero";
import { ContactSteps } from "@/components/ContactSteps";

export const metadata = { title: "상담 요청 | W 세일즈" };

/**
 * 시안 정본 09번(상담 요청) 구조 — 진행 과정 / .formcard 한 열.
 *
 * "방금 보신 것들" 레일은 뺐다 — 체험 진행도는 우측 하단 가이드 위젯이
 * 정본이고, 같은 목록이 두 곳에 떠 있으면 어느 쪽을 보고 채워야 하는지만
 * 흐려진다. 여기서는 상담 폼이 주인공이다.
 */
export default function ContactPage() {
  return (
    <>
      {/* 히어로 — 영상 무대 + 워드 리빌 + 포인터 패럴럭스(클라이언트) */}
      <ContactHero />

      <div className="sec contact-main">
        {/* 진행 과정 — 레일이 차오르는 플로우. 자동 순환·호버 정지는 그대로다 */}
        <div className="card ctimeline-row">
          <h4>진행 과정</h4>
          <ContactSteps />
        </div>

        {/* 스크롤 맨 아래가 상담 폼이다 */}
        <div id="contact-form">
          <ContactForm />
        </div>
      </div>
    </>
  );
}
