import { expect, test } from "@playwright/test";

/**
 * 상담 페이지. 모듈 쇼케이스(세일즈 포인트)와 진행 과정 플로우.
 * 쇼케이스 수치는 시드에서 파생되고, 카드는 실제 화면으로 데려가야 한다.
 */
test.describe("상담: 모듈 쇼케이스·진행 플로우", () => {
  test.beforeEach(async ({ page }) => {
    // 첫 방문 역할 선택 모달이 화면을 덮는다. 역할을 시드해 걷어낸다
    await page.addInitScript(() =>
      window.localStorage.setItem("wigtn-demo-role-v1", "member"),
    );
  });

  test("모듈 카드 8장이 서고, 카드가 실제 화면으로 데려간다", async ({
    page,
  }) => {
    await page.goto("/contact");
    const cards = page.locator(".modcard");
    await expect(cards).toHaveCount(8);
    // 계단식 등장이 끝나길 기다린다. 등장 중 클릭은 불안정 판정이 난다
    await page.waitForTimeout(1300);
    // 수치 파생. 백오피스 카드의 도구 수는 레지스트리에서 온 실수치다
    await expect(
      page.locator(".modcard", { hasText: "백오피스 프레임" }),
    ).toContainText(/운영 도구 \d+종/);
    await page.locator(".modcard", { hasText: "채용 보드" }).click();
    await expect(page).toHaveURL(/\/jobs/);
  });

  test("진행 과정 레일이 활성 단계까지 차오르고, 지나온 단계는 체크로 남는다", async ({
    page,
  }) => {
    await page.goto("/contact");
    await expect(page.locator(".cflow-rail .fill")).toBeAttached();
    // 마지막 단계에 호버로 고정. 앞 단계는 done, 레일은 끝까지 찬다
    await page.locator(".cfstep").nth(3).hover();
    await expect(page.locator(".cfstep").nth(3)).toHaveClass(/on/);
    await expect(page.locator(".cfstep").nth(0)).toHaveClass(/done/);
    await page.waitForTimeout(900); // 레일 채움 트랜지션(0.7s) 종료 대기
    const fill = await page
      .locator(".cflow-rail .fill")
      .evaluate((node) => node.getBoundingClientRect().width);
    const rail = await page
      .locator(".cflow-rail")
      .evaluate((node) => node.getBoundingClientRect().width);
    expect(fill).toBeGreaterThan(rail * 0.9);
  });
});
