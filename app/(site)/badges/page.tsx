import { BadgePanel } from "@/components/BadgePanel";
import { Crumb } from "@/components/Crumb";

export const metadata = { title: "실적 인증 | W 세일즈" };

/**
 * 실적 인증 — 푸터가 이름을 부르면서도 화면이 없어 `/my`로 보내던 자리.
 *
 * 마이의 인증 카드는 "내 상태"만 보여준다. 여기서는 그 앞 단계(인증이 무엇이고
 * 등급이 어떻게 갈리는지)와 제출을 다룬다. 제출은 같은 경로를 타므로 운영자
 * 증빙 검토 큐로 그대로 넘어간다.
 */
export default function BadgesPage() {
  return (
    <>
      <div className="pagehead">
        <Crumb items={[{ label: "마이", href: "/my" }, { label: "실적 인증" }]} />
        <div className="ttl">
          <div>
            <h1>실적 인증</h1>
            <div className="desc">
              증빙을 올리면 운영자가 확인하고 등급을 올려줘요, 인증 회원의
              리뷰가 먼저 노출됩니다
            </div>
          </div>
        </div>
      </div>

      <div className="sec">
        <BadgePanel />
      </div>
    </>
  );
}
