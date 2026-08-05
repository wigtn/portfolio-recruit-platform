import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    // addInitScript는 문서 이동마다 다시 실행된다. 첫 진입에서만 초기화해야
    // 리뷰 등록/답글 읽음 상태가 다음 화면까지 유지되는 계약을 검증할 수 있다.
    if (!window.sessionStorage.getItem("wigtn-review-e2e-ready")) {
      window.localStorage.clear();
      window.localStorage.setItem("wigtn-demo-role-v1", "member");
      window.localStorage.setItem("wigtn-demo-coach-guide", "1");
      window.sessionStorage.setItem("wigtn-review-e2e-ready", "1");
    }
  });
});

test("리뷰 등록 직후 상세 수치가 증가하고 마이페이지 목록에 나타난다", async ({
  page,
}) => {
  await page.goto("/companies/diamond-tech");
  const reviewTab = page.locator(".dtabs button").filter({ hasText: "리뷰" });
  const before = Number((await reviewTab.locator(".ct").innerText()).trim());

  await page.getByRole("link", { name: "리뷰 쓰기" }).click();
  for (const axis of ["인센티브", "목표현실성", "매니저코칭", "계정배분", "성과압박"]) {
    await page.getByRole("button", { name: `${axis} 4점` }).click();
  }
  await page.getByPlaceholder("예: 인센티브 구조가 투명하고 코칭이 확실해요").fill(
    "등록 수치와 내 활동을 함께 확인한 리뷰",
  );
  await page.getByPlaceholder("좋았던 점을 구체적으로").fill("목표와 보상 기준이 명확해요.");
  await page.getByPlaceholder("아쉬웠던 점을 구체적으로").fill("초기 교육 일정이 촘촘해요.");
  await page.getByRole("button", { name: "리뷰 등록" }).click();

  await page.getByRole("link", { name: "내 리뷰 확인하기" }).click();
  await expect(reviewTab.locator(".ct")).toHaveText(String(before + 1));
  await expect(
    page.getByRole("heading", { name: `영업직 리뷰 ${before + 1}건` }),
  ).toBeVisible();
  await expect(page.getByText("등록 수치와 내 활동을 함께 확인한 리뷰")).toBeVisible();

  await page.goto("/companies");
  const companyCard = page.locator(".company", { hasText: "◇◇테크" });
  await expect(companyCard.locator(".company-review-count b")).toHaveText(
    String(before + 1),
  );

  await page.goto("/my");
  await page.getByRole("button", { name: /내 리뷰/ }).click();
  await expect(page.getByText("등록 수치와 내 활동을 함께 확인한 리뷰")).toBeVisible();
});

test("같은 회사에 리뷰를 다시 등록해도 리뷰 수가 매번 증가한다", async ({
  page,
}) => {
  await page.goto("/companies/diamond-tech");
  const reviewTab = page.locator(".dtabs button").filter({ hasText: "리뷰" });
  const before = Number((await reviewTab.locator(".ct").innerText()).trim());

  const submitReview = async (headline: string) => {
    await page.getByRole("link", { name: "리뷰 쓰기" }).click();
    for (const axis of ["인센티브", "목표현실성", "매니저코칭", "계정배분", "성과압박"]) {
      await page.getByRole("button", { name: `${axis} 4점` }).click();
    }
    await page
      .getByPlaceholder("예: 인센티브 구조가 투명하고 코칭이 확실해요")
      .fill(headline);
    await page
      .getByPlaceholder("좋았던 점을 구체적으로")
      .fill("등록 때마다 수치가 반영돼요.");
    await page
      .getByPlaceholder("아쉬웠던 점을 구체적으로")
      .fill("데모 데이터는 브라우저에만 남아요.");
    await page.getByRole("button", { name: "리뷰 등록" }).click();
    await page.getByRole("link", { name: "내 리뷰 확인하기" }).click();
  };

  await submitReview("첫 번째 증가 확인 리뷰");
  await expect(reviewTab.locator(".ct")).toHaveText(String(before + 1));

  await submitReview("두 번째 증가 확인 리뷰");
  await expect(reviewTab.locator(".ct")).toHaveText(String(before + 2));
  await expect(page.getByText("첫 번째 증가 확인 리뷰")).toBeVisible();
  await expect(page.getByText("두 번째 증가 확인 리뷰")).toBeVisible();
});

test("내 리뷰 목록에서 새 답글을 확인하면 읽음 상태로 바뀐다", async ({ page }) => {
  await page.goto("/my");
  await page.getByRole("button", { name: /내 리뷰/ }).click();

  const repliedReview = page.locator(".my-review-row", {
    hasText: "목표는 현실적인데 조직이 자주 바뀝니다",
  });
  await expect(repliedReview.getByText("새 답글")).toBeVisible();
  await repliedReview.click();
  await expect(page.getByText("조직 변경 과정에서 역할 안내가 부족했던 점")).toBeVisible();

  await page.goto("/my");
  await page.getByRole("button", { name: /내 리뷰/ }).click();
  const readReview = page.locator(".my-review-row", {
    hasText: "목표는 현실적인데 조직이 자주 바뀝니다",
  });
  await expect(readReview.getByText("답글 확인")).toBeVisible();
  await expect(readReview.getByText("새 답글")).toHaveCount(0);
});
