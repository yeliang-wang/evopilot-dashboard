export interface DashboardRuntimeConfig {
  apiBaseUrl?: string;
}

declare global {
  interface Window {
    EVOPILOT_DASHBOARD_CONFIG?: DashboardRuntimeConfig;
  }
}

export interface DashboardScope {
  tenantId: string;
  workspaceId: string;
  actorId: string;
  token: string;
}

export interface DashboardProjectionContext {
  projectId: string;
  goalId: string;
  loopId: string;
}

export interface DashboardUser {
  username: string;
  role?: string;
  tenantId?: string;
  workspaceId?: string;
  displayName?: string;
  platformAdmin?: boolean;
  mustChangePassword?: boolean;
}

export interface DashboardSession {
  token: string;
  user?: DashboardUser;
  mustChangePassword?: boolean;
}

export interface ApiResult<T = unknown> {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
  requestId?: string;
}

export interface DashboardActionRequest {
  id: string;
  label: string;
  method: "GET" | "POST" | "PATCH" | "DELETE";
  path: string;
  body?: unknown;
}

export interface DashboardActionResult<T = unknown> extends ApiResult<T> {
  actionId: string;
  actionLabel: string;
  method: string;
  path: string;
  schema?: string;
  nextAction?: string;
  blockers?: string[];
}

export interface DashboardSnapshotOptions {
  onResult?: (key: string, result: ApiResult) => void;
}

const DASHBOARD_API_TIMEOUT_MS = 15_000;
const DASHBOARD_USAGE_API_TIMEOUT_MS = 45_000;

export const configuredApiBaseUrl = String(window.EVOPILOT_DASHBOARD_CONFIG?.apiBaseUrl ?? "").replace(/\/+$/, "");
export const controlPlaneBaseUrl = configuredApiBaseUrl || window.location.origin;

