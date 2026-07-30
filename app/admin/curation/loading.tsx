import { Sk } from "@/components/Skeleton";
import { RouteSk } from "@/components/admin/RouteSkeleton";

/**
 * 큐레이션 스켈레톤 — CurationBoard의 자체 스켈레톤(SK_CARDS)과 같은
 * 카드 구성·슬롯 수·슬롯 높이(표 행 밀도 36px 실측)를 쓴다. 둘이 다르면
 * loading → 클라이언트 스켈레톤 사이에서 한 번 더 밀린다.
 */
const CARDS: Array<{ title: string; slots: number }> = [
  { title: "추천 회사 (홈 상단)", slots: 3 },
  { title: "인기글 고정", slots: 2 },
  { title: "메인 공지 · 배너", slots: 1 },
];

export default function CurationLoading() {
  return (
    <RouteSk label="큐레이션">
      {/* 저장 버튼 자리 — 실측 34px, 우측 정렬 */}
      <div className="ahd" aria-hidden>
        <Sk w={62} h={34} r={8} />
      </div>
      <div className="curgrid" aria-hidden>
        {CARDS.map((card) => (
          <div className="curcard" key={card.title}>
            <h4>{card.title}</h4>
            {Array.from({ length: card.slots }).map((_, index) => (
              <div className="slot" key={index} style={{ height: 36 }}>
                <Sk w={16} h={13} />
                <Sk w="56%" h={13} />
              </div>
            ))}
            {/* "추가" 버튼 자리(30px) — 행 간격은 이제 구분선 행이 만든다 */}
            <Sk w="100%" h={30} r={8} />
          </div>
        ))}
        {/* 키워드 카드 — 안내 문구(20.6) + 제외 행(36) + 추가 버튼(30) 실측 */}
        <div className="curcard">
          <h4>인기 키워드 제외</h4>
          <div
            style={{ display: "flex", alignItems: "center", minHeight: 20.6 }}
          >
            <Sk w="72%" h={13} />
          </div>
          <div style={{ marginTop: 10 }}>
            <div className="slot" style={{ height: 36 }}>
              <Sk w="40%" h={13} />
            </div>
            <Sk w="100%" h={30} r={8} />
          </div>
        </div>
      </div>
    </RouteSk>
  );
}
