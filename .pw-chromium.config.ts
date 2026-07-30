import { defineConfig } from "@playwright/test";
import base from "./playwright.config";

/**
 * chromium 오버라이드 — base의 channel(msedge)만 걷어낸다.
 * webServer는 뺀다: 이 환경에서는 새 dev 서버를 띄우지 않고 이미 떠 있는
 * 서버를 재사용한다. 대상은 PLAYWRIGHT_TEST_BASE_URL로 바꿀 수 있다.
 */
export default defineConfig({
  ...base,
  use: {
    ...base.use,
    channel: undefined,
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL ?? "http://127.0.0.1:4310",
  },
  webServer: undefined,
});
