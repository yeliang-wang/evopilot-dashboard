import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const index = read("index.html");
const app = read("src/App.tsx");
const api = read("src/api.ts");
const model = read("src/dashboard/model.ts");
const controller = read("src/dashboard/hooks/useAgentConsoleController.ts");
const components = [
  "src/dashboard/components.tsx",
  "src/dashboard/components/auth.tsx",
  "src/dashboard/components/composer.tsx",
  "src/dashboard/components/console.tsx",
  "src/dashboard/components/evidence.tsx",
  "src/dashboard/components/llm-profiles.tsx",
  "src/dashboard/components/management.tsx",
  "src/dashboard/components/management-widgets.tsx",
  "src/dashboard/components/templates.tsx",
  "src/dashboard/components/stage.tsx",
  "src/dashboard/components/workspace-usage.tsx"
].map(read).join("\n");
const dashboardSource = [app, api, model, controller, components].join("\n");
const mockApi = read("tests/fixtures/mock-evopilot-api.ts");
const browserE2E = read("tests/e2e/agent-console.spec.ts");
const visualTest = read("tests/visual/agent-console-visual.spec.ts");
const styles = read("src/styles.css");
const packageJson = read("package.json");
const dockerfile = read("Dockerfile");
const dockerignore = read(".dockerignore");
const nginx = read("nginx.conf.template");
const compose = read("compose.yaml");
const productionCompose = read("compose.production.yaml");
const hostNginx = read("deploy/nginx/evopilot-dashboard.conf.example");
const consoleSmoke = read("scripts/dashboard-console-smoke.mjs");
const productionSmoke = read("scripts/production-compat-smoke.mjs");
const releaseBuilder = read("scripts/build-release-artifacts.mjs");
const releaseVerifier = read("scripts/verify-release-artifacts.mjs");
const governanceVerifier = read("scripts/verify-open-source-governance.mjs");
const distIndex = fs.existsSync("dist/index.html") ? read("dist/index.html") : "";
const docs = [
  "README.md",
  "docs/README.md",
  "docs/getting-started.md",
  "docs/user-guide.md",
  "docs/admin-guide.md",
  "docs/ai-agents/README.md",
  "docs/ai-agents/dashboard-page-map.md",
  "docs/ai-agents/expected-ui-states.md",
  "docs/operations/smoke-test.md",
  "docs/operations/test-matrix.md",
  "docs/reference/api-usage.md",
  "docs/reference/roles-and-permissions.md",
  "docs/workflows/end-to-end-scenarios.md",
  "docs/workflows/project-onboarding.md",
  "docs/workflows/source-to-ga-loop.md",
  "docs/workflows/release-decision-review.md",
  "docs/releases/3.1.1.md"
].filter((file) => fs.existsSync(file)).map(read).join("\n");

