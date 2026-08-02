import { useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  FileText,
  LogIn,
  LogOut,
  Play,
  RefreshCw,
  Send,
  ShieldCheck,
  Wrench
} from "lucide-react";
import {
  apiSurface,
  changePassword,
  configuredApiBaseUrl,
  controlPlaneBaseUrl,
  executeDashboardAction,
  loadDashboardApiSnapshot,
  login as loginToEvoPilot,
  publicApiFetch,
  type ApiResult,
  type DashboardActionRequest,
  type DashboardActionResult,
  type DashboardProjectionContext,
  type DashboardScope,
  type DashboardSession
} from "./api";

type ConsoleStep =
  | "intake"
  | "template-match"
  | "drafting"
  | "review"
  | "changes"
  | "activated"
  | "loop"
  | "blocker"
  | "release";

type DrawerKind = "session" | "review" | "diff" | "blocker" | "release" | "api";
type PageId = "console" | "tenants" | "workspaces" | "users" | "templates" | "audit";

type MessageRole = "user" | "agent";

interface ProjectLoopContext extends DashboardProjectionContext {
  projectName: string;
  repositoryProvider: string;
  repositoryUrl: string;
  defaultBranch: string;
  tokenRef: string;
  executionMode: string;
  devopsOwner: string;
  ciWorkflow: string;
  ciRequiredCheck: string;
  llmProfileId: string;
  profileId: string;
  profileVersion: string;
  templateId: string;
  goalLoopTarget: string;
  confirmedBy: string;
  confirmation: string;
}

interface HarnessProfileDraft {
  profileId: string;
  version?: number;
  status?: string;
  sourceContent?: string;
  compiledContent?: string;
  sourceDigest?: string;
  compiledDigest?: string;
  policyRefs: string[];
  templateRef?: string;
  generatedByEvidence: string[];
  validationSummary?: string;
  diffSummary?: string;
  raw?: unknown;
}

interface ChatMessage {
  id: string;
  role: MessageRole;
  title: string;
  text: string;
  time: string;
  card: "intake" | "template" | "drafting" | "review" | "diff" | "activated" | "loop" | "blocker" | "release" | "session" | "api";
}

interface ReviewStep {
  id: string;
  label: string;
  status: "READY" | "REVIEW" | "WAITING" | "BLOCKED" | "DONE";
  detail: string;
  requestId?: string;
  result?: DashboardActionResult;
}

interface TenantForm {
  tenantId: string;
  workspaceId: string;
  adminUser: string;
  role: string;
  platformAdmin: string;
  password: string;
}

interface WorkspaceForm {
  tenantId: string;
  workspaceId: string;
  owner: string;
  projectLimit: string;
  loopLimit: string;
}

interface UserForm {
  username: string;
  tenantId: string;
  workspaceId: string;
  role: string;
  password: string;
  status: string;
}

interface TemplateEvolutionForm {
  baseTemplateId: string;
  targetVersion: string;
  intent: string;
  sourceType: string;
  sourceUri: string;
}

const storage = window.localStorage;
const sessionStorage = window.sessionStorage;
const query = new URLSearchParams(window.location.search);
const demoMode = query.get("demo") === "1";
const demoStep = normalizeDemoStep(query.get("step"));
const demoPage = normalizePage(query.get("page"));

const sampleGoal = "接入 GitHub 项目 github.com/acme/inventory-service，目标是把它提升到 GA-ready 的企业级 Python Web 服务：需要明确能力边界、异常处理、日志、监控、APM、CI/CD、发布门禁和回滚要求。";

const defaultScope: DashboardScope = {
  tenantId: storage.getItem("evopilot.tenantId") ?? "tenant-production",
  workspaceId: storage.getItem("evopilot.workspaceId") ?? "workspace-agent-products",
  actorId: storage.getItem("evopilot.actorId") ?? "workbuddy",
  token: sessionStorage.getItem("evopilot.apiToken") ?? (demoMode ? "demo-token" : "")
};

storage.removeItem("evopilot.apiToken");

const defaultContext: ProjectLoopContext = {
  projectId: storage.getItem("evopilot.projectId") ?? (demoMode ? "inventory-service" : ""),
  projectName: storage.getItem("evopilot.projectName") ?? (demoMode ? "inventory-service" : ""),
  repositoryProvider: storage.getItem("evopilot.repositoryProvider") ?? "github",
  repositoryUrl: storage.getItem("evopilot.repositoryUrl") ?? (demoMode ? "https://github.com/acme/inventory-service.git" : ""),
  defaultBranch: storage.getItem("evopilot.defaultBranch") ?? "main",
  tokenRef: storage.getItem("evopilot.tokenRef") ?? "",
  executionMode: storage.getItem("evopilot.executionMode") ?? "owned-repository",
  devopsOwner: storage.getItem("evopilot.devopsOwner") ?? (demoMode ? "acme" : ""),
  ciWorkflow: storage.getItem("evopilot.ciWorkflow") ?? "ci.yml",
  ciRequiredCheck: storage.getItem("evopilot.ciRequiredCheck") ?? "build",
  llmProfileId: storage.getItem("evopilot.llmProfileId") ?? "",
  profileId: storage.getItem("evopilot.profileId") ?? "default",
  profileVersion: storage.getItem("evopilot.profileVersion") ?? "",
  templateId: storage.getItem("evopilot.templateId") ?? "",
  goalLoopTarget: storage.getItem("evopilot.goalLoopTarget") ?? (demoMode ? sampleGoal : ""),
  goalId: storage.getItem("evopilot.goalId") ?? "",
  loopId: storage.getItem("evopilot.loopId") ?? "",
  confirmedBy: storage.getItem("evopilot.confirmedBy") ?? "",
  confirmation: storage.getItem("evopilot.confirmation") ?? ""
};

const initialStep: ConsoleStep = demoStep ?? (demoMode ? "review" : "intake");

const demoSession: DashboardSession = {
  token: "demo-token",
  user: {
    username: query.get("user") ?? "alice",
    role: query.get("role") ?? "operator",
    tenantId: "tenant-production",
    workspaceId: "workspace-agent-products",
    displayName: "Alice Operator",
    platformAdmin: query.get("admin") === "1"
  }
};

function readStoredSession(): DashboardSession | undefined {
  const raw = sessionStorage.getItem("evopilot.session");
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw) as DashboardSession;
    return parsed.token ? parsed : undefined;
  } catch {
    sessionStorage.removeItem("evopilot.session");
    return undefined;
  }
}

function projectIdFromRepository(repositoryUrl: string): string {
  const clean = repositoryUrl.trim().replace(/\.git$/, "");
  const fallback = clean.split("/").filter(Boolean).pop() ?? "";
  return fallback.replace(/[^a-zA-Z0-9._-]/g, "-").toLowerCase();
}

function normalizeDemoStep(value: string | null): ConsoleStep | undefined {
  const map: Record<string, ConsoleStep> = {
    "1": "intake",
    "2": "template-match",
    "3": "drafting",
    "4": "review",
    "5": "changes",
    "6": "activated",
    "7": "loop",
    "8": "blocker",
    "9": "release"
  };
  return value ? map[value] : undefined;
}

function normalizePage(value: string | null): PageId | undefined {
  const allowed: PageId[] = ["console", "tenants", "workspaces", "users", "templates", "audit"];
  return allowed.find((page) => page === value);
}

