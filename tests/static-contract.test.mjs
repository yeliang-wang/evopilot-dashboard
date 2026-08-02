import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const index = fs.readFileSync("index.html", "utf8");
const app = fs.readFileSync("src/App.tsx", "utf8");
const api = fs.readFileSync("src/api.ts", "utf8");
const styles = fs.readFileSync("src/styles.css", "utf8");
const config = fs.readFileSync("public/config.js", "utf8");
const packageJson = fs.readFileSync("package.json", "utf8");
const distIndex = fs.readFileSync("dist/index.html", "utf8");
const dockerfile = fs.readFileSync("Dockerfile", "utf8");
const dockerignore = fs.readFileSync(".dockerignore", "utf8");
const nginx = fs.readFileSync("nginx.conf.template", "utf8");
const ci = fs.readFileSync(".github/workflows/ci.yml", "utf8");
const compose = fs.readFileSync("compose.yaml", "utf8");
const productionCompose = fs.readFileSync("compose.production.yaml", "utf8");
const hostNginx = fs.readFileSync("deploy/nginx/evopilot-dashboard.conf.example", "utf8");
const productionSmoke = fs.readFileSync("scripts/production-compat-smoke.mjs", "utf8");
const consoleSmoke = fs.readFileSync("scripts/dashboard-console-smoke.mjs", "utf8");
const readme = fs.readFileSync("README.md", "utf8");
const docsIndex = fs.readFileSync("docs/README.md", "utf8");
const docsGettingStarted = fs.readFileSync("docs/getting-started.md", "utf8");
const docsUserGuide = fs.readFileSync("docs/user-guide.md", "utf8");
const docsAdminGuide = fs.readFileSync("docs/admin-guide.md", "utf8");
const docsAiAgents = fs.readFileSync("docs/ai-agents/README.md", "utf8");
const docsDashboardMap = fs.readFileSync("docs/ai-agents/dashboard-page-map.md", "utf8");
const docsExpectedStates = fs.readFileSync("docs/ai-agents/expected-ui-states.md", "utf8");
const docsPlaybook = fs.readFileSync("docs/ai-agents/digital-human-playbook.md", "utf8");
const docsSmoke = fs.readFileSync("docs/operations/smoke-test.md", "utf8");
const docsApiUsage = fs.readFileSync("docs/reference/api-usage.md", "utf8");
const docsE2E = fs.readFileSync("docs/workflows/end-to-end-scenarios.md", "utf8");
const docsDevopsBoundary = fs.readFileSync("docs/workflows/credential-and-devops-boundary.md", "utf8");
const allDocs = [
  readme,
  docsIndex,
  docsGettingStarted,
  docsUserGuide,
  docsAdminGuide,
  docsAiAgents,
  docsDashboardMap,
  docsExpectedStates,
  docsPlaybook,
  docsSmoke,
  docsApiUsage,
  docsE2E,
  docsDevopsBoundary
].join("\n");

