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

  test("코어 모듈 일곱이 서고, 각 모듈이 제 이름으로 짚힌다", async ({
    page,
  }) => {
    await page.goto("/contact");
    /* 쇼케이스는 업종용 카드 여덟 장에서 범용 코어 모듈 일곱으로 바뀌었다.
       카드를 눌러 다른 화면으로 보내는 물건이 아니라, 무엇으로 조립했는지
       설명하는 자리다. 그래서 이동이 아니라 존재와 식별을 잰다. */
    const rows = page.locator(".modrow");
    await expect(rows).toHaveCount(7);

    // 챗봇의 show_module이 이 표식으로 자리를 찾는다. 없으면 안내가 끊긴다
    const ids = await page
      .locator("[data-module]")
      .evaluateAll((nodes) => nodes.map((n) => n.getAttribute("data-module")));
    expect(ids).toEqual([
      "ui-kit",
      "api-contracts",
      "auth-membership",
      "content-engine",
      "ai-pipeline-sdk",
      "notification-file",
      "backoffice-frame",
    ]);

    // 모듈마다 제목이 하나씩 선다
    await expect(page.locator(".modrow-copy h3")).toHaveCount(7);
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
