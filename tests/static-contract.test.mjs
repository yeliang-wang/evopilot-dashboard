import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const index = fs.readFileSync("index.html", "utf8");
const app = fs.readFileSync("assets/app.js", "utf8");
const styles = fs.readFileSync("assets/styles.css", "utf8");
const config = fs.readFileSync("public/config.js", "utf8");
const distIndex = fs.readFileSync("dist/index.html", "utf8");
const dockerfile = fs.readFileSync("Dockerfile", "utf8");
const dockerignore = fs.readFileSync(".dockerignore", "utf8");
const nginx = fs.readFileSync("nginx.conf.template", "utf8");
const ci = fs.readFileSync(".github/workflows/ci.yml", "utf8");
const compose = fs.readFileSync("compose.yaml", "utf8");
const productionCompose = fs.readFileSync("compose.production.yaml", "utf8");
const hostNginx = fs.readFileSync("deploy/nginx/evopilot-dashboard.conf.example", "utf8");
const readme = fs.readFileSync("README.md", "utf8");
const docsIndex = fs.readFileSync("docs/README.md", "utf8");
const docsUserGuide = fs.readFileSync("docs/user-guide.md", "utf8");
const docsAiAgents = fs.readFileSync("docs/ai-agents/README.md", "utf8");
const docsDigitalHuman = fs.readFileSync("docs/ai-agents/digital-human-playbook.md", "utf8");
const docsApiUsage = fs.readFileSync("docs/reference/api-usage.md", "utf8");
const docsDevopsBoundary = fs.readFileSync("docs/workflows/credential-and-devops-boundary.md", "utf8");

test("dashboard is a standalone API client", () => {
  assert.match(index, /config\.js/);
  assert.match(index, /type="module" src="\/assets\/app\.js"/);
  assert.match(config, /EVOPILOT_DASHBOARD_CONFIG/);
  assert.match(app, /configuredApiBaseUrl/);
  assert.match(app, /const controlPlaneBaseUrl = configuredApiBaseUrl \|\| window\.location\.origin;/);
  assert.match(app, /function apiUrl/);
  assert.match(app, /apiFetch\("\/api\/v1\/goals"\)/);
  assert.match(app, /apiFetch\(`\/api\/v1\/goals\/\$\{encodeURIComponent\(goalId\)\}\/snapshot`\)/);
  assert.match(app, /controlPlaneUrl: controlPlaneBaseUrl/);
  assert.doesNotMatch(app, /controlPlaneUrl: window\.location\.origin/);
  assert.match(app, /\/api\/v1\/connectors\/deploy/);
  assert.match(app, /\/api\/v1\/onboarding\/project\/checklist/);
  assert.match(app, /\/api\/v1\/projects\/\$\{encodeURIComponent\(projectId\)\}\/onboarding-checklist/);
  assert.doesNotMatch(app, /\/api\/v1\/deploy-connectors/);
  assert.doesNotMatch(app, /apps\/dashboard/);
  assert.doesNotMatch(app, /\.codex-evidence/);
});

test("dashboard project onboarding follows current EvoPilot DevOps contract", () => {
  const legacyCiName = ["Jen", "kins"].join("");
  const legacyCiLower = legacyCiName.toLowerCase();
  const legacyProjectField = ["project", "cicd"].join(".");
  const legacyModeField = ["cicd", "Mode"].join("");
  assert.match(app, /evopilot-project-onboarding-checklist\/v1/);
  assert.match(app, /GitHub Actions/);
  assert.match(app, /GitLab CI/);
  assert.match(app, /provider,\s*\n\s*tokenRef/);
  assert.match(app, /postProjectOnboardingChecklist/);
  assert.match(app, /getProjectOnboardingChecklist/);
  assert.match(readme, /docs\/api\/openapi\.json/);
  assert.match(readme, /docs\/guides\/dashboard-integration\.md/);
  assert.match(readme, /docs\/README\.md/);
  assert.match(readme, /git@github\.com:yeliang-wang\/evopilot\.git/);
  assert.doesNotMatch(`${app}\n${styles}\n${readme}`, new RegExp(`${legacyCiName}|${legacyCiLower}`));
  assert.doesNotMatch(app, new RegExp(`provider:\\s*["']${legacyCiLower}["']`));
  assert.doesNotMatch(app, new RegExp(`executor:\\s*["']${legacyCiLower}["']`));
  assert.doesNotMatch(app, new RegExp(`${legacyProjectField.replace(".", "\\.")}|${legacyModeField}|${legacyCiLower}Job`));
});

test("dashboard repository owns UI operation and AI-agent docs", () => {
  for (const file of [
    "docs/README.md",
    "docs/getting-started.md",
    "docs/user-guide.md",
    "docs/admin-guide.md",
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

  assert.match(docsIndex, /Dashboard docs describe UI operations/);
  assert.match(docsUserGuide, /Dashboard does not call CLI commands/);
  assert.match(docsAiAgents, /WorkBuddy/);
  assert.match(docsDigitalHuman, /登录 -> 租户\/工作区 -> 用户\/权限 -> 凭据 -> 接入项目/);
  assert.match(docsApiUsage, /Do not copy OpenAPI schema/);
  assert.match(docsDevopsBoundary, /devopsOwner/);
  assert.match(docsDevopsBoundary, /fork-validated-pr/);
});

test("production build includes runtime dashboard scripts", () => {
  assert.match(distIndex, /config\.js/);
  assert.match(distIndex, /type="module"/);
  assert.equal(fs.existsSync("dist/config.js"), true);
  assert.equal(fs.readdirSync("dist/assets").some((file) => /^index-.*\.js$/.test(file)), true);
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

test("dashboard retains the loop workflow runtime UI", () => {
  assert.match(app, /renderLoopWorkflowRuntimeDashboard/);
  assert.match(app, /Loop Workflow Runtime/);
  assert.match(app, /Loop Workflow Graph/);
  assert.match(app, /GlobalGoal Cockpit/);
  assert.match(app, /GoalTarget/);
  assert.match(app, /Release Decision/);
  assert.match(styles, /\.loop-runtime-canvas/);
  assert.match(styles, /\.loop-runtime-node/);
});
