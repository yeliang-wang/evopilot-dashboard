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

const storage = window.localStorage;
const sessionStorage = window.sessionStorage;
const query = new URLSearchParams(window.location.search);
const demoMode = query.get("demo") === "1";
const demoStep = normalizeDemoStep(query.get("step"));

const sampleGoal = "接入 GitHub 项目 github.com/acme/inventory-service，目标是把它提升到 GA-ready 的企业级 Python Web 服务：需要明确能力边界、异常处理、日志、监控、APM、CI/CD、发布门禁和回滚要求。";

const defaultScope: DashboardScope = {
  tenantId: storage.getItem("evopilot.tenantId") ?? "tenant-production",
  workspaceId: storage.getItem("evopilot.workspaceId") ?? "workspace-agent-products",
  actorId: storage.getItem("evopilot.actorId") ?? "workbuddy",
  token: sessionStorage.getItem("evopilot.apiToken") ?? ""
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

  useEffect(() => {
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

  return (
    <div className="app-shell">
      <Sidebar context={context} consoleStep={consoleStep} />
      <section className="console-shell">
        <Topbar
          consoleStep={consoleStep}
          scope={scope}
          session={session}
          apiOk={liveProjectionSummary.ok}
          apiFailed={liveProjectionSummary.failed.length}
          onOpenSession={() => setDrawer("session")}
          onRefresh={() => void refreshApiSnapshot()}
          refreshing={apiLoading}
        />
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
              session={session}
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

function Sidebar({ context, consoleStep }: { context: ProjectLoopContext; consoleStep: ConsoleStep }) {
  const projectName = context.projectName || context.projectId || projectIdFromRepository(context.repositoryUrl) || "New project";
  const repo = context.repositoryUrl || "repository not set";
  return (
    <aside className="sidebar" aria-label="EvoPilot Agent Console sidebar">
      <div className="brand">
        <h1>EvoPilot</h1>
        <span>Agent Console</span>
      </div>
      <div className="project-switcher">
        <span>Workspace / Project</span>
        <strong>{projectName}</strong>
        <code>{repo}</code>
        <code>tenant: {defaultScope.tenantId} · ws: {defaultScope.workspaceId}</code>
      </div>
      <div className="sidebar-section">
        <h2>Active sessions</h2>
        <div className="session-list">
          <SidebarSession active title="GA readiness loop" detail={sessionDetail(consoleStep)} tone="blue" />
          <SidebarSession title="Observability hardening" detail="Paused at approval gate" tone="amber" />
          <SidebarSession title="Release evidence audit" detail="Completed yesterday" tone="green" />
        </div>
      </div>
      <div className="recent-decisions">
        <h2>Recent decisions</h2>
        <Decision tone="green" title="Template matched" detail="auto-match from project context" />
        <Decision tone="blue" title="Owner gate" detail="ProjectHarnessProfile draft review" />
        <Decision tone="amber" title="Evidence scope" detail="security, logs, tracing, deploy checks" />
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
  consoleStep,
  scope,
  session,
  apiOk,
  apiFailed,
  refreshing,
  onOpenSession,
  onRefresh
}: {
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
  const [title, subtitle] = titleMap[consoleStep];
  return (
    <header className="topbar">
      <div>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
      <div className="status-strip">
        <button type="button" className={`chip ${scope.token ? "green" : "amber"}`} onClick={onOpenSession}>
          <ShieldCheck size={14} aria-hidden="true" />
          {scope.token ? session?.user?.role ?? "signed in" : "sign in required"}
        </button>
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
            <strong>{scope.token ? "Signed in" : "Sign in required"}</strong>
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
            <label><span>Tenant</span><input value={scope.tenantId} onChange={(event) => onScopeChange({ ...scope, tenantId: event.currentTarget.value })} /></label>
            <label><span>Workspace</span><input value={scope.workspaceId} onChange={(event) => onScopeChange({ ...scope, workspaceId: event.currentTarget.value })} /></label>
            <label><span>Actor</span><input value={scope.actorId} onChange={(event) => onScopeChange({ ...scope, actorId: event.currentTarget.value })} /></label>
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
