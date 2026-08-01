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
      {/* 모듈 이야기는 하지 않는다 — ClosingBanner의 주석 참고. 부품 조립으로
          읽히는 순간 값을 깎을 논거를 우리가 먼저 내주는 셈이 된다.

          이 자리에서 할 말은 하나다: 지금 보고 있는 게 진짜로 돈다. 방문자가
          첫 화면에서 그걸 알아야 나머지를 눌러 볼 마음이 생긴다. */}
      <span className="promo-wide">
        여기 보이는 것 <b>전부 실제로 동작해요</b>, 눌러서 확인해보세요
      </span>
      <span className="promo-mobile">
        <b>전부 실제로 동작해요</b>
      </span>
    </span>
  );
}
