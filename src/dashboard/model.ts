import {
  apiSurface,
  type ApiResult,
  type DashboardActionRequest,
  type DashboardActionResult,
  type DashboardProjectionContext,
  type DashboardScope,
  type DashboardSession
} from "../api";

export type ConsoleStep =
  | "intake"
  | "template-match"
  | "drafting"
  | "review"
  | "changes"
  | "activated"
  | "loop"
  | "blocker"
  | "release";

export type DrawerKind = "session" | "review" | "diff" | "blocker" | "release" | "api";
export type PageId = "console" | "tenants" | "workspaces" | "users" | "templates" | "llm-profiles" | "audit";
export type ProjectDeliveryChain = "github-native" | "gitlab-native" | "github-source-gitlab-ci";

export type MessageRole = "user" | "agent";

export interface ProjectLoopContext extends DashboardProjectionContext {
  projectName: string;
  repositoryProvider: string;
  repositoryUrl: string;
  defaultBranch: string;
  tokenRef: string;
  deliveryChain: ProjectDeliveryChain;
  executionMode: string;
  devopsOwner: string;
  ciWorkflow: string;
  ciRequiredCheck: string;
  ciRequiredStage: string;
  ciRequiredJob: string;
  workflowProvider: string;
  workflowBaseUrl: string;
  workflowRepository: string;
  workflowProjectId: string;
  workflowBranch: string;
  gitlabRef: string;
  devopsTokenRef: string;
  cdRequiredStage: string;
  cdRequiredJob: string;
  readyUrl: string;
  llmProfileId: string;
  profileId: string;
  profileVersion: string;
  templateId: string;
  goalLoopTarget: string;
  confirmedBy: string;
  confirmation: string;
}

export interface HarnessProfileDraft {
  profileId: string;
  version?: number;
  status?: string;
  sourceContent?: string;
  compiledContent?: string;
  sourceDigest?: string;
  compiledDigest?: string;
  policyRefs: string[];
  templateRef?: string;
  harnessLayer?: string;
  domain?: string;
  compatibilityProfiles: string[];
  architectureProfiles: string[];
  runtimeProfiles: string[];
  referenceBoundary?: string;
  domainRequiredActions: string[];
  evidenceAdapters: string[];
  releaseBlockers: string[];
  missingModuleBoundaries: string[];
  repoProbeStatus?: string;
  generatedByEvidence: string[];
  validationSummary?: string;
  diffSummary?: string;
  raw?: unknown;
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  title: string;
  text: string;
  time: string;
  card: "intake" | "template" | "drafting" | "review" | "diff" | "activated" | "loop" | "blocker" | "release" | "session" | "api";
}

export interface ReviewStep {
  id: string;
  label: string;
  status: "READY" | "REVIEW" | "WAITING" | "BLOCKED" | "DONE";
  detail: string;
  requestId?: string;
  result?: DashboardActionResult;
}

export interface TenantForm {
  tenantId: string;
  name: string;
  plan: string;
  status: string;
}

export interface WorkspaceForm {
  tenantId: string;
  workspaceId: string;
  owner: string;
  projectLimit: string;
  loopLimit: string;
}

export interface UserForm {
  username: string;
  tenantId: string;
  workspaceId: string;
  role: string;
  password: string;
  status: string;
}

export interface TemplateEvolutionForm {
  baseTemplateId: string;
  targetVersion: string;
  intent: string;
  sourceType: string;
  sourceUri: string;
}

export interface LlmProfileForm {
  profileId: string;
  scope: "workspace" | "user";
  providerPreset: "glm" | "kimi" | "gemma" | "custom";
  modelName: string;
  apiKeyRef: string;
  baseUrl: string;
}

export const storage = window.localStorage;
export const sessionStorage = window.sessionStorage;
export const query = new URLSearchParams(window.location.search);
export const demoMode = query.get("demo") === "1";
export const demoStep = normalizeDemoStep(query.get("step"));
export const demoPage = normalizePage(query.get("page"));

export const sampleGoal = "接入 GitHub 项目 github.com/acme/inventory-service，目标是把它提升到 GA-ready 的企业级 Python Web 服务：需要明确能力边界、异常处理、日志、监控、APM、CI/CD、发布门禁和回滚要求。";

