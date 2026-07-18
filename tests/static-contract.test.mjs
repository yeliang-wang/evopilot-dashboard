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
  assert.doesNotMatch(app, /apps\/dashboard/);
  assert.doesNotMatch(app, /\.codex-evidence/);
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
