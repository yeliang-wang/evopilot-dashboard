import { type CSSProperties } from "react";
import {
  RefreshCw,
  ShieldCheck
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
import { fallbackProfileYaml } from "./evidence";
import {
  deliveryChainLabel,
  normalizeDeliveryChain,
  repositoryProviderForChain
} from "../model";

export function Sidebar({
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
    ["templates", "Harness Hub"],
    ["llm-profiles", "LLM Profiles"],
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

export function Topbar({
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
    templates: ["Harness Hub / 专家市场", "管理员查看外部 Catalog、领域专家资产和 Harness 进化 run；执行仍由 EvoPilot 控制面治理。"],
    "llm-profiles": ["LLM Profiles", "Register the provider and secret reference EvoPilot can use for project loops."],
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

export function StageBar({ stages }: { stages: Array<{ label: string; status: string; kind: string }> }) {
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

export function ChatBubble({
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
  const chain = normalizeDeliveryChain(context.deliveryChain) ?? "github-native";
  const workflowRepository = chain === "github-source-gitlab-ci"
    ? context.workflowProjectId || context.workflowRepository || "GitLab project pending"
    : context.workflowRepository || context.repositoryUrl || "repository workflow";
  return (
    <div className="card">
      <div className="card-head">
        <div>
          <strong>Intake summary</strong>
          <span>EvoPilot 会按项目源码系统和 CI/Loop 执行系统生成接入检查。</span>
        </div>
        <span className="tag blue">DRAFT</span>
      </div>
      <div className="card-body metrics three">
        <Metric label="Source" value={repositoryProviderForChain(chain)} note={context.repositoryUrl || "Enter repository URL"} />
        <Metric label="CI/Loop" value={chain === "github-native" ? "GitHub Actions" : "GitLab CI"} note={workflowRepository} />
        <Metric label="Owner gate" value="Required" note="profile activation needs confirmation" />
      </div>
    </div>
  );
}

function TemplateCard({ profileDraft }: { profileDraft: HarnessProfileDraft }) {
  const compatibility = compactList(profileDraft.compatibilityProfiles);
  const architecture = compactList(profileDraft.architectureProfiles);
  const runtime = compactList(profileDraft.runtimeProfiles);
  const requiredActions = compactList(profileDraft.domainRequiredActions);
  const evidenceAdapters = compactList(profileDraft.evidenceAdapters);
  const releaseBlockers = compactList(profileDraft.releaseBlockers, 2);
  return (
    <div className="card">
      <div className="card-head">
        <div>
          <strong>Template auto-match</strong>
          <span>接入项目不手选模板，EvoPilot 根据产品域、兼容性、架构和运行时上下文自动匹配。</span>
        </div>
        <span className="tag green">matched</span>
      </div>
      <div className="card-body metrics three">
        <Metric label="Primary template" value={profileDraft.templateRef || "auto-match"} note={profileDraft.domain || "runtime baseline"} />
        <Metric label="Harness layer" value={profileDraft.harnessLayer || "runtime"} note={runtime || "project implementation runtime"} />
        <Metric label="Compatibility" value={compatibility || "server matched"} note={architecture ? `Architecture: ${architecture}` : "architecture profile returned by EvoPilot"} />
        <Metric label="Generated by" value="EvoPilot" note={profileDraft.generatedByEvidence.join("; ") || "server-governed profile generation"} />
      </div>
      {requiredActions || evidenceAdapters || releaseBlockers ? (
        <div className="capability-list">
          {requiredActions ? <Capability text={`Required actions: ${requiredActions}`} /> : null}
          {evidenceAdapters ? <Capability text={`Evidence adapters: ${evidenceAdapters}`} /> : null}
          {releaseBlockers ? <Capability text={`Release blockers: ${releaseBlockers}`} /> : null}
          {profileDraft.repoProbeStatus ? <Capability text={`Repo probe: ${profileDraft.repoProbeStatus}; missing=${profileDraft.missingModuleBoundaries.join(", ") || "none"}`} /> : null}
        </div>
      ) : null}
      {profileDraft.referenceBoundary ? <p className="inline-note">{profileDraft.referenceBoundary}</p> : null}
    </div>
  );
}

function compactList(items: string[], limit = 3): string {
  if (items.length === 0) return "";
  const visible = items.slice(0, limit).join(", ");
  return items.length > limit ? `${visible} +${items.length - limit}` : visible;
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
        <div className="stream-line"><span className="spinner" />绑定 domain requiredActions、evidenceAdapters、releaseBlockers</div>
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
              <li><b>Review focus:</b> 能力边界、模块映射、领域必做动作、证据适配器、发布 blocker。</li>
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
