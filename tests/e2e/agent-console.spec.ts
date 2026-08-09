import { expect, test, type Page } from "@playwright/test";
import { mockEvoPilotApi } from "../fixtures/mock-evopilot-api";

const demoStages = [
  { step: 1, heading: "Project Intake", marker: "Intake summary", action: "Start intake" },
  { step: 2, heading: "Context resolved", marker: "Template auto-match", action: "matched" },
  { step: 3, heading: "Harness draft streaming", marker: "Generating ProjectHarnessProfile", action: "streaming" },
  { step: 4, heading: "Review Pack ready", marker: "ProjectHarnessProfile.yaml", action: "Confirm" },
  { step: 5, heading: "Owner changes applied", marker: "Draft update diff", action: "diff ready" },
  { step: 6, heading: "Profile activated", marker: "Active profile binding", action: "active" },
  { step: 7, heading: "Loop execution", marker: "Loop plan progress", action: "Project scan" },
  { step: 8, heading: "Blocker repair", marker: "Blocker located", action: "BLOCKED" },
  { step: 9, heading: "Release decision", marker: "GA Release Decision", action: "GO candidate" }
];

test.describe("Agent Console browser matrix", () => {
  test("demo mode renders all governed console stages without browser errors", async ({ page }) => {
    await ignoreFavicon(page);
    const errors = collectBrowserErrors(page);

    for (const stage of demoStages) {
      await page.goto(`/?demo=1&step=${stage.step}`);
      await expect(page.getByRole("heading", { name: stage.heading })).toBeVisible();
      await expect(page.getByText(stage.marker, { exact: false }).first()).toBeVisible();
      await expect(page.getByText(stage.action, { exact: false }).first()).toBeVisible();
      await expect(page.getByText("scope locked")).toBeVisible();
    }

    expect(errors).toEqual([]);
  });

  test("mock API login reaches ProjectHarnessProfile review through protected calls", async ({ page }) => {
    await ignoreFavicon(page);
    const api = await mockEvoPilotApi(page, "happy-path");
    const errors = collectBrowserErrors(page);

    await page.goto("/");
    await expect(page.getByRole("main", { name: "EvoPilot Dashboard sign in" })).toBeVisible();
    await page.getByLabel("Password").fill("mock-password");
    await page.getByLabel("Password").press("Enter");

    await expect(page.getByRole("heading", { name: "Project Intake" })).toBeVisible();
    await page.getByLabel("Repository").fill("https://github.com/acme/inventory-service.git");
    await page.getByLabel("Goal Loop Target").fill("Make the service GA-ready with release evidence and rollback gates.");
    await page.getByRole("button", { name: /Start intake/ }).click();

    await expect(page.getByRole("heading", { name: "Review Pack ready" })).toBeVisible();
    await expect(page.getByText("ProjectHarnessProfile.yaml", { exact: false }).first()).toBeVisible();
    await expect(page.getByText("req-harness-generate")).toBeVisible();
    expect(api.calls).toContain("POST /api/v1/auth/login");
    expect(api.calls).toContain("POST /api/v1/onboarding/project/checklist");
    expect(api.calls).toContain("POST /api/v1/projects/inventory-service/harness-profiles/generate");
    expect(errors).toEqual([]);
  });

  test("mock API blocker stops intake and exposes nextAction evidence", async ({ page }) => {
    await ignoreFavicon(page);
    await mockEvoPilotApi(page, "blocked-preflight");
    const errors = collectBrowserErrors(page);

    await page.goto("/");
    await page.getByLabel("Password").fill("mock-password");
    await page.getByLabel("Password").press("Enter");

    await expect(page.getByRole("heading", { name: "Project Intake" })).toBeVisible();
    await page.getByLabel("Repository").fill("https://github.com/acme/inventory-service.git");
    await page.getByLabel("Goal Loop Target").fill("Validate governed stop rules before release readiness.");
    await page.getByRole("button", { name: /Start intake/ }).click();

    await expect(page.getByText("connect-github-account").first()).toBeVisible();
    await expect(page.getByText("req-project-preflight-blocked").first()).toBeVisible();
    await expect(page.getByText("API action evidence")).toBeVisible();
    expect(unexpectedErrors(errors, ["409 (Conflict)"])).toEqual([]);
  });

  test("mock API renders Harness Hub Catalog projections", async ({ page }) => {
    await ignoreFavicon(page);
    const api = await mockEvoPilotApi(page, "happy-path");
    const errors = collectBrowserErrors(page);

    await page.goto("/");
    await page.getByLabel("Password").fill("mock-password");
    await page.getByLabel("Password").press("Enter");
    await page.getByRole("button", { name: "Harness Hub" }).click();

    await expect(page.getByRole("heading", { name: "Harness Hub / 专家市场" })).toBeVisible();
    await expect(page.getByText("EvoPilot Public Harness Catalog")).toBeVisible();
    await expect(page.getByText("Distributed Cache Harness Expert")).toBeVisible();
    await expect(page.getByText("distributed-cache-harness@0.1.0")).toBeVisible();
    expect(api.calls).toContain("GET /api/v1/harness/catalogs");
    expect(api.calls).toContain("GET /api/v1/harness/templates");
    expect(errors).toEqual([]);
  });
});

async function ignoreFavicon(page: Page): Promise<void> {
  await page.route("**/favicon.ico", async (route) => {
    await route.fulfill({ status: 204, body: "" });
  });
}

function collectBrowserErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  return errors;
}

function unexpectedErrors(errors: string[], allowedFragments: string[]): string[] {
  return errors.filter((error) => !allowedFragments.some((fragment) => error.includes(fragment)));
}
