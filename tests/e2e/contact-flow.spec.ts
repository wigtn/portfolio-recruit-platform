import { expect, test, type Page } from "@playwright/test";

/**
 * 1:1 문의 페이지 계약.
 *
 * 이 화면은 W 세일즈 서비스의 고객센터다 — 접수하면 백오피스 문의 큐에
 * 실제로 행이 생기고, 운영자 답변이 알림 벨과 내 문의 내역으로 돌아온다.
 * 그래서 재는 것도 왕복이다: 폼 하나가 아니라 접수 → 큐 → 답변 → 알림까지.
 *
 * 상담·외부 전송의 흔적이 없어야 한다는 것도 계약이다(포트폴리오 정책) —
 * 개인정보 입력란과 발송 문구가 한 조각도 남지 않았는지 함께 잰다.
 */

/** 역할 전환. 데모는 localStorage가 곧 세션이라, 전체 내비게이션이면 즉시 반영된다 */
async function switchRole(page: Page, role: "guest" | "member" | "admin") {
  await page.evaluate(
    (value) => window.localStorage.setItem("wigtn-demo-role-v1", value),
    role,
  );
}

test.describe("1:1 문의 — 접수와 운영자 답변 왕복", () => {
  test.beforeEach(async ({ page }) => {
    // 첫 방문 역할 선택 모달이 화면을 덮는다. 역할을 시드해 걷어낸다.
    // 시드는 테스트당 1회만 — 내비게이션마다 다시 돌면 접수 기록과
    // 역할 전환이 매번 지워져 왕복 시나리오가 성립하지 않는다.
    await page.addInitScript(() => {
      if (!window.sessionStorage.getItem("wigtn-e2e-ready")) {
        window.localStorage.clear();
        window.localStorage.setItem("wigtn-demo-role-v1", "member");
        window.localStorage.setItem("wigtn-demo-coach-guide", "1");
        window.sessionStorage.setItem("wigtn-e2e-ready", "1");
      }
    });
  });

  test("상담·외부 전송의 흔적이 없다", async ({ page }) => {
    await page.goto("/contact");
    await expect(page.locator(".formcard")).toBeVisible();

    // 개인정보 입력란 없음 — 닉네임 접수가 계약이다
    await expect(page.getByLabel(/이름|연락처|이메일/)).toHaveCount(0);
    // 상담 어휘와 모듈 쇼케이스 잔재 모두 없어야 한다
    await expect(page.getByText(/상담/)).toHaveCount(0);
    for (const sel of [".modshow", ".modrow", ".modcard", "[data-module]"]) {
      await expect(page.locator(sel)).toHaveCount(0);
    }
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

  test("접수 → 운영자 큐 → 답변 → 알림·내역 왕복이 실제로 돈다", async ({
    page,
  }) => {
    test.slow(); // 화면 세 개를 왕복한다

    // 1) 회원이 문의를 접수하면 내역에 "접수됨"으로 남는다
    await page.goto("/contact");
    await page.getByRole("button", { name: "문의 종류 선택" }).click();
    await page.getByRole("option", { name: "회사 리뷰" }).click();
    await page
      .getByPlaceholder("궁금한 점이나 겪은 문제를 적어주세요")
      .fill("리뷰 답글 알림이 어디로 오는지 궁금해요.");
    await page.getByRole("button", { name: "문의 접수" }).click();

    await expect(page.getByText("내 문의 내역")).toBeVisible();
    await expect(
      page.getByText("리뷰 답글 알림이 어디로 오는지 궁금해요."),
    ).toBeVisible();
    await expect(
      page.locator(".demo-inquiry .tag", { hasText: "접수됨" }),
    ).toBeVisible();

    // 2) 운영자 문의 큐에 같은 행이 서 있다 — 대기 탭 맨 위
    await switchRole(page, "admin");
    await page.goto("/admin/inquiries");
    const row = page.locator(".dtable tbody tr", {
      hasText: "리뷰 답글 알림이 어디로",
    });
    await expect(row).toBeVisible();
    await row.click();

    // 3) 그 자리에서 답한다 — 등록하면 답변완료 탭으로 옮겨진다
    await page
      .getByPlaceholder("문의에 대한 답변을 적어주세요.")
      .fill("리뷰 답글은 알림 벨과 내 정보의 내 리뷰 탭에서 확인할 수 있어요.");
    await page.getByRole("button", { name: "답변 등록" }).click();
    await expect(page.getByText("적용했어요", { exact: false })).toBeVisible();

    // 4) 문의자 화면으로 돌아오면 답변이 내역에 붙어 있다
    await switchRole(page, "member");
    await page.goto("/contact");
    await expect(
      page.locator(".demo-inquiry .tag", { hasText: "답변완료" }),
    ).toBeVisible();
    await expect(page.getByText("운영자 답변")).toBeVisible();
    await expect(
      page.getByText("리뷰 답글은 알림 벨과 내 정보의 내 리뷰 탭에서"),
    ).toBeVisible();

    // 5) 알림 벨에도 같은 결과가 도착해 있다
    await page.locator(".nav .acct-btn[aria-label*='알림']").click();
    await expect(page.getByText("1:1 문의에 답변이 도착했어요")).toBeVisible();
  });
});
