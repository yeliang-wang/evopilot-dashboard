import { expect, test } from "@playwright/test";

test.describe("Live EvoPilot API browser smoke", () => {
  test.skip(!process.env.EVOPILOT_LIVE_E2E, "Set EVOPILOT_LIVE_E2E=1 to run against a live EvoPilot API.");

  test("authenticates through the configured live API and reaches Agent Console", async ({ page }) => {
    const apiBaseUrl = process.env.EVOPILOT_API_BASE_URL;
    const username = process.env.EVOPILOT_E2E_USERNAME;
    const password = process.env.EVOPILOT_E2E_PASSWORD;
    test.skip(!apiBaseUrl, "EVOPILOT_API_BASE_URL is required for live E2E.");
    test.skip(!username || !password, "EVOPILOT_E2E_USERNAME and EVOPILOT_E2E_PASSWORD are required for live login.");

    await page.route("**/config.js", async (route) => {
      await route.fulfill({
        contentType: "application/javascript",
        body: `window.EVOPILOT_DASHBOARD_CONFIG = { apiBaseUrl: ${JSON.stringify(apiBaseUrl)} };`
      });
    });

    await page.goto("/");
    await expect(page.getByRole("main", { name: "EvoPilot Dashboard sign in" })).toBeVisible();
    await page.getByLabel("Username").fill(username ?? "");
    await page.getByLabel("Password").fill(password ?? "");
    await page.getByRole("button", { name: "登录" }).click();

    await expect(page.getByText("scope locked")).toBeVisible();
    await expect(page.getByRole("heading", { name: /Project intake|Password change required/ })).toBeVisible();
  });
});
