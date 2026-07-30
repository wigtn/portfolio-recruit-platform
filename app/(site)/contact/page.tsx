import { ContactForm } from "@/components/ContactForm";
import { ContactHero } from "@/components/ContactHero";
import { ContactSteps } from "@/components/ContactSteps";
import { ModuleShowcase } from "@/components/ModuleShowcase";
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

      <div className="sec">
        {/* 세일즈 포인트 — 이 데모를 이룬 모듈이 곧 제안서다 */}
        <ModuleShowcase />

        {/* 진행 과정 — 레일이 차오르는 플로우. 자동 순환·호버 정지는 그대로다 */}
        <div className="card ctimeline-row">
          <h4>진행 과정</h4>
          <ContactSteps />
        </div>

        <div className="formgrid contact-grid">
          {/* 방금 보신 것들 — 폼을 작성하는 동안 스크롤을 따라온다 */}
          <div className="wside">
            <SeenCard />
          </div>

          <ContactForm />
        </div>
      </div>
    </>
  );
}
