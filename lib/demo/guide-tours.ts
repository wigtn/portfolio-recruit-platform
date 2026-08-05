/**
 * 화면별 안내 투어.
 *
 * "이 화면 안내해줘"를 모델의 point_at 몇 번에 맡기면 화면마다 두세 곳을
 * 찍고 끝난다. 무엇을 짚을지가 모델의 그때그때 판단이라 커버리지가 매번
 * 다르고, 대부분 얕다(실기기 지적: 페이지별 UI를 디테일하게 안내하지 않는다).
 *
 * 그래서 안내는 **대본**으로 둔다. 화면마다 무엇을 어떤 순서로 짚고 무슨
 * 말을 할지 여기 적혀 있고, 모델은 guide_screen으로 "이 화면을 안내하라"만
 * 정한다. 판단은 모델에게, 동선은 코드에게 — 도구 검문과 같은 원칙이다.
 *
 * 셀렉터는 전부 실제 화면에서 확인한 것이다(2026-08-02, 로컬 프로덕션
 * 빌드에서 프로브). 화면이 바뀌어 사라진 지점은 엔진이 건너뛰고 개수로
 * 보고하므로, 여기 하나가 낡아도 안내 전체가 죽지는 않는다.
 */

import type { ScreenId } from "./chat-tools";

export type TourStep = {
  selector: string;
  /** 커서 옆에 뜨는 한 줄. 왜 여기를 보는지 */
  note: string;
};

export const TOURS: Partial<Record<ScreenId, TourStep[]>> = {
  home: [
    { selector: ".hero .searchband", note: "통합 검색이에요. 회사와 글을 한 번에 찾아요" },
    { selector: ".home-feature-section", note: "채용공고 하이라이트. 실데이터로 돌아가요" },
    { selector: ".home-market", note: "연봉과 시장 지표를 모아 보여줘요" },
    { selector: ".home-community-section", note: "커뮤니티 인기 글이 홈까지 올라와요" },
    { selector: ".closing-inner", note: "여기서 다른 회사 리뷰를 더 둘러볼 수 있어요" },
    { selector: ".demowidget .fab", note: "체험 가이드예요. 어디까지 봤는지 따라다녀요" },
  ],
  community: [
    { selector: ".filterbar", note: "게시판 정렬과 필터예요" },
    { selector: ".feed", note: "글 목록이에요. 눌러서 상세로 들어가요" },
    { selector: ".paging", note: "페이지 이동. 화면이 튀지 않게 목록만 갈려요" },
    { selector: "a[href='/community/write']", note: "글쓰기 버튼. 회원부터 열려요" },
  ],
  community_write: [
    { selector: ".formcard", note: "글쓰기 폼이에요. 붙여넣기 살균이 실제로 돌아요" },
  ],
  companies: [
    { selector: ".filterbar", note: "업종과 정렬 필터예요" },
    { selector: ".cgrid", note: "회사 카드 목록. 평점과 리뷰 수가 보여요" },
    { selector: "a[href='/compare']", note: "두 회사를 나란히 비교할 수도 있어요" },
  ],
  compare: [
    { selector: ".cmp-head", note: "비교할 두 회사를 여기서 골라요" },
    { selector: ".ds-select", note: "회사 이름을 누르면 목록이 열려요" },
    { selector: ".cotabs", note: "항목별로 비교 축을 바꿔요" },
    { selector: ".cmp", note: "선택한 두 회사가 축마다 나란히 서요" },
  ],
  jobs: [
    { selector: ".seg", note: "고용 형태 필터예요" },
    { selector: ".filterbar", note: "직무와 지역으로 좁혀요" },
    { selector: ".cgrid", note: "공고 카드예요. 스크롤하면 이어서 불러와요" },
  ],
  notices: [
    { selector: ".tabs", note: "공지, FAQ, 정책 문서가 탭으로 나뉘어요" },
    { selector: ".ntrow", note: "문서 한 건이에요. 눌러서 전문을 봐요" },
  ],
  badges: [
    { selector: ".pagehead", note: "실적 인증이에요. 증빙을 내면 등급이 올라요" },
    { selector: ".bcard", note: "등급 카드. 신청하면 운영자 검토로 이어져요" },
  ],
  my: [
    { selector: ".pagehead", note: "내 정보예요. 활동이 전부 여기 모여요" },
    { selector: ".my-tabs", note: "쓴 글, 반응, 지원 내역을 탭으로 봐요" },
  ],
  contact: [
    { selector: ".contact-rail", note: "체험 기록이에요. 무엇을 봤는지 따라와요" },
    { selector: ".seen-compact", note: "방금 보신 기능 목록이에요" },
    { selector: "#contact-form", note: "데모 문의사항이에요. 이 브라우저에만 저장돼요" },
    { selector: ".msgtips", note: "누르면 문의 틀이 들어가요. 지우고 써도 돼요" },
    { selector: ".formsubmit-btn", note: "저장은 직접 눌러주세요" },
  ],
  admin: [
    { selector: ".pnav", note: "운영 메뉴 전체예요. 화면마다 실데이터가 물려 있어요" },
    { selector: ".ds-statrow", note: "핵심 지표 줄이에요" },
    { selector: ".dashgrid", note: "대시보드 카드. 사용자 화면과 같은 데이터를 봐요" },
    { selector: ".chartcard", note: "추이 차트예요" },
  ],
};

/* 백오피스 하위 화면은 구조가 같다 — 표 + 필터 + 드래그 핸들.
   화면마다 대본을 다 적는 대신 공통 대본 하나를 쓴다. 다르게 보여줄 것이
   생기면 그때 TOURS에 그 화면 항목을 얹으면 이게 밀려난다. */
const ADMIN_TABLE_TOUR: TourStep[] = [
  { selector: ".pnav", note: "운영 메뉴예요. 지금 화면이 강조돼 있어요" },
  { selector: ".tablecard", note: "운영 표예요. 사용자 화면과 같은 데이터예요" },
  { selector: ".gth-grip", note: "열 너비를 끌어서 조절할 수 있어요" },
  { selector: ".dtable thead", note: "머리 줄을 누르면 정렬이 바뀌어요" },
];

const ADMIN_SUB: ScreenId[] = [
  "admin_reports",
  "admin_questions",
  "admin_members",
  "admin_companies",
  "admin_jobs",
  "admin_notices",
  "admin_curation",
  "admin_badges",
  "admin_ai",
  "admin_audit",
  "admin_policies",
];
for (const id of ADMIN_SUB) {
  if (!TOURS[id]) TOURS[id] = ADMIN_TABLE_TOUR;
}

/** 이 화면의 투어. 없으면 빈 배열 — 부른 쪽이 "안내할 대본이 없다"로 처리 */
export function tourOf(screen: ScreenId): TourStep[] {
  return TOURS[screen] ?? [];
}