test("dashboard is a standalone React API client", () => {
  assert.match(index, /config\.js/);
  assert.match(index, /id="root"/);
  assert.match(index, /type="module" src="\/src\/main\.tsx"/);
  assert.match(config, /EVOPILOT_DASHBOARD_CONFIG/);
  assert.match(packageJson, /"react"/);
  assert.match(packageJson, /"lucide-react"/);
  assert.match(packageJson, /HTTP API control plane/);
  assert.match(packageJson, /"typecheck": "tsc --noEmit"/);
  assert.match(packageJson, /"smoke:console": "node scripts\/dashboard-console-smoke\.mjs"/);

  assert.match(api, /configuredApiBaseUrl/);
  assert.match(api, /const controlPlaneBaseUrl = configuredApiBaseUrl \|\| window\.location\.origin;/);
  assert.match(api, /function apiUrl/);
  assert.match(api, /function publicApiFetch/);
  assert.match(api, /function apiFetch/);
  assert.match(api, /function executeDashboardAction/);
  assert.match(api, /function login/);
  assert.match(api, /function changePassword/);
  assert.match(api, /interface DashboardProjectionContext/);
  assert.match(api, /loadDashboardApiSnapshot\(\s*scope: DashboardScope,\s*context: DashboardProjectionContext/s);
  assert.match(api, /X-EvoPilot-Tenant/);
  assert.match(api, /X-EvoPilot-Workspace/);
  assert.match(api, /X-EvoPilot-Actor/);
  assert.match(api, /Authorization/);
  assert.match(app, /sessionStorage\.getItem\("evopilot\.apiToken"\)/);
  assert.match(app, /sessionStorage\.setItem\("evopilot\.apiToken", nextScope\.token\)/);
  assert.match(app, /storage\.removeItem\("evopilot\.apiToken"\)/);
  assert.doesNotMatch(app, /storage\.setItem\("evopilot\.apiToken"/);
  assert.doesNotMatch(app, /fetch\(/);
  assert.doesNotMatch(`${app}\n${api}`, /apps\/dashboard/);
  assert.doesNotMatch(`${app}\n${api}`, /\.codex-evidence/);
  assert.doesNotMatch(`${app}\n${api}`, /evopilot\s+(target|goal|loop|harness)/);
  assert.doesNotMatch(app, /github\.com\/example/);
  assert.equal(fs.existsSync("src/domain.ts"), false, "stale static domain fixture should not exist");
});

test("dashboard keeps the lightweight three-page information architecture", () => {
  assert.match(app, /type PageId = "projects" \| "runs" \| "ops";/);
  assert.match(app, /\(\["projects", "runs", "ops"\] as PageId\[\]\)/);
  for (const label of ["Projects", "Runs", "Ops"]) {
    assert.match(app, new RegExp(escapeRegExp(label)));
  }
  for (const staleComponent of ["<DashboardPage", "<HarnessPage", "<GoalRunsPage", "<OperationsPage"]) {
    assert.doesNotMatch(app, new RegExp(escapeRegExp(staleComponent)));
  }
  assert.doesNotMatch(app, /Dashboard \/ Projects \/ Harness \/ Goal Runs \/ Operations/);
  assert.doesNotMatch(app, /five top-level pages/);
});

test("dashboard exposes the Review Pack end-to-end browser flow", () => {
  for (const text of [
    "Start Or Continue A Project Loop",
    "Generate Review Pack",
    "Review Pack",
    "Project Loop Path",
    "Repository -> Goal Target -> Review Pack -> Loop -> Release Decision",
    "Owner Review Gates",
    "Advanced Control Details",
    "Troubleshooting Contract",
    "Last API Action",
    "Auth Session",
    "Server Projections",
    "Confirmed By",
    "Confirmation"
  ]) {
    assert.match(app, new RegExp(escapeRegExp(text)));
  }

  for (const actionId of [
    "project-preflight",
    "generate-harness-profile",
    "create-goal",
    "plan-goal",
    "activate-harness-profile",
    "approve-goal-plan",
    "advance-goal"
  ]) {
    assert.match(app, new RegExp(escapeRegExp(actionId)));
  }

  assert.match(styles, /\.review-confirmation/);
  assert.match(styles, /\.flow-line/);
  assert.match(styles, /\.review-pack/);
  assert.match(styles, /\.projection-grid/);
});

test("dashboard call sites cover current EvoPilot API control-plane surfaces", () => {
  for (const apiPath of [
    "/api/v1/auth/bootstrap",
    "/api/v1/auth/login",
    "/api/v1/auth/change-password",
    "/api/v1/summary",
    "/api/v1/projects",
    "/api/v1/onboarding/project/checklist",
    "/api/v1/projects/${encodeURIComponent(projectId)}/onboarding-checklist",
    "/api/v1/projects/${encodeURIComponent(projectId)}/source-credentials/preflight",
    "/api/v1/projects/${encodeURIComponent(projectId)}/devops/preflight",
    "/api/v1/projects/${encodeURIComponent(projectId)}/llm/preflight",
    "/api/v1/harness/templates",
    "/api/v1/harness/template-evolutions",
    "/api/v1/harness/policies",
    "/api/v1/projects/${encodeURIComponent(projectId)}/harness-profiles",
    "/api/v1/projects/${encodeURIComponent(projectId)}/harness-profiles/generate",
    "/api/v1/projects/${encodeURIComponent(projectId)}/harness-profiles/validate",
    "/api/v1/projects/${encodeURIComponent(projectId)}/harness-profiles/${encodeURIComponent(profileId)}/activate",
    "/api/v1/release/targets",
    "/api/v1/maturity/standards",
    "/api/v1/goals",
    "/api/v1/goals/${encodeURIComponent(goalId)}/plan",
    "/api/v1/goals/${encodeURIComponent(goalId)}/approve-plan",
    "/api/v1/goals/${encodeURIComponent(goalId)}/advance",
    "/api/v1/goals/${encodeURIComponent(goalId)}/run-status",
    "/api/v1/goals/${encodeURIComponent(goalId)}/phase-plan",
    "/api/v1/goals/${encodeURIComponent(goalId)}/evidence-matrix",
    "/api/v1/goals/${encodeURIComponent(goalId)}/final-report",
    "/api/v1/loops",
    "/api/v1/loops/${encodeURIComponent(loopId)}/executor-graph",
    "/api/v1/loops/${encodeURIComponent(loopId)}/trace-tree",
    "/api/v1/loops/${encodeURIComponent(loopId)}/events",
    "/api/v1/loops/${encodeURIComponent(loopId)}/source-closure/preflight",
    "/api/v1/loops/${encodeURIComponent(loopId)}/source-closure/execute",
    "/api/v1/release/decisions",
    "/api/v1/release/evidence",
    "/api/v1/audit",
    "/api/v1/history",
    "/api/v1/llm-profiles",
    "/api/v1/secrets",
    "/api/v1/users",
    "/api/v1/loop-workers/queue"
  ]) {
    assert.match(api, new RegExp(escapeRegExp(apiPath)));
  }

  assert.doesNotMatch(api, /\/api\/v1\/deploy-connectors/);
});

test("optional sibling EvoPilot OpenAPI contains the dashboard contract paths", () => {
  const candidates = [
    path.resolve("..", "evopilot", "docs", "api", "openapi.json"),
    path.resolve("..", "EvoPilot", "docs", "api", "openapi.json")
  ];
  const openApiPath = candidates.find((candidate) => fs.existsSync(candidate));
  if (!openApiPath) return;

  const openApi = JSON.parse(fs.readFileSync(openApiPath, "utf8"));
  const paths = Object.keys(openApi.paths ?? {});
  for (const required of [
    "/api/v1/auth/bootstrap",
    "/api/v1/auth/login",
    "/api/v1/auth/change-password",
    "/api/v1/summary",
    "/api/v1/projects",
    "/api/v1/onboarding/project/checklist",
    "/api/v1/harness/templates",
    "/api/v1/harness/template-evolutions",
    "/api/v1/harness/policies",
    "/api/v1/projects/{projectId}/harness-profiles",
    "/api/v1/projects/{projectId}/harness-profiles/generate",
    "/api/v1/projects/{projectId}/harness-profiles/{profileId}/activate",
    "/api/v1/release/targets",
    "/api/v1/maturity/standards",
    "/api/v1/goals",
    "/api/v1/goals/{goalId}/plan",
    "/api/v1/goals/{goalId}/approve-plan",
    "/api/v1/goals/{goalId}/advance",
    "/api/v1/goals/{goalId}/run-status",
    "/api/v1/goals/{goalId}/phase-plan",
    "/api/v1/goals/{goalId}/evidence-matrix",
    "/api/v1/loops/{loopId}/executor-graph",
    "/api/v1/loops/{loopId}/source-closure/preflight",
    "/api/v1/release/decisions",
    "/api/v1/audit",
    "/api/v1/llm-profiles"
  ]) {
    assert.equal(paths.includes(required), true, `${required} should exist in sibling EvoPilot OpenAPI`);
  }
});

test("dashboard project onboarding follows current EvoPilot DevOps contract", () => {
  const legacyCiName = ["Jen", "kins"].join("");
  const legacyCiLower = legacyCiName.toLowerCase();
  assert.match(`${app}\n${docsDevopsBoundary}`, /GitHub Actions/);
  assert.match(`${app}\n${docsDevopsBoundary}`, /GitLab/);
  assert.match(`${app}\n${docsDevopsBoundary}`, /executionMode/);
  assert.match(`${app}\n${docsDevopsBoundary}`, /fork-validated-pr/);
  assert.match(docsDevopsBoundary, /claimBoundary/);
  assert.match(`${app}\n${docsDevopsBoundary}`, /tokenRef/);
  assert.match(docsDevopsBoundary, /Server-side credentialRef\/tokenRef/);
  assert.doesNotMatch(`${app}\n${styles}\n${readme}`, new RegExp(`${legacyCiName}|${legacyCiLower}`));
});

test("dashboard repository owns lightweight UI operation and AI-agent docs", () => {
  for (const file of [
    "docs/README.md",
    "docs/getting-started.md",
    "docs/user-guide.md",
    "docs/admin-guide.md",
    "docs/workflows/end-to-end-scenarios.md",
    "docs/workflows/first-login.md",
    "docs/workflows/tenant-workspace-user-admin.md",
    "docs/workflows/project-onboarding.md",
    "docs/workflows/credential-and-devops-boundary.md",
    "docs/workflows/source-to-ga-loop.md",
    "docs/workflows/global-goal-loop-workflow.md",
    "docs/workflows/release-decision-review.md",
    "docs/workflows/audit-and-history.md",
    "docs/ai-agents/README.md",
    "docs/ai-agents/digital-human-playbook.md",
    "docs/ai-agents/dashboard-page-map.md",
    "docs/ai-agents/expected-ui-states.md",
    "docs/operations/deployment.md",
    "docs/operations/troubleshooting.md",
    "docs/operations/smoke-test.md",
    "docs/reference/api-usage.md",
    "docs/reference/roles-and-permissions.md"
  ]) {
    assert.equal(fs.existsSync(file), true, `${file} should exist`);
  }

  assert.match(allDocs, /Projects \/ Runs \/ Ops/);
  assert.match(docsIndex, /Dashboard docs describe browser operations/);
  assert.match(docsIndex, /not a full CLI replacement/);
  assert.match(docsIndex, /Review Pack/);
  assert.match(docsUserGuide, /Dashboard does not call CLI commands/);
  assert.match(docsUserGuide, /ordinary-user core flows/);
  assert.match(docsUserGuide, /Production Action Map/);
  assert.match(docsUserGuide, /POST \/api\/v1\/onboarding\/project\/checklist/);
  assert.match(docsUserGuide, /POST \/api\/v1\/goals/);
  assert.match(docsAiAgents, /WorkBuddy/);
  assert.match(docsAiAgents, /three top-level pages/);
  assert.match(docsAiAgents, /Agent-Safe Smoke/);
  assert.match(docsAiAgents, /Browser End-To-End Loop/);
  assert.match(docsDashboardMap, /Projects \| Runs \| Ops/);
  assert.match(docsDashboardMap, /Review Pack Action Recognition/);
  assert.match(docsExpectedStates, /Review Pack States/);
  assert.match(docsE2E, /CLI-equivalent/);
  assert.match(docsE2E, /WorkBuddy deviation guard/);
  assert.match(docsSmoke, /Dashboard Console Smoke/);
  assert.match(docsSmoke, /EVOPILOT_MUTATING_SMOKE=1/);
  assert.match(docsSmoke, /evopilot-dashboard-console-smoke\/v1/);
  assert.match(docsApiUsage, /Do not copy OpenAPI schema/);
  assert.match(docsApiUsage, /Review Pack API Map/);
  assert.match(docsApiUsage, /Projection Context/);
  assert.match(docsDevopsBoundary, /devopsOwner/);
  assert.match(docsDevopsBoundary, /fork-validated-pr/);
  assert.match(docsDevopsBoundary, /GitHub\/GitLab execution principal/);
  assert.match(docsDevopsBoundary, /connect-github-account/);
  assert.match(docsDevopsBoundary, /connect-gitlab-account/);
  assert.doesNotMatch(allDocs, /five top-level pages/);
  assert.doesNotMatch(allDocs, /Dashboard \/ Projects \/ Harness \/ Goal Runs \/ Operations/);
});

test("production build includes runtime dashboard scripts", () => {
  assert.match(distIndex, /config\.js/);
  assert.match(distIndex, /type="module"/);
  assert.equal(fs.existsSync("dist/config.js"), true);
  assert.equal(fs.readdirSync("dist/assets").some((file) => /^index-.*\.js$/.test(file)), true);
  assert.equal(fs.readdirSync("dist/assets").some((file) => /^index-.*\.css$/.test(file)), true);
});

test("dashboard service has deployable CI and container contracts", () => {
  assert.match(ci, /actions\/setup-node@v4/);
  assert.match(ci, /node-version: "22"/);
  assert.match(ci, /npm ci/);
  assert.match(ci, /npm run check/);

  assert.match(dockerfile, /FROM node:22-alpine AS build/);
  assert.match(dockerfile, /FROM nginx:1\.27-alpine/);
  assert.match(dockerfile, /EVOPILOT_API_BASE_URL=http:\/\/evopilot-api:19876/);
  assert.match(dockerfile, /COPY nginx\.conf\.template \/etc\/nginx\/templates\/default\.conf\.template/);
  assert.match(nginx, /location \/api\//);
  assert.match(nginx, /proxy_pass \$\{EVOPILOT_API_BASE_URL\}/);
  assert.match(compose, /EVOPILOT_DASHBOARD_PORT:-8080/);
  assert.match(compose, /host\.docker\.internal:19876/);
  assert.match(compose, /host-gateway/);
  assert.match(productionCompose, /EVOPILOT_DOCKER_NETWORK:-evopilot_default/);
  assert.match(productionCompose, /http:\/\/evopilot-server:19876/);
  assert.match(productionCompose, /external: true/);
  assert.match(hostNginx, /location \/api\//);
  assert.match(hostNginx, /proxy_pass http:\/\/127\.0\.0\.1:19876/);
  assert.match(hostNginx, /proxy_pass http:\/\/127\.0\.0\.1:18080/);
  assert.match(hostNginx, /location = \/dashboard-health/);

  assert.match(dockerignore, /node_modules/);
  assert.match(dockerignore, /dist/);
  assert.match(dockerignore, /\.git/);
});

test("production smoke separates dashboard health from proxied API checks", () => {
  assert.match(productionSmoke, /dashboard\.health/);
  assert.match(productionSmoke, /expectDashboardHealth/);
  assert.match(productionSmoke, /dashboard\.proxy\.version/);
  assert.match(productionSmoke, /evopilot-version\/v1/);
  assert.doesNotMatch(productionSmoke, /dashboard\.proxy\.health/);
  assert.doesNotMatch(productionSmoke, /dashboard\.proxy\.ready/);
});

test("dashboard console smoke validates auth, proxy, action, and mutating flow contracts", () => {
  assert.match(consoleSmoke, /evopilot-dashboard-console-smoke\/v1/);
  assert.match(consoleSmoke, /EVOPILOT_MUTATING_SMOKE/);
  assert.match(consoleSmoke, /AbortController/);
  assert.match(consoleSmoke, /auth\.login/);
  assert.match(consoleSmoke, /summary\.authenticated/);
  assert.match(consoleSmoke, /goals\.list/);
  assert.match(consoleSmoke, /release\.targets/);
  assert.match(consoleSmoke, /maturity\.standards/);
  assert.match(consoleSmoke, /mutating\.harness\.generate/);
  assert.match(consoleSmoke, /mutating\.harness\.activate/);
  assert.match(consoleSmoke, /mutating\.goal\.approve-plan/);
  assert.match(consoleSmoke, /requestId/);
});

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
