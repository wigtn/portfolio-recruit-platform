import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  outputDir: "./test-results",
  use: {
    baseURL: "http://127.0.0.1:3103",
    /* 브라우저는 번들 크로미움이 기본이다.

       예전에는 channel: "msedge"가 박혀 있었다. 그러면 Edge가 깔린 기계에서만
       돌아간다 — 리뷰어 맥이나 CI 컨테이너에서는 테스트 본문에 들어가기도
       전에 런처가 죽는다(실제로 리뷰에서 그렇게 실패했다). e2e는 아무나
       돌릴 수 있어야 값을 한다. 못 돌리면 안 도는 것과 같다.

       설치된 실제 브라우저로 확인하고 싶으면 PW_CHANNEL로 고른다:
       `PW_CHANNEL=msedge npx playwright test` */
    ...(process.env.PW_CHANNEL ? { channel: process.env.PW_CHANNEL } : {}),
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run dev -- --port 3103",
    url: "http://127.0.0.1:3103",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
