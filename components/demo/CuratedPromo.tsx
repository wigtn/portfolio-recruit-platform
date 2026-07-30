/**
 * 상단 띠 문구 — 이 데모를 만든 곳(WIGTN)이 방문자에게 하는 말이다.
 *
 * 데모 속 서비스의 운영 배너(큐레이션에서 설정)는 성격이 달라 여기 섞지 않는다
 * — 그건 `ServiceBanner`가 내비 아래 서비스 레이어에서 따로 띄운다.
 * 한 줄에 섞으면 누가 누구에게 하는 말인지 알 수 없다.
 */
export function CuratedPromo() {
  return (
    <span className="promo-line">
      <span className="promo-wide">
        이 화면 그대로, <b>업종만 바꿔</b> 만들어 드려요
      </span>
      <span className="promo-mobile">
        <b>업종만 바꿔</b> 제작해요
      </span>
    </span>
  );
}
