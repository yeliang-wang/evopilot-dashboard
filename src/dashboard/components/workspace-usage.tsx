import { type ReactNode } from "react";
import { Activity, Boxes, Cpu, Database } from "lucide-react";
import { type ApiResult, type DashboardScope } from "../../api";
import { asRecord, dataEnvelope, fieldText, numberField, resultItems, stringField } from "../model";

const usageGridColumns = "1.05fr 1.45fr 0.45fr 0.82fr 0.82fr 1.1fr";

export function WorkspaceUsagePanel({ scope, snapshot }: { scope: DashboardScope; snapshot: Record<string, ApiResult> }) {
  const result = snapshot.workspaceUsage;
  const usage = asRecord(dataEnvelope(result?.data));
  const llmUsage = asRecord(usage?.llmUsage);
  const projectRows = resultItems(result, ["projectUsage"]).slice(0, 10);
  const providerRows = projectLlmRows(projectRows).slice(0, 12);
  const topProject = asRecord(usage?.topProject);
  const statusText = result
    ? result.ok ? `status=${result.status}` : `status=${result.status} ${result.error ?? ""}`.trim()
    : "not loaded";

  return (
    <section className="data-panel usage-panel">
      <div className="panel-title">
        <span>Project LLM Usage</span>
        <h3>接入项目 LLM 用量追踪</h3>
        <p>{scope.tenantId} / {scope.workspaceId} · token、LLM 和 loop 归因来自 EvoPilot projection。</p>
      </div>
      <div className="usage-metric-grid">
        <UsageMetricCard
          icon={<Database size={18} aria-hidden="true" />}
          label="工作区累计 Token"
          value={formatNumber(numberField(llmUsage?.totalTokens))}
          detail={`input ${formatNumber(numberField(llmUsage?.inputTokens))} / output ${formatNumber(numberField(llmUsage?.outputTokens))}`}
        />
        <UsageMetricCard
          icon={<Boxes size={18} aria-hidden="true" />}
          label="有 LLM 用量的接入项目"
          value={formatNumber(numberField(usage?.projectsWithLlmUsage) ?? numberField(usage?.projectUsageCount))}
          detail={`active loops ${formatNumber(numberField(usage?.loopsWithLlmUsage))} · range ${usageRangeLabel(usage)}`}
        />
        <UsageMetricCard
          icon={<Cpu size={18} aria-hidden="true" />}
          label="LLM 组合"
          value={formatNumber(numberField(llmUsage?.providerModelCount))}
          detail={providerMixText(llmUsage)}
        />
        <UsageMetricCard
          icon={<Activity size={18} aria-hidden="true" />}
          label="Token 最高项目"
          value={fieldText(topProject, ["projectName", "projectId"], "not returned")}
          detail={`${formatNumber(numberField(topProject?.totalTokens))} tokens · latest ${stringField(topProject?.latestLoopId) ?? "-"}`}
        />
      </div>
      <div className="table usage-table">
        <div className="table-head" style={{ gridTemplateColumns: usageGridColumns }}>
          <strong>接入项目</strong>
          <strong>实际 LLM / Profile</strong>
          <strong>Calls</strong>
          <strong>Input / Output</strong>
          <strong>Total Token</strong>
          <strong>最近 Loop Token</strong>
        </div>
        {providerRows.length === 0 ? (
          <div className="empty-row">{result?.ok === false ? result.error ?? "Workspace usage projection failed." : "No project LLM usage returned by EvoPilot."}</div>
        ) : providerRows.map((row) => (
          <div key={row.id} className="table-row" style={{ gridTemplateColumns: usageGridColumns }}>
            <span className="usage-project-cell" title={`${row.projectLabel} · ${row.projectId}`}>
              <strong>{row.projectLabel}</strong>
              <small>{row.projectId}</small>
            </span>
            <span className="usage-llm-cell" title={`${row.provider} / ${row.model} · ${row.profileId}`}>
              <strong>{row.provider} / {row.model}</strong>
              <small>{row.profileId}</small>
            </span>
            <span>{formatNumber(row.calls)}</span>
            <span>{formatNumber(row.inputTokens)} / {formatNumber(row.outputTokens)}</span>
            <span>
              <strong className="usage-token-value">{formatNumber(row.totalTokens)}</strong>
              <small>{row.shareText}</small>
            </span>
            <span className="usage-loop-cell" title={`${row.latestLoopId} · requestId=${row.requestId}`}>
              <strong>{formatNumber(row.latestLoopTotalTokens)}</strong>
              <small>{loopStatusText(row)}</small>
              <small>requestId={row.requestId}</small>
            </span>
          </div>
        ))}
      </div>
      <div className="notice green">
        <strong>{statusText}</strong>
        <span>requestId={result?.requestId ?? "not returned"} · schema={stringField(usage?.schema) ?? "not returned"}</span>
      </div>
    </section>
  );
}

function UsageMetricCard({ icon, label, value, detail }: { icon: ReactNode; label: string; value: string; detail: string }) {
  return (
    <div className="usage-metric-card">
      <div className="usage-metric-title">
        <span>{icon}</span>
        <strong>{label}</strong>
      </div>
      <div className="usage-metric-value">{value}</div>
      <small>{detail}</small>
    </div>
  );
}

interface ProjectLlmUsageView {
  id: string;
  projectId: string;
  projectLabel: string;
  provider: string;
  model: string;
  profileId: string;
  calls: number | undefined;
  inputTokens: number | undefined;
  outputTokens: number | undefined;
  totalTokens: number;
  shareText: string;
  latestLoopId: string;
  latestLoopStatus: string;
  latestLoopTotalTokens: number | undefined;
  requestId: string;
}

