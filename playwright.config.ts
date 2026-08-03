import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.EVOPILOT_DASHBOARD_E2E_PORT ?? 5177);
const baseURL = `http://127.0.0.1:${port}`;
const localBrowserChannel = process.env.CI ? undefined : "chrome";

export default defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  outputDir: "test-results",
  snapshotPathTemplate: "{testDir}/__screenshots__{/projectName}/{testFilePath}/{arg}{ext}",
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report", open: "never" }],
    ["json", { outputFile: "test-results/playwright-report.json" }]
  ],
  expect: {
    timeout: 5_000,
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.08,
      threshold: 0.35
    }
  },
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure"
  },
  webServer: {
    command: `npm run dev -- --port ${port}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        ...(localBrowserChannel ? { channel: localBrowserChannel } : {}),
        viewport: { width: 1440, height: 960 }
      }
    },
    {
      name: "mobile-chromium",
      use: {
        ...devices["Pixel 7"],
        ...(localBrowserChannel ? { channel: localBrowserChannel } : {}),
        viewport: { width: 390, height: 844 }
      }
    }
  ]
});
