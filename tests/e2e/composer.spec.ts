import { test, expect } from "@playwright/test";

test("글쓰기: 태그 뱃지·커스텀 드롭다운·붙여넣기 실차단", async ({ page }) => {
  await page.goto("/community/write");
  // 회원으로 (게스트 게이트 우회)
  await page.evaluate(() => localStorage.setItem("wigtn-demo-role-v1", "member"));
  await page.reload();
  await page.waitForSelector(".weditor textarea.editor");

  // 1) 게시판 커스텀 드롭다운
  await page.click(".ds-select");
  await expect(page.locator(".ds-dropdown")).toBeVisible();
  await page.click('.ds-opt:has-text("노하우")');
  await expect(page.locator(".ds-select-v")).toHaveText("노하우");

  // 2) 태그. 추천 클릭 + 직접 입력 + 제거
  await page.click('.tagsug-pill:has-text("B2B")');
  await expect(page.locator(".tagpill")).toHaveCount(1);
  await page.click(".tagfield");
  await page.keyboard.type("스타트업");
  await page.keyboard.press("Enter");
  await expect(page.locator(".tagpill")).toHaveCount(2);
  await page.click('.tagpill:has-text("B2B") button');
  await expect(page.locator(".tagpill")).toHaveCount(1);

  // 3) 데모 버튼. 에디터 안에서 검역 연출, 본문은 걸러진 채 편집 가능
  await page.click(".demobtn");
  await expect(page.locator(".qoverlay.is-scanning")).toBeVisible();
  const editor = page.locator(".weditor textarea.editor");
  await expect(editor).toBeVisible(); // textarea가 대체되지 않는다
  const val = await editor.inputValue();
  expect(val).toContain("대면 미팅");
  expect(val).not.toContain("<script>");
  // 연출이 끝나면 오버레이가 걷히고 상단 중앙 토스트 요약이 뜬다
  await expect(page.locator(".qoverlay")).toHaveCount(0, { timeout: 6000 });
  await expect(page.locator(".ds-toaster.is-top .ds-toast")).toContainText(
    "걸러냈어요",
  );
  await editor.focus();
  await page.keyboard.press("End");
  await page.keyboard.type("편집됨");
  expect(await editor.inputValue()).toContain("편집됨"); // 렌더 후에도 편집된다

  // 4) 실붙여넣기. 위험 코드 직접 붙여넣어도 실제 차단
  await editor.focus();
  await page.evaluate(() => {
    const ta = document.querySelector<HTMLTextAreaElement>(".weditor textarea")!;
    const dt = new DataTransfer();
    dt.setData("text/plain", '테스트<script>steal()</script> 끝 <iframe src="x"></iframe>');
    ta.dispatchEvent(new ClipboardEvent("paste", { clipboardData: dt, bubbles: true, cancelable: true }));
  });
  await expect(
    page.locator(".qoverlay.is-scanning, .qoverlay.is-striking"),
  ).toBeVisible();
  const val2 = await editor.inputValue();
  expect(val2).not.toContain("<script>");
  expect(val2).not.toContain("<iframe");
});
