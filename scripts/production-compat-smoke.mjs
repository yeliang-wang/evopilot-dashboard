import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const apiBaseUrl = trimSlash(process.env.EVOPILOT_API_BASE_URL ?? process.env.EVOPILOT_SERVER ?? "http://8.153.72.80");
const dashboardBaseUrl = process.env.EVOPILOT_DASHBOARD_BASE_URL ? trimSlash(process.env.EVOPILOT_DASHBOARD_BASE_URL) : "";
const token = process.env.EVOPILOT_API_TOKEN ?? "";
const tenantId = process.env.EVOPILOT_TENANT ?? "tenant-production";
const workspaceId = process.env.EVOPILOT_WORKSPACE ?? "workspace-agent-products";
const reportPath = process.env.EVOPILOT_COMPAT_REPORT
  ?? path.join(os.tmpdir(), `evopilot-dashboard-production-compat-${Date.now()}.json`);

const checks = [];
const startedAt = new Date().toISOString();

await checkHttp("api.health", apiBaseUrl, "/health", { expectStatus: 200, expectField: ["status", "UP"] });
await checkHttp("api.ready", apiBaseUrl, "/ready", { expectStatus: 200, expectField: ["status", "READY"] });
await checkHttp("api.summary.unauthorized", apiBaseUrl, "/api/v1/summary", { expectStatus: 401 });
await checkHttp("api.summary.authenticated", apiBaseUrl, "/api/v1/summary", { token, expectStatus: 200 });

const projects = await checkHttp("api.projects.authenticated", apiBaseUrl, "/api/v1/projects", { token, expectStatus: 200 });
await checkOnboardingPlan("api.onboarding.plan", apiBaseUrl, token);
await checkExistingProjectOnboarding(projects);

if (dashboardBaseUrl) {
  await checkHttp("dashboard.root", dashboardBaseUrl, "/", { expectStatus: 200, expectText: "EvoPilot" });
  await checkHttp("dashboard.proxy.health", dashboardBaseUrl, "/health", { expectStatus: 200, expectField: ["status", "UP"] });
  await checkHttp("dashboard.proxy.ready", dashboardBaseUrl, "/ready", { expectStatus: 200, expectField: ["status", "READY"] });
  await checkHttp("dashboard.proxy.summary.unauthorized", dashboardBaseUrl, "/api/v1/summary", { expectStatus: 401 });
  await checkHttp("dashboard.proxy.summary.authenticated", dashboardBaseUrl, "/api/v1/summary", { token, expectStatus: 200 });
  await checkOnboardingPlan("dashboard.proxy.onboarding.plan", dashboardBaseUrl, token);
}

const finishedAt = new Date().toISOString();
const failed = checks.filter((check) => check.status === "FAIL");
const skipped = checks.filter((check) => check.status === "SKIP");
const report = {
  schema: "evopilot-dashboard-production-compat-smoke/v1",
  startedAt,
  finishedAt,
  apiBaseUrl,
  dashboardBaseUrl: dashboardBaseUrl || undefined,
  tenantId,
  workspaceId,
  result: failed.length === 0 ? "PASS" : "FAIL",
  summary: {
    total: checks.length,
    passed: checks.filter((check) => check.status === "PASS").length,
    failed: failed.length,
    skipped: skipped.length
  },
  checks
};

fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({
  result: report.result,
  summary: report.summary,
  reportPath,
  apiBaseUrl,
  dashboardBaseUrl: dashboardBaseUrl || null
}, null, 2));

if (failed.length > 0) process.exitCode = 1;

async function checkExistingProjectOnboarding(projectsResponse) {
  const projects = Array.isArray(projectsResponse?.json?.data) ? projectsResponse.json.data : [];
  const project = projects.find((item) => item?.id);
  if (!project) {
    checks.push({
      id: "api.onboarding.inspect-existing-project",
      status: "SKIP",
      detail: "No existing project returned by /api/v1/projects."
    });
    return;
  }
  await checkHttp("api.onboarding.inspect-existing-project", apiBaseUrl, `/api/v1/projects/${encodeURIComponent(project.id)}/onboarding-checklist`, {
    token,
    expectOneOfStatuses: [200, 409],
    expectSchema: "evopilot-project-onboarding-checklist/v1"
  });
}

async function checkOnboardingPlan(id, baseUrl, bearerToken) {
  await checkHttp(id, baseUrl, "/api/v1/onboarding/project/checklist", {
    method: "POST",
    token: bearerToken,
    body: {
      id: `dashboard-compat-smoke-${Date.now()}`,
      name: "Dashboard Compatibility Smoke",
      repository: {
        provider: "github",
        gitUrl: "https://github.com/yeliang-wang/evopilot-dashboard.git",
        defaultBranch: "main"
      },
      devops: {
        provider: "github-actions",
        ci: {
          workflow: "ci.yml",
          requiredChecks: ["build"]
        }
      },
      template: "ga",
      objective: "Dashboard compatibility smoke through non-mutating onboarding checklist."
    },
    expectOneOfStatuses: [200, 409],
    expectSchema: "evopilot-project-onboarding-checklist/v1"
  });
}

async function checkHttp(id, baseUrl, route, options = {}) {
  const started = Date.now();
  const headers = {
    "x-evopilot-tenant": tenantId,
    "x-evopilot-workspace": workspaceId,
    ...(options.body ? { "content-type": "application/json" } : {}),
    ...(options.token ? { authorization: `Bearer ${options.token}` } : {})
  };
  if (options.token === "" && id.includes("authenticated")) {
    checks.push({
      id,
      status: "FAIL",
      detail: "EVOPILOT_API_TOKEN is required for authenticated smoke checks."
    });
    return undefined;
  }
  try {
    const response = await fetch(`${baseUrl}${route}`, {
      method: options.method ?? "GET",
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined
    });
    const text = await response.text();
    const json = parseJson(text);
    const expectedStatuses = options.expectOneOfStatuses ?? [options.expectStatus];
    const failures = [];
    if (!expectedStatuses.includes(response.status)) failures.push(`status=${response.status}, expected=${expectedStatuses.join("|")}`);
    if (options.expectSchema && json?.data?.schema !== options.expectSchema) failures.push(`schema=${json?.data?.schema ?? "missing"}`);
    if (options.expectField) {
      const [field, expected] = options.expectField;
      if (json?.[field] !== expected) failures.push(`${field}=${json?.[field] ?? "missing"}`);
    }
    if (options.expectText && !text.includes(options.expectText)) failures.push(`textMissing=${options.expectText}`);
    const record = {
      id,
      status: failures.length ? "FAIL" : "PASS",
      httpStatus: response.status,
      durationMs: Date.now() - started,
      requestId: response.headers.get("x-request-id") ?? undefined,
      schema: json?.data?.schema,
      apiStatus: json?.status ?? json?.data?.status,
      nextAction: json?.data?.nextAction,
      blockers: Array.isArray(json?.data?.blockers) ? json.data.blockers.slice(0, 3) : undefined,
      detail: failures.join("; ") || undefined
    };
    checks.push(record);
    return { response, text, json, record };
  } catch (error) {
    checks.push({
      id,
      status: "FAIL",
      durationMs: Date.now() - started,
      detail: error instanceof Error ? error.message : String(error)
    });
    return undefined;
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