function nowTime() {
  return new Intl.DateTimeFormat("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date());
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
}

function dataEnvelope(value: unknown): unknown {
  const record = asRecord(value);
  return record && "data" in record ? record.data : value;
}

function stringField(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function numberField(value: unknown): number | undefined {
  return typeof value === "number" ? value : undefined;
}

function stringList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function readableJson(value: unknown): string {
  if (typeof value === "string") return value;
  if (value === undefined) return "";
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function resultItems(result: ApiResult | undefined, aliases: string[] = []): Record<string, unknown>[] {
  if (!result?.data) return [];
  return collectRecords(dataEnvelope(result.data), aliases);
}

function collectRecords(value: unknown, aliases: string[]): Record<string, unknown>[] {
  if (Array.isArray(value)) return value.filter((item): item is Record<string, unknown> => Boolean(asRecord(item)));
  const record = asRecord(value);
  if (!record) return [];
  for (const key of ["items", "records", "results", "data", ...aliases]) {
    if (key in record) {
      const nested = collectRecords(record[key], aliases.filter((alias) => alias !== key));
      if (nested.length > 0) return nested;
    }
  }
  return Object.keys(record).length > 0 ? [record] : [];
}

function fieldText(record: Record<string, unknown> | undefined, keys: string[], fallback = "-"): string {
  if (!record) return fallback;
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value;
    if (typeof value === "number" || typeof value === "boolean") return String(value);
  }
  return fallback;
}

function roleLabel(session?: DashboardSession): string {
  if (session?.user?.platformAdmin) return "platform admin";
  return session?.user?.role ?? "operator";
}

function isPlatformAdmin(session?: DashboardSession): boolean {
  return Boolean(session?.user?.platformAdmin || session?.user?.role === "platform-admin" || session?.user?.role === "admin");
}

function extractHarnessDraft(value: unknown): HarnessProfileDraft | undefined {
  const data = asRecord(dataEnvelope(value));
  if (!data) return undefined;
  const profile = asRecord(data.profile) ?? data;
  const summary = asRecord(data.summary);
  const generatedBy = asRecord(profile.generatedBy) ?? asRecord(data.generatedBy);
  const validation = profile.validation ?? data.validation;
  const diffFromActive = profile.diffFromActive ?? data.diffFromActive;
  const templateRef = profile.templateRef ?? data.templateRef;

  const evidenceValues = [
    ...stringList(generatedBy?.evidence),
    ...stringList(asRecord(generatedBy)?.selectionReasons)
  ];

  return {
    profileId: stringField(profile.profileId) ?? stringField(profile.id) ?? stringField(summary?.profileId) ?? "default",
    version: numberField(profile.version) ?? numberField(summary?.latestVersion),
    status: stringField(profile.status) ?? stringField(data.status) ?? "DRAFT",
    sourceContent: stringField(profile.sourceContent) ?? stringField(data.sourceContent),
    compiledContent: stringField(profile.compiledContent) ?? stringField(data.compiledContent),
    sourceDigest: stringField(profile.sourceDigest) ?? stringField(data.sourceDigest),
    compiledDigest: stringField(profile.compiledDigest) ?? stringField(data.compiledDigest),
    policyRefs: stringList(profile.policyRefs ?? data.policyRefs),
    templateRef: typeof templateRef === "string" ? templateRef : readableJson(templateRef || undefined),
    generatedByEvidence: evidenceValues,
    validationSummary: readableJson(validation || undefined),
    diffSummary: readableJson(diffFromActive || undefined),
    raw: value
  };
}

function extractGoalId(value: unknown): string | undefined {
  const data = asRecord(dataEnvelope(value));
  return stringField(data?.id) ?? stringField(data?.goalId);
}

function buildOnboardingAction(context: ProjectLoopContext): DashboardActionRequest {
  const projectId = context.projectId || projectIdFromRepository(context.repositoryUrl);
  return {
    id: "project-preflight",
    label: "Project Onboarding Checklist",
    method: "POST",
    path: apiSurface.onboardingChecklist,
    body: {
      id: projectId,
      name: context.projectName || projectId,
      repository: {
        provider: context.repositoryProvider,
        gitUrl: context.repositoryUrl,
        defaultBranch: context.defaultBranch
      },
      tokenRef: context.tokenRef || undefined,
      devops: {
        executionMode: context.executionMode,
        devopsOwner: context.devopsOwner || undefined,
        workflowRepository: context.repositoryUrl || undefined,
        ciWorkflow: context.ciWorkflow || undefined,
        requiredChecks: context.ciRequiredCheck ? [context.ciRequiredCheck] : undefined
      },
      llmProfileId: context.llmProfileId || undefined,
      objective: context.goalLoopTarget
    }
  };
}

function defaultDraft(context: ProjectLoopContext): HarnessProfileDraft {
  const projectId = context.projectId || projectIdFromRepository(context.repositoryUrl) || "inventory-service";
  return {
    profileId: "default",
    version: 1,
    status: "DRAFT",
    sourceContent: [
      "projectHarnessProfile:",
      "  id: profile_draft_41c8",
      "  status: DRAFT",
      "  inherits:",
      "    - enterprise-common-harness@1.1.0",
      "    - python-web-service-harness@1.2.0",
      "  scope:",
      "    include: [inventory domain, FastAPI HTTP API, persistence]",
      "    exclude: [billing ownership, external ERP source of truth]",
      "  controls:",
      "    domainRules: [idempotency, audit trail, transaction boundaries]",
      "    exceptionHandling:",
      "      required: [FastAPI handlers, ASGI middleware, domain exception mapper]",
      "      validation: release-blocking HTTP error contract tests",
      "    logging:",
      "      requiredFields: [requestId, correlationId, phaseId, module, action, cause]",
      "      triage: ERROR logs must link to evidence.requestId",
      "    observability:",
      "      required: [RED metrics, trace spans, APM map, alert policy]",
      "    releaseGates:",
      "      required: [preflight, canary evidence, rollback evidence, human approval]"
    ].join("\n"),
    compiledContent: "",
    sourceDigest: "sha256:7aa1c8...e912",
    compiledDigest: "sha256:41c8...compiled",
    policyRefs: [],
    templateRef: "python-web-service-harness@1.2.0",
    generatedByEvidence: ["templateSelection=auto-match", `project=${projectId}`],
    validationSummary: "32 checks; release-blocking validation required for logs, exception mapping, observability, and release gates.",
    diffSummary: "No active profile in demo baseline.",
    raw: undefined
  };
}

function initialMessages(step: ConsoleStep): ChatMessage[] {
  const messages: ChatMessage[] = [
    {
      id: "goal",
      role: "user",
      title: "Project owner",
      text: demoMode ? sampleGoal : "Describe the repository and goal loop target to start.",
      time: "09:30",
      card: "intake"
    }
  ];

  if (["template-match", "drafting", "review", "changes", "activated", "loop", "blocker", "release"].includes(step)) {
    messages.push({
      id: "template",
      role: "agent",
      title: "EvoPilot",
      text: "项目上下文已解析。EvoPilot 自动匹配更贴合的企业级 Web Service HarnessTemplate，不要求普通用户手动选择模板。",
      time: "09:31",
      card: "template"
    });
  }

  if (["drafting", "review", "changes", "activated", "loop", "blocker", "release"].includes(step)) {
    messages.push({
      id: "drafting",
      role: "agent",
      title: "EvoPilot",
      text: "正在把公共模板能力映射到该仓库的模块、证据和验收规则。",
      time: "09:32",
      card: "drafting"
    });
  }

  if (["review", "changes", "activated", "loop", "blocker", "release"].includes(step)) {
    messages.push({
      id: "review",
      role: "agent",
      title: "EvoPilot",
      text: "Review Pack 已生成。请检查能力边界、规则、异常处理、日志与监控要求。确认后我会激活该 ProjectHarnessProfile 并进入 loop planning。",
      time: "09:34",
      card: "review"
    });
  }

  if (["changes", "activated", "loop", "blocker", "release"].includes(step)) {
    messages.push({
      id: "change",
      role: "user",
      title: "Project owner",
      text: "请把日志要求提高：异常场景必须能通过 requestId / correlationId / phaseId 定位到模块、操作和失败原因。",
      time: "09:35",
      card: "diff"
    });
    messages.push({
      id: "diff",
      role: "agent",
      title: "EvoPilot",
      text: "已应用修改并生成新草案。核心变化集中在 logging、failure triage 和 evidence contract。",
      time: "09:36",
      card: "diff"
    });
  }

  if (["activated", "loop", "blocker", "release"].includes(step)) {
    messages.push({
      id: "activated",
      role: "agent",
      title: "EvoPilot",
      text: "ProjectHarnessProfile 已激活。后续目标拆解、执行、证据采集和发布门禁都会绑定这个 active profile。",
      time: "09:38",
      card: "activated"
    });
  }

  if (["loop", "blocker", "release"].includes(step)) {
    messages.push({
      id: "loop",
      role: "agent",
      title: "EvoPilot",
      text: "Loop 已开始执行。当前正在补齐异常处理与可观测性控制点，所有操作都会产生 evidence package。",
      time: "09:42",
      card: "loop"
    });
  }

  if (["blocker", "release"].includes(step)) {
    messages.push({
      id: "blocker",
      role: "agent",
      title: "EvoPilot",
      text: "检测到 blocker：异常映射测试未覆盖 domain exception 到 HTTP response 的统一转换。已定位失败模块并生成修复建议。",
      time: "09:48",
      card: "blocker"
    });
  }

  if (step === "release") {
    messages.push({
      id: "release",
      role: "agent",
      title: "EvoPilot",
      text: "GA Release Decision 已准备好。当前证据满足 active ProjectHarnessProfile 的能力边界、规则、日志、监控、异常处理和发布门禁要求。",
      time: "10:06",
      card: "release"
    });
  }

  return messages;
}

function focusMessages(step: ConsoleStep, messages: ChatMessage[]): ChatMessage[] {
  const preferredCardByStep: Record<ConsoleStep, ChatMessage["card"][]> = {
    intake: ["intake", "session"],
    "template-match": ["template", "api"],
    drafting: ["drafting", "template", "api"],
    review: ["review"],
    changes: ["diff", "review"],
    activated: ["activated"],
    loop: ["loop"],
    blocker: ["blocker", "api"],
    release: ["release"]
  };
  const selected = messages.filter((message) => preferredCardByStep[step].includes(message.card));
  if (selected.length > 0) return selected.slice(step === "changes" ? -2 : -1);
  return messages.slice(-1);
}

export default function App() {
  const [scope, setScope] = useState<DashboardScope>(defaultScope);
  const [context, setContext] = useState<ProjectLoopContext>(defaultContext);
  const [session, setSession] = useState<DashboardSession | undefined>(() => readStoredSession());
  const [loginForm, setLoginForm] = useState({ username: "tenant-admin", password: "" });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "" });
  const [authNotice, setAuthNotice] = useState(defaultScope.token ? "Session restored" : "Sign in to operate protected EvoPilot APIs");
  const [authLoading, setAuthLoading] = useState(false);
  const [apiSnapshot, setApiSnapshot] = useState<Record<string, ApiResult>>({});
  const [apiNotice, setApiNotice] = useState(defaultScope.token ? "Loading EvoPilot projections" : "Sign in to load live EvoPilot projections");
  const [apiLoading, setApiLoading] = useState(false);
  const [consoleStep, setConsoleStep] = useState<ConsoleStep>(initialStep);
  const [drawer, setDrawer] = useState<DrawerKind | undefined>(
    ["review", "changes", "blocker", "release"].includes(initialStep)
      ? initialStep === "changes"
        ? "diff"
        : initialStep === "blocker"
          ? "blocker"
          : initialStep === "release"
            ? "release"
            : "review"
      : undefined
  );
  const [messages, setMessages] = useState<ChatMessage[]>(() => initialMessages(initialStep));
  const [profileDraft, setProfileDraft] = useState<HarnessProfileDraft | undefined>(() => demoMode ? defaultDraft(defaultContext) : undefined);
  const [reviewSteps, setReviewSteps] = useState<ReviewStep[]>([]);
  const [lastAction, setLastAction] = useState<DashboardActionResult | undefined>();
  const [busyAction, setBusyAction] = useState<string | undefined>();
  const [ownerChange, setOwnerChange] = useState("");
  const [composerGoal, setComposerGoal] = useState(defaultContext.goalLoopTarget);
  const [activePage, setActivePage] = useState<PageId>(demoPage ?? "console");
  const [tenantForm, setTenantForm] = useState<TenantForm>({
    tenantId: "tenant-payments",
    workspaceId: "workspace-payment-agents",
    adminUser: "payments-admin",
    role: "admin",
    platformAdmin: "false",
    password: ""
  });
  const [workspaceForm, setWorkspaceForm] = useState<WorkspaceForm>({
    tenantId: defaultScope.tenantId,
    workspaceId: "workspace-customer-success",
    owner: "tenant-admin",
    projectLimit: "20",
    loopLimit: "100"
  });
  const [userForm, setUserForm] = useState<UserForm>({
    username: "project-owner",
    tenantId: defaultScope.tenantId,
    workspaceId: defaultScope.workspaceId,
    role: "operator",
    password: "",
    status: "ACTIVE"
  });
  const [templateForm, setTemplateForm] = useState<TemplateEvolutionForm>({
    baseTemplateId: "python-enterprise-harness",
    targetVersion: "1.2.0",
    intent: "Upgrade observability, exception triage, release evidence, and AI-agent runbook coverage.",
    sourceType: "admin-note",
    sourceUri: "Administrator lifecycle note"
  });

  const liveProjectionSummary = useMemo(() => {
    const entries = Object.entries(apiSnapshot);
    return {
      total: entries.length,
      ok: entries.filter(([, result]) => result.ok).length,
      failed: entries.filter(([, result]) => !result.ok)
    };
  }, [apiSnapshot]);

  const stages = useMemo(() => stageState(consoleStep), [consoleStep]);
  const activeDraft = profileDraft ?? defaultDraft(context);
  const focusedMessages = useMemo(() => focusMessages(consoleStep, messages), [consoleStep, messages]);
  const effectiveSession = session ?? (demoMode ? demoSession : undefined);
  const canEditScope = isPlatformAdmin(effectiveSession);
  const signedIn = Boolean(effectiveSession?.token || scope.token);

  useEffect(() => {
    if (demoMode) return;
    void refreshBootstrap();
    if (defaultScope.token) void refreshApiSnapshot(defaultScope, defaultContext);
  }, []);

  function appendMessage(message: Omit<ChatMessage, "id" | "time"> & { time?: string }) {
    setMessages((current) => [
      ...current,
      {
        ...message,
        id: `${message.role}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        time: message.time ?? nowTime()
      }
    ]);
  }

  function updateScope(nextScope: DashboardScope) {
    setScope(nextScope);
    storage.setItem("evopilot.tenantId", nextScope.tenantId);
    storage.setItem("evopilot.workspaceId", nextScope.workspaceId);
    storage.setItem("evopilot.actorId", nextScope.actorId);
    if (nextScope.token) sessionStorage.setItem("evopilot.apiToken", nextScope.token);
    else sessionStorage.removeItem("evopilot.apiToken");
  }

  function updateContext(nextContext: ProjectLoopContext) {
    setContext(nextContext);
    for (const [key, value] of Object.entries(nextContext)) {
      storage.setItem(`evopilot.${key}`, String(value ?? ""));
    }
  }

  function patchContext(patch: Partial<ProjectLoopContext>) {
    const inferredProjectId = patch.repositoryUrl && !context.projectId
      ? projectIdFromRepository(patch.repositoryUrl)
      : context.projectId;
    const nextContext = { ...context, projectId: inferredProjectId, ...patch };
    updateContext(nextContext);
    if (patch.goalLoopTarget !== undefined) setComposerGoal(patch.goalLoopTarget);
  }

  async function refreshBootstrap() {
    const bootstrap = await publicApiFetch(apiSurface.authBootstrap);
    setAuthNotice(bootstrap.ok ? "Auth API reachable" : "Auth API unavailable or blocked");
  }

  async function refreshApiSnapshot(scopeOverride = scope, contextOverride = context) {
    setApiLoading(true);
    if (!scopeOverride.token) {
      setApiSnapshot({});
      setApiNotice("Sign in to load live EvoPilot projections");
      setApiLoading(false);
      return;
    }
    const snapshot = await loadDashboardApiSnapshot(scopeOverride, contextOverride);
    setApiSnapshot(snapshot);
    const failures = Object.entries(snapshot).filter(([, result]) => !result.ok);
    const successes = Object.entries(snapshot).filter(([, result]) => result.ok);
    if (failures.length === 0) setApiNotice("Live EvoPilot API connected");
    else if (successes.length > 0) setApiNotice("Live API connected; selected project, goal, or loop may need attention");
    else setApiNotice("API reachable, authentication or RBAC required");
    setApiLoading(false);
  }

  function applySession(nextSession: DashboardSession) {
    setSession(nextSession);
    sessionStorage.setItem("evopilot.session", JSON.stringify(nextSession));
    const nextScope = {
      tenantId: nextSession.user?.tenantId ?? scope.tenantId,
      workspaceId: nextSession.user?.workspaceId ?? scope.workspaceId,
      actorId: nextSession.user?.username ?? scope.actorId,
      token: nextSession.token
    };
    updateScope(nextScope);
    void refreshApiSnapshot(nextScope, context);
    setAuthNotice(nextSession.user?.mustChangePassword || nextSession.mustChangePassword
      ? "Signed in. Password change required."
      : "Signed in with EvoPilot session token.");
  }

  async function performLogin() {
    setAuthLoading(true);
    const result = await loginToEvoPilot(loginForm.username, loginForm.password);
    if (result.ok && result.data?.token) applySession(result.data);
    else setAuthNotice(`Login failed: ${result.error ?? result.status}`);
    setAuthLoading(false);
  }

  async function performChangePassword() {
    setAuthLoading(true);
    const result = await changePassword(scope, passwordForm.currentPassword, passwordForm.newPassword);
    if (result.ok && result.data?.token) {
      setPasswordForm({ currentPassword: "", newPassword: "" });
      applySession(result.data);
    } else {
      setAuthNotice(`Password change failed: ${result.error ?? result.status}`);
    }
    setAuthLoading(false);
  }

  function signOut() {
    setSession(undefined);
    sessionStorage.removeItem("evopilot.session");
    updateScope({ ...scope, token: "" });
    setApiSnapshot({});
    setApiNotice("Sign in to load live EvoPilot projections");
    setAuthNotice("Signed out");
  }

  async function runAction(action: DashboardActionRequest): Promise<DashboardActionResult> {
    setBusyAction(action.id);
    const result = await executeDashboardAction(scope, action);
    setLastAction(result);
    if (result.ok) await refreshApiSnapshot(scope, context);
    setBusyAction(undefined);
    return result;
  }

  async function startIntake() {
    const nextContext = {
      ...context,
      goalLoopTarget: composerGoal,
      projectId: context.projectId || projectIdFromRepository(context.repositoryUrl),
      projectName: context.projectName || context.projectId || projectIdFromRepository(context.repositoryUrl)
    };
    updateContext(nextContext);

    appendMessage({
      role: "user",
      title: "Project owner",
      text: composerGoal || "Start project onboarding and harness review.",
      card: "intake"
    });

    if (!scope.token) {
      setConsoleStep("intake");
      setDrawer("session");
      appendMessage({
        role: "agent",
        title: "EvoPilot",
        text: "需要先登录 EvoPilot Dashboard。登录后才能调用受保护的 onboarding、harness 和 goal APIs。",
        card: "session"
      });
      return;
    }

    setConsoleStep("template-match");
    const checklist = await runAction(buildOnboardingAction(nextContext));
    setReviewSteps([{
      id: "project-preflight",
      label: "Project Onboarding Checklist",
      status: checklist.ok ? "READY" : "BLOCKED",
      detail: checklist.nextAction ?? checklist.error ?? "Project context and onboarding checklist resolved.",
      requestId: checklist.requestId,
      result: checklist
    }]);

    appendMessage({
      role: "agent",
      title: "EvoPilot",
      text: checklist.ok
        ? "项目上下文已解析。EvoPilot 将基于项目上下文和 goal loop target 自动匹配 HarnessTemplate。"
        : `项目接入检查被阻塞：${checklist.nextAction ?? checklist.error ?? checklist.status}`,
      card: checklist.ok ? "template" : "api"
    });

    if (!checklist.ok) {
      setDrawer("api");
      return;
    }

    await generateHarnessDraft(nextContext);
  }

  async function generateHarnessDraft(baseContext = context, changeText?: string) {
    if (!scope.token) {
      setDrawer("session");
      return;
    }
    const projectId = baseContext.projectId || projectIdFromRepository(baseContext.repositoryUrl);
    if (!projectId) return;
    setConsoleStep("drafting");
    appendMessage({
      role: "agent",
      title: "EvoPilot",
      text: "正在生成 ProjectHarnessProfile。当前草案会继承公共模板和租户策略，并补齐项目级实现映射。",
      card: "drafting"
    });

    const generated = await runAction({
      id: "generate-harness-profile",
      label: "Generate ProjectHarnessProfile Draft",
      method: "POST",
      path: apiSurface.projectHarnessProfileGenerate(projectId),
      body: {
        profileId: baseContext.profileId || "default",
        templateId: baseContext.templateId || undefined,
        goalLoopTarget: changeText ? `${baseContext.goalLoopTarget}\n\nOwner requested change:\n${changeText}` : baseContext.goalLoopTarget,
        llmProfileId: baseContext.llmProfileId || undefined
      }
    });

    const draft = extractHarnessDraft(generated.data);
    setReviewSteps((current) => [
      ...current,
      {
        id: "generate-harness-profile",
        label: "ProjectHarnessProfile Draft",
        status: generated.ok ? "REVIEW" : "BLOCKED",
        detail: generated.ok
          ? "DRAFT generated. Show sourceContent, compiledContent, validation, diff, digests, policyRefs, and generatedBy before activation."
          : generated.error ?? "Could not generate harness profile.",
        requestId: generated.requestId,
        result: generated
      }
    ]);

    if (!generated.ok || !draft) {
      setDrawer("api");
      appendMessage({
        role: "agent",
        title: "EvoPilot",
        text: `ProjectHarnessProfile 生成失败：${generated.nextAction ?? generated.error ?? generated.status}`,
        card: "api"
      });
      return;
    }

    setProfileDraft(draft);
    updateContext({
      ...baseContext,
      projectId,
      profileId: draft.profileId,
      profileVersion: draft.version ? String(draft.version) : baseContext.profileVersion
    });
    setConsoleStep(changeText ? "changes" : "review");
    setDrawer(changeText ? "diff" : "review");
    appendMessage({
      role: "agent",
      title: "EvoPilot",
      text: changeText
        ? "已根据用户修改请求生成新的 ProjectHarnessProfile DRAFT。请检查差异后再确认。"
        : "Review Pack 已生成。请检查 ProjectHarnessProfile.yaml，确认前不会激活。",
      card: changeText ? "diff" : "review"
    });
  }

  async function requestProfileChanges() {
    if (!ownerChange.trim()) return;
    appendMessage({
      role: "user",
      title: "Project owner",
      text: ownerChange.trim(),
      card: "diff"
    });
    if (!scope.token) {
      setConsoleStep("changes");
      setDrawer("diff");
      return;
    }
    await generateHarnessDraft(context, ownerChange.trim());
    setOwnerChange("");
  }

  async function confirmAndActivateHarness() {
    if (!scope.token) {
      setDrawer("session");
      return;
    }
    const projectId = context.projectId || projectIdFromRepository(context.repositoryUrl);
    const profileId = profileDraft?.profileId || context.profileId || "default";
    const version = Number(profileDraft?.version ?? context.profileVersion);
    if (!projectId || !profileId) return;

    const activated = await runAction({
      id: "activate-harness-profile",
      label: "Activate Reviewed ProjectHarnessProfile",
      method: "POST",
      path: apiSurface.projectHarnessProfileActivate(projectId, profileId),
      body: { version: Number.isFinite(version) && version > 0 ? version : undefined }
    });

    setReviewSteps((current) => [
      ...current,
      {
        id: "activate-harness-profile",
        label: "Harness Activation",
        status: activated.ok ? "DONE" : "BLOCKED",
        detail: activated.ok ? "Reviewed ProjectHarnessProfile activated." : activated.error ?? "Activation failed.",
        requestId: activated.requestId,
        result: activated
      }
    ]);

    if (!activated.ok) {
      setDrawer("api");
      return;
    }

    setConsoleStep("activated");
    setDrawer(undefined);
    appendMessage({
      role: "agent",
      title: "EvoPilot",
      text: "ProjectHarnessProfile 已激活。下一步会创建或读取 goal，并生成绑定 active harness 的 phase plan。",
      card: "activated"
    });

    await createGoalAndPlan(projectId);
  }

  async function createGoalAndPlan(projectId: string) {
    let goalId = context.goalId;
    if (!goalId) {
      const created = await runAction({
        id: "create-goal",
        label: "Create GlobalGoal",
        method: "POST",
        path: apiSurface.goals,
        body: {
          projectId,
          releaseTargetId: "ga",
          objective: context.goalLoopTarget,
          llmProfileId: context.llmProfileId || undefined
        }
      });
      goalId = extractGoalId(created.data) ?? "";
      setReviewSteps((current) => [
        ...current,
        {
          id: "create-goal",
          label: "GlobalGoal",
          status: created.ok ? "READY" : "BLOCKED",
          detail: created.ok ? "GlobalGoal created from goal loop target." : created.error ?? "Goal create failed.",
          requestId: created.requestId,
          result: created
        }
      ]);
      if (!created.ok || !goalId) {
        setDrawer("api");
        return;
      }
      patchContext({ goalId });
    }

    const plan = await runAction({
      id: "plan-goal",
      label: "Generate Goal Phase Plan",
      method: "POST",
      path: apiSurface.goalPlan(goalId),
      body: {}
    });
    setReviewSteps((current) => [
      ...current,
      {
        id: "plan-goal",
        label: "Phase Plan",
        status: plan.ok ? "REVIEW" : "BLOCKED",
        detail: plan.ok
          ? "Alpha/Beta/RC/GA phase plan generated. Show projectHarness binding before approval."
          : plan.error ?? "Goal plan failed.",
        requestId: plan.requestId,
        result: plan
      }
    ]);
  }

  async function approvePlanAndAdvance() {
    if (!scope.token || !context.goalId) {
      setDrawer(scope.token ? "api" : "session");
      return;
    }
    if (!context.confirmedBy.trim() || !context.confirmation.trim()) {
      appendMessage({
        role: "agent",
        title: "EvoPilot",
        text: "Phase plan approval requires real confirmedBy and confirmation. Dashboard will not invent either value.",
        card: "api"
      });
      return;
    }

    const approved = await runAction({
      id: "approve-goal-plan",
      label: "Approve Reviewed Phase Plan",
      method: "POST",
      path: apiSurface.goalApprovePlan(context.goalId),
      body: {
        confirmedBy: context.confirmedBy,
        confirmation: context.confirmation
      }
    });

    setReviewSteps((current) => [
      ...current,
      {
        id: "approve-goal-plan",
        label: "Phase Plan Approval",
        status: approved.ok ? "DONE" : "BLOCKED",
        detail: approved.ok ? "Phase plan approved with explicit confirmation." : approved.error ?? "Approval failed.",
        requestId: approved.requestId,
        result: approved
      }
    ]);

    if (!approved.ok) {
      setDrawer("api");
      return;
    }

    const advanced = await runAction({
      id: "advance-goal",
      label: "Start Or Advance Loop",
      method: "POST",
      path: apiSurface.goalAdvance(context.goalId),
      body: {}
    });
    const blocked = !advanced.ok || Boolean(advanced.nextAction) || Boolean(advanced.blockers?.length);
    setConsoleStep(blocked ? "blocker" : "loop");
    setDrawer(blocked ? "blocker" : undefined);
    appendMessage({
      role: "agent",
      title: "EvoPilot",
      text: blocked
        ? `Loop stopped at a governed boundary: ${advanced.nextAction ?? advanced.blockers?.join(", ") ?? advanced.error ?? advanced.status}`
        : "Loop 已开始执行。Dashboard 会继续读取 run-status、evidence matrix 和 release decision。",
      card: blocked ? "blocker" : "loop"
    });
  }

  async function refreshReleaseEvidence() {
    await refreshApiSnapshot(scope, context);
    setConsoleStep("release");
    setDrawer("release");
    appendMessage({
      role: "agent",
      title: "EvoPilot",
      text: "Release Decision 视图已刷新。最终 GO/NO-GO 以 EvoPilot evidence package 和 release decision 为准。",
      card: "release"
    });
  }

  async function runManagementAction(action: DashboardActionRequest) {
    if (!scope.token) {
      setDrawer("session");
      setActivePage("console");
      return;
    }
    const result = await runAction(action);
    setDrawer("api");
    if (!result.ok) setActivePage("console");
  }

  if (!demoMode && !session?.token) {
    return (
      <AuthScreen
        authNotice={authNotice}
        authLoading={authLoading}
        loginForm={loginForm}
        onLoginForm={setLoginForm}
        onLogin={() => void performLogin()}
      />
    );
  }

  if (!demoMode && (session?.mustChangePassword || session?.user?.mustChangePassword)) {
    return (
      <PasswordChangeScreen
        session={session}
        authNotice={authNotice}
        authLoading={authLoading}
        passwordForm={passwordForm}
        onPasswordForm={setPasswordForm}
        onChangePassword={() => void performChangePassword()}
        onSignOut={signOut}
      />
    );
  }

  return (
    <div className="app-shell">
      <Sidebar
        activePage={activePage}
        onNavigate={setActivePage}
      />
      <section className={`console-shell ${activePage === "console" ? "" : "management-mode"}`}>
        <Topbar
          activePage={activePage}
          consoleStep={consoleStep}
          scope={scope}
          session={effectiveSession}
          apiOk={liveProjectionSummary.ok}
          apiFailed={liveProjectionSummary.failed.length}
          onOpenSession={() => setDrawer("session")}
          onRefresh={() => void refreshApiSnapshot()}
          refreshing={apiLoading}
        />
        {activePage === "console" ? (
          <>
            <StageBar stages={stages} />
            <main className={`workspace ${drawer ? "" : "drawer-closed"}`}>
              <section className="conversation" aria-label="EvoPilot Agent Console conversation">
                <div className="thread">
                  {focusedMessages.map((message) => (
                    <ChatBubble
                      key={message.id}
                      message={message}
                      context={context}
                      profileDraft={activeDraft}
                      reviewSteps={reviewSteps}
                      lastAction={lastAction}
                    />
                  ))}
                </div>
                <Composer
                  consoleStep={consoleStep}
                  context={context}
                  goal={composerGoal}
                  ownerChange={ownerChange}
                  busyAction={busyAction}
                  onPatchContext={patchContext}
                  onGoalChange={(goal) => {
                    setComposerGoal(goal);
                    patchContext({ goalLoopTarget: goal });
                  }}
                  onOwnerChange={setOwnerChange}
                  onStart={() => void startIntake()}
                  onRequestChanges={() => void requestProfileChanges()}
                  onConfirm={() => void confirmAndActivateHarness()}
                  onApproveAndAdvance={() => void approvePlanAndAdvance()}
                  onViewEvidence={() => setDrawer(drawer ? undefined : "review")}
                  onViewRelease={() => void refreshReleaseEvidence()}
                />
              </section>
              {drawer && (
                <EvidenceDrawer
                  kind={drawer}
                  scope={scope}
                  context={context}
                  session={effectiveSession}
                  canEditScope={canEditScope}
                  signedIn={signedIn}
                  authNotice={authNotice}
                  authLoading={authLoading}
                  loginForm={loginForm}
                  passwordForm={passwordForm}
                  apiNotice={apiNotice}
                  apiLoading={apiLoading}
                  snapshot={apiSnapshot}
                  profileDraft={activeDraft}
                  lastAction={lastAction}
                  onLoginForm={setLoginForm}
                  onPasswordForm={setPasswordForm}
                  onLogin={() => void performLogin()}
                  onChangePassword={() => void performChangePassword()}
                  onSignOut={signOut}
                  onScopeChange={updateScope}
                  onPatchContext={patchContext}
                  onRefresh={() => void refreshApiSnapshot()}
                />
              )}
            </main>
          </>
        ) : (
          <ManagementPage
            page={activePage}
            scope={scope}
            session={effectiveSession}
            snapshot={apiSnapshot}
            lastAction={lastAction}
            busyAction={busyAction}
            tenantForm={tenantForm}
            workspaceForm={workspaceForm}
            userForm={userForm}
            templateForm={templateForm}
            onTenantForm={setTenantForm}
            onWorkspaceForm={setWorkspaceForm}
            onUserForm={setUserForm}
            onTemplateForm={setTemplateForm}
            onRunAction={(action) => void runManagementAction(action)}
            onRefresh={() => void refreshApiSnapshot()}
          />
        )}
      </section>
    </div>
  );
}

function stageState(step: ConsoleStep) {
  const state = [
    { label: "Project Intake", status: "not started", kind: "" },
    { label: "Harness Draft", status: "not started", kind: "" },
    { label: "Owner Review", status: "not started", kind: "" },
    { label: "Loop Execution", status: "not started", kind: "" },
    { label: "Release Decision", status: "not started", kind: "" }
  ];
  const done = (index: number) => {
    state[index] = { ...state[index], status: "done", kind: "done" };
  };
  const current = (index: number, status: string, kind = "current") => {
    state[index] = { ...state[index], status, kind };
  };

  if (step === "intake") current(0, "editing goal");
  if (step === "template-match") {
    done(0);
    current(1, "matching template");
  }
  if (step === "drafting") {
    done(0);
    current(1, "drafting profile");
  }
  if (step === "review") {
    done(0);
    done(1);
    current(2, "needs owner review");
  }
  if (step === "changes") {
    done(0);
    done(1);
    current(2, "changes applied");
  }
  if (step === "activated") {
    done(0);
    done(1);
    done(2);
    current(3, "planning");
  }
  if (step === "loop") {
    done(0);
    done(1);
    done(2);
    current(3, "running");
  }
  if (step === "blocker") {
    done(0);
    done(1);
    done(2);
    current(3, "blocked repair", "warn");
  }
  if (step === "release") {
    done(0);
    done(1);
    done(2);
    done(3);
    current(4, "GO review");
  }
  return state;
}

function AuthScreen({
  authNotice,
  authLoading,
  loginForm,
  onLoginForm,
  onLogin
}: {
  authNotice: string;
  authLoading: boolean;
  loginForm: { username: string; password: string };
  onLoginForm: (form: { username: string; password: string }) => void;
  onLogin: () => void;
}) {
  return (
    <main className="auth-screen" aria-label="EvoPilot Dashboard sign in">
      <section className="auth-brand">
        <div className="brand-row">
          <span className="brand-mark-small">E</span>
          <strong>EvoPilot</strong>
        </div>
        <div>
          <h1>Control plane access starts here.</h1>
          <p>登录后，Dashboard 会用 EvoPilot 返回的用户身份锁定 tenant、workspace、actor scope，再进入 Agent Console。</p>
        </div>
        <div className="brand-evidence">
          <div><strong>Auth</strong><span>Bearer session token stored in sessionStorage only.</span></div>
          <div><strong>Scope</strong><span>Tenant and workspace come from the signed-in user.</span></div>
          <div><strong>RBAC</strong><span>普通用户只看核心链路，管理员才看平台页面。</span></div>
          <div><strong>Audit</strong><span>Every protected action reports requestId and nextAction.</span></div>
        </div>
      </section>
      <section className="auth-panel">
        <div className="panel-head">
          <div>
            <span className="eyebrow">EvoPilot Dashboard</span>
            <h2>登录控制台</h2>
          </div>
          <span className="tag amber">API auth required</span>
        </div>
        <label>
          <span>Username</span>
          <input autoFocus value={loginForm.username} onChange={(event) => onLoginForm({ ...loginForm, username: event.currentTarget.value })} />
        </label>
        <label>
          <span>Password</span>
          <input type="password" value={loginForm.password} onChange={(event) => onLoginForm({ ...loginForm, password: event.currentTarget.value })} onKeyDown={(event) => {
            if (event.key === "Enter" && loginForm.username && loginForm.password) onLogin();
          }} />
        </label>
        <button className="btn primary wide" type="button" onClick={onLogin} disabled={authLoading || !loginForm.username || !loginForm.password}>
          <LogIn size={15} aria-hidden="true" /> {authLoading ? "Signing in..." : "登录"}
        </button>
        <div className="notice amber">
          <strong>{authNotice}</strong>
          <span>首次部署通常由平台管理员初始化 admin 账号；其他用户由平台管理员或租户管理员创建并分配 tenant/workspace。</span>
        </div>
      </section>
    </main>
  );
}

function PasswordChangeScreen({
  session,
  authNotice,
  authLoading,
  passwordForm,
  onPasswordForm,
  onChangePassword,
  onSignOut
}: {
  session?: DashboardSession;
  authNotice: string;
  authLoading: boolean;
  passwordForm: { currentPassword: string; newPassword: string };
  onPasswordForm: (form: { currentPassword: string; newPassword: string }) => void;
  onChangePassword: () => void;
  onSignOut: () => void;
}) {
  return (
    <main className="auth-screen centered" aria-label="EvoPilot Dashboard password change">
      <section className="auth-panel lock-panel">
        <div className="panel-head">
          <div>
            <span className="eyebrow">Password change required</span>
            <h2>必须先修改默认密码</h2>
          </div>
          <span className="tag amber">{roleLabel(session)}</span>
        </div>
        <p className="panel-copy">{session?.user?.username ?? "signed-in user"} 已登录，但服务器要求先改密。完成后才能进入 Agent Console 或管理员页面。</p>
        <label>
          <span>Current Password</span>
          <input type="password" value={passwordForm.currentPassword} onChange={(event) => onPasswordForm({ ...passwordForm, currentPassword: event.currentTarget.value })} />
        </label>
        <label>
          <span>New Password</span>
          <input type="password" value={passwordForm.newPassword} onChange={(event) => onPasswordForm({ ...passwordForm, newPassword: event.currentTarget.value })} />
        </label>
        <div className="actions split">
          <button className="btn primary" type="button" onClick={onChangePassword} disabled={authLoading || !passwordForm.currentPassword || !passwordForm.newPassword}>完成改密</button>
          <button className="btn" type="button" onClick={onSignOut}>退出</button>
        </div>
        <div className="notice green"><strong>{authNotice}</strong><span>改密成功后，新的 session token 会替换当前会话。</span></div>
      </section>
    </main>
  );
}

function ManagementPage({
  page,
  scope,
  session,
  snapshot,
  lastAction,
  busyAction,
  tenantForm,
  workspaceForm,
  userForm,
  templateForm,
  onTenantForm,
  onWorkspaceForm,
  onUserForm,
  onTemplateForm,
  onRunAction,
  onRefresh
}: {
  page: Exclude<PageId, "console">;
  scope: DashboardScope;
  session?: DashboardSession;
  snapshot: Record<string, ApiResult>;
  lastAction?: DashboardActionResult;
  busyAction?: string;
  tenantForm: TenantForm;
  workspaceForm: WorkspaceForm;
  userForm: UserForm;
  templateForm: TemplateEvolutionForm;
  onTenantForm: (form: TenantForm) => void;
  onWorkspaceForm: (form: WorkspaceForm) => void;
  onUserForm: (form: UserForm) => void;
  onTemplateForm: (form: TemplateEvolutionForm) => void;
  onRunAction: (action: DashboardActionRequest) => void;
  onRefresh: () => void;
}) {
  if (page === "tenants") return <TenantsPage form={tenantForm} snapshot={snapshot} busyAction={busyAction} lastAction={lastAction} onForm={onTenantForm} onRunAction={onRunAction} />;
  if (page === "workspaces") return <WorkspacesPage form={workspaceForm} snapshot={snapshot} busyAction={busyAction} lastAction={lastAction} onForm={onWorkspaceForm} onRunAction={onRunAction} />;
  if (page === "users") return <UsersPage form={userForm} snapshot={snapshot} busyAction={busyAction} lastAction={lastAction} onForm={onUserForm} onRunAction={onRunAction} />;
  if (page === "templates") return <TemplatesPage form={templateForm} snapshot={snapshot} busyAction={busyAction} lastAction={lastAction} onForm={onTemplateForm} onRunAction={onRunAction} />;
  return <AuditPage snapshot={snapshot} session={session} lastAction={lastAction} onRefresh={onRefresh} />;
}

function TenantsPage({
  form,
  snapshot,
  busyAction,
  lastAction,
  onForm,
  onRunAction
}: {
  form: TenantForm;
  snapshot: Record<string, ApiResult>;
  busyAction?: string;
  lastAction?: DashboardActionResult;
  onForm: (form: TenantForm) => void;
  onRunAction: (action: DashboardActionRequest) => void;
}) {
  const rows = resultItems(snapshot.tenants, ["tenants"]).slice(0, 8);
  return (
    <main className="management-workspace">
      <section className="management-layout">
        <DataPanel
          title="创建租户、工作区和租户管理员"
          subtitle="只有 platform admin 能跨 tenant 管理边界。"
          rows={rows}
          columns={[
            ["Tenant", ["id", "tenantId", "name"]],
            ["Plan", ["plan", "tier"]],
            ["Workspaces", ["workspaceCount", "workspaces"]],
            ["Users", ["userCount", "users"]],
            ["Status", ["status", "state"]]
          ]}
          empty="No tenants returned by EvoPilot."
        />
        <aside className="form-panel">
          <PanelTitle eyebrow="Tenant registry" title="初始化新租户" />
          <label><span>Tenant ID</span><input value={form.tenantId} onChange={(event) => onForm({ ...form, tenantId: event.currentTarget.value })} /></label>
          <label><span>Workspace ID</span><input value={form.workspaceId} onChange={(event) => onForm({ ...form, workspaceId: event.currentTarget.value })} /></label>
          <label><span>租户管理员</span><input value={form.adminUser} onChange={(event) => onForm({ ...form, adminUser: event.currentTarget.value })} /></label>
          <div className="form-two">
            <label><span>角色</span><select value={form.role} onChange={(event) => onForm({ ...form, role: event.currentTarget.value })}><option value="admin">admin</option><option value="operator">operator</option></select></label>
            <label><span>Platform Admin</span><select value={form.platformAdmin} onChange={(event) => onForm({ ...form, platformAdmin: event.currentTarget.value })}><option value="false">false</option><option value="true">true</option></select></label>
          </div>
          <label><span>初始密码</span><input type="password" value={form.password} onChange={(event) => onForm({ ...form, password: event.currentTarget.value })} /></label>
          <button
            className="btn green wide"
            type="button"
            disabled={busyAction === "admin-create-tenant" || !form.tenantId || !form.workspaceId || !form.adminUser}
            onClick={() => onRunAction({
              id: "admin-create-tenant",
              label: "Create tenant/workspace/admin",
              method: "POST",
              path: apiSurface.tenants,
              body: {
                id: form.tenantId,
                workspace: { id: form.workspaceId },
                owner: {
                  username: form.adminUser,
                  role: form.role,
                  platformAdmin: form.platformAdmin === "true",
                  password: form.password || undefined,
                  mustChangePassword: true
                }
              }
            })}
          >
            创建并发放
          </button>
          <ActionEvidence lastAction={lastAction} />
        </aside>
      </section>
    </main>
  );
}

function WorkspacesPage({
  form,
  snapshot,
  busyAction,
  lastAction,
  onForm,
  onRunAction
}: {
  form: WorkspaceForm;
  snapshot: Record<string, ApiResult>;
  busyAction?: string;
  lastAction?: DashboardActionResult;
  onForm: (form: WorkspaceForm) => void;
  onRunAction: (action: DashboardActionRequest) => void;
}) {
  const rows = resultItems(snapshot.workspaces, ["workspaces"]).slice(0, 8);
  return (
    <main className="management-workspace">
      <section className="management-layout">
        <DataPanel
          title="工作区管理"
          subtitle="Workspace 是用户、项目、凭据引用、loop 和审计的隔离边界。"
          rows={rows}
          columns={[
            ["Workspace", ["id", "workspaceId", "name"]],
            ["Tenant", ["tenantId", "tenant"]],
            ["Projects", ["projectCount", "projects"]],
            ["Loops", ["loopCount", "loops"]],
            ["Status", ["status", "state"]]
          ]}
          empty="No workspaces returned by EvoPilot."
        />
        <aside className="form-panel">
          <PanelTitle eyebrow="Workspace boundary" title="创建工作区" />
          <label><span>Tenant ID</span><input value={form.tenantId} onChange={(event) => onForm({ ...form, tenantId: event.currentTarget.value })} /></label>
          <label><span>Workspace ID</span><input value={form.workspaceId} onChange={(event) => onForm({ ...form, workspaceId: event.currentTarget.value })} /></label>
          <label><span>Owner</span><input value={form.owner} onChange={(event) => onForm({ ...form, owner: event.currentTarget.value })} /></label>
          <div className="form-two">
            <label><span>Project limit</span><input value={form.projectLimit} onChange={(event) => onForm({ ...form, projectLimit: event.currentTarget.value })} /></label>
            <label><span>Loop limit</span><input value={form.loopLimit} onChange={(event) => onForm({ ...form, loopLimit: event.currentTarget.value })} /></label>
          </div>
          <button
            className="btn green wide"
            type="button"
            disabled={busyAction === "admin-create-workspace" || !form.tenantId || !form.workspaceId}
            onClick={() => onRunAction({
              id: "admin-create-workspace",
              label: "Create workspace",
              method: "POST",
              path: apiSurface.workspaces,
              body: {
                tenantId: form.tenantId,
                id: form.workspaceId,
                owner: form.owner,
                quota: {
                  projects: Number(form.projectLimit) || undefined,
                  loops: Number(form.loopLimit) || undefined
                }
              }
            })}
          >
            创建工作区
          </button>
          <ActionEvidence lastAction={lastAction} />
        </aside>
      </section>
    </main>
  );
}

function UsersPage({
  form,
  snapshot,
  busyAction,
  lastAction,
  onForm,
  onRunAction
}: {
  form: UserForm;
  snapshot: Record<string, ApiResult>;
  busyAction?: string;
  lastAction?: DashboardActionResult;
  onForm: (form: UserForm) => void;
  onRunAction: (action: DashboardActionRequest) => void;
}) {
  const rows = resultItems(snapshot.users, ["users"]).slice(0, 8);
  return (
    <main className="management-workspace">
      <section className="management-layout">
        <DataPanel
          title="创建 tenant/workspace scoped 用户"
          subtitle="用户登录后 scope 锁定，普通用户不能跨租户切换。"
          rows={rows}
          columns={[
            ["User", ["username", "id"]],
            ["Role", ["role"]],
            ["Tenant", ["tenantId"]],
            ["Workspace", ["workspaceId"]],
            ["Status", ["status", "state"]]
          ]}
          empty="No users returned by EvoPilot."
        />
        <aside className="form-panel">
          <PanelTitle eyebrow="User registry" title="创建新用户" />
          <label><span>Username</span><input value={form.username} onChange={(event) => onForm({ ...form, username: event.currentTarget.value })} /></label>
          <div className="form-two">
            <label><span>Role</span><select value={form.role} onChange={(event) => onForm({ ...form, role: event.currentTarget.value })}><option value="operator">operator</option><option value="admin">admin</option><option value="auditor">auditor</option></select></label>
            <label><span>Status</span><select value={form.status} onChange={(event) => onForm({ ...form, status: event.currentTarget.value })}><option value="ACTIVE">ACTIVE</option><option value="DISABLED">DISABLED</option></select></label>
          </div>
          <label><span>Tenant ID</span><input value={form.tenantId} onChange={(event) => onForm({ ...form, tenantId: event.currentTarget.value })} /></label>
          <label><span>Workspace ID</span><input value={form.workspaceId} onChange={(event) => onForm({ ...form, workspaceId: event.currentTarget.value })} /></label>
          <label><span>Initial password</span><input type="password" value={form.password} onChange={(event) => onForm({ ...form, password: event.currentTarget.value })} /></label>
          <button
            className="btn green wide"
            type="button"
            disabled={busyAction === "admin-create-user" || !form.username || !form.tenantId || !form.workspaceId}
            onClick={() => onRunAction({
              id: "admin-create-user",
              label: "Create scoped user",
              method: "POST",
              path: apiSurface.users,
              body: {
                username: form.username,
                tenantId: form.tenantId,
                workspaceId: form.workspaceId,
                role: form.role,
                status: form.status,
                password: form.password || undefined,
                mustChangePassword: true
              }
            })}
          >
            创建用户
          </button>
          <ActionEvidence lastAction={lastAction} />
        </aside>
      </section>
    </main>
  );
}

function TemplatesPage({
  form,
  snapshot,
  busyAction,
  lastAction,
  onForm,
  onRunAction
}: {
  form: TemplateEvolutionForm;
  snapshot: Record<string, ApiResult>;
  busyAction?: string;
  lastAction?: DashboardActionResult;
  onForm: (form: TemplateEvolutionForm) => void;
  onRunAction: (action: DashboardActionRequest) => void;
}) {
  const templates = resultItems(snapshot.templates, ["templates"]).slice(0, 8);
  const evolutions = resultItems(snapshot.templateEvolutions, ["evolutions"]).slice(0, 5);
  return (
    <main className="management-workspace">
      <section className="management-layout">
        <DataPanel
          title="企业级 HarnessTemplate 知识包"
          subtitle="新项目自动匹配模板；管理员通过版本、changelog 和 evolution run 管理生命周期。"
          rows={templates}
          columns={[
            ["Template", ["id", "templateId", "name"]],
            ["Version", ["version"]],
            ["Type", ["softwareType", "language", "category"]],
            ["Status", ["status", "state"]]
          ]}
          empty="No templates returned by EvoPilot."
        />
        <aside className="form-panel">
          <PanelTitle eyebrow="Template evolution" title="创建进化 run" />
          <label><span>Base Template</span><input value={form.baseTemplateId} onChange={(event) => onForm({ ...form, baseTemplateId: event.currentTarget.value })} /></label>
          <label><span>Target Version</span><input value={form.targetVersion} onChange={(event) => onForm({ ...form, targetVersion: event.currentTarget.value })} /></label>
          <label><span>Intent</span><textarea value={form.intent} onChange={(event) => onForm({ ...form, intent: event.currentTarget.value })} /></label>
          <div className="form-two">
            <label><span>Source Type</span><select value={form.sourceType} onChange={(event) => onForm({ ...form, sourceType: event.currentTarget.value })}><option value="admin-note">admin-note</option><option value="github-repo">github-repo</option><option value="web-url">web-url</option><option value="attachment">attachment</option><option value="local-pack">local-pack</option></select></label>
            <label><span>Source</span><input value={form.sourceUri} onChange={(event) => onForm({ ...form, sourceUri: event.currentTarget.value })} /></label>
          </div>
          <button
            className="btn green wide"
            type="button"
            disabled={busyAction === "admin-create-template-evolution" || !form.baseTemplateId || !form.intent}
            onClick={() => onRunAction({
              id: "admin-create-template-evolution",
              label: "Create HarnessTemplateEvolution",
              method: "POST",
              path: apiSurface.harnessTemplateEvolutions,
              body: {
                baseTemplateId: form.baseTemplateId,
                targetVersion: form.targetVersion || undefined,
                intent: form.intent,
                sources: [{
                  type: form.sourceType,
                  name: form.sourceUri || form.sourceType,
                  uri: form.sourceType === "admin-note" ? undefined : form.sourceUri,
                  contentText: form.sourceType === "admin-note" ? form.sourceUri : undefined
                }]
              }
            })}
          >
            创建 evolution draft
          </button>
          <div className="sub-list">
            {evolutions.map((item, index) => <small key={index}>{fieldText(item, ["id", "evolutionId"])} · {fieldText(item, ["status", "state"])}</small>)}
          </div>
          <ActionEvidence lastAction={lastAction} />
        </aside>
      </section>
    </main>
  );
}

function AuditPage({
  snapshot,
  session,
  lastAction,
  onRefresh
}: {
  snapshot: Record<string, ApiResult>;
  session?: DashboardSession;
  lastAction?: DashboardActionResult;
  onRefresh: () => void;
}) {
  const rows = resultItems(snapshot.audit, ["audit", "records"]).slice(0, 10);
  return (
    <main className="management-workspace">
      <section className="summary-grid">
        <SummaryCard label="Audit events" value={String(rows.length)} detail="server-returned rows in current scope" />
        <SummaryCard label="Actor" value={session?.user?.username ?? defaultScope.actorId} detail={roleLabel(session)} />
        <SummaryCard label="Last request" value={lastAction?.requestId ?? "none"} detail={lastAction?.nextAction ?? "no nextAction"} />
      </section>
      <section className="management-layout">
        <DataPanel
          title="审计与日志溯源"
          subtitle="AI Agent 根据 requestId -> action -> scope -> nextAction/blockers 定位问题。"
          rows={rows}
          columns={[
            ["Time", ["time", "timestamp", "createdAt"]],
            ["Actor", ["actorId", "actor", "username"]],
            ["Action", ["action", "operation", "event"]],
            ["Target", ["target", "resource", "path"]],
            ["Result", ["status", "result"]]
          ]}
          empty="No audit records returned by EvoPilot."
        />
        <aside className="form-panel">
          <PanelTitle eyebrow="Failure trace" title="AI 可读证据" />
          <EvidenceRow label="requestId" value={lastAction?.requestId ?? "not returned"} />
          <EvidenceRow label="lastAction" value={lastAction ? `${lastAction.method} ${lastAction.path}` : "none"} />
          <EvidenceRow label="nextAction" value={lastAction?.nextAction ?? "none"} />
          <EvidenceRow label="blockers" value={lastAction?.blockers?.join(", ") || "none"} />
          <LogLine level={lastAction?.ok ? "INFO" : lastAction ? "ERROR" : "INFO"} text={lastAction?.error ?? "No failing API action selected."} />
          <button className="btn primary wide" type="button" onClick={onRefresh}><RefreshCw size={15} aria-hidden="true" /> Refresh audit</button>
        </aside>
      </section>
    </main>
  );
}

function SummaryCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="summary-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </div>
  );
}

function DataPanel({
  title,
  subtitle,
  rows,
  columns,
  empty
}: {
  title: string;
  subtitle: string;
  rows: Record<string, unknown>[];
  columns: Array<[string, string[]]>;
  empty: string;
}) {
  return (
    <section className="data-panel">
      <PanelTitle eyebrow="Live projection" title={title} subtitle={subtitle} />
      <div className="table">
        <div className="table-head" style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}>
          {columns.map(([label]) => <strong key={label}>{label}</strong>)}
        </div>
        {rows.length === 0 ? (
          <div className="empty-row">{empty}</div>
        ) : rows.map((row, index) => (
          <div key={index} className="table-row" style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}>
            {columns.map(([label, keys]) => <span key={label}>{fieldText(row, keys)}</span>)}
          </div>
        ))}
      </div>
      <div className="notice amber">
        <strong>Dashboard 不绕过 EvoPilot 控制面。</strong>
        <span>页面显示的是当前 API projection；最终状态以服务端返回的 requestId、status、nextAction 和 audit 为准。</span>
      </div>
    </section>
  );
}

function PanelTitle({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle?: string }) {
  return (
    <div className="panel-title">
      <span>{eyebrow}</span>
      <h3>{title}</h3>
      {subtitle && <p>{subtitle}</p>}
    </div>
  );
}

function LockedScope({ scope }: { scope: DashboardScope }) {
  return (
    <div className="locked-scope">
      <EvidenceRow label="Tenant" value={scope.tenantId} />
      <EvidenceRow label="Workspace" value={scope.workspaceId} />
      <EvidenceRow label="Actor" value={scope.actorId} />
    </div>
  );
}

function ActionEvidence({ lastAction }: { lastAction?: DashboardActionResult }) {
  return (
    <div className="drawer-card">
      <strong>Last action evidence</strong>
      <small>{lastAction ? `${lastAction.actionLabel}: ${lastAction.status}` : "No action on this page yet."}</small>
      <EvidenceRow label="requestId" value={lastAction?.requestId ?? "not returned"} />
      <EvidenceRow label="nextAction" value={lastAction?.nextAction ?? "none"} />
    </div>
  );
}

function Sidebar({
  activePage,
  onNavigate
}: {
  activePage: PageId;
  onNavigate: (page: PageId) => void;
}) {
  const items: Array<[PageId, string]> = [
    ["console", "# Agent Console"],
    ["tenants", "Tenants"],
    ["workspaces", "Workspaces"],
    ["users", "Users"],
    ["templates", "Harness Templates"],
    ["audit", "Audit"]
  ];
  return (
    <aside className="sidebar" aria-label="EvoPilot Agent Console sidebar">
      <div className="brand">
        <div className="brand-row">
          <span className="brand-mark-small">E</span>
          <h1>EvoPilot</h1>
        </div>
      </div>
      <div className="sidebar-section">
        <div className="nav-list">
          {items.map(([page, label]) => (
            <button
              key={page}
              type="button"
              className={`nav-item ${activePage === page ? "active" : ""}`}
              onClick={() => onNavigate(page)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}

function sessionDetail(step: ConsoleStep) {
  if (step === "intake") return "Project intake · goal target";
  if (step === "template-match" || step === "drafting") return "Harness draft · auto-match";
  if (step === "review" || step === "changes") return "Project owner review";
  if (step === "activated") return "Loop planning";
  if (step === "loop") return "Loop running";
  if (step === "blocker") return "Repair approval needed";
  return "Release decision review";
}

function SidebarSession({ active, title, detail, tone }: { active?: boolean; title: string; detail: string; tone: string }) {
  return (
    <div className={`sidebar-session ${active ? "active" : ""}`}>
      <div>
        <span className={`dot ${tone}`} />
        <strong>{title}</strong>
      </div>
      <small>{detail}</small>
    </div>
  );
}

function Decision({ tone, title, detail }: { tone: string; title: string; detail: string }) {
  return (
    <div className="decision">
      <span className={`dot ${tone}`} />
      <div>
        <strong>{title}</strong>
        <small>{detail}</small>
      </div>
    </div>
  );
}

function Topbar({
  activePage,
  consoleStep,
  scope,
  session,
  apiOk,
  apiFailed,
  refreshing,
  onOpenSession,
  onRefresh
}: {
  activePage: PageId;
  consoleStep: ConsoleStep;
  scope: DashboardScope;
  session?: DashboardSession;
  apiOk: number;
  apiFailed: number;
  refreshing: boolean;
  onOpenSession: () => void;
  onRefresh: () => void;
}) {
  const titleMap: Record<ConsoleStep, [string, string]> = {
    intake: ["Project Intake", "用户只需要描述项目地址和目标，Dashboard 不暴露复杂配置菜单。"],
    "template-match": ["Context resolved", "EvoPilot 自动匹配模板，用户不需要手动选择 HarnessTemplate。"],
    drafting: ["Harness draft streaming", "HarnessProfile 由 template harness、项目上下文和 goal target 组合生成。"],
    review: ["Review Pack ready", "确认点以对话内 YAML/Markdown 卡片出现，不跳转到复杂表单页。"],
    changes: ["Owner changes applied", "用户在对话里提出修改，EvoPilot 返回 diff 后再次等待确认。"],
    activated: ["Profile activated", "Active ProjectHarnessProfile 绑定后续 planning 与 loop execution。"],
    loop: ["Loop execution", "执行阶段只展示普通用户关心的进度，详细日志按需展开。"],
    blocker: ["Blocker repair", "异常出现时，AI Agent 能基于日志、requestId 和 evidence 追踪问题位置。"],
    release: ["Release decision", "Release Gate 汇总 profile coverage、evidence、风险和下一步动作。"]
  };
  const pageTitleMap: Record<PageId, [string, string]> = {
    console: titleMap[consoleStep],
    tenants: ["平台租户管理", "创建租户、工作区和租户管理员；只有 platform admin 能跨 tenant 切换 scope。"],
    workspaces: ["工作区管理", "按租户管理 workspace 边界、owner、项目配额和 loop 配额。"],
    users: ["用户权限管理", "创建 tenant/workspace scoped 用户，首次登录必须改密，所有操作进入 audit。"],
    templates: ["Harness Template 管理", "管理员查看公共模板、创建模板进化 run，并通过版本和 changelog 管理生命周期。"],
    audit: ["审计与日志溯源", "按 requestId、actor、scope、action、nextAction 和 blocker 定位问题。"]
  };
  const [title, subtitle] = pageTitleMap[activePage];
  return (
    <header className="topbar">
      <div>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
      <div className="status-strip">
        <button type="button" className={`chip ${scope.token ? "green" : "amber"}`} onClick={onOpenSession}>
          <ShieldCheck size={14} aria-hidden="true" />
          {scope.token ? roleLabel(session) : "sign in required"}
        </button>
        <span className="chip blue">scope locked</span>
        <span className="chip mono">{scope.tenantId}</span>
        <span className="chip mono">{scope.workspaceId}</span>
        <button type="button" className={`chip ${apiFailed ? "amber" : apiOk ? "green" : ""}`} onClick={onRefresh} disabled={refreshing}>
          <RefreshCw size={14} aria-hidden="true" />
          {refreshing ? "refreshing" : apiOk ? `${apiOk} API ok` : "API waiting"}
        </button>
        <span className="chip mono">{configuredApiBaseUrl || "same-origin proxy"}</span>
        <span className="chip mono">{controlPlaneBaseUrl}</span>
      </div>
    </header>
  );
}

function StageBar({ stages }: { stages: Array<{ label: string; status: string; kind: string }> }) {
  return (
    <div className="stagebar">
      <div className="stages">
        {stages.map((stage, index) => (
          <div key={stage.label} className={`stage ${stage.kind}`}>
            <div className="stage-num">{index + 1}</div>
            <div>
              <strong>{stage.label}</strong>
              <span>{stage.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChatBubble({
  message,
  context,
  profileDraft,
  reviewSteps,
  lastAction
}: {
  message: ChatMessage;
  context: ProjectLoopContext;
  profileDraft: HarnessProfileDraft;
  reviewSteps: ReviewStep[];
  lastAction?: DashboardActionResult;
}) {
  return (
    <article className={`message ${message.role}`}>
      <div className={`avatar ${message.role}`}>{message.role === "user" ? "U" : "AI"}</div>
      <div className="bubble">
        <div className="bubble-head">
          <strong>{message.title}</strong>
          <span>{message.time}</span>
        </div>
        <p>{message.text}</p>
        <MessageCard message={message} context={context} profileDraft={profileDraft} reviewSteps={reviewSteps} lastAction={lastAction} />
      </div>
    </article>
  );
}

function MessageCard({
  message,
  context,
  profileDraft,
  reviewSteps,
  lastAction
}: {
  message: ChatMessage;
  context: ProjectLoopContext;
  profileDraft: HarnessProfileDraft;
  reviewSteps: ReviewStep[];
  lastAction?: DashboardActionResult;
}) {
  if (message.card === "intake") return <IntakeCard context={context} />;
  if (message.card === "template") return <TemplateCard profileDraft={profileDraft} />;
  if (message.card === "drafting") return <DraftingCard />;
  if (message.card === "review") return <ProfileReviewCard context={context} profileDraft={profileDraft} />;
  if (message.card === "diff") return <DiffCard profileDraft={profileDraft} />;
  if (message.card === "activated") return <ActivatedCard context={context} reviewSteps={reviewSteps} />;
  if (message.card === "loop") return <LoopCard reviewSteps={reviewSteps} />;
  if (message.card === "blocker") return <BlockerCard lastAction={lastAction} />;
  if (message.card === "release") return <ReleaseCard profileDraft={profileDraft} />;
  return <ApiCard lastAction={lastAction} />;
}

function IntakeCard({ context }: { context: ProjectLoopContext }) {
  return (
    <div className="card">
      <div className="card-head">
        <div>
          <strong>Intake summary</strong>
          <span>EvoPilot 会自动解析项目和目标，不要求普通用户理解 CLI 参数。</span>
        </div>
        <span className="tag blue">DRAFT</span>
      </div>
      <div className="card-body metrics three">
        <Metric label="Repo" value={context.repositoryProvider || "GitHub"} note={context.repositoryUrl || "Enter repository URL"} />
        <Metric label="Goal target" value="GA-ready" note={context.goalLoopTarget || "Describe enterprise readiness"} />
        <Metric label="Owner gate" value="Required" note="profile activation needs confirmation" />
      </div>
    </div>
  );
}

function TemplateCard({ profileDraft }: { profileDraft: HarnessProfileDraft }) {
  return (
    <div className="card">
      <div className="card-head">
        <div>
          <strong>Template auto-match</strong>
          <span>接入项目不手选模板，EvoPilot 根据语言、软件类型和目标自动匹配。</span>
        </div>
        <span className="tag green">matched</span>
      </div>
      <div className="card-body metrics two">
        <Metric label="Primary template" value={profileDraft.templateRef || "auto-match"} note="DDD, API contract, testing, observability" />
        <Metric label="Generated by" value="EvoPilot" note={profileDraft.generatedByEvidence.join("; ") || "server-governed profile generation"} />
      </div>
    </div>
  );
}

function DraftingCard() {
  return (
    <div className="card">
      <div className="card-head">
        <div>
          <strong>Generating ProjectHarnessProfile</strong>
          <span>把公共模板能力映射到该仓库的模块、证据和验收规则。</span>
        </div>
        <span className="tag blue">streaming</span>
      </div>
      <div className="card-body">
        <div className="stream-line"><span className="spinner" />解析 repo runtime、DevOps 和 LLM profile</div>
        <div className="stream-line"><span className="spinner" />生成 capability coverage: API, domain, data, observability, release</div>
        <div className="stream-line"><span className="spinner" />绑定 evidence contract: requestId, phaseId, digests, policyRefs</div>
        <div className="progress" style={{ "--value": "72%" } as CSSProperties}><span /></div>
      </div>
    </div>
  );
}

function ProfileReviewCard({ context, profileDraft }: { context: ProjectLoopContext; profileDraft: HarnessProfileDraft }) {
  return (
    <div className="card">
      <div className="card-head">
        <div>
          <strong>ProjectHarnessProfile.yaml</strong>
          <span>这是用户确认前看到的人类可读 Harness 定义草案。</span>
        </div>
        <span className="tag amber">needs approval</span>
      </div>
      <div className="card-body">
        <div className="review-document">
          <div className="doc-toolbar">
            <code>profiles/{context.projectId || "project"}/ProjectHarnessProfile.yaml</code>
            <div className="doc-tags">
              <span className="tag amber">{profileDraft.status || "DRAFT"}</span>
              <span className="tag blue">YAML</span>
              <span className="tag">{profileDraft.profileId}{profileDraft.version ? ` v${profileDraft.version}` : ""}</span>
            </div>
          </div>
          <div className="markdown-note">
            <strong>## Owner Review Summary</strong>
            <ul>
              <li><b>Scope:</b> review project capability boundaries before activation.</li>
              <li><b>Decision:</b> confirmation makes this profile the active harness for goal planning and loop execution.</li>
              <li><b>Review focus:</b> 能力边界、规则、异常处理、日志溯源、监控/APM、发布门禁。</li>
            </ul>
          </div>
          <pre className="yaml-block">{profileDraft.sourceContent || fallbackProfileYaml(context, profileDraft)}</pre>
        </div>
      </div>
    </div>
  );
}

function DiffCard({ profileDraft }: { profileDraft: HarnessProfileDraft }) {
  return (
    <div className="card">
      <div className="card-head">
        <div>
          <strong>Draft update diff</strong>
          <span>用户要求已转成 profile 变更，等待再次确认。</span>
        </div>
        <span className="tag green">diff ready</span>
      </div>
      <div className="card-body">
        <div className="diff">
          <div className="diff-row add"><span>+</span><span>logging.requiredFields: requestId, correlationId, phaseId, tenantId, module, action, failureCause</span></div>
          <div className="diff-row add"><span>+</span><span>failureTriage.rule: every ERROR log must link to evidence.requestId and owning capability</span></div>
          <div className="diff-row change"><span>~</span><span>{"validation.observability.minCoverage: recommended -> release-blocking"}</span></div>
          <div className="diff-row add"><span>+</span><span>{"agentRunbook: requestId -> traceId -> module -> failing check -> suggested repair"}</span></div>
        </div>
        {profileDraft.diffSummary && <pre className="compact-json">{profileDraft.diffSummary}</pre>}
      </div>
    </div>
  );
}

function ActivatedCard({ context, reviewSteps }: { context: ProjectLoopContext; reviewSteps: ReviewStep[] }) {
  return (
    <div className="card">
      <div className="card-head">
        <div>
          <strong>Active profile binding</strong>
          <span>从这里开始，loop execution 不能绕过 active harness 契约。</span>
        </div>
        <span className="tag green">active</span>
      </div>
      <div className="card-body flow-nodes">
        <FlowNode name="Goal target" detail={context.goalLoopTarget || "GA-ready enterprise service"} />
        <FlowNode name="Active profile" detail={`${context.profileId || "default"} ${context.profileVersion ? `v${context.profileVersion}` : ""}`} />
        <FlowNode name="Loop plan" detail={reviewSteps.find((item) => item.id === "plan-goal")?.status ?? "planning"} />
        <FlowNode name="Evidence" detail="packages per requestId" />
        <FlowNode name="Release gate" detail="GO / NO-GO / BLOCKED" />
      </div>
    </div>
  );
}

function LoopCard({ reviewSteps }: { reviewSteps: ReviewStep[] }) {
  const rows = [
    ["Done", "Project scan", "runtime and DevOps context resolved", "green"],
    ["Done", "Exception policy", "handlers and mapper contract added", "green"],
    ["Running", "Observability", "logs, metrics, trace spans and APM checks", "blue"],
    ["Queued", "Release gates", "preflight, canary and rollback evidence", ""],
    ["Queued", "GA decision", "summarize evidence and residual risk", ""]
  ];
  return (
    <div className="card">
      <div className="card-head">
        <div>
          <strong>Loop plan progress</strong>
          <span>Dashboard 展示主要链路，不把 CLI 原子命令暴露给普通用户。</span>
        </div>
        <span className="tag blue">{reviewSteps.find((item) => item.id === "advance-goal")?.status ?? "running"}</span>
      </div>
      <div className="card-body timeline">
        {rows.map(([status, name, detail, tone]) => <TimelineRow key={name} status={status} name={name} detail={detail} tone={tone} />)}
        <div className="progress green" style={{ "--value": "58%" } as CSSProperties}><span /></div>
      </div>
    </div>
  );
}

function BlockerCard({ lastAction }: { lastAction?: DashboardActionResult }) {
  return (
    <div className="card">
      <div className="card-head">
        <div>
          <strong>Blocker located</strong>
          <span>异常不是只提示失败，而是能追溯到模块、规则、日志和修复动作。</span>
        </div>
        <span className="tag red">BLOCKED</span>
      </div>
      <div className="card-body">
        <div className="metrics two">
          <Metric label="Failing capability" value="Exception handling" note="domain exception mapper coverage" />
          <Metric label="Located module" value="app/api/errors.py" note={lastAction?.nextAction ?? "missing InventoryConflict mapping test"} />
        </div>
        <div className="diff">
          <div className="diff-row change"><span>!</span><span>{lastAction?.error ?? "contract test failed or server returned nextAction"}</span></div>
          <div className="diff-row add"><span>+</span><span>Repair proposal: inspect requestId, log trace, failing capability, and suggested action</span></div>
          <div className="diff-row add"><span>+</span><span>Evidence rerun scope: minimal checks around the blocker</span></div>
        </div>
      </div>
    </div>
  );
}

function ReleaseCard({ profileDraft }: { profileDraft: HarnessProfileDraft }) {
  return (
    <div className="card">
      <div className="card-head">
        <div>
          <strong>GA Release Decision</strong>
          <span>最终确认只看高信号摘要，完整证据可展开。</span>
        </div>
        <span className="tag green">GO candidate</span>
      </div>
      <div className="card-body">
        <div className="metrics three">
          <Metric label="Harness coverage" value="100%" note="profile controls satisfied" />
          <Metric label="Evidence package" value="Complete" note={profileDraft.compiledDigest ?? "compiled digest available in drawer"} />
          <Metric label="Decision" value="GO" note="pending owner confirmation" />
        </div>
        <div className="capability-list">
          <Capability text="异常处理、日志、监控、APM、CI/CD、回滚全部满足 active profile" />
          <Capability text="所有 ERROR 日志均可通过 requestId / correlationId / phaseId 溯源" />
          <Capability text="Release gate 包含 risk summary、residual risk 和 rollback plan" />
          <Capability text="WorkBuddy 可读取 requestId、evidence digest 和 nextAction 继续自动化" />
        </div>
      </div>
    </div>
  );
}

function ApiCard({ lastAction }: { lastAction?: DashboardActionResult }) {
  if (!lastAction) return null;
  return (
    <div className="card">
      <div className="card-head">
        <div>
          <strong>Last API Action</strong>
          <span>{lastAction.method} {lastAction.path}</span>
        </div>
        <span className={`tag ${lastAction.ok ? "green" : "red"}`}>{lastAction.status}</span>
      </div>
      <div className="card-body metrics three">
        <Metric label="requestId" value={lastAction.requestId ?? "not returned"} note={lastAction.actionLabel} />
        <Metric label="nextAction" value={lastAction.nextAction ?? "none"} note={lastAction.schema ?? "schema not returned"} />
        <Metric label="blockers" value={lastAction.blockers?.join(", ") || "none"} note={lastAction.error ?? "no error"} />
      </div>
    </div>
  );
}

function Metric({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </div>
  );
}

function Capability({ text }: { text: string }) {
  return (
    <div className="capability"><span className="dot blue" /><span>{text}</span></div>
  );
}

function FlowNode({ name, detail }: { name: string; detail: string }) {
  return (
    <div className="flow-node">
      <strong>{name}</strong>
      <span>{detail}</span>
    </div>
  );
}

function TimelineRow({ status, name, detail, tone }: { status: string; name: string; detail: string; tone: string }) {
  return (
    <div className="timeline-row">
      <span className={`tag ${tone}`}>{status}</span>
      <strong>{name}</strong>
      <span>{detail}</span>
    </div>
  );
}

function Composer({
  consoleStep,
  context,
  goal,
  ownerChange,
  busyAction,
  onPatchContext,
  onGoalChange,
  onOwnerChange,
  onStart,
  onRequestChanges,
  onConfirm,
  onApproveAndAdvance,
  onViewEvidence,
  onViewRelease
}: {
  consoleStep: ConsoleStep;
  context: ProjectLoopContext;
  goal: string;
  ownerChange: string;
  busyAction?: string;
  onPatchContext: (patch: Partial<ProjectLoopContext>) => void;
  onGoalChange: (goal: string) => void;
  onOwnerChange: (value: string) => void;
  onStart: () => void;
  onRequestChanges: () => void;
  onConfirm: () => void;
  onApproveAndAdvance: () => void;
  onViewEvidence: () => void;
  onViewRelease: () => void;
}) {
  const disabled = Boolean(busyAction);
  if (consoleStep === "intake" || consoleStep === "template-match" || consoleStep === "drafting") {
    return (
      <section className="composer" aria-label="Project goal composer">
        <div className="composer-grid">
          <label>
            <span>Repository</span>
            <input
              value={context.repositoryUrl}
              placeholder="https://github.com/org/project.git"
              onChange={(event) => onPatchContext({ repositoryUrl: event.currentTarget.value })}
            />
          </label>
          <label>
            <span>Goal Loop Target</span>
            <textarea value={goal} placeholder="Describe the project goal..." onChange={(event) => onGoalChange(event.currentTarget.value)} />
          </label>
        </div>
        <div className="composer-footer">
          <span>Enter repository and goal target. EvoPilot will auto-match template harness and return a DRAFT ProjectHarnessProfile.</span>
          <button className="btn primary" type="button" onClick={onStart} disabled={disabled || !goal.trim()}>
            <Send size={15} aria-hidden="true" /> {disabled ? "Working..." : "Start intake"}
          </button>
        </div>
      </section>
    );
  }

  if (consoleStep === "review" || consoleStep === "changes") {
    return (
      <section className="composer" aria-label="Owner review composer">
        <textarea
          value={ownerChange}
          placeholder="Request a harness change, or confirm the displayed ProjectHarnessProfile.yaml."
          onChange={(event) => onOwnerChange(event.currentTarget.value)}
        />
        <div className="composer-footer">
          <span>修改会生成新的 DRAFT 差异，不会直接激活。</span>
          <div className="actions">
            <button className="btn primary" type="button" onClick={onRequestChanges} disabled={disabled || !ownerChange.trim()}>
              <Send size={15} aria-hidden="true" /> Request changes
            </button>
            <button className="btn green" type="button" onClick={onConfirm} disabled={disabled}>
              <CheckCircle2 size={15} aria-hidden="true" /> Confirm
            </button>
            <button className="btn" type="button" onClick={onViewEvidence}>
              <Eye size={15} aria-hidden="true" /> View evidence
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (consoleStep === "activated") {
    return (
      <section className="composer" aria-label="Phase plan approval composer">
        <div className="composer-grid approval">
          <label>
            <span>Confirmed By</span>
            <input value={context.confirmedBy} placeholder="real project owner" onChange={(event) => onPatchContext({ confirmedBy: event.currentTarget.value })} />
          </label>
          <label>
            <span>Confirmation</span>
            <textarea value={context.confirmation} placeholder="Project owner reviewed the active harness binding and Alpha/Beta/RC/GA phase plan." onChange={(event) => onPatchContext({ confirmation: event.currentTarget.value })} />
          </label>
        </div>
        <div className="composer-footer">
          <span>Phase plan approval needs real confirmation. Dashboard will not invent it.</span>
          <button className="btn primary" type="button" onClick={onApproveAndAdvance} disabled={disabled || !context.confirmedBy.trim() || !context.confirmation.trim()}>
            <Play size={15} aria-hidden="true" /> Approve plan & start loop
          </button>
        </div>
      </section>
    );
  }

  if (consoleStep === "blocker") {
    return (
      <section className="composer" aria-label="Blocker composer">
        <textarea readOnly value="批准修复 blocker 前，请先查看 requestId、日志、失败能力和建议修复范围。" />
        <div className="composer-footer">
          <span>Stop on blocker unless the project owner or administrator approves repair.</span>
          <div className="actions">
            <button className="btn warn" type="button" onClick={onViewEvidence}><Wrench size={15} aria-hidden="true" /> View repair evidence</button>
            <button className="btn" type="button" onClick={onViewRelease}>Refresh release evidence</button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="composer" aria-label="Release decision composer">
      <textarea readOnly value="确认发布前，请读取 release decision、TargetEvidencePackage、PhasePackage 和 residual risk。" />
      <div className="composer-footer">
        <span>Release truth comes from EvoPilot evidence packages and release decisions.</span>
        <div className="actions">
          <button className="btn green" type="button" onClick={onViewRelease}><CheckCircle2 size={15} aria-hidden="true" /> Confirm release</button>
          <button className="btn" type="button" onClick={onViewEvidence}><Eye size={15} aria-hidden="true" /> View evidence</button>
        </div>
      </div>
    </section>
  );
}

function EvidenceDrawer({
  kind,
  scope,
  context,
  session,
  canEditScope,
  signedIn,
  authNotice,
  authLoading,
  loginForm,
  passwordForm,
  apiNotice,
  apiLoading,
  snapshot,
  profileDraft,
  lastAction,
  onLoginForm,
  onPasswordForm,
  onLogin,
  onChangePassword,
  onSignOut,
  onScopeChange,
  onPatchContext,
  onRefresh
}: {
  kind: DrawerKind;
  scope: DashboardScope;
  context: ProjectLoopContext;
  session?: DashboardSession;
  canEditScope: boolean;
  signedIn: boolean;
  authNotice: string;
  authLoading: boolean;
  loginForm: { username: string; password: string };
  passwordForm: { currentPassword: string; newPassword: string };
  apiNotice: string;
  apiLoading: boolean;
  snapshot: Record<string, ApiResult>;
  profileDraft: HarnessProfileDraft;
  lastAction?: DashboardActionResult;
  onLoginForm: (form: { username: string; password: string }) => void;
  onPasswordForm: (form: { currentPassword: string; newPassword: string }) => void;
  onLogin: () => void;
  onChangePassword: () => void;
  onSignOut: () => void;
  onScopeChange: (scope: DashboardScope) => void;
  onPatchContext: (patch: Partial<ProjectLoopContext>) => void;
  onRefresh: () => void;
}) {
  if (kind === "session") {
    return (
      <aside className="drawer">
        <DrawerHead title="Session and scope" subtitle={authNotice} />
        <div className="drawer-body">
          <div className="drawer-card">
            <strong>{signedIn ? "Signed in" : "Sign in required"}</strong>
            <small>{session?.user?.username ?? scope.actorId}</small>
          </div>
          <label>
            <span>Username</span>
            <input value={loginForm.username} onChange={(event) => onLoginForm({ ...loginForm, username: event.currentTarget.value })} />
          </label>
          <label>
            <span>Password</span>
            <input type="password" value={loginForm.password} onChange={(event) => onLoginForm({ ...loginForm, password: event.currentTarget.value })} />
          </label>
          <button className="btn primary" type="button" onClick={onLogin} disabled={authLoading}><LogIn size={15} aria-hidden="true" /> Login</button>
          <button className="btn" type="button" onClick={onSignOut}><LogOut size={15} aria-hidden="true" /> Sign out</button>
          {(session?.mustChangePassword || session?.user?.mustChangePassword) && (
            <div className="drawer-card">
              <label>
                <span>Current Password</span>
                <input type="password" value={passwordForm.currentPassword} onChange={(event) => onPasswordForm({ ...passwordForm, currentPassword: event.currentTarget.value })} />
              </label>
              <label>
                <span>New Password</span>
                <input type="password" value={passwordForm.newPassword} onChange={(event) => onPasswordForm({ ...passwordForm, newPassword: event.currentTarget.value })} />
              </label>
              <button className="btn primary" type="button" onClick={onChangePassword} disabled={authLoading}>Change password</button>
            </div>
          )}
          <div className="drawer-card">
            <div className="drawer-card-head">
              <strong>Scope locked</strong>
              <span className={`tag ${canEditScope ? "amber" : "green"}`}>{canEditScope ? "admin editable" : "login scoped"}</span>
            </div>
            <label><span>Tenant</span><input disabled={!canEditScope} value={scope.tenantId} onChange={(event) => onScopeChange({ ...scope, tenantId: event.currentTarget.value })} /></label>
            <label><span>Workspace</span><input disabled={!canEditScope} value={scope.workspaceId} onChange={(event) => onScopeChange({ ...scope, workspaceId: event.currentTarget.value })} /></label>
            <label><span>Actor</span><input disabled={!canEditScope} value={scope.actorId} onChange={(event) => onScopeChange({ ...scope, actorId: event.currentTarget.value })} /></label>
            <small>普通用户的 scope 来自登录会话；只有 platform admin 才允许切换 scope 做跨租户管理。</small>
          </div>
        </div>
      </aside>
    );
  }

  const titleMap: Record<Exclude<DrawerKind, "session">, [string, string]> = {
    review: ["Evidence drawer", "按需展开。普通用户不需要常驻看到这些细节，AI Agent 可以读取这些字段继续自动化。"],
    diff: ["Draft diff evidence", "记录本次用户修改如何进入 profile，并保留可审计 digest。"],
    blocker: ["Failure trace", "异常定位需要能让 AI 根据日志找到问题所在，并给出最小修复范围。"],
    release: ["Release evidence", "最终发布摘要保留完整 evidence digest、风险、决策字段和 nextAction。"],
    api: ["API action evidence", apiNotice]
  };
  const [title, subtitle] = titleMap[kind];

  return (
    <aside className="drawer">
      <DrawerHead title={title} subtitle={subtitle} />
      <div className="drawer-body">
        <EvidenceRow label="requestId" value={lastAction?.requestId ?? "not returned"} />
        <EvidenceRow label="profileDraft" value={`${profileDraft.profileId}${profileDraft.version ? ` v${profileDraft.version}` : ""} · ${profileDraft.sourceDigest ?? "sourceDigest missing"}`} />
        <EvidenceRow label="compiledDigest" value={profileDraft.compiledDigest ?? "not returned"} />
        <EvidenceRow label="policyRefs" value={profileDraft.policyRefs.join(", ") || "none"} />
        <EvidenceRow label="generatedBy" value={profileDraft.generatedByEvidence.join("; ") || "not returned"} />
        <EvidenceRow label="lastAction" value={lastAction ? `${lastAction.method} ${lastAction.path} · status=${lastAction.status}` : "none"} />
        <EvidenceRow label="nextAction" value={lastAction?.nextAction ?? "none"} />
        <div className="drawer-card">
          <div className="drawer-card-head">
            <strong>Log trace</strong>
            <button className="mini-btn" type="button" onClick={onRefresh} disabled={apiLoading}><RefreshCw size={13} aria-hidden="true" /> Refresh</button>
          </div>
          <LogLine level={lastAction?.ok ? "INFO" : lastAction ? "ERROR" : "INFO"} text={lastAction?.error ?? lastAction?.actionLabel ?? "No API action yet"} />
          <LogLine level="INFO" text={`project=${context.projectId || "not-set"} goal=${context.goalId || "not-set"} loop=${context.loopId || "not-set"}`} />
          <LogLine level={lastAction?.nextAction ? "WARN" : "INFO"} text={`nextAction=${lastAction?.nextAction ?? "none"} blockers=${lastAction?.blockers?.join(", ") || "none"}`} />
        </div>
        <details className="drawer-card">
          <summary>Advanced control details</summary>
          <label><span>Project ID</span><input value={context.projectId} onChange={(event) => onPatchContext({ projectId: event.currentTarget.value })} /></label>
          <label><span>Goal ID</span><input value={context.goalId} onChange={(event) => onPatchContext({ goalId: event.currentTarget.value })} /></label>
          <label><span>Loop ID</span><input value={context.loopId} onChange={(event) => onPatchContext({ loopId: event.currentTarget.value })} /></label>
          <label><span>Token Ref</span><input value={context.tokenRef} onChange={(event) => onPatchContext({ tokenRef: event.currentTarget.value })} /></label>
          <label><span>LLM Profile</span><input value={context.llmProfileId} onChange={(event) => onPatchContext({ llmProfileId: event.currentTarget.value })} /></label>
          <label><span>Template override</span><input value={context.templateId} onChange={(event) => onPatchContext({ templateId: event.currentTarget.value })} /></label>
        </details>
        <details className="drawer-card">
          <summary>Server projections</summary>
          <div className="projection-list">
            {Object.entries(snapshot).length === 0 && <small>No projections loaded.</small>}
            {Object.entries(snapshot).map(([key, result]) => (
              <div key={key} className={`projection ${result.ok ? "ok" : "failed"}`}>
                <span>{key}</span>
                <strong>{result.status}</strong>
                <small>{result.requestId ?? result.error ?? "no requestId"}</small>
              </div>
            ))}
          </div>
        </details>
      </div>
    </aside>
  );
}

function DrawerHead({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="drawer-head">
      <h3>{title}</h3>
      <p>{subtitle}</p>
    </div>
  );
}

function EvidenceRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="evidence-row">
      <span>{label}</span>
      <code>{value}</code>
    </div>
  );
}

function LogLine({ level, text }: { level: "INFO" | "WARN" | "ERROR"; text: string }) {
  return (
    <div className={`log-line ${level.toLowerCase()}`}>
      <code>{level}</code>
      <span>{text}</span>
    </div>
  );
}

function fallbackProfileYaml(context: ProjectLoopContext, profileDraft: HarnessProfileDraft) {
  return [
    "projectHarnessProfile:",
    `  id: ${profileDraft.profileId}`,
    `  status: ${profileDraft.status ?? "DRAFT"}`,
    "  inherits:",
    `    - ${profileDraft.templateRef || "auto-matched-template"}`,
    "  scope:",
    `    include: [${context.projectName || context.projectId || "project domain"}, HTTP API, persistence]`,
    "    exclude: [external systems not owned by this project]",
    "  controls:",
    "    exceptionHandling:",
    "      required: [exception handlers, middleware, domain exception mapper]",
    "    logging:",
    "      requiredFields: [requestId, correlationId, phaseId, module, action, cause]",
    "    observability:",
    "      required: [metrics, traces, APM map, alert policy]",
    "    releaseGates:",
    "      required: [preflight, canary evidence, rollback evidence, human approval]"
  ].join("\n");
}