export function apiUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${configuredApiBaseUrl}${normalizedPath}`;
}

export async function publicApiFetch<T = unknown>(
  path: string,
  init: RequestInit = {},
  timeoutMs = DASHBOARD_API_TIMEOUT_MS
): Promise<ApiResult<T>> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (init.body) headers.set("Content-Type", "application/json");
  return fetchJson<T>(path, { ...init, headers }, timeoutMs);
}

export async function apiFetch<T = unknown>(
  path: string,
  scope: DashboardScope,
  init: RequestInit = {},
  timeoutMs = DASHBOARD_API_TIMEOUT_MS
): Promise<ApiResult<T>> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  headers.set("Content-Type", "application/json");
  headers.set("X-EvoPilot-Tenant", scope.tenantId);
  headers.set("X-EvoPilot-Workspace", scope.workspaceId);
  headers.set("X-EvoPilot-Actor", scope.actorId);
  if (scope.token) headers.set("Authorization", `Bearer ${scope.token}`);

  return fetchJson<T>(path, { ...init, headers }, timeoutMs);
}

async function fetchJson<T = unknown>(
  path: string,
  init: RequestInit = {},
  timeoutMs = DASHBOARD_API_TIMEOUT_MS
): Promise<ApiResult<T>> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(apiUrl(path), { ...init, signal: controller.signal });
    const requestId = response.headers.get("x-request-id") ?? response.headers.get("x-evopilot-request-id") ?? undefined;
    const text = await response.text();
    const data = text ? safeJson(text) : undefined;

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        data: data as T,
        error: errorMessage(data) ?? response.statusText,
        requestId
      };
    }

    return { ok: true, status: response.status, data: data as T, requestId };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      error: error instanceof DOMException && error.name === "AbortError"
        ? `Request timed out after ${timeoutMs}ms`
        : error instanceof Error ? error.message : String(error)
    };
  } finally {
    window.clearTimeout(timeout);
  }
}

export async function login(username: string, password: string): Promise<ApiResult<DashboardSession>> {
  const response = await publicApiFetch(apiSurface.authLogin, {
    method: "POST",
    body: JSON.stringify({ username, password })
  });
  if (!response.ok) return response as ApiResult<DashboardSession>;
  return { ...response, data: extractSession(response.data) };
}

export async function changePassword(
  scope: DashboardScope,
  currentPassword: string,
  newPassword: string
): Promise<ApiResult<DashboardSession>> {
  const response = await apiFetch(apiSurface.authChangePassword, scope, {
    method: "POST",
    body: JSON.stringify({ currentPassword, newPassword })
  });
  if (!response.ok) return response as ApiResult<DashboardSession>;
  return { ...response, data: extractSession(response.data) };
}

export async function executeDashboardAction<T = unknown>(
  scope: DashboardScope,
  action: DashboardActionRequest
): Promise<DashboardActionResult<T>> {
  const result = await apiFetch<T>(action.path, scope, {
    method: action.method,
    body: action.method === "GET" ? undefined : JSON.stringify(action.body ?? {})
  });
  const metadata = extractResultMetadata(result.data);
  return {
    ...result,
    actionId: action.id,
    actionLabel: action.label,
    method: action.method,
    path: action.path,
    schema: metadata.schema,
    nextAction: metadata.nextAction,
    blockers: metadata.blockers
  };
}

function extractSession(value: unknown): DashboardSession {
  const data = dataEnvelope(value);
  const record = isRecord(data) ? data : {};
  return {
    token: stringField(record.token),
    user: isRecord(record.user) ? {
      username: stringField(record.user.username),
      role: optionalStringField(record.user.role),
      tenantId: optionalStringField(record.user.tenantId),
      workspaceId: optionalStringField(record.user.workspaceId),
      displayName: optionalStringField(record.user.displayName),
      platformAdmin: booleanField(record.user.platformAdmin),
      mustChangePassword: booleanField(record.user.mustChangePassword)
    } : undefined,
    mustChangePassword: booleanField(record.mustChangePassword)
  };
}

function extractResultMetadata(value: unknown): { schema?: string; nextAction?: string; blockers?: string[] } {
  const data = dataEnvelope(value);
  if (!isRecord(data)) return {};
  return {
    schema: optionalStringField(data.schema),
    nextAction: optionalStringField(data.nextAction),
    blockers: arrayOfStrings(data.blockers)
  };
}

function dataEnvelope(value: unknown): unknown {
  if (!isRecord(value)) return value;
  return "data" in value ? value.data : value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function stringField(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function optionalStringField(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function booleanField(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function arrayOfStrings(value: unknown): string[] | undefined {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : undefined;
}

function safeJson(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function errorMessage(value: unknown): string | undefined {
  if (!value || typeof value !== "object") return undefined;
  const record = value as Record<string, unknown>;
  if (typeof record.error === "string") return record.error;
  if (typeof record.message === "string") return record.message;
  if (typeof record.detail === "string") return record.detail;
  return undefined;
}

export const apiSurface = {
  authBootstrap: "/api/v1/auth/bootstrap",
  authLogin: "/api/v1/auth/login",
  authChangePassword: "/api/v1/auth/change-password",
  summary: "/api/v1/summary",
  projects: "/api/v1/projects",
  projectOnboardingChecklist: (projectId: string) => `/api/v1/projects/${encodeURIComponent(projectId)}/onboarding-checklist`,
  onboardingChecklist: "/api/v1/onboarding/project/checklist",
  sourceCredentials: (projectId: string) => `/api/v1/projects/${encodeURIComponent(projectId)}/source-credentials`,
  sourceCredentialPreflight: (projectId: string) => `/api/v1/projects/${encodeURIComponent(projectId)}/source-credentials/preflight`,
  projectDevops: (projectId: string) => `/api/v1/projects/${encodeURIComponent(projectId)}/devops`,
  projectDevopsPreflight: (projectId: string) => `/api/v1/projects/${encodeURIComponent(projectId)}/devops/preflight`,
  projectUsage: (projectId: string) => `/api/v1/projects/${encodeURIComponent(projectId)}/usage`,
  llmProfiles: "/api/v1/llm-profiles",
  llmProfilePreflight: (profileId: string) => `/api/v1/llm-profiles/${encodeURIComponent(profileId)}/preflight`,
  projectLlm: (projectId: string) => `/api/v1/projects/${encodeURIComponent(projectId)}/llm`,
  projectLlmPreflight: (projectId: string) => `/api/v1/projects/${encodeURIComponent(projectId)}/llm/preflight`,
  harnessTemplates: "/api/v1/harness/templates",
  harnessTemplateValidate: "/api/v1/harness/templates/validate",
  harnessTemplateEvolutions: "/api/v1/harness/template-evolutions",
  harnessPolicies: "/api/v1/harness/policies",
  projectHarnessProfiles: (projectId: string) => `/api/v1/projects/${encodeURIComponent(projectId)}/harness-profiles`,
  projectHarnessProfileGenerate: (projectId: string) => `/api/v1/projects/${encodeURIComponent(projectId)}/harness-profiles/generate`,
  projectHarnessProfileValidate: (projectId: string) => `/api/v1/projects/${encodeURIComponent(projectId)}/harness-profiles/validate`,
  projectHarnessProfile: (projectId: string, profileId: string) =>
    `/api/v1/projects/${encodeURIComponent(projectId)}/harness-profiles/${encodeURIComponent(profileId)}`,
  projectHarnessProfileActivate: (projectId: string, profileId: string) =>
    `/api/v1/projects/${encodeURIComponent(projectId)}/harness-profiles/${encodeURIComponent(profileId)}/activate`,
  goals: "/api/v1/goals",
  goal: (goalId: string) => `/api/v1/goals/${encodeURIComponent(goalId)}`,
  goalPlan: (goalId: string) => `/api/v1/goals/${encodeURIComponent(goalId)}/plan`,
  goalPlanApply: (goalId: string) => `/api/v1/goals/${encodeURIComponent(goalId)}/plan/apply`,
  goalApprovePlan: (goalId: string) => `/api/v1/goals/${encodeURIComponent(goalId)}/approve-plan`,
  goalPhases: (goalId: string) => `/api/v1/goals/${encodeURIComponent(goalId)}/phases`,
  goalTargets: (goalId: string) => `/api/v1/goals/${encodeURIComponent(goalId)}/targets`,
  goalPhasePackages: (goalId: string) => `/api/v1/goals/${encodeURIComponent(goalId)}/phase-packages`,
  goalPhasePackage: (goalId: string, phase: string) => `/api/v1/goals/${encodeURIComponent(goalId)}/phase-packages/${encodeURIComponent(phase)}`,
  goalTargetPackages: (goalId: string) => `/api/v1/goals/${encodeURIComponent(goalId)}/target-packages`,
  goalTargetPackage: (goalId: string, targetId: string) => `/api/v1/goals/${encodeURIComponent(goalId)}/target-packages/${encodeURIComponent(targetId)}`,
  goalSnapshot: (goalId: string) => `/api/v1/goals/${encodeURIComponent(goalId)}/snapshot`,
  goalAdvance: (goalId: string) => `/api/v1/goals/${encodeURIComponent(goalId)}/advance`,
  goalRunStatus: (goalId: string) => `/api/v1/goals/${encodeURIComponent(goalId)}/run-status`,
  goalPhasePlan: (goalId: string) => `/api/v1/goals/${encodeURIComponent(goalId)}/phase-plan`,
  goalGraph: (goalId: string) => `/api/v1/goals/${encodeURIComponent(goalId)}/graph`,
  goalTimeline: (goalId: string) => `/api/v1/goals/${encodeURIComponent(goalId)}/timeline`,
  goalEvidenceMatrix: (goalId: string) => `/api/v1/goals/${encodeURIComponent(goalId)}/evidence-matrix`,
  goalFinalReport: (goalId: string) => `/api/v1/goals/${encodeURIComponent(goalId)}/final-report`,
  loops: "/api/v1/loops",
  loopExecutorGraph: (loopId: string) => `/api/v1/loops/${encodeURIComponent(loopId)}/executor-graph`,
  loopStart: (loopId: string) => `/api/v1/loops/${encodeURIComponent(loopId)}/start`,
  loopResume: (loopId: string) => `/api/v1/loops/${encodeURIComponent(loopId)}/resume`,
  loopApprove: (loopId: string) => `/api/v1/loops/${encodeURIComponent(loopId)}/approve`,
  loopTraceTree: (loopId: string) => `/api/v1/loops/${encodeURIComponent(loopId)}/trace-tree`,
  loopEvents: (loopId: string) => `/api/v1/loops/${encodeURIComponent(loopId)}/events`,
  loopSourceClosurePreflight: (loopId: string) => `/api/v1/loops/${encodeURIComponent(loopId)}/source-closure/preflight`,
  releaseDecisions: "/api/v1/release/decisions",
  releaseEvidence: "/api/v1/release/evidence",
  releaseEvidenceItem: (evidenceId: string) => `/api/v1/release/evidence/${encodeURIComponent(evidenceId)}`,
  sourceClosureExecute: (loopId: string) => `/api/v1/loops/${encodeURIComponent(loopId)}/source-closure/execute`,
  sourceClosureReviewDecision: (loopId: string) => `/api/v1/loops/${encodeURIComponent(loopId)}/source-closure/review-decision`,
  harnessTemplateEvolutionAdvance: (evolutionId: string) => `/api/v1/harness/template-evolutions/${encodeURIComponent(evolutionId)}/advance`,
  harnessTemplateEvolutionApprove: (evolutionId: string) => `/api/v1/harness/template-evolutions/${encodeURIComponent(evolutionId)}/approve`,
  harnessTemplateEvolutionPublish: (evolutionId: string) => `/api/v1/harness/template-evolutions/${encodeURIComponent(evolutionId)}/publish`,
  releaseTargets: "/api/v1/release/targets",
  maturityStandards: "/api/v1/maturity/standards",
  audit: "/api/v1/audit",
  history: "/api/v1/history",
  loopStoreReadiness: "/api/v1/loop-store/readiness",
  loopObservability: "/api/v1/loop-observability",
  workerQueue: "/api/v1/loop-workers/queue",
  secrets: "/api/v1/secrets",
  users: "/api/v1/users",
  tenants: "/api/v1/tenants",
  workspaces: "/api/v1/workspaces",
  workspaceUsage: (workspaceId: string) => `/api/v1/workspaces/${encodeURIComponent(workspaceId)}/usage`,
  githubAppInstallations: "/api/v1/github-app/installations"
};

export async function loadDashboardApiSnapshot(
  scope: DashboardScope,
  context: DashboardProjectionContext,
  options: DashboardSnapshotOptions = {}
): Promise<Record<string, ApiResult>> {
  const projectId = context.projectId.trim();
  const goalId = context.goalId.trim();
  const loopId = context.loopId.trim();
  const calls: Array<[string, string]> = [
    ["summary", apiSurface.summary],
    ["projects", apiSurface.projects],
    ["templates", apiSurface.harnessTemplates],
    ["templateEvolutions", apiSurface.harnessTemplateEvolutions],
    ["policies", apiSurface.harnessPolicies],
    ["releaseTargets", apiSurface.releaseTargets],
    ["maturityStandards", apiSurface.maturityStandards],
    ["goals", apiSurface.goals],
    ["releaseDecisions", apiSurface.releaseDecisions],
    ["audit", apiSurface.audit],
    ["llmProfiles", apiSurface.llmProfiles],
    ["tenants", apiSurface.tenants],
    ["workspaces", apiSurface.workspaces],
    ["workspaceUsage", apiSurface.workspaceUsage(scope.workspaceId)],
    ["users", apiSurface.users]
  ];
  if (projectId) {
    calls.push(["profiles", apiSurface.projectHarnessProfiles(projectId)]);
    calls.push(["projectUsage", apiSurface.projectUsage(projectId)]);
    calls.push(["projectLlm", apiSurface.projectLlm(projectId)]);
    calls.push(["projectLlmPreflight", apiSurface.projectLlmPreflight(projectId)]);
  }
  if (goalId) {
    calls.push(["goal", apiSurface.goal(goalId)]);
    calls.push(["goalRunStatus", apiSurface.goalRunStatus(goalId)]);
    calls.push(["goalPhasePlan", apiSurface.goalPhasePlan(goalId)]);
    calls.push(["goalPhases", apiSurface.goalPhases(goalId)]);
    calls.push(["goalTargets", apiSurface.goalTargets(goalId)]);
    calls.push(["goalPhasePackages", apiSurface.goalPhasePackages(goalId)]);
    calls.push(["goalTargetPackages", apiSurface.goalTargetPackages(goalId)]);
    calls.push(["goalSnapshot", apiSurface.goalSnapshot(goalId)]);
    calls.push(["goalEvidenceMatrix", apiSurface.goalEvidenceMatrix(goalId)]);
    calls.push(["goalFinalReport", apiSurface.goalFinalReport(goalId)]);
  }
  if (loopId) calls.push(["loopExecutorGraph", apiSurface.loopExecutorGraph(loopId)]);

  const results = await Promise.allSettled(calls.map(async ([key, path]) => {
    const result = await apiFetch(path, scope, {}, snapshotTimeoutMs(key));
    options.onResult?.(key, result);
    return [key, result] as const;
  }));
  return Object.fromEntries(results.map((result, index) => {
    if (result.status === "fulfilled") return result.value;
    const [key] = calls[index];
    return [key, {
      ok: false,
      status: 0,
      error: result.reason instanceof Error ? result.reason.message : String(result.reason)
    } satisfies ApiResult];
  }));
}

function snapshotTimeoutMs(key: string): number {
  return key.endsWith("Usage") ? DASHBOARD_USAGE_API_TIMEOUT_MS : DASHBOARD_API_TIMEOUT_MS;
}
