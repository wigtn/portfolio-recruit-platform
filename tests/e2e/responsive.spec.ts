import { expect, test, type Page } from "@playwright/test";

const USER_ROUTES = [
  "/",
  "/community",
  "/community/p-4821",
  "/community/write",
  "/companies",
  "/companies/diamond-tech",
  "/companies/diamond-tech/review",
  "/compare",
  "/jobs",
  "/jobs/j-2201",
  "/badges",
  "/my",
  "/notices",
  "/contact",
];

async function setRole(page: Page, role: "guest" | "member" | "admin") {
  await page.addInitScript((nextRole) => {
    if (!window.localStorage.getItem("wigtn-demo-role-v1")) {
      window.localStorage.setItem("wigtn-demo-role-v1", nextRole);
    }
    window.localStorage.setItem("wigtn-demo-coach-guide", "1");
  }, role);
}

async function expectNoDocumentOverflow(page: Page) {
  const sizes = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    offenders: [...document.querySelectorAll<HTMLElement>("body *")]
      .map((node) => {
        const rect = node.getBoundingClientRect();
        return {
          selector: `${node.tagName.toLowerCase()}.${node.className}`,
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          width: Math.round(rect.width),
        };
      })
      .filter(
        ({ left, right }) =>
          right > document.documentElement.clientWidth + 1 || left < -1,
      )
      .slice(0, 12),
  }));
  expect(
    sizes.scrollWidth,
    `${page.url()} ${JSON.stringify(sizes.offenders)}`,
  ).toBeLessThanOrEqual(sizes.clientWidth + 1);
}

/* 한 케이스가 라우트 14개와 뷰포트 4개를 다 돌고 있었다. dev 서버는 라우트를
   처음 열 때 컴파일하므로 그 합이 60초를 넘겨 타임아웃으로 죽었다 — 무엇이
   깨졌는지가 아니라 "오래 걸렸다"만 남는다. 보는 것이 다르니 케이스도 나눈다. */
test("320px에서 사용자 화면이 가로로 밀리지 않는다", async ({ page }) => {
  test.setTimeout(90_000);
  await setRole(page, "member");

  await page.setViewportSize({ width: 320, height: 844 });
  for (const route of USER_ROUTES) {
    await page.goto(route, { waitUntil: "domcontentloaded" });
    await expect(page.locator(".nav")).toBeVisible();
    await expectNoDocumentOverflow(page);
  }

  await page.goto("/community/p-4821", { waitUntil: "domcontentloaded" });
  const reactionLabels = page.locator(".reactbar .rb-label");
  await expect(reactionLabels).toHaveCount(4);
  for (const label of await reactionLabels.all()) {
    const box = await label.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeLessThan(20);
  }
});

test("좁은 폭에서 주 메뉴는 하단 탭바 하나다", async ({ page }) => {
  test.setTimeout(60_000);
  await setRole(page, "member");

  for (const width of [320, 360, 390, 430]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expectNoDocumentOverflow(page);

    /* 좁은 화면의 주 메뉴는 하단 탭바 하나다.

       예전에는 헤더에도 GNB 네 개가 깔려 있어서, 이 자리에서 그 링크들의
       폭과 위치를 봤다. 지금은 헤더에서 접었다 — 같은 목적지가 화면 위아래에
       두 벌 있으면 어느 쪽이 주인지 모호하고, 고정 헤더가 96px을 먹었다.

       그래서 보는 것을 바꾼다. 헤더 메뉴가 실제로 접혀 있는지, 그리고 그
       목적지들이 탭바에서 눌리는지. 숨긴 자리에 대체 경로가 없으면 그건
       메뉴를 없앤 것이지 옮긴 것이 아니다. */
    await expect(page.locator(".nav .links")).toBeHidden();

    const tabs = page.locator(".tabbar a");
    await expect(tabs).toHaveCount(6);
    const tabBox = await page.locator(".tabbar").boundingBox();
    expect(tabBox).not.toBeNull();

    for (const href of ["/community", "/companies", "/jobs", "/notices"]) {
      const tab = page.locator(`.tabbar a[href="${href}"]`);
      await expect(tab).toBeVisible();
      const box = await tab.boundingBox();
      expect(box).not.toBeNull();
      // 손가락이 닿는 최소 폭. 320px에서 6칸이면 칸당 49px이 하한이다
      expect(box!.width).toBeGreaterThan(44);
      // 칸이 판 밖으로 삐져나오지 않는다
      expect(box!.x).toBeGreaterThanOrEqual(tabBox!.x - 1);
      expect(box!.x + box!.width).toBeLessThanOrEqual(
        tabBox!.x + tabBox!.width + 1,
      );
    }
  }
});

