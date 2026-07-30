import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  outputDir: "./test-results",
  use: {
    baseURL: "http://127.0.0.1:3103",
    channel: "msedge",
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
