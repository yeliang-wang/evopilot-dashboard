import { useEffect, useMemo, useState } from "react";
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

type PageId = "projects" | "runs" | "ops";
type ReviewStepStatus = "READY" | "REVIEW" | "WAITING" | "BLOCKED" | "DONE";

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

interface ReviewPackStep {
  id: string;
  label: string;
  status: ReviewStepStatus;
  detail: string;
  requestId?: string;
  result?: DashboardActionResult;
}

const storage = window.localStorage;
const sessionStorage = window.sessionStorage;

const defaultScope: DashboardScope = {
  tenantId: storage.getItem("evopilot.tenantId") ?? "tenant-production",
  workspaceId: storage.getItem("evopilot.workspaceId") ?? "workspace-agent-products",
  actorId: storage.getItem("evopilot.actorId") ?? "workbuddy",
  token: sessionStorage.getItem("evopilot.apiToken") ?? ""
};

storage.removeItem("evopilot.apiToken");

const defaultContext: ProjectLoopContext = {
  projectId: storage.getItem("evopilot.projectId") ?? "",
  projectName: storage.getItem("evopilot.projectName") ?? "",
  repositoryProvider: storage.getItem("evopilot.repositoryProvider") ?? "github",
  repositoryUrl: storage.getItem("evopilot.repositoryUrl") ?? "",
  defaultBranch: storage.getItem("evopilot.defaultBranch") ?? "main",
  tokenRef: storage.getItem("evopilot.tokenRef") ?? "",
  executionMode: storage.getItem("evopilot.executionMode") ?? "owned-repository",
  devopsOwner: storage.getItem("evopilot.devopsOwner") ?? "",
  ciWorkflow: storage.getItem("evopilot.ciWorkflow") ?? "ci.yml",
  ciRequiredCheck: storage.getItem("evopilot.ciRequiredCheck") ?? "build",
  llmProfileId: storage.getItem("evopilot.llmProfileId") ?? "",
  profileId: storage.getItem("evopilot.profileId") ?? "default",
  profileVersion: storage.getItem("evopilot.profileVersion") ?? "",
  templateId: storage.getItem("evopilot.templateId") ?? "",
  goalLoopTarget: storage.getItem("evopilot.goalLoopTarget") ?? "",
  goalId: storage.getItem("evopilot.goalId") ?? "",
  loopId: storage.getItem("evopilot.loopId") ?? "",
  confirmedBy: storage.getItem("evopilot.confirmedBy") ?? "",
  confirmation: storage.getItem("evopilot.confirmation") ?? ""
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

function readGeneratedProfile(value: unknown): { profileId?: string; version?: number } {
  if (!value || typeof value !== "object") return {};
  const envelope = value as Record<string, unknown>;
  const data = envelope.data && typeof envelope.data === "object" ? envelope.data as Record<string, unknown> : envelope;
  const profile = data.profile && typeof data.profile === "object" ? data.profile as Record<string, unknown> : undefined;
  return {
    profileId: typeof profile?.profileId === "string" ? profile.profileId : undefined,
    version: typeof profile?.version === "number" ? profile.version : undefined
  };
}

function readCreatedGoal(value: unknown): { goalId?: string } {
  if (!value || typeof value !== "object") return {};
  const envelope = value as Record<string, unknown>;
  const data = envelope.data && typeof envelope.data === "object" ? envelope.data as Record<string, unknown> : envelope;
  return { goalId: typeof data.id === "string" ? data.id : undefined };
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

function reviewPackIntro(context: ProjectLoopContext): ReviewPackStep[] {
  return [
    {
      id: "repository",
      label: "Repository",
      status: context.repositoryUrl ? "READY" : "WAITING",
      detail: context.repositoryUrl ? context.repositoryUrl : "Enter a GitHub, GitLab, or local-git repository first."
    },
    {
      id: "goal-target",
      label: "Goal Target",
      status: context.goalLoopTarget ? "READY" : "WAITING",
      detail: context.goalLoopTarget || "Describe the business outcome to evolve."
    },
    {
      id: "harness-draft",
      label: "Harness Draft",
      status: "REVIEW",
      detail: "EvoPilot generates a ProjectHarnessProfile DRAFT. It must be shown before activation."
    },
    {
      id: "phase-plan",
      label: "Phase Plan",
      status: "WAITING",
      detail: "Alpha/Beta/RC/GA plan must be shown before approval."
    },
    {
      id: "loop",
      label: "Loop",
      status: "WAITING",
      detail: "Execution starts only after review gates pass."
    },
    {
      id: "release",
      label: "Release Decision",
      status: "WAITING",
      detail: "GO/NO-GO comes from EvoPilot release evidence, not browser inference."
    }
  ];
}

export default function App() {
  const [activePage, setActivePage] = useState<PageId>("projects");
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
  const [reviewPack, setReviewPack] = useState<ReviewPackStep[]>(() => reviewPackIntro(defaultContext));
  const [lastAction, setLastAction] = useState<DashboardActionResult | undefined>();
  const [busyAction, setBusyAction] = useState<string | undefined>();

  const liveProjectionSummary = useMemo(() => {
    const entries = Object.entries(apiSnapshot);
    return {
      total: entries.length,
      ok: entries.filter(([, result]) => result.ok).length,
      failed: entries.filter(([, result]) => !result.ok)
    };
  }, [apiSnapshot]);

  useEffect(() => {
    void refreshBootstrap();
    if (defaultScope.token) void refreshApiSnapshot(defaultScope, defaultContext);
  }, []);

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
    setReviewPack(reviewPackIntro(nextContext));
  }

  function patchContext(patch: Partial<ProjectLoopContext>) {
    const inferredProjectId = patch.repositoryUrl && !context.projectId
      ? projectIdFromRepository(patch.repositoryUrl)
      : context.projectId;
    updateContext({ ...context, projectId: inferredProjectId, ...patch });
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

  async function generateReviewPack() {
    if (!scope.token) {
      setReviewPack([{ id: "auth", label: "Auth Session", status: "BLOCKED", detail: "Sign in before generating a Review Pack." }]);
      return;
    }

    const nextContext = {
      ...context,
      projectId: context.projectId || projectIdFromRepository(context.repositoryUrl),
      projectName: context.projectName || context.projectId || projectIdFromRepository(context.repositoryUrl)
    };
    updateContext(nextContext);
    const steps: ReviewPackStep[] = [];

    const checklist = await runAction(buildOnboardingAction(nextContext));
    steps.push({
      id: "project-preflight",
      label: "Project Onboarding Checklist",
      status: checklist.ok ? "READY" : "BLOCKED",
      detail: checklist.nextAction ?? checklist.error ?? "Checklist completed.",
      requestId: checklist.requestId,
      result: checklist
    });

    if (!checklist.ok) {
      setReviewPack(steps);
      return;
    }

    if (nextContext.projectId) {
      const generated = await runAction({
        id: "generate-harness-profile",
        label: "Generate ProjectHarnessProfile Draft",
        method: "POST",
        path: apiSurface.projectHarnessProfileGenerate(nextContext.projectId),
        body: {
          profileId: nextContext.profileId || "default",
          templateId: nextContext.templateId || undefined,
          goalLoopTarget: nextContext.goalLoopTarget,
          llmProfileId: nextContext.llmProfileId || undefined
        }
      });
      const generatedProfile = readGeneratedProfile(generated.data);
      if (generated.ok && generatedProfile.profileId) {
        updateContext({
          ...nextContext,
          profileId: generatedProfile.profileId,
          profileVersion: generatedProfile.version ? String(generatedProfile.version) : nextContext.profileVersion
        });
      }
      steps.push({
        id: "generate-harness-profile",
        label: "Harness Draft",
        status: generated.ok ? "REVIEW" : "BLOCKED",
        detail: generated.ok
          ? "DRAFT generated. Show sourceContent, compiledContent, validation, diff, digest, and policyRefs before activation."
          : generated.error ?? "Could not generate harness profile.",
        requestId: generated.requestId,
        result: generated
      });

      if (!generated.ok) {
        setReviewPack(steps);
        return;
      }
    }

    let plannedGoalId = nextContext.goalId;
    if (!plannedGoalId && nextContext.projectId && nextContext.goalLoopTarget) {
      const createdGoal = await runAction({
        id: "create-goal",
        label: "Create GlobalGoal",
        method: "POST",
        path: apiSurface.goals,
        body: {
          projectId: nextContext.projectId,
          releaseTargetId: "ga",
          objective: nextContext.goalLoopTarget,
          llmProfileId: nextContext.llmProfileId || undefined
        }
      });
      const goal = readCreatedGoal(createdGoal.data);
      if (createdGoal.ok && goal.goalId) {
        plannedGoalId = goal.goalId;
        updateContext({ ...nextContext, goalId: goal.goalId });
      }
      steps.push({
        id: "create-goal",
        label: "GlobalGoal",
        status: createdGoal.ok ? "READY" : "BLOCKED",
        detail: createdGoal.ok
          ? "GlobalGoal created from repository and business objective. Goal ID is saved under Advanced Control Details."
          : createdGoal.error ?? "Could not create GlobalGoal.",
        requestId: createdGoal.requestId,
        result: createdGoal
      });

      if (!createdGoal.ok || !plannedGoalId) {
        setReviewPack(steps);
        return;
      }
    }

    if (plannedGoalId) {
      const plan = await runAction({
        id: "plan-goal",
        label: "Generate Goal Phase Plan",
        method: "POST",
        path: apiSurface.goalPlan(plannedGoalId),
        body: {}
      });
      steps.push({
        id: "plan-goal",
        label: "Phase Plan",
        status: plan.ok ? "REVIEW" : "BLOCKED",
        detail: plan.ok
          ? "Alpha/Beta/RC/GA phase plan generated. Show it to the project owner before approval."
          : plan.error ?? "Goal plan was not generated.",
        requestId: plan.requestId,
        result: plan
      });
    } else {
      steps.push({
        id: "phase-plan",
        label: "Phase Plan",
        status: "WAITING",
        detail: "Set goalId after goal creation or run target plan through EvoPilot before phase approval."
      });
    }

    setReviewPack(steps);
  }

  async function activateReviewedHarness() {
    if (!context.projectId || !context.profileId) return;
    const result = await runAction({
      id: "activate-harness-profile",
      label: "Activate Reviewed ProjectHarnessProfile",
      method: "POST",
      path: apiSurface.projectHarnessProfileActivate(context.projectId, context.profileId),
      body: { version: Number(context.profileVersion || 0) || undefined }
    });
    setReviewPack((current) => [
      ...current,
      {
        id: "activate-harness-profile",
        label: "Harness Activation",
        status: result.ok ? "DONE" : "BLOCKED",
        detail: result.ok ? "Reviewed profile activated." : result.error ?? "Activation failed.",
        requestId: result.requestId,
        result
      }
    ]);
  }

  async function approvePhasePlan() {
    if (!context.goalId) return;
    const result = await runAction({
      id: "approve-goal-plan",
      label: "Approve Reviewed Phase Plan",
      method: "POST",
      path: apiSurface.goalApprovePlan(context.goalId),
      body: {
        confirmedBy: context.confirmedBy,
        confirmation: context.confirmation
      }
    });
    setReviewPack((current) => [
      ...current,
      {
        id: "approve-goal-plan",
        label: "Phase Plan Approval",
        status: result.ok ? "DONE" : "BLOCKED",
        detail: result.ok ? "Phase plan approved with explicit confirmation." : result.error ?? "Approval failed.",
        requestId: result.requestId,
        result
      }
    ]);
  }

  async function advanceGoal() {
    if (!context.goalId) return;
    const result = await runAction({
      id: "advance-goal",
      label: "Advance Goal One Step",
      method: "POST",
      path: apiSurface.goalAdvance(context.goalId),
      body: {}
    });
    setReviewPack((current) => [
      ...current,
      {
        id: "advance-goal",
        label: "Loop Advance",
        status: result.ok ? "DONE" : "BLOCKED",
        detail: result.nextAction ?? result.error ?? "Goal advanced.",
        requestId: result.requestId,
        result
      }
    ]);
  }

  const pageTitle = activePage === "projects" ? "Projects" : activePage === "runs" ? "Runs" : "Ops";
  const pageSubtitle = activePage === "projects"
    ? "Connect a repository, generate a Review Pack, then confirm before loop execution."
    : activePage === "runs"
      ? "Watch Alpha/Beta/RC/GA execution, blockers, evidence packages, and release decisions."
      : "Troubleshoot by requestId, nextAction, policy, credential, LLM, source closure, and release evidence.";

  return (
    <div className="shell">
      <aside className="sidebar" aria-label="EvoPilot Dashboard navigation">
        <div className="brand">
          <strong>EvoPilot</strong>
          <span>Project Loop Console</span>
        </div>
        <nav className="nav" aria-label="Primary navigation">
          {(["projects", "runs", "ops"] as PageId[]).map((page) => (
            <button key={page} type="button" className={activePage === page ? "active" : ""} onClick={() => setActivePage(page)}>
              <span>{page === "projects" ? "Projects" : page === "runs" ? "Runs" : "Ops"}</span>
              <small>{page === "projects" ? "12" : page === "runs" ? "5" : "2"}</small>
            </button>
          ))}
        </nav>
        <div className="scope">
          <span>Workspace</span>
          <strong>{scope.tenantId}</strong>
          <small>{scope.workspaceId}</small>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <h1>{pageTitle}</h1>
            <p>{pageSubtitle}</p>
          </div>
          <div className="status-cluster" aria-label="System status">
            <span className={liveProjectionSummary.ok > 0 ? "pill live" : "pill"}>{liveProjectionSummary.ok > 0 ? "API LIVE" : "API WAITING"}</span>
            <span className="pill">{session?.user?.role ?? "no role"}</span>
            <span className="pill">{configuredApiBaseUrl || "same-origin proxy"}</span>
          </div>
        </header>

        <SessionPanel
          session={session}
          scope={scope}
          notice={authNotice}
          loading={authLoading}
          loginForm={loginForm}
          passwordForm={passwordForm}
          onLoginForm={setLoginForm}
          onPasswordForm={setPasswordForm}
          onLogin={() => void performLogin()}
          onChangePassword={() => void performChangePassword()}
          onSignOut={signOut}
        />

        {activePage === "projects" && (
          <ProjectsView
            context={context}
            reviewPack={reviewPack}
            busyAction={busyAction}
            onPatchContext={patchContext}
            onGenerateReviewPack={() => void generateReviewPack()}
            onActivateHarness={() => void activateReviewedHarness()}
            onApprovePlan={() => void approvePhasePlan()}
            onAdvanceGoal={() => void advanceGoal()}
          />
        )}

        {activePage === "runs" && (
          <RunsView
            context={context}
            snapshot={apiSnapshot}
            reviewPack={reviewPack}
            lastAction={lastAction}
            onAdvanceGoal={() => void advanceGoal()}
          />
        )}

        {activePage === "ops" && (
          <OpsView
            scope={scope}
            context={context}
            apiNotice={apiNotice}
            apiLoading={apiLoading}
            snapshot={apiSnapshot}
            lastAction={lastAction}
            onScopeChange={updateScope}
            onPatchContext={patchContext}
            onRefresh={() => void refreshApiSnapshot()}
          />
        )}
      </main>
    </div>
  );
}

function SessionPanel({
  session,
  scope,
  notice,
  loading,
  loginForm,
  passwordForm,
  onLoginForm,
  onPasswordForm,
  onLogin,
  onChangePassword,
  onSignOut
}: {
  session?: DashboardSession;
  scope: DashboardScope;
  notice: string;
  loading: boolean;
  loginForm: { username: string; password: string };
  passwordForm: { currentPassword: string; newPassword: string };
  onLoginForm: (form: { username: string; password: string }) => void;
  onPasswordForm: (form: { currentPassword: string; newPassword: string }) => void;
  onLogin: () => void;
  onChangePassword: () => void;
  onSignOut: () => void;
}) {
  const signedIn = Boolean(scope.token);
  return (
    <section className="session-panel" aria-label="Auth Session">
      <div className="session-summary">
        <div>
          <strong>Auth Session</strong>
          <span>{notice}</span>
        </div>
        <span className={signedIn ? "badge ready" : "badge review"}>{signedIn ? "SIGNED IN" : "SIGN IN REQUIRED"}</span>
      </div>
      <div className="session-fields">
        <label>
          <span>Username</span>
          <input value={loginForm.username} onChange={(event) => onLoginForm({ ...loginForm, username: event.currentTarget.value })} />
        </label>
        <label>
          <span>Password</span>
          <input
            value={loginForm.password}
            type="password"
            placeholder="Dashboard login password"
            onChange={(event) => onLoginForm({ ...loginForm, password: event.currentTarget.value })}
          />
        </label>
        <button className="secondary-action" type="button" onClick={onLogin} disabled={loading}>{loading ? "Working..." : "Login"}</button>
        <button className="ghost-action" type="button" onClick={onSignOut}>Sign Out</button>
      </div>
      {(session?.mustChangePassword || session?.user?.mustChangePassword) && (
        <div className="session-fields">
          <label>
            <span>Current Password</span>
            <input
              type="password"
              value={passwordForm.currentPassword}
              onChange={(event) => onPasswordForm({ ...passwordForm, currentPassword: event.currentTarget.value })}
            />
          </label>
          <label>
            <span>New Password</span>
            <input
              type="password"
              value={passwordForm.newPassword}
              onChange={(event) => onPasswordForm({ ...passwordForm, newPassword: event.currentTarget.value })}
            />
          </label>
          <button className="secondary-action" type="button" onClick={onChangePassword} disabled={loading}>Change Password</button>
        </div>
      )}
    </section>
  );
}

function ProjectsView({
  context,
  reviewPack,
  busyAction,
  onPatchContext,
  onGenerateReviewPack,
  onActivateHarness,
  onApprovePlan,
  onAdvanceGoal
}: {
  context: ProjectLoopContext;
  reviewPack: ReviewPackStep[];
  busyAction?: string;
  onPatchContext: (patch: Partial<ProjectLoopContext>) => void;
  onGenerateReviewPack: () => void;
  onActivateHarness: () => void;
  onApprovePlan: () => void;
  onAdvanceGoal: () => void;
}) {
  return (
    <>
      <div className="layout">
        <section className="surface" aria-label="Project onboarding">
          <div className="hero">
            <div>
              <h2>Start Or Continue A Project Loop</h2>
              <p>The default path is narrow: repository, goal target, Review Pack, owner confirmation, loop execution.</p>
            </div>
          </div>

          <div className="starter">
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
              <textarea
                value={context.goalLoopTarget}
                placeholder="Describe the business outcome EvoPilot should evolve toward."
                onChange={(event) => onPatchContext({ goalLoopTarget: event.currentTarget.value })}
              />
            </label>
            <button className="primary-action" type="button" onClick={onGenerateReviewPack} disabled={Boolean(busyAction)}>
              {busyAction ? "Generating..." : "Generate Review Pack"}
            </button>
          </div>

          <FlowPath reviewPack={reviewPack} />
          <ReviewPack reviewPack={reviewPack} />
        </section>

        <aside className="side-panel" aria-label="Next action">
          <div className="next-box">
            <h3>Next Action</h3>
            <p>Show the generated Harness Draft and Alpha/Beta/RC/GA plan before activation, approval, or execution.</p>
            <button className="primary-action" type="button" onClick={onGenerateReviewPack} disabled={Boolean(busyAction)}>
              Review Pack
            </button>
          </div>
          <div className="signal-list">
            <Signal label="Repository" status={context.repositoryUrl ? "READY" : "WAITING"} />
            <Signal label="Goal Target" status={context.goalLoopTarget ? "READY" : "WAITING"} />
            <Signal label="Harness Draft" status={reviewPack.some((item) => item.id === "generate-harness-profile" && item.status !== "BLOCKED") ? "REVIEW" : "WAITING"} />
            <Signal label="Phase Approval" status={context.goalId ? "WAITING" : "PENDING"} />
          </div>
        </aside>
      </div>

      <section className="table-panel" aria-label="Review actions">
        <div className="table-head">
          <h3>Owner Review Gates</h3>
          <span className="pill">No auto-approval</span>
        </div>
        <div className="review-confirmation">
          <label>
            <span>Confirmed By</span>
            <input value={context.confirmedBy} onChange={(event) => onPatchContext({ confirmedBy: event.currentTarget.value })} />
          </label>
          <label className="wide">
            <span>Confirmation</span>
            <input
              value={context.confirmation}
              placeholder="Project owner reviewed the Harness Draft and Alpha/Beta/RC/GA phase plan."
              onChange={(event) => onPatchContext({ confirmation: event.currentTarget.value })}
            />
          </label>
        </div>
        <div className="review-actions">
          <button className="secondary-action" type="button" onClick={onActivateHarness} disabled={!context.projectId || !context.profileId}>
            Activate Reviewed Harness
          </button>
          <button className="secondary-action" type="button" onClick={onApprovePlan} disabled={!context.goalId || !context.confirmedBy || !context.confirmation}>
            Approve Phase Plan
          </button>
          <button className="secondary-action" type="button" onClick={onAdvanceGoal} disabled={!context.goalId}>
            Start Or Advance Loop
          </button>
        </div>
      </section>

      <AdvancedContext context={context} onPatchContext={onPatchContext} />
    </>
  );
}

function FlowPath({ reviewPack }: { reviewPack: ReviewPackStep[] }) {
  const flow = [
    { id: "repository", label: "Repository" },
    { id: "goal-target", label: "Goal Target" },
    { id: "generate-harness-profile", fallbackId: "harness-draft", label: "Harness Draft" },
    { id: "plan-goal", fallbackId: "phase-plan", label: "Phase Plan" },
    { id: "loop", label: "Loop" },
    { id: "release", label: "Release" }
  ];
  return (
    <div className="flow">
      <div className="section-title">
        <h3>Project Loop Path</h3>
        <span>{"Repository -> Goal Target -> Review Pack -> Loop -> Release Decision"}</span>
      </div>
      <div className="flow-line">
        {flow.map((step, index) => {
          const match = reviewPack.find((item) => item.id === step.id) ?? reviewPack.find((item) => item.id === step.fallbackId);
          const status = match?.status ?? "WAITING";
          return (
            <div key={step.label} className={`step ${status.toLowerCase()}`}>
              <small>{String(index + 1).padStart(2, "0")}</small>
              <strong>{step.label}</strong>
              <span>{match?.detail ?? "Waiting for server projection."}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ReviewPack({ reviewPack }: { reviewPack: ReviewPackStep[] }) {
  return (
    <div className="review-pack">
      {reviewPack.map((item) => (
        <div key={item.id} className="review-item">
          <div className="review-item-head">
            <strong>{item.label}</strong>
            <span className={`badge ${item.status.toLowerCase()}`}>{item.status}</span>
          </div>
          <span>{item.detail}</span>
          {item.requestId && <code>{item.requestId}</code>}
        </div>
      ))}
    </div>
  );
}

function Signal({ label, status }: { label: string; status: string }) {
  return (
    <div className="signal">
      <span>{label}</span>
      <strong>{status}</strong>
    </div>
  );
}

function RunsView({
  context,
  snapshot,
  reviewPack,
  lastAction,
  onAdvanceGoal
}: {
  context: ProjectLoopContext;
  snapshot: Record<string, ApiResult>;
  reviewPack: ReviewPackStep[];
  lastAction?: DashboardActionResult;
  onAdvanceGoal: () => void;
}) {
  return (
    <>
      <section className="surface">
        <div className="hero">
          <div>
            <h2>{context.goalId || "No goal selected"}</h2>
            <p>Runs keeps the same server-governed semantics as CLI: no phase skip, no release inference, stop at blockers and nextAction.</p>
          </div>
          <button className="primary-action" type="button" onClick={onAdvanceGoal} disabled={!context.goalId}>Advance Goal</button>
        </div>
        <FlowPath reviewPack={reviewPack} />
      </section>
      <section className="table-panel">
        <div className="table-head">
          <h3>Server Projections</h3>
          <span className="pill">run-status / evidence / release</span>
        </div>
        <ProjectionList snapshot={snapshot} />
      </section>
      <LastAction result={lastAction} />
    </>
  );
}

function OpsView({
  scope,
  context,
  apiNotice,
  apiLoading,
  snapshot,
  lastAction,
  onScopeChange,
  onPatchContext,
  onRefresh
}: {
  scope: DashboardScope;
  context: ProjectLoopContext;
  apiNotice: string;
  apiLoading: boolean;
  snapshot: Record<string, ApiResult>;
  lastAction?: DashboardActionResult;
  onScopeChange: (scope: DashboardScope) => void;
  onPatchContext: (patch: Partial<ProjectLoopContext>) => void;
  onRefresh: () => void;
}) {
  return (
    <>
      <section className="surface">
        <div className="hero">
          <div>
            <h2>Operations</h2>
            <p>{apiNotice}</p>
          </div>
          <button className="secondary-action" type="button" onClick={onRefresh} disabled={apiLoading}>{apiLoading ? "Refreshing..." : "Refresh Projections"}</button>
        </div>
        <div className="ops-grid">
          <label>
            <span>Tenant</span>
            <input value={scope.tenantId} onChange={(event) => onScopeChange({ ...scope, tenantId: event.currentTarget.value })} />
          </label>
          <label>
            <span>Workspace</span>
            <input value={scope.workspaceId} onChange={(event) => onScopeChange({ ...scope, workspaceId: event.currentTarget.value })} />
          </label>
          <label>
            <span>Actor</span>
            <input value={scope.actorId} onChange={(event) => onScopeChange({ ...scope, actorId: event.currentTarget.value })} />
          </label>
          <label>
            <span>Goal ID</span>
            <input value={context.goalId} onChange={(event) => onPatchContext({ goalId: event.currentTarget.value })} />
          </label>
          <label>
            <span>Loop ID</span>
            <input value={context.loopId} onChange={(event) => onPatchContext({ loopId: event.currentTarget.value })} />
          </label>
          <label>
            <span>Confirmed By</span>
            <input value={context.confirmedBy} onChange={(event) => onPatchContext({ confirmedBy: event.currentTarget.value })} />
          </label>
          <label className="wide">
            <span>Confirmation</span>
            <input value={context.confirmation} onChange={(event) => onPatchContext({ confirmation: event.currentTarget.value })} />
          </label>
        </div>
      </section>
      <section className="table-panel">
        <div className="table-head">
          <h3>Troubleshooting Contract</h3>
          <span className="pill">requestId / nextAction</span>
        </div>
        <div className="work-list">
          <TroubleRow label="Credential repair" detail="Stop on connect-github-account, connect-gitlab-account, or configure-source-credentials." />
          <TroubleRow label="Harness stale" detail="Stop on PROJECT_HARNESS_PROFILE_POLICY_STALE and regenerate a reviewed profile revision." />
          <TroubleRow label="Human gate" detail="Do not invent confirmedBy or confirmation; wait for owner approval." />
          <TroubleRow label="Release verdict" detail="Use TargetEvidencePackage, PhasePackage, and release decisions. Do not infer GO from UI color." />
        </div>
      </section>
      <ProjectionList snapshot={snapshot} />
      <LastAction result={lastAction} />
    </>
  );
}

function TroubleRow({ label, detail }: { label: string; detail: string }) {
  return (
    <div className="work-row">
      <div>
        <span>{label}</span>
        <small>{detail}</small>
      </div>
      <span className="badge review">STOP</span>
    </div>
  );
}

function ProjectionList({ snapshot }: { snapshot: Record<string, ApiResult> }) {
  const entries = Object.entries(snapshot);
  if (!entries.length) {
    return <p className="empty">No live projections loaded. Sign in and refresh from Ops.</p>;
  }
  return (
    <div className="projection-grid">
      {entries.map(([key, result]) => (
        <div key={key} className={result.ok ? "projection-item ok" : "projection-item failed"}>
          <span>{key}</span>
          <strong>{result.status}</strong>
          <small>{result.requestId ?? result.error ?? "no requestId"}</small>
        </div>
      ))}
    </div>
  );
}

function LastAction({ result }: { result?: DashboardActionResult }) {
  if (!result) return null;
  return (
    <section className="advanced-panel action-panel">
      <div className="table-head">
        <h3>Last API Action</h3>
        <span className={result.ok ? "badge ready" : "badge blocked"}>{result.ok ? "OK" : "FAILED"}</span>
      </div>
      <div className="advanced-grid">
        <Tile label="Action" value={result.actionLabel} />
        <Tile label="API" value={`${result.method} ${result.path}`} />
        <Tile label="Status" value={String(result.status)} />
        <Tile label="Request ID" value={result.requestId ?? "not returned"} />
        <Tile label="Schema" value={result.schema ?? "not returned"} />
        <Tile label="Next Action" value={result.nextAction ?? "not returned"} />
        <Tile label="Blockers" value={result.blockers?.join("; ") || result.error || "none"} />
      </div>
    </section>
  );
}

function AdvancedContext({
  context,
  onPatchContext
}: {
  context: ProjectLoopContext;
  onPatchContext: (patch: Partial<ProjectLoopContext>) => void;
}) {
  return (
    <details className="advanced-panel">
      <summary>
        <span>Advanced Control Details</span>
        <span className="pill">For WorkBuddy and administrators</span>
      </summary>
      <div className="advanced-form">
        <label>
          <span>Project ID</span>
          <input value={context.projectId} onChange={(event) => onPatchContext({ projectId: event.currentTarget.value })} />
        </label>
        <label>
          <span>Project Name</span>
          <input value={context.projectName} onChange={(event) => onPatchContext({ projectName: event.currentTarget.value })} />
        </label>
        <label>
          <span>Provider</span>
          <input value={context.repositoryProvider} onChange={(event) => onPatchContext({ repositoryProvider: event.currentTarget.value })} />
        </label>
        <label>
          <span>Default Branch</span>
          <input value={context.defaultBranch} onChange={(event) => onPatchContext({ defaultBranch: event.currentTarget.value })} />
        </label>
        <label>
          <span>Token Ref</span>
          <input value={context.tokenRef} onChange={(event) => onPatchContext({ tokenRef: event.currentTarget.value })} />
        </label>
        <label>
          <span>Execution Mode</span>
          <input value={context.executionMode} onChange={(event) => onPatchContext({ executionMode: event.currentTarget.value })} />
        </label>
        <label>
          <span>DevOps Owner</span>
          <input value={context.devopsOwner} onChange={(event) => onPatchContext({ devopsOwner: event.currentTarget.value })} />
        </label>
        <label>
          <span>CI Workflow</span>
          <input value={context.ciWorkflow} onChange={(event) => onPatchContext({ ciWorkflow: event.currentTarget.value })} />
        </label>
        <label>
          <span>CI Required Check</span>
          <input value={context.ciRequiredCheck} onChange={(event) => onPatchContext({ ciRequiredCheck: event.currentTarget.value })} />
        </label>
        <label>
          <span>LLM Profile</span>
          <input value={context.llmProfileId} onChange={(event) => onPatchContext({ llmProfileId: event.currentTarget.value })} />
        </label>
        <label>
          <span>Profile ID</span>
          <input value={context.profileId} onChange={(event) => onPatchContext({ profileId: event.currentTarget.value })} />
        </label>
        <label>
          <span>Profile Version</span>
          <input value={context.profileVersion} onChange={(event) => onPatchContext({ profileVersion: event.currentTarget.value })} />
        </label>
        <label>
          <span>Template ID Override</span>
          <input value={context.templateId} onChange={(event) => onPatchContext({ templateId: event.currentTarget.value })} />
        </label>
        <label>
          <span>Goal ID</span>
          <input value={context.goalId} onChange={(event) => onPatchContext({ goalId: event.currentTarget.value })} />
        </label>
        <label>
          <span>Loop ID</span>
          <input value={context.loopId} onChange={(event) => onPatchContext({ loopId: event.currentTarget.value })} />
        </label>
      </div>
    </details>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="advanced-tile">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
