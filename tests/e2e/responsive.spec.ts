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

test("320~430px 사용자 화면은 문서와 헤더가 가로로 밀리지 않는다", async ({
  page,
}) => {
  test.setTimeout(60_000);
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

  for (const width of [320, 360, 390, 430]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expectNoDocumentOverflow(page);

    const navMetrics = await page.locator(".nav .links").evaluate((node) => {
      const rect = node.getBoundingClientRect();
      const links = [...node.querySelectorAll("a")].map((link) => {
        const linkRect = link.getBoundingClientRect();
        return {
          left: linkRect.left,
          right: linkRect.right,
          width: linkRect.width,
        };
      });
      return {
        left: rect.left,
        right: rect.right,
        clientWidth: node.clientWidth,
        scrollWidth: node.scrollWidth,
        links,
      };
    });
    expect(navMetrics.scrollWidth).toBe(navMetrics.clientWidth);
    expect(navMetrics.links).toHaveLength(4);
    for (const link of navMetrics.links) {
      expect(link.left).toBeGreaterThanOrEqual(navMetrics.left - 1);
      expect(link.right).toBeLessThanOrEqual(navMetrics.right + 1);
      expect(link.width).toBeGreaterThan(50);
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

test("모바일 플로팅 UI는 이벤트·가이드·챗 패널을 동시에 겹치지 않는다", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 640 });
  await setRole(page, "guest");
  await page.addInitScript(() =>
    window.localStorage.removeItem("wigtn-demo-event-popup-v1"),
  );
  await page.goto("/");

  await expect(page.locator(".evpop")).toBeVisible();

  /* 계약이 바뀌었다.

     전에는 팝업이 뜨면 두 fab을 숨겼다(toBeHidden). 그러면 팝업을 닫기
     전까지 상담으로 가는 길이 화면에서 사라진다 — 사용자 지시로 버튼은
     남기기로 했다.

     대신 지켜야 할 것은 "겹치지 않는다"다. 겹치면 팝업을 누르려다 fab이
     눌리거나 그 반대가 된다. 겹침을 실제 사각형으로 확인한다. */
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
      pop: rect(".evpop"),
      guide: rect(".demowidget .fab"),
      chat: rect(".chatwidget .chatfab"),
      vh: window.innerHeight,
    };
  });
  const hits = (
    a: { l: number; t: number; r: number; b: number } | null,
    b: { l: number; t: number; r: number; b: number } | null,
  ) => !!a && !!b && a.l < b.r && b.l < a.r && a.t < b.b && b.t < a.b;

  expect(boxes.pop).not.toBeNull();
  expect(hits(boxes.pop, boxes.guide)).toBe(false);
  expect(boxes.pop && hits(boxes.pop, boxes.chat)).toBe(false);
  // fab은 하단에 남는다 — 팝업을 피하겠다고 화면 중간까지 올라가면 안 된다
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

test("모바일 비교표와 관리자 카드가 세로 흐름으로 재배치된다", async ({
  page,
}) => {
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

  await page.getByRole("button", { name: "상담 챗봇 열기" }).click();
  const chatPanel = await page.locator(".chatpanel").boundingBox();
  expect(chatPanel).not.toBeNull();
  expect(chatPanel!.x).toBeGreaterThanOrEqual(11);
  expect(chatPanel!.x + chatPanel!.width).toBeLessThanOrEqual(379);
  expect(chatPanel!.width).toBeLessThanOrEqual(361);
  expect(chatPanel!.height).toBeLessThanOrEqual(641);
});
