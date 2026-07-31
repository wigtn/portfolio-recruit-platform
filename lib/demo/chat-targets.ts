/**
 * 챗봇이 가리킬 수 있는 화면 지점.
 *
 * 챗봇이 "백오피스에서 보실 수 있어요"라고 말하는 것과, 백오피스를 열고
 * 사이드바를 짚으며 "여기요"라고 하는 것은 다른 물건이다. 후자를 하려면
 * 가리킬 곳에 이름이 있어야 한다.
 *
 * 셀렉터를 모델에게 맡기지 않는다. 모델이 CSS를 지어내면 절반이 빗나가고,
 * 빗나간 강조는 "조작할 수 있다"는 인상 자체를 무너뜨린다. 여기 적힌
 * 이름만 부를 수 있고, 없는 이름은 실행 단계에서 거절된다.
 *
 * where는 그 지점이 있는 화면이다. 챗봇이 먼저 그 화면으로 이동해야 하는지
 * 판단하는 데 쓴다.
 */
export type Target = {
  id: string;
  /** 모델이 읽는 설명. 이게 곧 사용법이다 */
  what: string;
  /** 이 지점이 사는 화면. "any"는 어느 화면에서나 있다 */
  where: string;
  selector: string;
};

export const TARGETS: Target[] = [
  {
    id: "header_search",
    what: "상단 통합 검색 버튼. 회사와 글을 한 번에 찾는다",
    where: "any",
    selector: ".gsearch",
  },
  {
    id: "header_bell",
    what: "알림 벨. 신고나 증빙 처리 결과가 여기로 돌아온다",
    where: "any",
    selector: ".nav .acct-btn[aria-label*='알림']",
  },
  {
    id: "header_account",
    what: "계정 메뉴. 역할 전환이 여기 있다",
    where: "any",
    selector: ".nav .acct:last-of-type .acct-btn",
  },
  {
    id: "community_list",
    what: "커뮤니티 글 목록",
    where: "/community",
    selector: "#community-feed, .feed",
  },
  {
    id: "community_pager",
    what: "게시판 페이지 버튼. 눌러도 화면이 움직이지 않는다",
    where: "/community",
    selector: ".paging",
  },
  {
    id: "community_filters",
    what: "게시판 정렬과 필터 줄",
    where: "/community",
    selector: ".filterbar",
  },
  {
    id: "jobs_list",
    what: "채용공고 카드 목록",
    where: "/jobs",
    selector: ".cgrid",
  },
  {
    id: "jobs_infinite",
    what: "무한 스크롤 발치. 스크롤하면 이어서 불러온다",
    where: "/jobs",
    selector: ".inf-foot",
  },
  {
    id: "company_score",
    what: "회사 평점 상자. 영업 5축 막대가 있다",
    where: "/companies/",
    selector: ".scorebox",
  },
  {
    id: "company_reviews",
    what: "현직자 리뷰 목록",
    where: "/companies/",
    selector: ".review",
  },
  {
    id: "contact_rail",
    what: "왼쪽 체험 기록 레일. 무엇을 해봤는지 따라다닌다",
    where: "/contact",
    selector: ".contact-rail",
  },
  {
    id: "contact_form",
    what: "상담 신청 폼",
    where: "/contact",
    selector: "#contact-form",
  },
  {
    id: "admin_sidebar",
    what: "백오피스 사이드바. 운영 메뉴 전체가 여기 있다",
    where: "/admin",
    selector: ".pnav, .psidebar, aside nav",
  },
  {
    id: "admin_metrics",
    what: "백오피스 대시보드 지표",
    where: "/admin",
    selector: ".dashboard-metrics, .metric-card",
  },
  {
    id: "admin_table",
    what: "백오피스 표. 정렬과 검색, 내려받기가 붙어 있다",
    where: "/admin",
    selector: ".dtable, .tablecard",
  },
  {
    id: "demo_guide",
    what: "우측 하단 체험 가이드 버튼",
    where: "any",
    selector: ".demowidget .fab",
  },
];

/**
 * 지점 이름 앞에 붙는 표식.
 *
 * 화면 이름(open_screen)과 지점 이름(point_at)이 형태가 같아서 모델이
 * 섞어 썼다. `admin`과 `admin_sidebar`, `community`와 `community_list`는
 * 생김새로 구분할 방법이 없고, 접두어까지 겹친다. 어느 목록 소속인지는
 * "지금 어느 도구를 부르는가"로만 알 수 있는데, 도구가 스물이 넘으면 그
 * 기억이 흐려진다. 실제로 "백오피스 화면 열어줘"에 지점 이름인
 * `demo_guide`를 화면 자리에 넣는 일이 세 번 다 재현됐다.
 *
 * 그래서 이름이 스스로 소속을 말하게 한다. `@`로 시작하면 지점이고, 화면일
 * 수 없다. 외워야 할 것을 형태로 옮긴 것이다.
 *
 * 표식은 모델에게 보이는 쪽에만 붙인다. selector와 화면 코드가 쓰는 내부
 * 이름은 그대로다. 바깥 규약 때문에 안쪽을 흔들 이유가 없다.
 */
export const SPOT = "@";

/** 표식이 붙은 이름과 안 붙은 이름 둘 다 받는다.
    모델이 표식을 빠뜨려도 가리키는 곳은 하나뿐이라 헷갈릴 여지가 없다 */
export const TARGET_BY_ID: Record<string, Target> = Object.fromEntries(
  TARGETS.flatMap((target) => [
    [`${SPOT}${target.id}`, target],
    [target.id, target],
  ]),
);

/** 모델 프롬프트에 넣을 목록. 이름과 설명만 준다 */
export const TARGET_ENUM = TARGETS.map((target) => `${SPOT}${target.id}`);
export const TARGET_GUIDE = TARGETS.map(
  (target) => `${SPOT}${target.id} (${target.where}): ${target.what}`,
).join("\n");

/** 이 값이 화면 이름이 아니라 지점 이름인가 */
export function isSpot(value: string): boolean {
  return value.startsWith(SPOT) || value in TARGET_BY_ID;
}

/** 에이전트 커서에게 한 걸음을 시키는 신호 */
export const AGENT_EVENT = "wigtn-demo-agent";
/** 그 걸음이 끝났다는 신호. 고정 시간으로 어림하면 설명이 어긋난다 */
export const AGENT_DONE_EVENT = "wigtn-demo-agent-done";

export type AgentStep = {
  selector: string;
  /** 커서 옆에 띄울 한 줄. 왜 여기를 짚는지 */
  note?: string;
  /** 짚기만 할지, 실제로 누를지 */
  click?: boolean;
  /** 머무는 시간(ms) */
  hold?: number;
};
