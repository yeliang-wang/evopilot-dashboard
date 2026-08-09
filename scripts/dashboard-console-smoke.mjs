import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const dashboardBaseUrl = trimSlash(process.env.EVOPILOT_DASHBOARD_BASE_URL ?? "http://127.0.0.1:5175");
const apiBaseUrl = trimSlash(process.env.EVOPILOT_API_BASE_URL ?? "http://127.0.0.1:19876");
const tenantId = process.env.EVOPILOT_TENANT ?? "tenant-production";
const workspaceId = process.env.EVOPILOT_WORKSPACE ?? "workspace-agent-products";
const actorId = process.env.EVOPILOT_ACTOR ?? "tenant-admin";
const username = process.env.EVOPILOT_DASHBOARD_USERNAME ?? "tenant-admin";
const password = process.env.EVOPILOT_DASHBOARD_PASSWORD ?? "tenant-password";
const mutating = process.env.EVOPILOT_MUTATING_SMOKE === "1";
const timeoutMs = Number(process.env.EVOPILOT_SMOKE_TIMEOUT_MS ?? 15000);
const longTimeoutMs = Number(process.env.EVOPILOT_MUTATING_SMOKE_TIMEOUT_MS ?? 90000);
const reportPath = process.env.EVOPILOT_DASHBOARD_CONSOLE_SMOKE_REPORT
  ?? path.join(os.tmpdir(), `evopilot-dashboard-console-smoke-${Date.now()}.json`);

const checks = [];
const startedAt = new Date().toISOString();
let token = process.env.EVOPILOT_API_TOKEN ?? "";
const smokeId = `dashboard-console-smoke-${Date.now()}`;

await check("api.health", apiBaseUrl, "/health", { expectStatus: 200 });
await check("api.ready", apiBaseUrl, "/ready", { expectStatus: 200 });
await check("dashboard.root", dashboardBaseUrl, "/", { expectStatus: 200, expectText: "EvoPilot" });
await check("dashboard.config", dashboardBaseUrl, "/config.js", { expectStatus: 200, expectText: "EVOPILOT_DASHBOARD_CONFIG" });
await check("dashboard.proxy.health", dashboardBaseUrl, "/health", { expectStatus: 200 });
await check("dashboard.proxy.ready", dashboardBaseUrl, "/ready", { expectStatus: 200 });
await check("auth.bootstrap", dashboardBaseUrl, "/api/v1/auth/bootstrap", { expectStatus: 200 });
await check("summary.unauthenticated", dashboardBaseUrl, "/api/v1/summary", { expectStatus: 401 });

if (!token) {
  const login = await check("auth.login", dashboardBaseUrl, "/api/v1/auth/login", {
    method: "POST",
    body: { username, password },
    expectStatus: 200
  });
  token = login?.json?.data?.token ?? "";
}

await check("summary.authenticated", dashboardBaseUrl, "/api/v1/summary", { token, expectStatus: 200 });
await check("harness.catalogs", dashboardBaseUrl, "/api/v1/harness/catalogs", { token, expectStatus: 200 });
await check("projects.list", dashboardBaseUrl, "/api/v1/projects", { token, expectStatus: 200 });
await check("goals.list", dashboardBaseUrl, "/api/v1/goals", { token, expectStatus: 200 });
await check("release.targets", dashboardBaseUrl, "/api/v1/release/targets", { token, expectStatus: 200 });
await check("maturity.standards", dashboardBaseUrl, "/api/v1/maturity/standards", { token, expectStatus: 200 });
await check("worker.queue", dashboardBaseUrl, "/api/v1/loop-workers/queue", { token, expectStatus: 200 });

if (mutating) {
  await runMutatingSmoke();
} else {
  checks.push({
    id: "mutating-flow",
    status: "SKIP",
    detail: "Set EVOPILOT_MUTATING_SMOKE=1 to create a temporary project, plan a goal with selectedHarness, and approve the goal plan."
  });
}

const finishedAt = new Date().toISOString();
const failed = checks.filter((check) => check.status === "FAIL");
const report = {
  schema: "evopilot-dashboard-console-smoke/v1",
  startedAt,
  finishedAt,
  apiBaseUrl,
  dashboardBaseUrl,
  tenantId,
  workspaceId,
  actorId,
  mutating,
  smokeId,
  result: failed.length === 0 ? "PASS" : "FAIL",
  summary: {
    total: checks.length,
    passed: checks.filter((check) => check.status === "PASS").length,
    failed: failed.length,
    skipped: checks.filter((check) => check.status === "SKIP").length
  },
  checks
};

fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({
  result: report.result,
  summary: report.summary,
  reportPath,
  mutating,
  smokeId
}, null, 2));

if (failed.length > 0) process.exitCode = 1;

async function runMutatingSmoke() {
  const repoRoot = path.join(os.tmpdir(), `${smokeId}-repo`);
  fs.mkdirSync(path.join(repoRoot, "tests"), { recursive: true });
  fs.writeFileSync(path.join(repoRoot, "pyproject.toml"), `[project]\nname = "${smokeId}"\nversion = "0.1.0"\n`);
  fs.writeFileSync(path.join(repoRoot, "tests", "test_smoke.py"), "def test_smoke():\n    assert True\n");

  const project = await check("mutating.project.create", dashboardBaseUrl, "/api/v1/projects", {
    method: "POST",
    token,
    timeoutMs,
    body: {
      id: smokeId,
      name: "Dashboard Console Smoke",
      repository: { provider: "local-git", root: repoRoot },
      runtime: {
        language: "python",
        unitCommands: ["pytest"],
        smokeCommands: ["pytest -q tests"]
      }
    },
    expectOneOfStatuses: [201, 409]
  });
  if (!project || ![201, 409].includes(project.httpStatus)) return;

  const goal = await check("mutating.goal.create", dashboardBaseUrl, "/api/v1/goals", {
    method: "POST",
    token,
    body: {
      projectId: smokeId,
      objective: "Dashboard production console smoke goal"
    },
    expectStatus: 201
  });
  const goalId = goal?.json?.data?.id;
  if (!goalId) {
    checks.push({ id: "mutating.goal.id", status: "FAIL", detail: "Goal create did not return data.id." });
    return;
  }

  const planned = await check("mutating.goal.plan", dashboardBaseUrl, `/api/v1/goals/${encodeURIComponent(goalId)}/plan`, {
    method: "POST",
    token,
    timeoutMs: longTimeoutMs,
    body: {},
    expectStatus: 201
  });
  if (!planned || planned.status !== "PASS") return;
  const selectedHarness = planned.json?.data?.plan?.selectedHarness ?? planned.json?.data?.selectedHarness;
  if (!selectedHarness?.harnessId) {
    checks.push({ id: "mutating.goal.selectedHarness", status: "FAIL", detail: "Goal plan did not return data.plan.selectedHarness.harnessId." });
    return;
  }

  await check("mutating.goal.approve-plan", dashboardBaseUrl, `/api/v1/goals/${encodeURIComponent(goalId)}/approve-plan`, {
    method: "POST",
    token,
    body: {
      confirmedBy: "Dashboard Smoke Owner",
      confirmation: "Dashboard smoke owner reviewed selectedHarness and approved the displayed Alpha/Beta/RC/GA phase plan."
    },
    expectStatus: 200
  });
}

async function check(id, baseUrl, route, options = {}) {
  const started = Date.now();
  const headers = {
    "accept": options.expectText ? "text/html,*/*" : "application/json",
    "x-evopilot-tenant": tenantId,
    "x-evopilot-workspace": workspaceId,
    "x-evopilot-actor": actorId
  };
  if (options.body) headers["content-type"] = "application/json";
  if (options.token) headers.authorization = `Bearer ${options.token}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? timeoutMs);
  try {
    const response = await fetch(`${baseUrl}${route}`, {
      method: options.method ?? "GET",
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal
    });
    const text = await response.text();
    const json = parseJson(text);
    const expectedStatuses = options.expectOneOfStatuses ?? [options.expectStatus];
    const failures = [];
    if (!expectedStatuses.includes(response.status)) failures.push(`status=${response.status}, expected=${expectedStatuses.join("|")}`);
    if (options.expectText && !text.includes(options.expectText)) failures.push(`textMissing=${options.expectText}`);
    const record = {
      id,
      status: failures.length ? "FAIL" : "PASS",
      httpStatus: response.status,
      durationMs: Date.now() - started,
      requestId: response.headers.get("x-request-id") ?? undefined,
      schema: json?.data?.schema,
      nextAction: json?.data?.nextAction,
      blockers: Array.isArray(json?.data?.blockers) ? json.data.blockers.slice(0, 5) : undefined,
      detail: failures.join("; ") || undefined
    };
    checks.push(record);
    return { response, text, json, ...record };
  } catch (error) {
    checks.push({
      id,
      status: "FAIL",
      durationMs: Date.now() - started,
      detail: error instanceof Error ? error.message : String(error)
    });
    return undefined;
  } finally {
    clearTimeout(timeout);
  }
}

function parseJson(text) {
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

function trimSlash(value) {
  return String(value).replace(/\/+$/, "");
}
