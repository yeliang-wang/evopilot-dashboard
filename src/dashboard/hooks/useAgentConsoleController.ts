import { useEffect, useMemo, useRef, useState } from "react";
import {
  apiSurface,
  changePassword,
  executeDashboardAction,
  loadDashboardApiSnapshot,
  login as loginToEvoPilot,
  publicApiFetch,
  type ApiResult,
  type DashboardActionRequest,
  type DashboardActionResult,
  type DashboardScope,
  type DashboardSession
} from "../../api";
import { stageState } from "../components";
import {
  buildOnboardingAction,
  defaultContext,
  defaultDraft,
  defaultScope,
  demoMode,
  demoPage,
  demoSession,
  extractGoalId,
  extractHarnessDraft,
  focusMessages,
  initialMessages,
  initialStep,
  isPlatformAdmin,
  nowTime,
  projectIdFromRepository,
  readStoredSession,
  sessionStorage,
  storage,
  type ChatMessage,
  type ConsoleStep,
  type DrawerKind,
  type HarnessBindingDraft,
  type LlmProfileForm,
  type PageId,
  type ProjectLoopContext,
  type ReviewStep,
  type TenantForm,
  type UserForm,
  type WorkspaceForm
} from "../model";

export function useAgentConsoleController() {
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
  const apiRefreshId = useRef(0);
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
  const [profileDraft, setProfileDraft] = useState<HarnessBindingDraft | undefined>(() => demoMode ? defaultDraft(defaultContext) : undefined);
  const [reviewSteps, setReviewSteps] = useState<ReviewStep[]>([]);
  const [lastAction, setLastAction] = useState<DashboardActionResult | undefined>();
  const [busyAction, setBusyAction] = useState<string | undefined>();
  const [ownerChange, setOwnerChange] = useState("");
  const [composerGoal, setComposerGoal] = useState(defaultContext.goalLoopTarget);
  const [activePage, setActivePage] = useState<PageId>(demoPage ?? "console");
  const [tenantForm, setTenantForm] = useState<TenantForm>({
    tenantId: "tenant-payments",
    name: "Payments",
    plan: "SaaS",
    status: "ACTIVE"
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
  const [llmProfileForm, setLlmProfileForm] = useState<LlmProfileForm>({
    profileId: "workspace-glm-52",
    scope: "workspace",
    providerPreset: "glm",
    modelName: "glm-5.2",
    apiKeyRef: "LLM_ZHIPU_PROD",
    baseUrl: ""
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
    const refreshId = apiRefreshId.current + 1;
    apiRefreshId.current = refreshId;
    setApiLoading(true);
    if (!scopeOverride.token) {
      setApiSnapshot({});
      setApiNotice("Sign in to load live EvoPilot projections");
      setApiLoading(false);
      return;
    }
    const snapshot = await loadDashboardApiSnapshot(scopeOverride, contextOverride, {
      onResult: (key, result) => {
        if (apiRefreshId.current !== refreshId) return;
        setApiSnapshot((current) => ({ ...current, [key]: result }));
      }
    });
    if (apiRefreshId.current !== refreshId) return;
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
        ? "项目上下文已解析。EvoPilot 会在 goal plan 阶段从已发布 Catalog 自动绑定 selectedHarness。"
        : `项目接入检查被阻塞：${checklist.nextAction ?? checklist.error ?? checklist.status}`,
      card: checklist.ok ? "template" : "api"
    });

    if (!checklist.ok) {
      setDrawer("api");
      return;
    }

    await createGoalAndPlan(nextContext.projectId || projectIdFromRepository(nextContext.repositoryUrl));
  }

  async function generateHarnessDraft(baseContext = context, changeText?: string) {
    setConsoleStep("drafting");
    appendMessage({
      role: "agent",
      title: "EvoPilot",
      text: "正在重新生成 goal plan。EvoPilot 会重新读取已发布 Catalog 并绑定 selectedHarness。",
      card: "drafting"
    });
    updateContext({
      ...baseContext,
      goalLoopTarget: changeText ? `${baseContext.goalLoopTarget}\n\nOwner requested change:\n${changeText}` : baseContext.goalLoopTarget
    });
    await createGoalAndPlan(baseContext.projectId || projectIdFromRepository(baseContext.repositoryUrl), Boolean(changeText));
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
    setConsoleStep("activated");
    setDrawer(undefined);
    appendMessage({
      role: "agent",
      title: "EvoPilot",
      text: "selectedHarness 和 phase plan 已完成人工确认。下一步需要填写真实 confirmedBy 与 confirmation 后批准计划。",
      card: "activated"
    });
  }

  async function createGoalAndPlan(projectId: string, changeText = false) {
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
    const binding = extractHarnessDraft(plan.data);
    if (binding) setProfileDraft(binding);
    setReviewSteps((current) => [
      ...current,
      {
        id: "plan-goal",
        label: "Phase Plan selectedHarness",
        status: plan.ok ? "REVIEW" : "BLOCKED",
        detail: plan.ok
          ? "Alpha/Beta/RC/GA phase plan generated. Show selectedHarness binding before approval."
          : plan.error ?? "Goal plan failed.",
        requestId: plan.requestId,
        result: plan
      }
    ]);
    if (!plan.ok || !binding) {
      setDrawer("api");
      appendMessage({
        role: "agent",
        title: "EvoPilot",
        text: `Goal plan 生成失败或缺少 selectedHarness：${plan.nextAction ?? plan.error ?? plan.status}`,
        card: "api"
      });
      return;
    }
    setConsoleStep(changeText ? "changes" : "review");
    setDrawer(changeText ? "diff" : "review");
    appendMessage({
      role: "agent",
      title: "EvoPilot",
      text: changeText
        ? "已重新生成计划并更新 selectedHarness 绑定。请检查差异后再确认。"
        : "Review Pack 已生成。请检查 selectedHarness、Catalog digest、entry digest 和 phase plan 后再确认。",
      card: changeText ? "diff" : "review"
    });
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



  function updateComposerGoal(goal: string) {
    setComposerGoal(goal);
    patchContext({ goalLoopTarget: goal });
  }

  function toggleReviewDrawer() {
    setDrawer(drawer ? undefined : "review");
  }

  return {
    activeDraft,
    activePage,
    apiLoading,
    apiNotice,
    apiSnapshot,
    authLoading,
    authNotice,
    busyAction,
    canEditScope,
    composerGoal,
    consoleStep,
    context,
    demoMode,
    drawer,
    effectiveSession,
    focusedMessages,
    lastAction,
    liveProjectionSummary,
    llmProfileForm,
    loginForm,
    ownerChange,
    passwordForm,
    reviewSteps,
    scope,
    session,
    signedIn,
    stages,
    tenantForm,
    userForm,
    workspaceForm,
    approvePlanAndAdvance,
    confirmAndActivateHarness,
    performChangePassword,
    performLogin,
    refreshApiSnapshot,
    refreshReleaseEvidence,
    requestProfileChanges,
    runManagementAction,
    setActivePage,
    setDrawer,
    setLoginForm,
    setLlmProfileForm,
    setOwnerChange,
    setPasswordForm,
    setTenantForm,
    setUserForm,
    setWorkspaceForm,
    signOut,
    startIntake,
    toggleReviewDrawer,
    updateComposerGoal,
    updateScope,
    patchContext
  };
}
