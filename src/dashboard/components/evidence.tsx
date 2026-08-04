import { type CSSProperties } from "react";
import {
  CheckCircle2,
  Eye,
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
  configuredApiBaseUrl,
  controlPlaneBaseUrl,
  type ApiResult,
  type DashboardActionRequest,
  type DashboardActionResult,
  type DashboardScope,
  type DashboardSession
} from "../../api";
import {
  defaultScope,
  fieldText,
  resultItems,
  roleLabel,
  type ChatMessage,
  type ConsoleStep,
  type DrawerKind,
  type HarnessProfileDraft,
  type PageId,
  type ProjectLoopContext,
  type ReviewStep,
  type TemplateEvolutionForm,
  type TenantForm,
  type UserForm,
  type WorkspaceForm
} from "../model";

export function EvidenceDrawer({
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

export function EvidenceRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="evidence-row">
      <span>{label}</span>
      <code>{value}</code>
    </div>
  );
}

export function LogLine({ level, text }: { level: "INFO" | "WARN" | "ERROR"; text: string }) {
  return (
    <div className={`log-line ${level.toLowerCase()}`}>
      <code>{level}</code>
      <span>{text}</span>
    </div>
  );
}

export function fallbackProfileYaml(context: ProjectLoopContext, profileDraft: HarnessProfileDraft) {
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
