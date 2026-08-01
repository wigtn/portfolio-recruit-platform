import { expect, test, type Page } from "@playwright/test";
import { DEMO_FEATURES } from "../../lib/demo/progress";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (!window.sessionStorage.getItem("wigtn-e2e-ready")) {
      window.localStorage.clear();
      window.localStorage.setItem("wigtn-demo-role-v1", "member");
      window.localStorage.setItem("wigtn-demo-coach-guide", "1");
      window.sessionStorage.setItem("wigtn-e2e-ready", "1");
    }
  });
});

/** 역할 전환. 데모는 localStorage가 곧 세션이라, 전체 내비게이션이면 즉시 반영된다 */
async function switchRole(page: Page, role: "guest" | "member" | "admin") {
  await page.evaluate(
    (value) => window.localStorage.setItem("wigtn-demo-role-v1", value),
    role,
  );
}

/** step-up 재인증 통과. 고위험 조치(블라인드·복원 등)가 거절된 뒤 열린다 */
async function passStepUp(page: Page) {
  const modal = page.locator(".stepup");
  await expect(modal).toBeVisible();
  await modal.locator("input").fill("000000");
  await modal.getByRole("button", { name: "확인" }).click();
  await expect(modal).toBeHidden();
}

/**
 * 회원으로 p-4821 글을 신고한다. 신고 왕복·알림 테스트의 공통 시작점.
 * hydration 전 첫 클릭이 떨어질 수 있어 팝업 등장까지를 재시도 단위로 묶는다.
 */
async function reportPost(page: Page) {
  await page.goto("/community/p-4821");
  await expect(async () => {
    await page.locator(".reactbar .rb-report").click();
    await expect(
      page.getByRole("button", { name: "신고하기", exact: true }),
    ).toBeVisible({ timeout: 1_000 });
  }).toPass();
  await page.getByRole("button", { name: "신고하기", exact: true }).click();
  await expect(page.getByText("신고가 접수됐어요")).toBeVisible();
  /* 모달 안의 닫기로 좁힌다. 화면에는 이벤트 팝업의 닫기도 있어서 이름만으로
     찾으면 둘이 잡힌다(strict mode 위반). 팝업이 역할과 무관하게 뜨게 되면서
     드러났는데, 애초에 이 단정이 어느 닫기를 말하는지 불분명했다. */
  await page
    .locator(".modalwrap")
    .getByRole("button", { name: "닫기", exact: true })
    .click();
}

/** 관리자 신고 관리에서 p-4821 신고를 블라인드 처리한다(확인 다이얼로그 → step-up) */
async function blindReport(page: Page) {
  await switchRole(page, "admin");
  await page.goto("/admin/reports");
  const row = page.locator(".dtable tbody tr", { hasText: "신규 거래처" });
  await expect(row).toBeVisible();
  await row.getByRole("button", { name: "블라인드", exact: true }).click();
  // 파괴적 조치라 확인 다이얼로그가 먼저. 사유가 채워진 채 확정 버튼만 누른다
  const confirm = page.locator(".modal", { hasText: "블라인드할까요?" });
  await confirm.getByRole("button", { name: "블라인드", exact: true }).click();
  await passStepUp(page);
  await expect(page.getByText("적용했어요", { exact: false })).toBeVisible();
}

/* 모달이 아니라 헤더에 붙는 패널이다(뒤를 덮지 않는다). 여기서 지키는
   계약은 그대로다 — 열면 입력에 포커스가 가고, ESC로 닫으면 트리거로
   포커스가 돌아온다. 돌아오지 않으면 키보드 사용자는 문서 맨 위로 튕긴다. */
