import { useState } from "react";
import {
  Plus,
  RefreshCw
} from "lucide-react";
import {
  apiSurface,
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
  type LlmProfileForm,
  type PageId,
  type TenantForm,
  type UserForm,
  type WorkspaceForm
} from "../model";
import { EvidenceRow, LogLine } from "./evidence";
import { LlmProfilesPage } from "./llm-profiles";
import { AdminDialog, DataPanel } from "./management-widgets";
import { TemplatesPage } from "./templates";
import { WorkspaceUsagePanel } from "./workspace-usage";

type RowRecord = Record<string, unknown>;
type DialogMode = "create" | "edit";

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
  llmProfileForm,
  onTenantForm,
  onWorkspaceForm,
  onUserForm,
  onLlmProfileForm,
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
  llmProfileForm: LlmProfileForm;
  onTenantForm: (form: TenantForm) => void;
  onWorkspaceForm: (form: WorkspaceForm) => void;
  onUserForm: (form: UserForm) => void;
  onLlmProfileForm: (form: LlmProfileForm) => void;
  onRunAction: (action: DashboardActionRequest) => void;
  onRefresh: () => void;
}) {
  if (page === "tenants") return <TenantsPage form={tenantForm} snapshot={snapshot} busyAction={busyAction} lastAction={lastAction} onForm={onTenantForm} onRunAction={onRunAction} />;
  if (page === "workspaces") return <WorkspacesPage form={workspaceForm} scope={scope} snapshot={snapshot} busyAction={busyAction} lastAction={lastAction} onForm={onWorkspaceForm} onRunAction={onRunAction} />;
  if (page === "users") return <UsersPage form={userForm} snapshot={snapshot} busyAction={busyAction} lastAction={lastAction} onForm={onUserForm} onRunAction={onRunAction} />;
  if (page === "templates") return <TemplatesPage snapshot={snapshot} busyAction={busyAction} lastAction={lastAction} onRunAction={onRunAction} />;
  if (page === "llm-profiles") return <LlmProfilesPage form={llmProfileForm} snapshot={snapshot} busyAction={busyAction} lastAction={lastAction} onForm={onLlmProfileForm} onRunAction={onRunAction} onRefresh={onRefresh} />;
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
  const [dialog, setDialog] = useState<DialogMode | undefined>();

  function openCreate() {
    onForm({
      tenantId: "",
      name: "",
      plan: "SaaS",
      status: "ACTIVE"
    });
    setDialog("create");
  }

  function openEdit(row: RowRecord) {
    const tenantId = fieldText(row, ["id", "tenantId"], form.tenantId);
    onForm({
      tenantId,
      name: fieldText(row, ["name"], tenantId),
      plan: fieldText(row, ["plan", "tier"], form.plan),
      status: fieldText(row, ["status", "state"], form.status)
    });
    setDialog("edit");
  }

  const submitAction: DashboardActionRequest = {
    id: dialog === "edit" ? "admin-update-tenant" : "admin-create-tenant",
    label: dialog === "edit" ? "Update tenant" : "Create tenant/workspace/admin",
    method: "POST",
    path: apiSurface.tenants,
    body: {
      id: form.tenantId,
      name: form.name || form.tenantId,
      plan: form.plan || undefined,
      status: form.status || undefined
    }
  };

  return (
    <main className="management-workspace">
      <DataPanel
        title="租户管理"
        subtitle="Platform admin 管理 tenant registry；workspace 和用户在各自页面处理。"
        rows={rows}
        columns={[
          ["Tenant", ["id", "tenantId", "name"]],
          ["Plan", ["plan", "tier"]],
          ["Workspaces", ["workspaceCount", "workspaces"]],
          ["Users", ["userCount", "users"]],
          ["Status", ["status", "state"]]
        ]}
        empty="No tenants returned by EvoPilot."
        toolbar={<button className="btn primary" type="button" onClick={openCreate}><Plus size={15} aria-hidden="true" /> 初始化租户</button>}
        actionLabel="修改"
        onRowAction={openEdit}
      />
      {dialog && (
        <AdminDialog
          eyebrow="Tenant registry"
          title={dialog === "edit" ? "修改租户" : "初始化新租户"}
          subtitle={`${form.tenantId || "new tenant"} · ${form.plan || "plan"}`}
          primaryLabel={dialog === "edit" ? "保存租户" : "创建租户"}
          busy={busyAction === submitAction.id}
          disabled={!form.tenantId}
          lastAction={lastAction}
          onClose={() => setDialog(undefined)}
          onSubmit={() => onRunAction(submitAction)}
        >
          <label><span>Tenant ID</span><input value={form.tenantId} onChange={(event) => onForm({ ...form, tenantId: event.currentTarget.value })} disabled={dialog === "edit"} /></label>
          <div className="form-two">
            <label><span>Name</span><input value={form.name} onChange={(event) => onForm({ ...form, name: event.currentTarget.value })} /></label>
            <label><span>Plan</span><input value={form.plan} onChange={(event) => onForm({ ...form, plan: event.currentTarget.value })} /></label>
          </div>
          <label><span>Status</span><select value={form.status} onChange={(event) => onForm({ ...form, status: event.currentTarget.value })}><option value="ACTIVE">ACTIVE</option><option value="SUSPENDED">SUSPENDED</option></select></label>
        </AdminDialog>
      )}
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
  const [dialog, setDialog] = useState<DialogMode | undefined>();

  function openCreate() {
    setDialog("create");
  }

  function openEdit(row: RowRecord) {
    onForm({
      ...form,
      tenantId: fieldText(row, ["tenantId", "tenant"], form.tenantId),
      workspaceId: fieldText(row, ["id", "workspaceId", "name"], form.workspaceId)
    });
    setDialog("edit");
  }

  const createAction: DashboardActionRequest = {
    id: "admin-create-workspace",
    label: "Create workspace",
    method: "POST",
    path: apiSurface.workspaces,
    body: {
      tenantId: form.tenantId,
      id: form.workspaceId,
      owner: form.owner,
      quotas: {
        projects: Number(form.projectLimit) || undefined,
        loops: Number(form.loopLimit) || undefined
      }
    }
  };
  const editUnsupported = dialog === "edit";

  return (
    <main className="management-workspace">
      <section className="management-stack">
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
          toolbar={<button className="btn primary" type="button" onClick={openCreate}><Plus size={15} aria-hidden="true" /> 新增工作区</button>}
          actionLabel="修改"
          onRowAction={openEdit}
        />
      </section>
      {dialog && (
        <AdminDialog
          eyebrow="Workspace boundary"
          title={dialog === "edit" ? "编辑工作区" : "创建工作区"}
          subtitle={`${form.workspaceId || "workspace"} · ${form.tenantId || "tenant"}`}
          primaryLabel={editUnsupported ? "服务端暂未开放保存" : "创建工作区"}
          busy={busyAction === createAction.id}
          disabled={editUnsupported || !form.tenantId || !form.workspaceId}
          lastAction={lastAction}
          footerNote={editUnsupported ? "当前 EvoPilot API 未开放 workspace PATCH；Dashboard 只展示预填编辑弹框，不伪造本地保存结果。" : undefined}
          onClose={() => setDialog(undefined)}
          onSubmit={() => onRunAction(createAction)}
        >
          <label><span>Tenant ID</span><input value={form.tenantId} onChange={(event) => onForm({ ...form, tenantId: event.currentTarget.value })} disabled={dialog === "edit"} /></label>
          <label><span>Workspace ID</span><input value={form.workspaceId} onChange={(event) => onForm({ ...form, workspaceId: event.currentTarget.value })} disabled={dialog === "edit"} /></label>
          <label><span>Owner</span><input value={form.owner} onChange={(event) => onForm({ ...form, owner: event.currentTarget.value })} /></label>
          <div className="form-two">
            <label><span>Project limit</span><input value={form.projectLimit} onChange={(event) => onForm({ ...form, projectLimit: event.currentTarget.value })} /></label>
            <label><span>Loop limit</span><input value={form.loopLimit} onChange={(event) => onForm({ ...form, loopLimit: event.currentTarget.value })} /></label>
          </div>
        </AdminDialog>
      )}
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
  const [dialog, setDialog] = useState<DialogMode | undefined>();

  function openCreate() {
    setDialog("create");
  }

  function openEdit(row: RowRecord) {
    onForm({
      ...form,
      username: fieldText(row, ["username", "id"], form.username),
      tenantId: fieldText(row, ["tenantId"], form.tenantId),
      workspaceId: fieldText(row, ["workspaceId"], form.workspaceId),
      role: fieldText(row, ["role"], form.role),
      status: fieldText(row, ["status", "state"], form.status),
      password: ""
    });
    setDialog("edit");
  }

  const action: DashboardActionRequest = dialog === "edit" ? {
    id: "admin-update-user",
    label: "Update scoped user",
    method: "PATCH",
    path: `/api/v1/users/${encodeURIComponent(form.username)}`,
    body: {
      tenantId: form.tenantId,
      workspaceId: form.workspaceId,
      role: form.role,
      status: form.status
    }
  } : {
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
  };

  return (
    <main className="management-workspace">
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
        toolbar={<button className="btn primary" type="button" onClick={openCreate}><Plus size={15} aria-hidden="true" /> 新增用户</button>}
        actionLabel="修改"
        onRowAction={openEdit}
      />
      {dialog && (
        <AdminDialog
          eyebrow="User registry"
          title={dialog === "edit" ? "编辑用户" : "创建新用户"}
          subtitle={`${form.username || "new user"} · ${form.tenantId || "tenant"} / ${form.workspaceId || "workspace"}`}
          primaryLabel={dialog === "edit" ? "保存修改" : "创建用户"}
          busy={busyAction === action.id}
          disabled={!form.username || !form.tenantId || !form.workspaceId}
          lastAction={lastAction}
          onClose={() => setDialog(undefined)}
          onSubmit={() => onRunAction(action)}
        >
          <label><span>Username</span><input value={form.username} onChange={(event) => onForm({ ...form, username: event.currentTarget.value })} disabled={dialog === "edit"} /></label>
          <div className="form-two">
            <label><span>Role</span><select value={form.role} onChange={(event) => onForm({ ...form, role: event.currentTarget.value })}><option value="operator">operator</option><option value="admin">admin</option><option value="auditor">auditor</option><option value="viewer">viewer</option></select></label>
            <label><span>Status</span><select value={form.status} onChange={(event) => onForm({ ...form, status: event.currentTarget.value })}><option value="ACTIVE">ACTIVE</option><option value="DISABLED">DISABLED</option></select></label>
          </div>
          <label><span>Tenant ID</span><input value={form.tenantId} onChange={(event) => onForm({ ...form, tenantId: event.currentTarget.value })} disabled={dialog === "edit"} /></label>
          <label><span>Workspace ID</span><input value={form.workspaceId} onChange={(event) => onForm({ ...form, workspaceId: event.currentTarget.value })} /></label>
          <label><span>{dialog === "edit" ? "Password reset" : "Initial password"}</span><input type="password" value={form.password} placeholder={dialog === "edit" ? "保持不变" : ""} onChange={(event) => onForm({ ...form, password: event.currentTarget.value })} disabled={dialog === "edit"} /></label>
        </AdminDialog>
      )}
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
  const fallbackRows = rows.length > 0 ? rows : [{
    time: "-",
    actorId: session?.user?.username ?? defaultScope.actorId,
    action: "No failing API action selected",
    target: "requestId not returned",
    status: "INFO"
  }];
  const [selectedAuditRow, setSelectedAuditRow] = useState<RowRecord | undefined>();

  return (
    <main className="management-workspace">
      <section className="summary-grid">
        <SummaryCard label="Audit events" value={String(rows.length)} detail="server-returned rows in current scope" />
        <SummaryCard label="Actor" value={session?.user?.username ?? defaultScope.actorId} detail={roleLabel(session)} />
        <SummaryCard label="Last request" value={lastAction?.requestId ?? "none"} detail={lastAction?.nextAction ?? "no nextAction"} />
      </section>
      <DataPanel
        title="审计与日志溯源"
        subtitle="AI Agent 根据 requestId -> action -> scope -> nextAction/blockers 定位问题。"
        rows={fallbackRows}
        columns={[
          ["Time", ["time", "timestamp", "createdAt"]],
          ["Actor", ["actorId", "actor", "username"]],
          ["Action", ["action", "operation", "event"]],
          ["Target", ["target", "resource", "path"]],
          ["Result", ["status", "result"]]
        ]}
        empty="No audit records returned by EvoPilot."
        toolbar={<button className="btn primary" type="button" onClick={onRefresh}><RefreshCw size={15} aria-hidden="true" /> Refresh audit</button>}
        actionLabel="查看证据"
        actionIcon="eye"
        onRowAction={setSelectedAuditRow}
      />
      {selectedAuditRow && (
        <AdminDialog
          eyebrow="Failure trace"
          title="AI 可读证据"
          subtitle={`${fieldText(selectedAuditRow, ["action", "operation", "event"])} · ${fieldText(selectedAuditRow, ["status", "result"])}`}
          primaryLabel="Refresh audit"
          lastAction={lastAction}
          onClose={() => setSelectedAuditRow(undefined)}
          onSubmit={onRefresh}
        >
          <EvidenceRow label="audit.time" value={fieldText(selectedAuditRow, ["time", "timestamp", "createdAt"])} />
          <EvidenceRow label="audit.actor" value={fieldText(selectedAuditRow, ["actorId", "actor", "username"])} />
          <EvidenceRow label="audit.action" value={fieldText(selectedAuditRow, ["action", "operation", "event"])} />
          <EvidenceRow label="audit.target" value={fieldText(selectedAuditRow, ["target", "resource", "path"])} />
          <EvidenceRow label="audit.status" value={fieldText(selectedAuditRow, ["status", "result"])} />
          <EvidenceRow label="audit.requestId" value={fieldText(selectedAuditRow, ["requestId", "correlationId"], "not returned")} />
          <EvidenceRow label="requestId" value={lastAction?.requestId ?? "not returned"} />
          <EvidenceRow label="lastAction" value={lastAction ? `${lastAction.method} ${lastAction.path}` : "none"} />
          <EvidenceRow label="nextAction" value={lastAction?.nextAction ?? "none"} />
          <EvidenceRow label="blockers" value={lastAction?.blockers?.join(", ") || "none"} />
          <LogLine level={lastAction?.ok ? "INFO" : lastAction ? "ERROR" : "INFO"} text={lastAction?.error ?? "No failing API action selected."} />
        </AdminDialog>
      )}
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
