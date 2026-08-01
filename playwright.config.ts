import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  // Uses the system-installed Microsoft Edge (channel: "msedge") instead of
  // Playwright's bundled Chromium — this environment has no internet access
  // to download browsers from cdn.playwright.dev.
  projects: [
    { name: "msedge", use: { ...devices["Desktop Chrome"], channel: "msedge" } },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