test("헤더 통합 검색은 추천어와 검색 결과를 패널에서 탐색한다", async ({
  page,
}) => {
  await page.goto("/");

  const trigger = page.getByRole("button", { name: "회사, 글 검색 열기" });
  await trigger.click();

  /* 넓은 화면에서는 헤더 안에서 자라는 입력칸이다(모달이 아니다). 제목
     블록은 좁은 화면 시트에만 있어서, 여기서는 요소의 aria-label로 잡는다. */
  const dialog = page.getByRole("dialog", { name: "통합 검색" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("추천 검색어")).toBeVisible();

  const input = dialog.getByRole("textbox", { name: "회사와 글 통합 검색" });
  await expect(input).toBeFocused();
  await input.fill("서울");
  await expect(dialog.getByText("‘서울’ 검색 결과")).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("우측 플로팅 체험 가이드가 열리고 진행률을 보여준다", async ({ page }) => {
  await page.goto("/");

  const widget = page.locator(".demowidget");
  const trigger = widget.locator(".fab");
  await expect(widget).toBeVisible();
  await expect(trigger).toBeVisible();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");

  await trigger.click();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await expect(widget.locator(".dwpanel")).toBeVisible();
  // 개수는 정본(DEMO_FEATURES)에서 파생한다. 숫자를 박아두면 항목이 늘 때마다 깨진다
  await expect(widget.locator(".titem")).toHaveCount(DEMO_FEATURES.length);
});

test("AI 안전 강도는 이 화면에서 역할 없이 바뀌고, 파이프라인은 재생된다", async ({
  page,
}) => {
  await page.goto("/community/p-4821");

  // 컨트롤은 플로팅 패널 안에 산다. 아이콘 버튼으로 패널부터 연다
  await page.locator(".aicall").click();
  const trigger = page.locator(".aifloat .demotrigger");
  const popup = page.locator(".aifloat .demotip");
  await expect(async () => {
    await trigger.click();
    await expect(popup).toBeVisible({ timeout: 1_000 });
  }).toPass();

  const triggerBox = await trigger.boundingBox();
  const popupBox = await popup.boundingBox();
  expect(triggerBox).not.toBeNull();
  expect(popupBox).not.toBeNull();
  // 안전 강도는 컨트롤 줄(말풍선 하단). 팝업은 위로 열린다
  expect(popupBox!.y + popupBox!.height).toBeLessThanOrEqual(triggerBox!.y + 1);

  // 권한 게이트 없음(사용자 지시). 게스트 상태에서도 바로 바뀐다
  await popup.getByRole("button", { name: "엄격" }).click();
  await expect(trigger).toContainText("엄격");

  await popup.getByRole("button", { name: "안전 강도 설정 닫기" }).click();
  // 말풍선은 자동으로 닫히지 않는다. 게시를 확인하고 직접 닫는다
  await expect(page.locator(".aifloat .afdone")).toBeVisible({
    timeout: 30_000,
  });
  await page.locator(".afclose").click();
  await expect(page.locator(".ai-comment")).toBeVisible();
  // 다시 생성. 파이프라인(아이콘 스텝)이 재생된다
  await page.locator(".aicall").click();
  await expect(page.locator(".aistep")).toHaveClass(/is-live/);
  await expect(page.locator(".aistep-item.on, .aistep-item.done").first()).toBeVisible();
});

test("회원 답변이 순차 등장하고 직접 등록한 답변이 유지된다", async ({
  page,
}) => {
  await page.goto("/community/p-4821");

  // 시드 회원 답변은 처음부터 전부 보인다(순차 등장 제거. 사용자 지시)
  await expect(
    page.locator("#memberAnswers .comment.is-in").first(),
  ).toBeVisible({ timeout: 4_000 });

  const input = page.getByPlaceholder("답변을 남겨보세요");
  await input.fill("현장 검증용 답변입니다.");
  await page.getByRole("button", { name: "등록", exact: true }).click();
  await expect(page.getByText("현장 검증용 답변입니다.")).toBeVisible();

  await page.reload();
  // 내가 쓴 답변은 데모 토글과 무관하게 항상 보인다(영속)
  await expect(page.getByText("현장 검증용 답변입니다.")).toBeVisible({
    timeout: 4_000,
  });
});

test("관리자 대시보드는 backoffice-frame 모듈 화면으로 조립된다", async ({
  page,
}) => {
  // AdminGate가 열람부터 막는다. beforeEach의 member 세팅 뒤에 admin으로 덮는다
  await page.addInitScript(() =>
    window.localStorage.setItem("wigtn-demo-role-v1", "admin"),
  );
  await page.goto("/admin");

  // 지표 타일·차트는 ds 킷, 큐 요약은 backoffice-frame 모듈 표면에서 온다
  await expect(page.locator(".ds-statrow .ds-stat")).toHaveCount(4);
  await expect(page.locator(".dashgrid .chartcard").first()).toBeVisible();
  await expect(page.locator(".dashboard-queue .queue-summary")).toBeVisible();
  await expect(page.locator(".ds-gauge")).toHaveCount(6);
});

test("관리자 큐레이션 저장 순서가 실제 홈 추천 회사에 반영된다", async ({
  page,
}) => {
  await page.goto("/");
  await switchRole(page, "admin");
  await page.goto("/admin/curation");

  const companySlots = page.locator(".curcard").first();
  const secondCompany = (
    await companySlots.locator(".slot .nm").nth(1).textContent()
  )?.trim();
  expect(secondCompany).toBeTruthy();

  // 순서 변경은 드래그앤드롭이 정본. 테스트는 핸들의 키보드 경로(↓)로 안정 실행
  await companySlots.locator(".slot .ds-draghandle").first().focus();
  await page.keyboard.press("ArrowDown");
  await page.getByRole("button", { name: "변경 저장" }).click();
  await expect(
    page.getByText("홈 화면 배치를 저장했어요", { exact: false }),
  ).toBeVisible();

  await page.goto("/");
  // 회사 카드는 "현직자 회사 리뷰" 섹션에 있다(무한 슬라이드 트랙).
  // 큐레이션 순서가 그 트랙의 첫 카드로 그대로 나와야 한다.
  await expect(
    page.locator(".home-review-digest .company .cn").first(),
  ).toHaveText(secondCompany!);
});

test("신고 → 블라인드 → 사용자 화면 가림 → 복원 왕복이 실제로 돈다", async ({
  page,
}) => {
  test.slow(); // 화면 4개를 왕복한다. 기본 타임아웃이 빠듯하다

  // 1) 회원이 글을 신고하면 운영자 큐에 행이 생긴다
  await reportPost(page);

  // 2) 운영자가 확인 다이얼로그 → step-up을 거쳐 블라인드한다
  await blindReport(page);

  // 3) 사용자 화면. 원문이 가려지고 안내가 남는다
  await page.goto("/community/p-4821");
  await expect(
    page.getByText("운영자에 의해 블라인드된 글이에요"),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "신규 거래처 뚫는 노하우 있나요?" }),
  ).toBeHidden();

  // 4) 복원. 처리완료 탭으로 옮겨진 행에서. 화면을 떠났다 왔으니 step-up도 다시 선다
  await page.goto("/admin/reports");
  await page.locator(".seg button", { hasText: "처리완료" }).click();
  const closedRow = page.locator(".dtable tbody tr", {
    hasText: "신규 거래처",
  });
  await closedRow.getByRole("button", { name: "복원", exact: true }).click();
  await passStepUp(page);
  await expect(page.getByText("적용했어요", { exact: false })).toBeVisible();

  // 5) 원문이 그대로 돌아온다
  await page.goto("/community/p-4821");
  await expect(
    page.getByRole("heading", { name: "신규 거래처 뚫는 노하우 있나요?" }),
  ).toBeVisible();
});

test("증빙 승인이 회원 관리의 등급·이력까지 함께 올린다", async ({ page }) => {
  await page.addInitScript(() =>
    window.localStorage.setItem("wigtn-demo-role-v1", "admin"),
  );
  // 증빙 검토 화면의 라우트는 /admin/badges다(사이드바 "증빙 검토" 링크)
  await page.goto("/admin/badges");

  // 대기 큐 첫 신청(필드러너 Lv.3 → Lv.4)이 자동 선택돼 있다
  await expect(
    page.getByRole("heading", { name: "증빙 검토, 필드러너" }),
  ).toBeVisible();
  // "승인"은 탭 세그먼트에도 있다. 패널의 조치 버튼(.evacts)으로 좁힌다
  await page.locator(".evacts").getByRole("button", { name: "승인" }).click();
  await expect(page.getByText("적용했어요", { exact: false })).toBeVisible();

  // 승인 탭으로 옮겨지고, 회원 관리의 등급이 신청 문구의 오른쪽 값으로 올라간다
  await page.locator(".seg button", { hasText: "승인" }).click();
  await expect(
    page.locator(".dtable tbody tr", { hasText: "필드러너" }),
  ).toBeVisible();

  await page.goto("/admin/members");
  const memberRow = page.locator(".dtable tbody tr", { hasText: "필드러너" });
  await expect(memberRow).toBeVisible();
  // 등급은 LevelBadge가 "Lv.4"(칩)와 "필드리더"(이름)로 나눠 그린다 ·
  // 전체 문자열은 배지의 title 속성이 정본이다
  await expect(
    memberRow.locator('.lvbadge[title="Lv.4 필드리더"]'),
  ).toBeVisible();
});

test("답변 없는 질문에 운영자가 답하면 글 상세 병합과 큐 감소로 돌아온다", async ({
  page,
}) => {
  test.slow(); // 대시보드 → 질문 큐 → 사용자 글 상세 → 대시보드를 왕복한다

  await page.addInitScript(() =>
    window.localStorage.setItem("wigtn-demo-role-v1", "admin"),
  );

  // 1) 대시보드 운영 큐. 하드코딩 12가 아니라 시드 실측(5건)이고,
  //    사용자 화면이 아닌 백오피스 담당 화면(/admin/questions)으로 이어진다
  await page.goto("/admin");
  const queueItem = page.locator(".dashboard-queue .queue-item", {
    hasText: "답변 없는 질문",
  });
  await expect(queueItem.locator(".queue-count")).toHaveText("5");
  await queueItem.locator("a").click();
  await expect(page).toHaveURL(/\/admin\/questions/);

  // 2) 질문 행 선택 → AI 참고 답변으로 초안을 받고 다듬어 등록
  await page
    .locator(".dtable tbody tr", { hasText: "수금이 자꾸 밀리는 거래처" })
    .click();
  // AI 채우기 버튼은 제거됐다(자동 장치를 수동 복제하지 않는다). 직접 작성
  const input = page.getByPlaceholder("질문에 대한 답변을 적어주세요.");
  await input.fill(
    "독촉을 개인 부탁이 아니라 회사 절차의 일로 옮겨보세요. 다음 거래 조건과 묶어 정리하면 관계가 상하지 않습니다.",
  );
  await page.getByRole("button", { name: "답변 등록", exact: true }).click();
  await expect(page.getByText("적용했어요", { exact: false })).toBeVisible();

  // 대기 큐에서 빠지고 답변완료 탭으로 옮겨진다
  await page.locator(".seg button", { hasText: "답변완료" }).click();
  await expect(
    page.locator(".dtable tbody tr", { hasText: "수금이 자꾸 밀리는" }),
  ).toBeVisible();

  // 3) 사용자 글 상세. 등록한 답변이 운영자 배지로 병합돼 있다
  await page.goto("/community/p-q2");
  const official = page.locator("#operatorAnswers .comment");
  await expect(official).toContainText("운영자");
  await expect(official).toContainText("독촉을 개인 부탁이 아니라");

  // 4) 큐가 실측으로 줄어든다. 대시보드 건수와 사이드바 배지가 함께
  await page.goto("/admin");
  await expect(queueItem.locator(".queue-count")).toHaveText("4");
  await expect(
    page.locator(".pnavitem", { hasText: "질문 관리" }).locator(".cnt"),
  ).toHaveText("4");
});

test("신고 처리 결과가 알림 벨의 미읽음 뱃지로 돌아온다", async ({ page }) => {
  test.slow(); // 신고 접수부터 알림 확인까지 화면 3개를 왕복한다

  // 기준선. 시드의 고정 공지(nt-1) 하나가 항상 미읽음으로 서 있다
  await page.goto("/");
  const badge = page.locator(".ntf-badge");
  await expect(badge).toHaveText("1");

  // 내가 낸 신고를 운영자가 블라인드 처리하면
  await reportPost(page);
  await blindReport(page);

  // 처리 결과가 알림으로 돌아온다. 뱃지가 늘고, 목록에 결과 문구가 선다
  await switchRole(page, "member");
  await page.goto("/");
  await expect(badge).toHaveText("2");
  await page.getByRole("button", { name: /알림/ }).click();
  await expect(
    page.getByText("신고하신 콘텐츠가 블라인드됐어요"),
  ).toBeVisible();
});
