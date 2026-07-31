import { ContactForm } from "@/components/ContactForm";
import { ContactHero } from "@/components/ContactHero";
import { ContactSteps } from "@/components/ContactSteps";
import { SeenCard } from "./SeenCard";

export const metadata = { title: "상담 요청 | W 세일즈" };

/**
 * 시안 정본 09번(상담 요청) 구조 그대로 — .formgrid(신뢰 요약 카드 / .formcard)
 *
 * 왼쪽 "방금 보신 것들"은 체험 히스토리 기반 신뢰 요약이다 — 서버에서는
 * 진행도를 읽을 수 없어서 클라이언트 컴포넌트(SeenCard)로 분리했다.
 */
export default function ContactPage() {
  return (
    <>
      {/* 히어로 — 영상 무대 + 워드 리빌 + 포인터 패럴럭스(클라이언트) */}
      <ContactHero />

      {/* 두 칸 구조. "방금 보신 것들"은 폼 옆에서만 따라다니는 카드가 아니라
          스크롤 내내 붙어 있는 레일이다 — 무엇을 체험했는지 옆에 떠 있어야
          마지막 폼에서 쓸 말이 생긴다. 오른쪽이 본문, 폼은 그 끝에 앉는다. */}
      <div className="sec contact-shell">
        <aside className="contact-rail">
          {/* compact가 아니면 9개 항목이 화면 높이를 넘어 레일 안에 스크롤바가
              생긴다. 끝까지 따라오는 레일 안에서 또 스크롤하게 두지 않는다 */}
          <SeenCard compact />
        </aside>

        <div className="contact-main">
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
      </div>
    </>
  );
}
