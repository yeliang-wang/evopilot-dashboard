import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const index = fs.readFileSync("index.html", "utf8");
const app = fs.readFileSync("src/App.tsx", "utf8");
const dashboardModel = fs.readFileSync("src/dashboard/model.ts", "utf8");
const dashboardController = fs.readFileSync("src/dashboard/hooks/useAgentConsoleController.ts", "utf8");
const dashboardComponentFiles = [
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
];
const dashboardComponents = dashboardComponentFiles.map((file) => fs.readFileSync(file, "utf8")).join("\n");
const dashboardSource = [app, dashboardController, dashboardModel, dashboardComponents].join("\n");
const api = fs.readFileSync("src/api.ts", "utf8");
const styles = fs.readFileSync("src/styles.css", "utf8");
const config = fs.readFileSync("public/config.js", "utf8");
const packageJson = fs.readFileSync("package.json", "utf8");
const playwrightConfig = fs.readFileSync("playwright.config.ts", "utf8");
const distIndex = fs.existsSync("dist/index.html") ? fs.readFileSync("dist/index.html", "utf8") : "";
const dockerfile = fs.readFileSync("Dockerfile", "utf8");
const dockerignore = fs.readFileSync(".dockerignore", "utf8");
const nginx = fs.readFileSync("nginx.conf.template", "utf8");
const ci = fs.readFileSync(".github/workflows/ci.yml", "utf8");
const compose = fs.readFileSync("compose.yaml", "utf8");
const productionCompose = fs.readFileSync("compose.production.yaml", "utf8");
const hostNginx = fs.readFileSync("deploy/nginx/evopilot-dashboard.conf.example", "utf8");
const productionSmoke = fs.readFileSync("scripts/production-compat-smoke.mjs", "utf8");
const consoleSmoke = fs.readFileSync("scripts/dashboard-console-smoke.mjs", "utf8");
const browserWorkflow = fs.readFileSync(".github/workflows/browser-e2e.yml", "utf8");
const visualWorkflow = fs.readFileSync(".github/workflows/visual-regression.yml", "utf8");
const prArtifactsWorkflow = fs.readFileSync(".github/workflows/pr-artifacts.yml", "utf8");
const browserE2E = fs.readFileSync("tests/e2e/agent-console.spec.ts", "utf8");
const liveE2E = fs.readFileSync("tests/e2e/live-api.spec.ts", "utf8");
const visualTest = fs.readFileSync("tests/visual/agent-console-visual.spec.ts", "utf8");
const mockApi = fs.readFileSync("tests/fixtures/mock-evopilot-api.ts", "utf8");
const readme = fs.readFileSync("README.md", "utf8");
const docsIndex = fs.readFileSync("docs/README.md", "utf8");
const docsUserGuide = fs.readFileSync("docs/user-guide.md", "utf8");
const docsAiAgents = fs.readFileSync("docs/ai-agents/README.md", "utf8");
const docsDashboardMap = fs.readFileSync("docs/ai-agents/dashboard-page-map.md", "utf8");
const docsExpectedStates = fs.readFileSync("docs/ai-agents/expected-ui-states.md", "utf8");
const docsSmoke = fs.readFileSync("docs/operations/smoke-test.md", "utf8");
const docsTestMatrix = fs.readFileSync("docs/operations/test-matrix.md", "utf8");
const docsApiUsage = fs.readFileSync("docs/reference/api-usage.md", "utf8");
const docsRoles = fs.readFileSync("docs/reference/roles-and-permissions.md", "utf8");
const docsE2E = fs.readFileSync("docs/workflows/end-to-end-scenarios.md", "utf8");
const docsGettingStarted = fs.readFileSync("docs/getting-started.md", "utf8");
const docsAdmin = fs.readFileSync("docs/admin-guide.md", "utf8");
const docsDigitalHuman = fs.readFileSync("docs/ai-agents/digital-human-playbook.md", "utf8");
const docsDevopsBoundary = fs.readFileSync("docs/workflows/credential-and-devops-boundary.md", "utf8");
const allDocs = [
  readme,
  docsIndex,
  docsUserGuide,
  docsAiAgents,
  docsDashboardMap,
  docsExpectedStates,
  docsSmoke,
  docsTestMatrix,
  docsApiUsage,
  docsRoles,
  docsE2E,
  docsGettingStarted,
  docsAdmin,
  docsDigitalHuman,
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
  assert.match(api, /interface DashboardSnapshotOptions/);
  assert.match(api, /loadDashboardApiSnapshot\(\s*scope: DashboardScope,\s*context: DashboardProjectionContext/s);
  assert.match(api, /DASHBOARD_API_TIMEOUT_MS/);
  assert.match(api, /DASHBOARD_USAGE_API_TIMEOUT_MS/);
  assert.match(api, /AbortController/);
  assert.match(api, /Promise\.allSettled/);
  assert.match(api, /Request timed out after/);
  assert.match(api, /options\.onResult/);
  assert.match(dashboardController, /useRef/);
  assert.match(dashboardController, /onResult: \(key, result\)/);
  assert.match(api, /X-EvoPilot-Tenant/);
  assert.match(api, /X-EvoPilot-Workspace/);
  assert.match(api, /X-EvoPilot-Actor/);
  assert.match(api, /Authorization/);
  assert.match(dashboardModel, /sessionStorage\.getItem\("evopilot\.apiToken"\)/);
  assert.match(dashboardSource, /sessionStorage\.setItem\("evopilot\.apiToken", nextScope\.token\)/);
  assert.match(dashboardModel, /storage\.removeItem\("evopilot\.apiToken"\)/);
  assert.doesNotMatch(dashboardSource, /storage\.setItem\("evopilot\.apiToken"/);
  assert.doesNotMatch(app, /fetch\(/);
  assert.doesNotMatch(`${dashboardSource}\n${api}`, /apps\/dashboard/);
  assert.doesNotMatch(`${dashboardSource}\n${api}`, /\.codex-evidence/);
  assert.doesNotMatch(`${dashboardSource}\n${api}`, /evopilot\s+(target|goal|loop|harness)/);
  assert.equal(fs.existsSync("src/domain.ts"), false, "stale static domain fixture should not exist");
});

test("dashboard shell and feature modules stay bounded", () => {
  assert.ok(lineCount(app) <= 350, `src/App.tsx has ${lineCount(app)} lines`);
  assert.ok(lineCount(dashboardController) <= 750, `controller has ${lineCount(dashboardController)} lines`);
  assert.ok(lineCount(dashboardModel) <= 700, `model has ${lineCount(dashboardModel)} lines`);
  for (const file of dashboardComponentFiles) {
    const content = fs.readFileSync(file, "utf8");
    assert.ok(lineCount(content) <= 700, `${file} has ${lineCount(content)} lines`);
  }
});

test("dashboard implements the Agent Console v2 information architecture", () => {
  for (const text of [
    "Agent Console",
    "Project Intake",
    "Template Auto-Match",
    "ProjectHarnessProfile DRAFT",
    "Owner Review",
    "Loop Execution",
    "Release Decision",
    "Evidence drawer",
    "ProjectHarnessProfile.yaml",
    "Owner Review Summary",
    "Start intake",
    "Request changes",
    "Confirm",
    "Approve plan & start loop",
    "View evidence",
    "Control plane access starts here.",
    "scope locked",
    "Tenants",
    "Workspaces",
    "Users",
    "Harness Templates",
    "LLM Profiles",
    "Register LLM Profile",
    "Project LLM Profile",
    "Use my profile for this run",
    "workspace scope",
    "HarnessTemplateEvolution",
    "Harness Knowledge Factory",
    "Template match preview",
    "Preview template match",
    "source-project",
    "source-corpus",
    "production-log",
    "evopilot-history",
    "gapClassificationsText",
    "domainSignalsText",
    "autoMatchText",
    "autoMatch: true",
    "dashboard-knowledge-factory",
    "database-product-harness@2.2.0",
    "domain=database-product",
    "Compatibility",
    "Harness layer",
    "compatibilityProfiles",
    "architectureProfiles",
    "runtimeProfiles",
    "Required actions",
    "Evidence adapters",
    "Release blockers",
    "repoProbe",
    "接入项目 LLM 用量追踪",
    "Project LLM Usage",
    "WorkspaceUsagePanel",
    "providerModelUsage",
    "latestLoopTotalTokens",
    "shareOfWorkspace"
  ]) {
    assert.match(dashboardSource, new RegExp(escapeRegExp(text)));
  }

  assert.match(dashboardModel, /export type ConsoleStep =/);
  assert.match(dashboardModel, /export type DrawerKind =/);
  assert.match(dashboardModel, /export type PageId = "console" \| "tenants" \| "workspaces" \| "users" \| "templates" \| "llm-profiles" \| "audit"/);
  assert.match(dashboardComponents, /function AuthScreen/);
  assert.match(dashboardComponents, /function PasswordChangeScreen/);
  assert.match(dashboardComponents, /function ManagementPage/);
  assert.doesNotMatch(dashboardComponents, /function ProjectsPage/);
  assert.match(dashboardComponents, /function TenantsPage/);
  assert.match(dashboardComponents, /function WorkspacesPage/);
  assert.match(dashboardComponents, /function UsersPage/);
  assert.match(dashboardComponents, /function TemplatesPage/);
  assert.match(dashboardComponents, /function LlmProfilesPage/);
  assert.match(dashboardComponents, /function AuditPage/);
  assert.match(dashboardComponents, /function StageBar/);
  assert.match(dashboardComponents, /function EvidenceDrawer/);
  assert.match(dashboardComponents, /function ProfileReviewCard/);
  assert.match(dashboardComponents, /function DiffCard/);
  assert.match(dashboardComponents, /function BlockerCard/);
  assert.match(styles, /\.app-shell/);
  assert.match(styles, /\.stagebar/);
  assert.match(styles, /\.conversation/);
  assert.match(styles, /\.review-document/);
  assert.match(styles, /\.yaml-block/);
  assert.match(styles, /\.drawer/);
  assert.match(styles, /\.auth-screen/);
  assert.match(styles, /\.nav-item/);
  assert.match(styles, /grid-template-columns:\s*168px minmax\(0, 1fr\)/);
  assert.match(styles, /\.management-workspace/);
  assert.match(styles, /\.form-panel/);

  assert.doesNotMatch(dashboardSource, /type PageId = "projects" \| "runs" \| "ops";/);
  assert.doesNotMatch(dashboardSource, /\(\["projects", "runs", "ops"\] as PageId\[\]\)/);
  assert.doesNotMatch(dashboardSource, /"projects", "Projects"/);
  assert.doesNotMatch(dashboardSource, /page === "projects"/);
  assert.doesNotMatch(dashboardSource, /Workspace \/ Project/);
  assert.doesNotMatch(dashboardSource, /Active sessions/);
  assert.doesNotMatch(dashboardSource, /Recent decisions/);
  assert.doesNotMatch(dashboardSource, /Projects \/ Runs \/ Ops/);
  assert.doesNotMatch(dashboardSource, /five top-level pages/);
});

test("dashboard preserves governed review gates and stop rules", () => {
  for (const actionId of [
    "project-preflight",
    "generate-harness-profile",
    "activate-harness-profile",
    "create-goal",
    "plan-goal",
    "approve-goal-plan",
    "advance-goal"
  ]) {
    assert.match(dashboardSource, new RegExp(escapeRegExp(actionId)));
  }

  for (const text of [
    "DRAFT",
    "sourceContent",
    "compiledContent",
    "policyRefs",
    "sourceDigest",
    "compiledDigest",
    "generatedBy",
    "Dashboard will not invent either value",
    "Release truth comes from EvoPilot evidence packages and release decisions"
  ]) {
    assert.match(dashboardSource, new RegExp(escapeRegExp(text)));
  }
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
    "/api/v1/projects/${encodeURIComponent(projectId)}/usage",
    "/api/v1/projects/${encodeURIComponent(projectId)}/source-credentials/preflight",
    "/api/v1/projects/${encodeURIComponent(projectId)}/devops/preflight",
    "/api/v1/projects/${encodeURIComponent(projectId)}/llm/preflight",
    "/api/v1/harness/templates",
    "/api/v1/harness/template-matches",
    "/api/v1/harness/template-evolutions",
    "/api/v1/harness/policies",
    "/api/v1/projects/${encodeURIComponent(projectId)}/harness-profiles",
    "/api/v1/projects/${encodeURIComponent(projectId)}/harness-profiles/generate",
    "/api/v1/projects/${encodeURIComponent(projectId)}/harness-profiles/validate",
    "/api/v1/projects/${encodeURIComponent(projectId)}/harness-profiles/${encodeURIComponent(profileId)}",
    "/api/v1/projects/${encodeURIComponent(projectId)}/harness-profiles/${encodeURIComponent(profileId)}/activate",
    "/api/v1/release/targets",
    "/api/v1/maturity/standards",
    "/api/v1/goals",
    "/api/v1/goals/${encodeURIComponent(goalId)}",
    "/api/v1/goals/${encodeURIComponent(goalId)}/plan",
    "/api/v1/goals/${encodeURIComponent(goalId)}/approve-plan",
    "/api/v1/goals/${encodeURIComponent(goalId)}/advance",
    "/api/v1/goals/${encodeURIComponent(goalId)}/run-status",
    "/api/v1/goals/${encodeURIComponent(goalId)}/phase-plan",
    "/api/v1/goals/${encodeURIComponent(goalId)}/phases",
    "/api/v1/goals/${encodeURIComponent(goalId)}/targets",
    "/api/v1/goals/${encodeURIComponent(goalId)}/phase-packages",
    "/api/v1/goals/${encodeURIComponent(goalId)}/target-packages",
    "/api/v1/goals/${encodeURIComponent(goalId)}/snapshot",
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
    "/api/v1/release/evidence/${encodeURIComponent(evidenceId)}",
    "/api/v1/audit",
    "/api/v1/history",
    "/api/v1/llm-profiles",
    "/api/v1/llm-profiles/${encodeURIComponent(profileId)}/preflight",
    "/api/v1/projects/${encodeURIComponent(projectId)}/llm",
    "/api/v1/projects/${encodeURIComponent(projectId)}/llm/preflight",
    "/api/v1/secrets",
    "/api/v1/tenants",
    "/api/v1/workspaces",
    "/api/v1/workspaces/${encodeURIComponent(workspaceId)}/usage",
    "/api/v1/users",
    "/api/v1/loop-workers/queue"
  ]) {
    assert.match(api, new RegExp(escapeRegExp(apiPath)));
  }

  assert.doesNotMatch(api, /\/api\/v1\/deploy-connectors/);
  assert.match(dashboardSource, /snapshot\.workspaceUsage/);
  assert.match(docsApiUsage, /Browser code must not calculate project token totals locally/);
  assert.doesNotMatch(dashboardSource, /reduce\(\(.*totalTokens/s);
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
    "/api/v1/projects/{projectId}/usage",
    "/api/v1/harness/templates",
    "/api/v1/harness/template-matches",
    "/api/v1/harness/template-evolutions",
    "/api/v1/harness/policies",
    "/api/v1/projects/{projectId}/harness-profiles",
    "/api/v1/projects/{projectId}/harness-profiles/generate",
    "/api/v1/projects/{projectId}/harness-profiles/{profileId}",
    "/api/v1/projects/{projectId}/harness-profiles/{profileId}/activate",
    "/api/v1/release/targets",
    "/api/v1/maturity/standards",
    "/api/v1/goals",
    "/api/v1/goals/{goalId}",
    "/api/v1/goals/{goalId}/plan",
    "/api/v1/goals/{goalId}/approve-plan",
    "/api/v1/goals/{goalId}/advance",
    "/api/v1/goals/{goalId}/run-status",
    "/api/v1/goals/{goalId}/phase-plan",
    "/api/v1/goals/{goalId}/phase-packages",
    "/api/v1/goals/{goalId}/target-packages",
    "/api/v1/goals/{goalId}/snapshot",
    "/api/v1/goals/{goalId}/evidence-matrix",
    "/api/v1/loops/{loopId}/executor-graph",
    "/api/v1/loops/{loopId}/source-closure/preflight",
    "/api/v1/release/decisions",
    "/api/v1/release/evidence",
    "/api/v1/audit",
    "/api/v1/llm-profiles",
    "/api/v1/workspaces/{workspaceId}/usage"
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
  assert.match(dashboardSource, /sourceMode/);
  assert.match(dashboardSource, /external-source/);
  assert.match(dashboardSource, /workflowProvider/);
  assert.match(dashboardSource, /gitlabRef/);
  assert.match(dashboardSource, /GitHub source \+ GitLab CI/);
  assert.match(docsDevopsBoundary, /claimBoundary/);
  assert.match(`${app}\n${docsDevopsBoundary}`, /tokenRef/);
  assert.match(docsDevopsBoundary, /Server-side credentialRef\/tokenRef/);
  assert.doesNotMatch(`${app}\n${styles}\n${readme}`, new RegExp(`${legacyCiName}|${legacyCiLower}`));
});

test("dashboard docs are updated for Agent Console v2 and AI agents", () => {
  for (const file of [
    "docs/README.md",
    "docs/getting-started.md",
    "docs/user-guide.md",
    "docs/admin-guide.md",
    "docs/workflows/end-to-end-scenarios.md",
    "docs/workflows/project-onboarding.md",
    "docs/workflows/source-to-ga-loop.md",
    "docs/workflows/release-decision-review.md",
    "docs/ai-agents/README.md",
    "docs/ai-agents/digital-human-playbook.md",
    "docs/ai-agents/dashboard-page-map.md",
    "docs/ai-agents/expected-ui-states.md",
    "docs/operations/deployment.md",
    "docs/operations/troubleshooting.md",
    "docs/operations/smoke-test.md",
    "docs/operations/test-matrix.md",
    "docs/reference/api-usage.md",
    "docs/reference/roles-and-permissions.md"
  ]) {
    assert.equal(fs.existsSync(file), true, `${file} should exist`);
  }

  for (const text of [
    "Agent Console v2",
    "ProjectHarnessProfile.yaml",
    "Project Intake -> Template Auto-Match -> ProjectHarnessProfile DRAFT -> Owner Review -> Loop Execution -> Release Decision",
    "Evidence Drawer",
    "chat-first",
    "login-scoped",
    "scope locked",
    "Tenants",
    "Workspaces",
    "Users",
    "Harness Templates",
    "HarnessTemplateEvolution",
    "WorkBuddy",
    "ordinary-user core flow"
  ]) {
    assert.match(allDocs, new RegExp(escapeRegExp(text)));
  }

  assert.match(docsAiAgents, /Agent Console v2/);
  assert.match(docsAiAgents, /Browser End-To-End Loop/);
  assert.match(docsAiAgents, /Admin Browser Operations/);
  assert.match(docsDashboardMap, /Dashboard Page Map/);
  assert.match(docsDashboardMap, /Left Navigation/);
  assert.match(docsDashboardMap, /`# Agent Console`, `Tenants`, `Workspaces`, `Users`, `Harness Templates`, `LLM Profiles`, `Audit`/);
  assert.match(docsExpectedStates, /ProjectHarnessProfile YAML Review/);
  assert.match(docsExpectedStates, /Authentication States/);
  assert.match(docsExpectedStates, /Admin Page States/);
  assert.match(docsE2E, /CLI-equivalent/);
  assert.match(docsE2E, /Platform Admin Creates Tenant And User/);
  assert.match(docsE2E, /Platform Admin Starts Harness Template Evolution/);
  assert.match(docsE2E, /WorkBuddy deviation guard/);
  assert.match(docsSmoke, /Dashboard Console Smoke/);
  assert.match(docsSmoke, /EVOPILOT_MUTATING_SMOKE=1/);
  assert.match(docsSmoke, /evopilot-dashboard-console-smoke\/v1/);
  assert.match(docsTestMatrix, /Browser E2E Scope/);
  assert.match(docsTestMatrix, /Visual Regression Scope/);
  assert.match(docsTestMatrix, /Live E2E Boundary/);
  assert.match(docsTestMatrix, /PR Artifacts/);
  assert.match(docsApiUsage, /Agent Console API Map/);
  assert.match(docsApiUsage, /Role-Based API Boundary/);
  assert.match(docsApiUsage, /Projection Context/);
  assert.match(docsRoles, /Dashboard Navigation By Role/);
  assert.match(docsGettingStarted, /first screen is the EvoPilot login page/);
  assert.match(docsAdmin, /Harness Templates page creates evolution draft/);
  assert.match(docsDigitalHuman, /# Agent Console/);
  assert.doesNotMatch(allDocs, /three top-level pages/);
  assert.doesNotMatch(allDocs, /Projects \/ Runs \/ Ops/);
  assert.doesNotMatch(allDocs, /Open \*\*Runs\*\*/);
  assert.doesNotMatch(allDocs, /Open \*\*Ops\*\*/);
  assert.doesNotMatch(allDocs, /Generate Review Pack/);
  assert.doesNotMatch(allDocs, /Ordinary operator \| `# Agent Console`, `Projects`, `Audit`/);
  assert.doesNotMatch(allDocs, /Left rail \| Role navigation, optional workspace\/project context, active sessions, recent decisions/);
  assert.doesNotMatch(allDocs, /five top-level pages/);
});

test("production build includes runtime dashboard scripts", () => {
  if (!distIndex) return;
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

test("production and console smoke validate API compatibility", () => {
  assert.match(productionSmoke, /dashboard\.health/);
  assert.match(productionSmoke, /expectDashboardHealth/);
  assert.match(productionSmoke, /dashboard\.proxy\.version/);
  assert.match(productionSmoke, /evopilot-version\/v1/);
  assert.match(consoleSmoke, /evopilot-dashboard-console-smoke\/v1/);
  assert.match(consoleSmoke, /EVOPILOT_MUTATING_SMOKE/);
  assert.match(consoleSmoke, /AbortController/);
  assert.match(consoleSmoke, /auth\.login/);
  assert.match(consoleSmoke, /summary\.authenticated/);
  assert.match(consoleSmoke, /harness\.templates/);
  assert.match(consoleSmoke, /goals\.list/);
  assert.match(consoleSmoke, /release\.targets/);
  assert.match(consoleSmoke, /maturity\.standards/);
  assert.match(consoleSmoke, /mutating\.harness\.generate/);
  assert.match(consoleSmoke, /mutating\.harness\.activate/);
  assert.match(consoleSmoke, /mutating\.goal\.approve-plan/);
  assert.match(consoleSmoke, /requestId/);
});

test("dashboard test matrix covers browser e2e, visual regression, live e2e, and PR artifacts", () => {
  assert.match(packageJson, /"test:browser": "npm run test:e2e:mock && npm run test:visual"/);
  assert.match(packageJson, /"test:e2e:mock": "playwright test tests\/e2e --project=chromium --project=mobile-chromium"/);
  assert.match(packageJson, /"test:e2e:live": "EVOPILOT_LIVE_E2E=1 playwright test tests\/e2e\/live-api\.spec\.ts --project=chromium"/);
  assert.match(packageJson, /"test:visual": "playwright test tests\/visual --project=chromium"/);
  assert.match(packageJson, /"@playwright\/test"/);

  assert.match(playwrightConfig, /webServer/);
  assert.match(playwrightConfig, /npm run dev -- --port/);
  assert.match(playwrightConfig, /trace: "retain-on-failure"/);
  assert.match(playwrightConfig, /video: "retain-on-failure"/);
  assert.match(playwrightConfig, /snapshotPathTemplate/);
  assert.match(playwrightConfig, /mobile-chromium/);

  assert.match(browserE2E, /\?demo=1&step=\$\{stage\.step\}/);
  assert.match(browserE2E, /mock API login reaches ProjectHarnessProfile review/);
  assert.match(browserE2E, /mock API blocker stops intake and exposes nextAction evidence/);
  assert.match(browserE2E, /collectBrowserErrors/);
  assert.match(liveE2E, /EVOPILOT_LIVE_E2E/);
  assert.match(liveE2E, /EVOPILOT_API_BASE_URL/);
  assert.match(liveE2E, /EVOPILOT_E2E_USERNAME/);
  assert.match(visualTest, /toHaveScreenshot/);
  assert.match(visualTest, /agent-console-review-desktop\.png/);
  assert.match(visualTest, /agent-console-blocker-mobile\.png/);
  assert.match(mockApi, /req-project-preflight-blocked/);
  assert.match(mockApi, /connect-github-account/);
  assert.match(mockApi, /x-request-id/);
  assert.match(mockApi, /req-harness-template-match/);
  assert.match(mockApi, /distributed-cache-harness/);
  assert.match(mockApi, /database-product-harness@2\.2\.0/);
  assert.match(mockApi, /domain: "database-product"/);
  assert.match(mockApi, /domainHarnessRequiredActions/);
  assert.match(mockApi, /evidenceAdapters/);
  assert.match(mockApi, /domainHarnessReleaseBlockers/);
  assert.match(mockApi, /repoProbe/);
  assert.match(mockApi, /postgres-compatible/);

  for (const workflow of [browserWorkflow, visualWorkflow, prArtifactsWorkflow]) {
    assert.match(workflow, /actions\/setup-node@v4/);
    assert.match(workflow, /node-version: "22"/);
    assert.match(workflow, /npm ci/);
    assert.match(workflow, /npx playwright install --with-deps chromium/);
    assert.match(workflow, /actions\/upload-artifact@v4/);
  }
  assert.match(browserWorkflow, /npm run test:e2e:mock/);
  assert.match(visualWorkflow, /npm run test:visual/);
  assert.match(prArtifactsWorkflow, /npm run check/);
  assert.match(prArtifactsWorkflow, /npm run test:browser/);
  assert.match(prArtifactsWorkflow, /npm run release:artifact/);
  assert.match(prArtifactsWorkflow, /npm run verify:release-artifact/);
});

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function lineCount(value) {
  return value.split(/\r?\n/).length;
}
