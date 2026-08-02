import { expect, test } from "@playwright/test";

/**
 * 모바일 하단 탭바 계약.
 *
 * 이 기능은 UI를 하나 더 얹는 것보다 **기존 하단 레이어와의 정합**이 훨씬 큰
 * 일이다. 우하단에는 이미 체험 가이드, 챗봇, 토스트가 앉아 있고,
 * 탭바가 서면 그것들이 전부 같이 올라가야 한다. 그 어긋남은 눈으로 한 번
 * 보고 넘어가면 다음 변경에서 조용히 되돌아온다.
 *
 * 그래서 "보인다"만 보지 않고, 가려지지 않는지와 잘리지 않는지를 같이 잰다.
 */

const MOBILE = { width: 390, height: 844 };
const DESKTOP = { width: 1280, height: 900 };

test.describe("모바일 하단 탭바", () => {
  test("좁은 폭에서만 선다", async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto("/community");
    await expect(page.locator(".tabbar")).toBeVisible();

    await page.setViewportSize(DESKTOP);
    await expect(page.locator(".tabbar")).toBeHidden();
  });

  test("바닥에 붙지 않고 떠 있다", async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto("/community");

    /* 여백은 계산된 bottom 값으로 잰다.
       화면에 그려진 위치로 재면 안 된다. 모달 같은 층이 뜨는 순간
       탭바가 물러나면서 translateY가 걸리고, 그 도중을 재면 여백이 줄어든
       것처럼 보인다. 실제로 5.8px이 나와 판정이 뒤집혔다. 여기서 묻는 것은
       "어디에 놓였나"이지 "지금 어디에 있나"가 아니다. */
    const bottom = await page
      .locator(".tabbar")
      .evaluate((node) => parseFloat(getComputedStyle(node).bottom));
    expect(bottom).toBeGreaterThanOrEqual(12);

    // 좁은 폭에서 가로로 넘치면 안 된다. 넘치면 스크롤바가 서고 여백도 어긋난다
    const overflowX = await page.evaluate(() => {
      const root = document.documentElement;
      return root.scrollWidth - root.clientWidth;
    });
    expect(overflowX).toBeLessThanOrEqual(0);
  });

  test("푸터가 탭바에 잘리지 않는다", async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto("/community");
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(400);

    const footer = await page.locator(".footer").boundingBox();
    const bar = await page.locator(".tabbar").boundingBox();
    expect(footer).not.toBeNull();
    expect(bar).not.toBeNull();
    // 푸터의 마지막 줄이 탭바 위쪽보다 위에서 끝나야 한다
    expect(footer!.y + footer!.height).toBeLessThanOrEqual(bar!.y + 1);
  });

  test("활성 표시가 화면과 맞는다", async ({ page }) => {
    await page.setViewportSize(MOBILE);

    await page.goto("/community");
    await expect(
      page.locator('.tabbar a[aria-current="page"]'),
    ).toHaveText(/커뮤니티/);

    await page.goto("/jobs");
    await expect(page.locator('.tabbar a[aria-current="page"]')).toHaveText(
      /채용/,
    );

    // 회사 비교는 회사 리뷰의 탭이다. 헤더와 같은 규칙을 봐야 한다
    await page.goto("/compare");
    await expect(page.locator('.tabbar a[aria-current="page"]')).toHaveText(
      /회사/,
    );

    // 홈은 정확히 일치할 때만. 접두어로 보면 모든 화면에서 켜진다
    await page.goto("/");
    await expect(page.locator('.tabbar a[aria-current="page"]')).toHaveText(
      /홈/,
    );
  });

  test("백오피스에는 서지 않는다", async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto("/admin");
    // 사이드바와 버거 메뉴가 이미 있어서 같은 목적지가 두 벌이 된다
    await expect(page.locator(".tabbar")).toHaveCount(0);
  });

  /**
   * 앞에 서야 하는 것이 열리면 탭바는 물러난다.
   *
   * 트리거 버튼을 누르는 대신 그 층을 직접 붙여서 본다. 어느 버튼이 어느
   * 모달을 여는지는 화면마다 바뀌지만, "이 층이 있으면 탭바가 물러난다"는
   * 규칙은 바뀌지 않는다. 규칙을 재는 편이 오래 간다.
   */
  for (const layer of [
    { name: "모달", cls: "modalwrap" },
    { name: "드로어", cls: "pdrawer is-open" },
  ]) {
    test(`${layer.name}이 열리면 물러난다`, async ({ page }) => {
      await page.setViewportSize(MOBILE);
      await page.goto("/community");
      await expect(page.locator(".tabbar")).toBeVisible();

      await page.evaluate((cls) => {
        const node = document.createElement("div");
        node.className = cls;
        node.id = "layer-probe";
        document.body.appendChild(node);
      }, layer.cls);

      await expect(page.locator(".tabbar")).toHaveCSS("opacity", "0");
      await expect(page.locator(".tabbar")).toHaveCSS(
        "pointer-events",
        "none",
      );
    });
  }

  /* 챗 패널은 예외다(사용자 지시). 챗봇이 화면을 오가며 안내하는 동안에도
     탭바가 남는다 — 챗 위젯이 탭바 위에 떠 있어 자리도 겹치지 않는다 */
  test("챗 패널이 열려도 탭바는 남는다", async ({ page }) => {
    await page.setViewportSize(MOBILE);
    /* 첫 방문 역할 모달이 탭바를 물리면 이 검증과 겹친다 — 제 테스트가
       따로 있으니 여기선 치워 둔다 */
    await page.addInitScript(() => {
      window.localStorage.setItem("wigtn-demo-role-v1", "member");
    });
    await page.goto("/community");
    await expect(page.locator(".tabbar")).toBeVisible();

    await page.evaluate(() => {
      const node = document.createElement("div");
      node.className = "chatpanel";
      node.id = "layer-probe";
      document.body.appendChild(node);
    });

    await expect(page.locator(".tabbar")).toHaveCSS("opacity", "1");
  });

  /* 활성 표시는 유리알 하나가 미끄러진다 — 탭을 바꾸면 같은 필이
     transform으로 이동해야 한다(칸마다 새로 그리면 순간이동으로 보인다) */
  test("활성 유리알이 탭을 따라 이동한다", async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.addInitScript(() => {
      window.localStorage.setItem("wigtn-demo-role-v1", "member");
    });
    await page.goto("/");
    const pill = page.locator(".tabbar-pill");
    await expect(pill).toBeVisible();
    const before = await pill.evaluate(
      (node) => getComputedStyle(node).transform,
    );

    await page.locator(".tabbar a", { hasText: "내 정보" }).click();
    await expect(page.locator('.tabbar a[aria-current="page"]')).toHaveText(
      "내 정보",
    );
    await page.waitForTimeout(600); // 스프링 트랜지션(0.45s) 종료 대기
    const after = await pill.evaluate(
      (node) => getComputedStyle(node).transform,
    );
    expect(after).not.toBe(before);
  });
});