test("작은 화면의 역할 모달은 뷰포트 안에 머물고 배경을 잠근다", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.addInitScript(() => {
    window.localStorage.removeItem("wigtn-demo-role-v1");
    window.localStorage.setItem("wigtn-demo-coach-guide", "1");
  });
  await page.goto("/");

  const modal = page.locator(".role-modal");
  await expect(modal).toBeVisible();
  const box = await modal.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.y).toBeGreaterThanOrEqual(0);
  expect(box!.y + box!.height).toBeLessThanOrEqual(568);
  await expect(page.locator("body")).toHaveCSS("overflow", "hidden");
  await modal.locator(".role", { hasText: "운영자" }).click();
  await expect(
    modal.getByRole("button", { name: "운영자로 시작" }),
  ).toBeVisible();
});

test("모바일에서 가이드와 챗 fab이 겹치지 않는다", async ({ page }) => {
  /* 이벤트 팝업은 걷어냈다(2026-08-02). 팝업과의 겹침을 보던 테스트를
     남은 두 fab 사이의 계약으로 줄인다 — 겹치면 하나를 누르려다 다른
     것이 눌린다. */
  await page.setViewportSize({ width: 360, height: 640 });
  await setRole(page, "guest");
  await page.goto("/");

  await expect(page.locator(".demowidget")).toBeVisible();
  await expect(page.locator(".chatwidget")).toBeVisible();

  const boxes = await page.evaluate(() => {
    const rect = (selector: string) => {
      const el = document.querySelector(selector);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { l: r.left, t: r.top, r: r.right, b: r.bottom };
    };
    return {
      guide: rect(".demowidget .fab"),
      chat: rect(".chatwidget .chatfab"),
      vh: window.innerHeight,
    };
  });
  const hits = (
    a: { l: number; t: number; r: number; b: number } | null,
    b: { l: number; t: number; r: number; b: number } | null,
  ) => !!a && !!b && a.l < b.r && b.l < a.r && a.t < b.b && b.t < a.b;

  expect(boxes.guide).not.toBeNull();
  expect(hits(boxes.guide, boxes.chat)).toBe(false);
  // 둘 다 하단에 남는다 — 화면 중간까지 올라오면 안 된다
  expect(boxes.chat!.b).toBeGreaterThan(boxes.vh - 160);
});

