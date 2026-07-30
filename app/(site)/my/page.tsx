import { MyPanel } from "@/components/MyPanel";
import { Crumb } from "@/components/Crumb";

export const metadata = { title: "마이 | W 세일즈" };

/**
 * 시안 정본 08번(마이페이지) 구조 — .profilecard → .split(.tabs+.feed / 사이드 카드).
 * 프로필 카드는 MyPanel 안에 있다 — 카드 수치와 탭 카운트가 같은 소스에서
 * 파생돼야 해서다(서버에서 박아 두면 한 화면 안에서 수치가 어긋난다).
 *
 * 인증 카드가 데모 포인트: 증빙 신청이 운영자 검토로 이어지고, 반려 사유가 여기 뜬다.
 */
export default function MyPage() {
  return (
    <>
      {/* 사이트에서 유일하게 h1이 없던 화면 — 제목 계층을 다른 페이지와 맞춘다 */}
      <div className="pagehead">
        <Crumb items={[{ label: "마이페이지" }]} />
        <div className="ttl">
          <div>
            <h1>마이페이지</h1>
            <div className="desc">
              내 활동과 등급·증빙 상태를 한곳에서 확인해요
            </div>
          </div>
        </div>
      </div>

      <div className="sec">
        <MyPanel />
      </div>
    </>
  );
}