test("dashboard is a standalone React HTTP API client", () => {
  assert.match(index, /config\.js/);
  assert.match(index, /id="root"/);
  assert.match(index, /type="module" src="\/src\/main\.tsx"/);
  assert.match(packageJson, /"version": "3\.1\.1"/);
  assert.match(packageJson, /"react"/);
  assert.match(packageJson, /"lucide-react"/);
  assert.match(api, /configuredApiBaseUrl/);
  assert.match(api, /controlPlaneBaseUrl/);
  assert.match(api, /Authorization/);
  assert.match(api, /X-EvoPilot-Tenant/);
  assert.match(api, /Promise\.allSettled/);
  assert.doesNotMatch(app, /fetch\(/);
  assert.doesNotMatch(dashboardSource, /apps\/dashboard/);
  assert.doesNotMatch(dashboardSource, /\.codex-evidence/);
  assert.doesNotMatch(dashboardSource, /evopilot\s+(target|goal|loop|harness)/);
});

test("dashboard uses EvoPilot selectedHarness and embeds independent evopilot-harness Hub", () => {
  for (const text of [
    "selectedHarness",
    "selectedHarness.yaml",
    "evopilot-goal-plan-selected-harness-binding/v1",
    "catalogDigest",
    "entryDigest",
    "Harness Hub / 专家市场",
    "evopilot-harness Hub",
    "iframe",
    "configuredHarnessHubUrl",
    "harnessHubUrl",
    "EvoPilot goal plan"
  ]) {
    assert.match(dashboardSource + docs, new RegExp(escapeRegExp(text)));
  }

  assert.match(api, /configuredHarnessHubUrl/);
  assert.match(components, /<iframe/);
  assert.match(controller, /apiSurface\.goalPlan/);
  assert.match(controller, /extractHarnessDraft\(plan\.data\)/);
  assert.match(mockApi, /selectedHarnessProjection/);

  for (const forbidden of [
    "/api/v1/harness/templates",
    "/api/v1/harness/catalogs",
    "/api/v1/harness/template-matches",
    "/api/v1/harness/template-evolutions",
    "/api/v1/harness/template-evolutions/evolve",
    "/api/v1/harness/policies",
    "/harness-profiles",
    "ProjectHarnessProfile",
    "HarnessTemplateEvolution",
    "Mount Published Harness Catalog",
    "Scan Published Harness Catalog"
  ]) {
    assert.doesNotMatch(dashboardSource, new RegExp(escapeRegExp(forbidden)));
    assert.doesNotMatch(mockApi, new RegExp(escapeRegExp(forbidden)));
  }
});

test("dashboard shell and UI modules stay bounded", () => {
  assert.ok(lineCount(app) <= 350, `src/App.tsx has ${lineCount(app)} lines`);
  assert.ok(lineCount(controller) <= 750, `controller has ${lineCount(controller)} lines`);
  assert.ok(lineCount(model) <= 760, `model has ${lineCount(model)} lines`);
  for (const file of [
    "src/dashboard/components/auth.tsx",
    "src/dashboard/components/composer.tsx",
    "src/dashboard/components/console.tsx",
    "src/dashboard/components/evidence.tsx",
    "src/dashboard/components/management.tsx",
    "src/dashboard/components/templates.tsx"
  ]) {
    const content = read(file);
    assert.ok(lineCount(content) <= 720, `${file} has ${lineCount(content)} lines`);
  }

  for (const text of [
    "Agent Console",
    "Project Intake",
    "Template Auto-Match",
    "selectedHarness binding",
    "Owner Review",
    "Loop Execution",
    "Release Decision",
    "Evidence drawer",
    "Tenants",
    "Workspaces",
    "Users",
    "Harness Hub",
    "LLM Profiles",
    "Audit"
  ]) {
    assert.match(dashboardSource, new RegExp(escapeRegExp(text)));
  }

  assert.match(styles, /\.app-shell/);
  assert.match(styles, /\.stagebar/);
  assert.match(styles, /\.conversation/);
  assert.match(styles, /\.yaml-block/);
  assert.match(styles, /\.drawer/);
  assert.match(styles, /\.management-workspace/);
});

test("browser and smoke tests cover the v3 flow", () => {
  assert.match(browserE2E, /mock API login reaches selectedHarness review/);
  assert.match(browserE2E, /POST \/api\/v1\/goals\/goal-mock-ga\/plan/);
  assert.match(browserE2E, /not\.toContain\("GET \/api\/v1\/harness\/templates"\)/);
  assert.match(visualTest, /selectedHarness\.yaml/);
  assert.match(consoleSmoke, /harnessHubUrl/);
  assert.match(consoleSmoke, /mutating\.goal\.selectedHarness/);
  assert.doesNotMatch(consoleSmoke, /harness\.templates/);
  assert.doesNotMatch(consoleSmoke, /harness\.catalogs/);
  assert.doesNotMatch(consoleSmoke, /harness\.generate/);
  assert.doesNotMatch(consoleSmoke, /harness\.activate/);
  assert.match(productionSmoke, /evopilot-version\/v1/);
});

test("release, governance, and deployment contracts remain present", () => {
  assert.match(dockerfile, /FROM node:22-alpine AS build/);
  assert.match(dockerfile, /FROM nginx:1\.27-alpine/);
  assert.match(nginx, /location \/api\//);
  assert.match(nginx, /proxy_pass \$\{EVOPILOT_API_BASE_URL\}/);
  assert.match(compose, /EVOPILOT_DASHBOARD_PORT:-8080/);
  assert.match(compose, /EVOPILOT_HARNESS_HUB_URL/);
  assert.match(productionCompose, /EVOPILOT_DOCKER_NETWORK:-evopilot_default/);
  assert.match(productionCompose, /EVOPILOT_HARNESS_HUB_URL/);
  assert.match(hostNginx, /proxy_pass http:\/\/127\.0\.0\.1:18080/);
  assert.match(dockerignore, /node_modules/);
  assert.match(dockerignore, /\.git/);
  assert.match(releaseBuilder, /evopilot-dashboard/);
  assert.match(releaseVerifier, /SHA256SUMS/);
  assert.match(governanceVerifier, /docs\/releases\/3\.1\.1\.md/);
});

test("production build includes runtime dashboard scripts", () => {
  if (!distIndex) return;
  assert.match(distIndex, /config\.js/);
  assert.match(distIndex, /type="module"/);
  assert.equal(fs.existsSync("dist/config.js"), true);
  assert.equal(fs.readdirSync("dist/assets").some((file) => /^index-.*\.js$/.test(file)), true);
  assert.equal(fs.readdirSync("dist/assets").some((file) => /^index-.*\.css$/.test(file)), true);
});

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function lineCount(value) {
  return value.split(/\r?\n/).length;
}