test("모바일 탭·페이지네이션·푸터·채용 필터가 좁은 폭에 맞게 정리된다", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await setRole(page, "member");

  await page.goto("/my");
  const myTabs = page.locator(".my-tabs");
  await expect(myTabs).toHaveCSS("overflow-y", "hidden");
  const tabSize = await myTabs.evaluate((node) => ({
    clientHeight: node.clientHeight,
    scrollHeight: node.scrollHeight,
  }));
  expect(tabSize.scrollHeight).toBeLessThanOrEqual(tabSize.clientHeight + 1);

  await page.goto("/community?page=1");
  const categoryTabs = page.locator(".community-category-tabs");
  const categoryBox = await categoryTabs.boundingBox();
  expect(categoryBox).not.toBeNull();
  for (const tab of await categoryTabs.getByRole("tab").all()) {
    const box = await tab.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(categoryBox!.x - 1);
    expect(box!.x + box!.width).toBeLessThanOrEqual(
      categoryBox!.x + categoryBox!.width + 1,
    );
  }
  const firstPageNumbers = await page
    .locator(".paging a")
    .evaluateAll((links) =>
      links
        .map((link) => link.textContent?.trim() ?? "")
        .filter((text) => /^\d+$/.test(text)),
    );
  expect(firstPageNumbers).toEqual(["1", "2", "3", "4", "5"]);

  await page.goto("/community?page=6");
  const secondPageNumbers = await page
    .locator(".paging a")
    .evaluateAll((links) =>
      links
        .map((link) => link.textContent?.trim() ?? "")
        .filter((text) => /^\d+$/.test(text)),
    );
  expect(secondPageNumbers).toEqual(["6", "7", "8", "9"]);

  await page.goto("/jobs");
  const filterTools = page.locator(".jobs-filter-tools");
  await expect(filterTools.locator(".industry-select")).toBeVisible();
  await expect(filterTools.locator(".jobs-employment")).toBeVisible();
  const searchBox = await filterTools.locator(".jobs-search").boundingBox();
  const toolsBox = await filterTools.boundingBox();
  expect(searchBox).not.toBeNull();
  expect(toolsBox).not.toBeNull();
  expect(searchBox!.width).toBeGreaterThan(260);
  expect(searchBox!.x).toBeGreaterThanOrEqual(toolsBox!.x - 1);

  /* 푸터 계약이 바뀌었다.

     2열을 검증하고 있었다. 그때는 제목과 목록이 늘 펼쳐져 있어서 2열이
     스크롤을 줄여 줬다. 지금은 접히는 아코디언이라 세로 한 줄이 맞다 —
     2열이면 셋 중 하나가 홀로 남아 빈 칸이 생기고, 하나를 펼치면 옆 칸이
     따라 늘어나 경계가 어긋난다.

     열 수 대신 지켜야 할 것을 본다: 한 줄로 서고, 접힌 상태로 시작하고,
     눌러서 펼칠 수 있다. */
  const footerColumns = await page
    .locator(".footer .ftop")
    .evaluate((node) => getComputedStyle(node).gridTemplateColumns);
  expect(footerColumns.trim().split(/\s+/)).toHaveLength(1);

  const groups = page.locator(".footer .fcol");
  await expect(groups).toHaveCount(3);
  // 접힌 채로 시작한다 — 셋이 다 펼쳐지면 푸터가 화면 두 개 분량이다
  expect(await groups.first().evaluate((n: HTMLDetailsElement) => n.open)).toBe(
    false,
  );
  await groups.first().locator("summary").click();
  expect(await groups.first().evaluate((n: HTMLDetailsElement) => n.open)).toBe(
    true,
  );
  await expect(groups.first().locator(".flinks a").first()).toBeVisible();

  await expect(page.locator(".ft-brand")).toBeVisible();
  await expectNoDocumentOverflow(page);
});

/* 라우트를 여럿 도는 케이스다. dev 서버는 처음 여는 라우트마다 컴파일하고,
   그 값은 앞선 케이스들이 얼마나 돌았는지에 따라 달라진다 — 단독으로는
   44초에 끝나는데 전체 실행에서는 기본 상한을 넘겼다. */
