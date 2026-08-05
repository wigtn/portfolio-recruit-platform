import { ContactForm } from "@/components/ContactForm";
import { ContactHero } from "@/components/ContactHero";
import { ContactSteps } from "@/components/ContactSteps";

export const metadata = { title: "1:1 문의 | W 세일즈" };

/**
 * 1:1 문의 — W 세일즈 서비스의 고객센터.
 *
 * "데모 문의사항"이라는 픽션 밖 이름은 걷어냈다(리뷰 결정). 접수하면 백오피스
 * 문의 큐(/admin/inquiries)에 실제로 쌓이고, 운영자 답변이 알림 벨과 내역으로
 * 돌아온다 — 신고·증빙과 같은 왕복 문법의 세 번째 사례다.
 *
 * "방금 보신 것들" 레일도 뺐다(리뷰 결정) — 체험 진행도의 정본은 우측 하단
 * 가이드 위젯이고, 고객센터 화면에 체험 요약이 떠 있을 이유가 없다.
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

        {/* 스크롤 맨 아래가 1:1 문의 폼이다 — 접수는 운영자 큐로 간다 */}
        <div id="contact-form">
          <ContactForm />
        </div>
      </div>
    </>
  );
}
