import { expect, test, type Page } from "@playwright/test";

test.describe("Agent Console visual regression", () => {
  test("review stage desktop baseline", async ({ page }) => {
    await openStableDemo(page, "/?demo=1&step=4", { width: 1440, height: 960 });
    await expect(page.getByText("selectedHarness.yaml", { exact: false }).first()).toBeVisible();
    await expect(page).toHaveScreenshot("agent-console-review-desktop.png", {
      fullPage: true,
      animations: "disabled",
      caret: "hide"
    });
  });

  test("blocker stage mobile baseline", async ({ page }) => {
    await openStableDemo(page, "/?demo=1&step=8", { width: 390, height: 844 });
    await expect(page.getByText("Blocker located")).toBeVisible();
    await expect(page).toHaveScreenshot("agent-console-blocker-mobile.png", {
      animations: "disabled",
      caret: "hide"
    });
  });

  test("release stage desktop baseline", async ({ page }) => {
    await openStableDemo(page, "/?demo=1&step=9", { width: 1440, height: 960 });
    await expect(page.getByText("GA Release Decision", { exact: true })).toBeVisible();
    await expect(page).toHaveScreenshot("agent-console-release-desktop.png", {
      fullPage: true,
      animations: "disabled",
      caret: "hide"
    });
  });
});

async function openStableDemo(
  page: Page,
  path: string,
  viewport: { width: number; height: number }
): Promise<void> {
  await page.setViewportSize(viewport);
  await page.goto(path);
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
        caret-color: transparent !important;
      }
    `
  });
  await page.evaluate(async () => {
    if ("fonts" in document) await document.fonts.ready;
  });
}