test("모바일 비교표와 관리자 카드가 세로 흐름으로 재배치된다", async ({
  page,
}) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await setRole(page, "member");
  await page.goto("/compare");

  const compareRow = page.locator(".cmp-row").first();
  const labelBox = await compareRow.locator(".cmp-k").boundingBox();
  const valueBox = await compareRow.locator(".cmp-v").first().boundingBox();
  expect(labelBox).not.toBeNull();
  expect(valueBox).not.toBeNull();
  expect(labelBox!.y).toBeLessThan(valueBox!.y);
  await expectNoDocumentOverflow(page);

  await page.evaluate(() =>
    window.localStorage.setItem("wigtn-demo-role-v1", "admin"),
  );
  await page.goto("/admin/ai");
  await expect(page.locator(".phd-menu")).toHaveCSS("width", "44px");
  await expect(page.locator(".phd-brand")).toHaveCount(0);
  await expect(page.locator(".phd-c .ic")).toHaveCount(0);
  await expect(page.locator(".role-switch-btn .acct-av")).toBeVisible();
  const headerCenter = await page.locator(".phd-c").evaluate((node) => {
    const rect = node.getBoundingClientRect();
    return rect.left + rect.width / 2;
  });
  expect(Math.abs(headerCenter - 390 / 2)).toBeLessThanOrEqual(1);
  const aiCards = page.locator(".ai-config-grid > .tablecard");
  const first = await aiCards.nth(0).boundingBox();
  const second = await aiCards.nth(1).boundingBox();
  expect(first).not.toBeNull();
  expect(second).not.toBeNull();
  expect(second!.y).toBeGreaterThan(first!.y + first!.height - 1);

  await page.goto("/admin/reports");
  const heading = page.locator(".tabletop h4").first();
  const headingBox = await heading.boundingBox();
  expect(headingBox).not.toBeNull();
  expect(headingBox!.width).toBeGreaterThan(150);
  expect(headingBox!.height).toBeLessThan(60);
  const firstCell = page.locator(".dtable tbody td").first();
  await expect(firstCell).toHaveCSS("overflow", "hidden");
  await expect(firstCell).toHaveCSS("text-overflow", "ellipsis");
  await expect(firstCell).toHaveCSS("min-width", "0px");
  await expectNoDocumentOverflow(page);

  await page.goto("/admin/members");
  const memberCards = page.locator(".amain .mrow > .mcard");
  await expect(memberCards).toHaveCount(4);
  const memberCardBoxes = await memberCards.evaluateAll((cards) =>
    cards.map((card) => {
      const rect = card.getBoundingClientRect();
      return { x: rect.x, y: rect.y, height: rect.height };
    }),
  );
  expect(memberCardBoxes[0].y).toBe(memberCardBoxes[1].y);
  expect(memberCardBoxes[2].y).toBeGreaterThan(memberCardBoxes[0].y);
  expect(memberCardBoxes.every((box) => box.height < 90)).toBe(true);

  await page.goto("/admin/companies");
  const actions = page.locator(".tabletop-actions");
  await expect(actions).toBeVisible();
  const actionButtons = actions.locator(".btn");
  await expect(actionButtons).toHaveCount(2);
  const actionWidths = await actionButtons.evaluateAll((buttons) =>
    buttons.map((button) => button.getBoundingClientRect().width),
  );
  expect(actionWidths.every((width) => width > 120)).toBe(true);

  await page.goto("/admin");
  await expect(page.locator(".ds-donut circle").first()).toHaveAttribute(
    "stroke-linecap",
    "butt",
  );

  /* 눌러서 열릴 때까지 다시 시도한다.

     dev 서버는 라우트를 처음 열 때 컴파일하므로, 버튼이 그려진 뒤에도
     React가 아직 안 붙어 있는 순간이 있다. 그때 누르면 아무 일도 일어나지
     않고 "패널이 없다"로만 남는다 — 무엇이 문제인지 안 보인다. */
  await expect(async () => {
    await page.getByRole("button", { name: "데모 도우미 열기" }).click();
    await expect(page.locator(".chatpanel")).toBeVisible({ timeout: 2_000 });
  }).toPass();
  const chatPanel = await page.locator(".chatpanel").boundingBox();
  expect(chatPanel).not.toBeNull();
  expect(chatPanel!.x).toBeGreaterThanOrEqual(11);
  expect(chatPanel!.x + chatPanel!.width).toBeLessThanOrEqual(379);
  expect(chatPanel!.width).toBeLessThanOrEqual(361);
  expect(chatPanel!.height).toBeLessThanOrEqual(641);
});
