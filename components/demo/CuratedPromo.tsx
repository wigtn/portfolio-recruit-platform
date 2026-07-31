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
      {/* "이 화면 그대로"는 쓰지 않는다. 데모를 그대로 넘긴다는 말로 읽혀
          정작 하려는 이야기(검증된 부품을 당신 업종으로 다시 조합한다)를 가린다 */}
      <span className="promo-wide">
        검증된 모듈로, <b>당신의 업종에 맞게</b> 만들어 드려요
      </span>
      <span className="promo-mobile">
        <b>당신의 업종에 맞게</b> 제작해요
      </span>
    </span>
  );
}