function formatNumber(value: number | undefined): string {
  return new Intl.NumberFormat("en-US").format(value ?? 0);
}

function usageRangeLabel(usage: Record<string, unknown> | undefined): string {
  const range = asRecord(usage?.range) ?? asRecord(usage?.timeRange);
  const label = stringField(range?.label) ?? stringField(usage?.rangeLabel);
  if (label) return label;
  const from = stringField(range?.from) ?? stringField(usage?.from);
  const to = stringField(range?.to) ?? stringField(usage?.to);
  if (from && to) return `${shortDateTime(from)} - ${shortDateTime(to)}`;
  return "all recorded loops";
}

function providerMixText(llmUsage: Record<string, unknown> | undefined): string {
  const providers = stringField(llmUsage?.providers) ?? stringField(llmUsage?.providerSummary);
  if (providers) return providers;
  const providerCount = numberField(llmUsage?.providerCount);
  const providerModelCount = numberField(llmUsage?.providerModelCount);
  if (providerCount !== undefined || providerModelCount !== undefined) {
    return `${formatNumber(providerCount)} providers · ${formatNumber(providerModelCount)} LLM rows`;
  }
  return "provider/model not returned";
}

function projectLlmRows(projectRows: Record<string, unknown>[]): ProjectLlmUsageView[] {
  return projectRows.flatMap((project, projectIndex) => {
    const llmUsage = asRecord(project.llmUsage);
    const configured = asRecord(project.configuredLlm);
    const loops = asRecord(project.loops);
    const breakdown = providerBreakdown(project);
    const hasUsage = (numberField(llmUsage?.calls) ?? 0) > 0 || (numberField(llmUsage?.totalTokens) ?? 0) > 0;
    const rows = breakdown.length > 0 ? breakdown : hasUsage ? [llmUsage ?? {}] : [];
    return rows.map((usageRow, usageIndex) => {
      const latestLoop = asRecord(usageRow.latestLoop) ?? loops;
      const provider = stringField(usageRow.provider) ?? stringField(llmUsage?.provider) ?? stringField(configured?.provider) ?? "not recorded";
      const model = stringField(usageRow.model) ?? stringField(llmUsage?.model) ?? stringField(configured?.model) ?? "not recorded";
      const profileId = stringField(usageRow.profileId) ?? stringField(llmUsage?.profileId) ?? stringField(configured?.profileId) ?? "profile not returned";
      const latestLoopId = stringField(usageRow.latestLoopId) ?? stringField(latestLoop?.latestLoopId) ?? stringField(latestLoop?.loopId) ?? "-";
      const latestLoopStatus = stringField(usageRow.latestLoopStatus) ?? stringField(latestLoop?.latestLoopStatus) ?? stringField(latestLoop?.status) ?? "-";
      return {
        id: `${fieldText(project, ["projectId", "projectName"], `project-${projectIndex}`)}-${provider}-${model}-${usageIndex}`,
        projectId: fieldText(project, ["projectId", "id"], "-"),
        projectLabel: fieldText(project, ["projectName", "name", "projectId"], "-"),
        provider,
        model,
        profileId,
        calls: numberField(usageRow.calls) ?? numberField(llmUsage?.calls),
        inputTokens: numberField(usageRow.inputTokens) ?? numberField(llmUsage?.inputTokens),
        outputTokens: numberField(usageRow.outputTokens) ?? numberField(llmUsage?.outputTokens),
        totalTokens: numberField(usageRow.totalTokens) ?? numberField(llmUsage?.totalTokens) ?? 0,
        shareText: shareText(usageRow),
        latestLoopId,
        latestLoopStatus,
        latestLoopTotalTokens: numberField(usageRow.latestLoopTotalTokens) ?? numberField(latestLoop?.latestLoopTotalTokens) ?? numberField(latestLoop?.totalTokens),
        requestId: stringField(usageRow.requestId) ?? stringField(latestLoop?.requestId) ?? "not returned"
      };
    });
  });
}

function providerBreakdown(project: Record<string, unknown>): Record<string, unknown>[] {
  const llmUsage = asRecord(project.llmUsage);
  for (const value of [
    project.providerModelUsage,
    project.llmBreakdown,
    llmUsage?.providerModelUsage,
    llmUsage?.providerModels,
    llmUsage?.breakdown
  ]) {
    if (Array.isArray(value)) {
      return value.map((item) => asRecord(item)).filter((item): item is Record<string, unknown> => Boolean(item));
    }
  }
  return [];
}

function shareText(row: Record<string, unknown>): string {
  const raw = numberField(row.shareOfWorkspace) ?? numberField(row.workspaceShare);
  if (raw === undefined) return "share not returned";
  const percent = raw <= 1 ? raw * 100 : raw;
  const rounded = Number(percent.toFixed(1));
  return Number.isInteger(rounded) ? `${rounded.toFixed(0)}% of workspace` : `${rounded}% of workspace`;
}

function loopStatusText(row: ProjectLlmUsageView): string {
  return row.latestLoopId === "-" ? "loop not returned" : `${row.latestLoopId} · ${row.latestLoopStatus}`;
}

function shortDateTime(value: string): string {
  return value.replace("T", " ").replace(/\.\d{3}Z$/, "").replace(/:00Z$/, "");
}
