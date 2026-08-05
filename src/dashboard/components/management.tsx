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
import { EvidenceRow, LogLine } from "./evidence";
import { WorkspaceUsagePanel } from "./workspace-usage";

export function ManagementPage({
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
  if (page === "workspaces") return <WorkspacesPage form={workspaceForm} scope={scope} snapshot={snapshot} busyAction={busyAction} lastAction={lastAction} onForm={onWorkspaceForm} onRunAction={onRunAction} />;
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
  scope,
  snapshot,
  busyAction,
  lastAction,
  onForm,
  onRunAction
}: {
  form: WorkspaceForm;
  scope: DashboardScope;
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
        <div className="management-stack">
          <WorkspaceUsagePanel scope={scope} snapshot={snapshot} />
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
        </div>
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
