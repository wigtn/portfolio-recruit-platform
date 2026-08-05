import { FEED } from "@/lib/seed/feed";
import { POSTS } from "@/lib/seed/posts";
import { REVIEWS } from "@/lib/seed/reviews";

/** 공개 리뷰와 작성자를 연결하지 않고, 마이페이지에서만 소유권을 복원하는 id. */
export const MY_REVIEW_IDS: readonly string[] = ["r-5", "r-9", "r-12"];

/**
 * 데모 사용자 프로필 — 헤더 계정 메뉴·마이·실적 인증이 같은 값을 읽는다.
 *
 * 두 화면이 각자 문자열을 들고 있으면 한쪽만 고쳤을 때 "드롭다운의 나"와
 * "마이의 나"가 달라진다. 실제로 그래서 어긋나 있었다.
 *
 * 등급 명칭은 /badges의 사다리(Lv.1~5)가 정본이다 — "재직 인증"·"L1" 같은
 * 화면별 표기가 제각각이라, 여기서 사다리 이름 하나로 묶는다.
 */
export const DEMO_PROFILE = {
  name: "익명 회원",
  /** 커뮤니티에 보이는 닉네임 — 글·댓글 시드가 이 이름으로 남아 있다 */
  nick: "김영업",
  /** 현재 등급 — 받은 도움 1,000+ 조건을 채운 상태(사다리 Lv.4) */
  level: "Lv.4 필드리더",
  /** 다음 등급 — 실적 증빙이 승인되면 올라간다(사다리 Lv.5) */
  nextLevel: "Lv.5 세일즈마스터",
  meta: "영업 3년차, 가입 8개월, 재직 확인 완료",
  /** 받은 도움 — Lv.4 조건(1,000+)을 채운 서사 값 */
  helpReceived: 1280,
  /**
   * 내 리뷰 수 — 공개 리뷰에는 작성자를 노출하지 않되, 내 활동에서는 소유권을
   * 복원해 목록과 답글 상태를 확인한다.
   */
  reviewCount: MY_REVIEW_IDS.length,
} as const;

/** 시드 피드에서 "내 글"로 치는 항목 — 마이 탭과 프로필 카드가 같이 센다 */
const MY_FEED_IDS: readonly string[] = ["f-1", "f-3"];

/**
 * 등급은 증빙 승인 여부에 따라 갈린다 — 등급 문자열을 쓰는 화면(마이·실적
 * 인증·계정 메뉴)이 전부 이 함수를 타야 승인 후에도 서로 어긋나지 않는다.
 */
export function levelFor(evidenceStatus?: string | null) {
  return evidenceStatus === "승인"
    ? DEMO_PROFILE.nextLevel
    : DEMO_PROFILE.level;
}

/**
 * 시드에 박힌 내 활동 — 프로필 카드 수치와 탭 카운트·목록이 전부 여기서
 * 파생된다. 프로필 카드가 "작성글 24"를 따로 들고 있으면 바로 아래 탭의
 * "내 글 2"와 한 화면에서 충돌한다(실제로 그랬다).
 */
export function seedActivity() {
  return {
    posts: FEED.filter((item) => MY_FEED_IDS.includes(item.id)),
    comments: POSTS.flatMap((post) =>
      post.comments
        .filter((comment) => comment.author === DEMO_PROFILE.nick)
        .map((comment) => ({ post, comment })),
    ),
    reviews: REVIEWS.filter((review) => MY_REVIEW_IDS.includes(review.id)),
  };
}