export const defaultScope: DashboardScope = {
  tenantId: storage.getItem("evopilot.tenantId") ?? "tenant-production",
  workspaceId: storage.getItem("evopilot.workspaceId") ?? "workspace-agent-products",
  actorId: storage.getItem("evopilot.actorId") ?? "workbuddy",
  token: sessionStorage.getItem("evopilot.apiToken") ?? (demoMode ? "demo-token" : "")
};

storage.removeItem("evopilot.apiToken");

export const defaultContext: ProjectLoopContext = {
  projectId: storage.getItem("evopilot.projectId") ?? (demoMode ? "inventory-service" : ""),
  projectName: storage.getItem("evopilot.projectName") ?? (demoMode ? "inventory-service" : ""),
  repositoryProvider: storage.getItem("evopilot.repositoryProvider") ?? "github",
  repositoryUrl: storage.getItem("evopilot.repositoryUrl") ?? (demoMode ? "https://github.com/acme/inventory-service.git" : ""),
  defaultBranch: storage.getItem("evopilot.defaultBranch") ?? "main",
  tokenRef: storage.getItem("evopilot.tokenRef") ?? "",
  deliveryChain: normalizeDeliveryChain(storage.getItem("evopilot.deliveryChain")) ?? "github-native",
  executionMode: storage.getItem("evopilot.executionMode") ?? "owned-repository",
  devopsOwner: storage.getItem("evopilot.devopsOwner") ?? (demoMode ? "acme" : ""),
  ciWorkflow: storage.getItem("evopilot.ciWorkflow") ?? "ci.yml",
  ciRequiredCheck: storage.getItem("evopilot.ciRequiredCheck") ?? "build",
  ciRequiredStage: storage.getItem("evopilot.ciRequiredStage") ?? "test",
  ciRequiredJob: storage.getItem("evopilot.ciRequiredJob") ?? "build",
  workflowProvider: storage.getItem("evopilot.workflowProvider") ?? "gitlab",
  workflowBaseUrl: storage.getItem("evopilot.workflowBaseUrl") ?? "",
  workflowRepository: storage.getItem("evopilot.workflowRepository") ?? "",
  workflowProjectId: storage.getItem("evopilot.workflowProjectId") ?? "",
  workflowBranch: storage.getItem("evopilot.workflowBranch") ?? "main",
  gitlabRef: storage.getItem("evopilot.gitlabRef") ?? "main",
  devopsTokenRef: storage.getItem("evopilot.devopsTokenRef") ?? "",
  cdRequiredStage: storage.getItem("evopilot.cdRequiredStage") ?? "",
  cdRequiredJob: storage.getItem("evopilot.cdRequiredJob") ?? "",
  readyUrl: storage.getItem("evopilot.readyUrl") ?? "",
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

export const initialStep: ConsoleStep = demoStep ?? (demoMode ? "review" : "intake");

export const demoSession: DashboardSession = {
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

export function readStoredSession(): DashboardSession | undefined {
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

export function projectIdFromRepository(repositoryUrl: string): string {
  const clean = repositoryUrl.trim().replace(/\.git$/, "");
  const fallback = clean.split("/").filter(Boolean).pop() ?? "";
  return fallback.replace(/[^a-zA-Z0-9._-]/g, "-").toLowerCase();
}

export function normalizeDemoStep(value: string | null): ConsoleStep | undefined {
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

export function normalizePage(value: string | null): PageId | undefined {
  const allowed: PageId[] = ["console", "tenants", "workspaces", "users", "templates", "llm-profiles", "audit"];
  return allowed.find((page) => page === value);
}

export function normalizeDeliveryChain(value: string | null | undefined): ProjectDeliveryChain | undefined {
  const text = String(value ?? "").trim();
  if (text === "github-native" || text === "github-actions") return "github-native";
  if (text === "gitlab-native" || text === "gitlab-ci") return "gitlab-native";
  if (text === "github-source-gitlab-ci" || text === "github-gitlab-bridge" || text === "external-source") return "github-source-gitlab-ci";
  return undefined;
}

export function deliveryChainLabel(chain: ProjectDeliveryChain): string {
  if (chain === "github-native") return "GitHub source + GitHub Actions";
  if (chain === "gitlab-native") return "GitLab source + GitLab CI";
  return "GitHub source + GitLab CI Bridge";
}

export function repositoryProviderForChain(chain: ProjectDeliveryChain): string {
  return chain === "gitlab-native" ? "gitlab" : "github";
}

export function devopsProviderForChain(chain: ProjectDeliveryChain): "github-actions" | "gitlab-ci" {
  return chain === "github-native" ? "github-actions" : "gitlab-ci";
}

export function nowTime() {
  return new Intl.DateTimeFormat("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date());
}

export function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
}

export function dataEnvelope(value: unknown): unknown {
  const record = asRecord(value);
  return record && "data" in record ? record.data : value;
}

export function stringField(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

export function numberField(value: unknown): number | undefined {
  return typeof value === "number" ? value : undefined;
}

export function stringList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

export function readableJson(value: unknown): string {
  if (typeof value === "string") return value;
  if (value === undefined) return "";
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export function resultItems(result: ApiResult | undefined, aliases: string[] = []): Record<string, unknown>[] {
  if (!result?.data) return [];
  return collectRecords(dataEnvelope(result.data), aliases);
}

export function collectRecords(value: unknown, aliases: string[]): Record<string, unknown>[] {
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

export function fieldText(record: Record<string, unknown> | undefined, keys: string[], fallback = "-"): string {
  if (!record) return fallback;
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value;
    if (typeof value === "number" || typeof value === "boolean") return String(value);
  }
  return fallback;
}

export function roleLabel(session?: DashboardSession): string {
  if (session?.user?.platformAdmin) return "platform admin";
  return session?.user?.role ?? "operator";
}

export function isPlatformAdmin(session?: DashboardSession): boolean {
  return Boolean(session?.user?.platformAdmin || session?.user?.role === "platform-admin" || session?.user?.role === "admin");
}

export function extractHarnessDraft(value: unknown): HarnessProfileDraft | undefined {
  const data = asRecord(dataEnvelope(value));
  if (!data) return undefined;
  const profile = asRecord(data.profile) ?? data;
  const summary = asRecord(data.summary);
  const generatedBy = asRecord(profile.generatedBy) ?? asRecord(data.generatedBy);
  const validation = profile.validation ?? data.validation;
  const diffFromActive = profile.diffFromActive ?? data.diffFromActive;
  const templateRef = profile.templateRef ?? data.templateRef;
  const sourceContentValue = profile.sourceContent ?? data.sourceContent;
  const sourceRecord = asRecord(sourceContentValue);
  const runtimeRecord = asRecord(sourceRecord?.runtime);
  const validationRecord = asRecord(sourceRecord?.validation);
  const evidenceRecord = asRecord(sourceRecord?.evidence);
  const rulesRecord = asRecord(sourceRecord?.rules);
  const metadataRecord = asRecord(sourceRecord?.metadata);
  const repoProbeRecord = asRecord(metadataRecord?.repoProbe);
  const domainRequiredActions = profileLabels(rulesRecord?.domainHarnessRequiredActions);

  const evidenceValues = [
    ...stringList(generatedBy?.evidence),
    ...stringList(asRecord(generatedBy)?.selectionReasons)
  ];

  return {
    profileId: stringField(profile.profileId) ?? stringField(profile.id) ?? stringField(summary?.profileId) ?? "default",
    version: numberField(profile.version) ?? numberField(summary?.latestVersion),
    status: stringField(profile.status) ?? stringField(data.status) ?? "DRAFT",
    sourceContent: stringField(sourceContentValue) ?? (sourceContentValue === undefined ? undefined : readableJson(sourceContentValue)),
    compiledContent: stringField(profile.compiledContent) ?? stringField(data.compiledContent),
    sourceDigest: stringField(profile.sourceDigest) ?? stringField(data.sourceDigest),
    compiledDigest: stringField(profile.compiledDigest) ?? stringField(data.compiledDigest),
    policyRefs: stringList(profile.policyRefs ?? data.policyRefs),
    templateRef: typeof templateRef === "string" ? templateRef : readableJson(templateRef || undefined),
    harnessLayer: stringField(runtimeRecord?.harnessLayer) ?? stringField(metadataRecord?.templateHarnessLayer),
    domain: stringField(runtimeRecord?.domain) ?? stringField(metadataRecord?.templateDomain),
    compatibilityProfiles: profileLabels(runtimeRecord?.compatibilityProfiles ?? metadataRecord?.compatibilityProfiles),
    architectureProfiles: profileLabels(runtimeRecord?.architectureProfiles ?? metadataRecord?.architectureProfiles),
    runtimeProfiles: profileLabels(runtimeRecord?.runtimeProfiles ?? metadataRecord?.runtimeProfiles),
    referenceBoundary: readableJson((runtimeRecord?.referenceBoundary ?? metadataRecord?.referenceBoundary) || undefined),
    domainRequiredActions: domainRequiredActions.length > 0 ? domainRequiredActions : stringList(validationRecord?.requiredActions),
    evidenceAdapters: profileLabels(evidenceRecord?.evidenceAdapters),
    releaseBlockers: stringList(rulesRecord?.domainHarnessReleaseBlockers),
    missingModuleBoundaries: stringList(validationRecord?.missingModuleBoundaries ?? repoProbeRecord?.missingModuleBoundaries),
    repoProbeStatus: stringField(repoProbeRecord?.status),
    generatedByEvidence: evidenceValues,
    validationSummary: readableJson(validation || undefined),
    diffSummary: readableJson(diffFromActive || undefined),
    raw: value
  };
}

export function profileLabels(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === "string") return item;
      const record = asRecord(item);
      return stringField(record?.id) ?? stringField(record?.name) ?? stringField(record?.artifact) ?? stringField(record?.referenceProduct);
    })
    .filter((item): item is string => Boolean(item));
}

export function extractGoalId(value: unknown): string | undefined {
  const data = asRecord(dataEnvelope(value));
  return stringField(data?.id) ?? stringField(data?.goalId);
}

export function buildOnboardingAction(context: ProjectLoopContext): DashboardActionRequest {
  const projectId = context.projectId || projectIdFromRepository(context.repositoryUrl);
  const chain = normalizeDeliveryChain(context.deliveryChain) ?? "github-native";
  const repositoryProvider = repositoryProviderForChain(chain);
  const devopsProvider = devopsProviderForChain(chain);
  const bridgeMode = chain === "github-source-gitlab-ci";
  const gitlabWorkflowRepository = context.workflowProjectId || context.workflowRepository;
  const devopsTokenRef = context.devopsTokenRef || undefined;
  const ci = devopsProvider === "github-actions"
    ? {
        workflow: context.ciWorkflow || undefined,
        requiredChecks: context.ciRequiredCheck ? [context.ciRequiredCheck] : undefined
      }
    : {
        ref: bridgeMode
          ? context.gitlabRef || context.workflowBranch || undefined
          : context.gitlabRef || context.defaultBranch || undefined,
        requiredStages: context.ciRequiredStage ? [context.ciRequiredStage] : undefined,
        requiredJobs: context.ciRequiredJob ? [context.ciRequiredJob] : undefined
      };
  const cd = context.cdRequiredStage || context.cdRequiredJob || context.readyUrl ? {
    requiredStages: context.cdRequiredStage ? [context.cdRequiredStage] : undefined,
    requiredJobs: context.cdRequiredJob ? [context.cdRequiredJob] : undefined,
    readyUrl: context.readyUrl || undefined
  } : undefined;
  return {
    id: "project-preflight",
    label: "Project Onboarding Checklist",
    method: "POST",
    path: apiSurface.onboardingChecklist,
    body: {
      id: projectId,
      name: context.projectName || projectId,
      repository: {
        provider: repositoryProvider,
        gitUrl: context.repositoryUrl,
        defaultBranch: context.defaultBranch
      },
      tokenRef: context.tokenRef || undefined,
      devops: {
        provider: devopsProvider,
        sourceMode: bridgeMode ? "external-source" : "repository-native",
        executionMode: context.executionMode,
        devopsOwner: context.devopsOwner || undefined,
        workflowRepository: bridgeMode ? undefined : context.workflowRepository || context.repositoryUrl || undefined,
        workflowProvider: bridgeMode ? context.workflowProvider || "gitlab" : undefined,
        workflowBaseUrl: bridgeMode ? context.workflowBaseUrl || undefined : undefined,
        workflowRepo: bridgeMode ? context.workflowRepository || undefined : undefined,
        workflowProjectId: bridgeMode ? gitlabWorkflowRepository || undefined : undefined,
        workflowBranch: bridgeMode ? context.workflowBranch || undefined : undefined,
        gitlabRef: bridgeMode ? context.gitlabRef || context.workflowBranch || undefined : undefined,
        tokenRef: devopsTokenRef,
        bridge: bridgeMode ? {
          workflowProvider: context.workflowProvider || "gitlab",
          workflowRepository: {
            provider: "gitlab",
            baseUrl: context.workflowBaseUrl || undefined,
            projectId: gitlabWorkflowRepository || undefined,
            defaultBranch: context.workflowBranch || undefined
          },
          gitlabRef: context.gitlabRef || context.workflowBranch || undefined
        } : undefined,
        ci,
        cd
      },
      llmProfileId: context.llmProfileId || undefined,
      objective: context.goalLoopTarget
    }
  };
}

export function defaultDraft(context: ProjectLoopContext): HarnessProfileDraft {
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
      "    - database-product-harness@2.1.0",
      "  scope:",
      "    include: [self-developed database product, SQL engine, storage engine, recovery]",
      "    exclude: [evolving PostgreSQL or MySQL upstreams as the product]",
      "  harnessLayers:",
      "    domain: database-product",
      "    compatibilityProfiles: [postgres-compatible, mysql-compatible, ansi-sql]",
      "    architectureProfiles: [distributed, htap, mpp]",
      "    runtimeProfiles: [java, go, rust, generic]",
      "  controls:",
      "    domainRules: [SQL compatibility, transaction isolation, crash recovery]",
      "    referenceBoundary: PostgreSQL/MySQL are compatibility oracles only",
      "    requiredActions: [declare-database-product-boundary, map-engine-module-boundaries, bind-sql-compatibility-suite, bind-correctness-and-recovery-suite]",
      "    evidenceAdapters: [sql-compatibility-report, differential-oracle-report, crash-recovery-log, benchmark-summary]",
      "    releaseBlockers: [missing product boundary, missing module boundary map, missing SQL compatibility report, missing recovery proof]",
      "    exceptionHandling:",
      "      required: [sqlState, queryId, transactionId, traceId]",
      "      validation: release-blocking SQL and protocol error contract tests",
      "    logging:",
      "      requiredFields: [requestId, traceId, queryId, transactionId, sqlState]",
      "      triage: ERROR logs must link to evidence.requestId",
      "    observability:",
      "      required: [query latency, transaction aborts, replication lag, recovery status]",
      "    releaseGates:",
      "      required: [SQL compatibility report, recovery proof, benchmark summary, human approval]"
    ].join("\n"),
    compiledContent: "",
    sourceDigest: "sha256:7aa1c8...e912",
    compiledDigest: "sha256:41c8...compiled",
    policyRefs: [],
    templateRef: "database-product-harness@2.1.0",
    harnessLayer: "domain",
    domain: "database-product",
    compatibilityProfiles: ["postgres-compatible", "mysql-compatible", "ansi-sql"],
    architectureProfiles: ["distributed", "htap", "mpp"],
    runtimeProfiles: ["java", "go", "rust", "generic"],
    referenceBoundary: "PostgreSQL and MySQL are compatibility references and differential oracles, not the evolved product.",
    domainRequiredActions: ["declare-database-product-boundary", "map-engine-module-boundaries", "bind-sql-compatibility-suite", "bind-correctness-and-recovery-suite"],
    evidenceAdapters: ["sql-compatibility-report", "differential-oracle-report", "crash-recovery-log", "benchmark-summary"],
    releaseBlockers: ["missing product boundary", "missing module boundary map", "missing SQL compatibility report", "missing recovery proof"],
    missingModuleBoundaries: [],
    repoProbeStatus: "PROBED",
    generatedByEvidence: ["templateSelection=auto-match", "domain=database-product", "domainSignal=database product", `project=${projectId}`],
    validationSummary: "32 checks; SQL compatibility, recovery, benchmark, observability, and release gates are release-blocking.",
    diffSummary: "No active profile in demo baseline.",
    raw: undefined
  };
}

export function initialMessages(step: ConsoleStep): ChatMessage[] {
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
      text: "项目上下文已解析。EvoPilot 自动匹配更贴合的领域 HarnessTemplate，不要求普通用户手动选择模板。",
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

export function focusMessages(step: ConsoleStep, messages: ChatMessage[]): ChatMessage[] {
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
