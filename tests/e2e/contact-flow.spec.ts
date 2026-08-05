import { expect, test } from "@playwright/test";

/**
 * 데모 문의사항 페이지 계약.
 *
 * 모듈 소개 섹션은 걷어냈다(사용자 지시) — 이 화면이 파는 것은 모듈 목록이
 * 아니라 "브라우저에만 메모한다"는 한 가지 행동이다. 그래서 재는 것도 두 가지다:
 * 모듈 관련 UI가 정말 한 조각도 남지 않았는지, 그리고 남은 진행 과정 플로우와
 * 폼이 제대로 서는지.
 */
test.describe("데모 문의사항 — 진행 플로우와 폼", () => {
  test.beforeEach(async ({ page }) => {
    // 첫 방문 역할 선택 모달이 화면을 덮는다. 역할을 시드해 걷어낸다
    await page.addInitScript(() => {
      window.localStorage.clear();
      window.localStorage.setItem("wigtn-demo-role-v1", "member");
    });
  });

  test("모듈 관련 UI가 남아 있지 않다", async ({ page }) => {
    await page.goto("/contact");
    await expect(page.locator(".formcard")).toBeVisible();

    // 쇼케이스 잔재(섹션·카드·앵커)와 폼의 관심 모듈 선택 모두 없어야 한다
    for (const sel of [".modshow", ".modrow", ".modcard", "[data-module]", ".checkrow"]) {
      await expect(page.locator(sel)).toHaveCount(0);
    }
    await expect(page.getByText("관심 모듈")).toHaveCount(0);
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

  test("개인정보 없이 데모 문의를 브라우저에만 저장한다", async ({ page }) => {
    await page.goto("/contact");

    await expect(page.getByText("개인정보를 받지 않는 체험용 기능이에요")).toBeVisible();
    await expect(page.getByLabel(/이름|연락처|이메일/)).toHaveCount(0);

    await page.getByRole("button", { name: "데모 문의 종류 선택" }).click();
    await page.getByRole("option", { name: "회사 리뷰" }).click();
    await page.getByPlaceholder("이 데모에서 확인하고 싶은 내용을 적어주세요").fill(
      "리뷰 답글 알림 위치를 확인하고 싶어요.",
    );
    await page.getByRole("button", { name: "데모 문의 저장" }).click();

    await expect(page.getByText("이 브라우저에 저장한 문의")).toBeVisible();
    await expect(page.getByText("리뷰 답글 알림 위치를 확인하고 싶어요.")).toBeVisible();
    const saved = await page.evaluate(() =>
      window.localStorage.getItem("wigtn-demo-inquiries-v1"),
    );
    expect(saved).toContain("회사 리뷰");
  });
});
