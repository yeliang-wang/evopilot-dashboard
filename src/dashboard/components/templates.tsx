import { useState } from "react";
import { Plus } from "lucide-react";
import {
  apiSurface,
  type ApiResult,
  type DashboardActionRequest,
  type DashboardActionResult
} from "../../api";
import {
  asRecord,
  dataEnvelope,
  fieldText,
  resultItems,
  type TemplateEvolutionForm
} from "../model";
import { AdminDialog, DataPanel } from "./management-widgets";

type RowRecord = Record<string, unknown>;

export function TemplatesPage({
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
  const evolutions = resultItems(snapshot.templateEvolutions, ["evolutions"]).slice(0, 8).map((row) => ({
    ...row,
    target: `${fieldText(row, ["targetTemplateId"])}@${fieldText(row, ["targetVersion"])}`,
    sourceTypesText: listText(row.sourceTypes) || String(row.sourceCount ?? "-"),
    autoMatchText: autoMatchText(row.autoMatch),
    domainSignalsText: listText(row.domainSignals) || "-",
    gapClassificationsText: listText(row.gapClassifications) || "-"
  }));
  const [dialog, setDialog] = useState(false);
  const matchPreview = matchPreviewFromAction(lastAction);

  function openEvolution(row?: RowRecord) {
    if (row) onForm({ ...form, baseTemplateId: fieldText(row, ["id", "templateId", "name"], form.baseTemplateId) });
    setDialog(true);
  }

  const source = templateEvolutionSourceFromForm(form);
  const matchAction: DashboardActionRequest = {
    id: "admin-match-template-evolution",
    label: "Preview HarnessTemplate match",
    method: "POST",
    path: apiSurface.harnessTemplateMatches,
    body: {
      intent: form.intent,
      sources: [source]
    }
  };
  const action: DashboardActionRequest = {
    id: "admin-harness-evolve",
    label: "Evolve Harness from source",
    method: "POST",
    path: apiSurface.harnessTemplateEvolve,
    body: {
      baseTemplateId: form.baseTemplateId || undefined,
      targetVersion: form.targetVersion || undefined,
      goal: form.intent,
      autoMatch: true,
      sources: [source]
    }
  };
  const formReady = Boolean(form.intent && form.sourceUri);

  return (
    <main className="management-workspace">
      <section className="management-stack">
        <DataPanel
          title="企业级 HarnessTemplate 知识包"
          subtitle="新项目自动匹配模板；普通入口一键生成 review draft，管理员继续管理 approve、publish 和 impact。"
          rows={templates}
          columns={[
            ["Template", ["id", "templateId", "name"]],
            ["Version", ["version"]],
            ["Type", ["softwareType", "language", "category"]],
            ["Status", ["status", "state"]]
          ]}
          empty="No templates returned by EvoPilot."
          toolbar={<button className="btn primary" type="button" onClick={() => openEvolution()}><Plus size={15} aria-hidden="true" /> 一键进化 Harness</button>}
          actionLabel="进化"
          actionIcon="plus"
          onRowAction={openEvolution}
        />
        <DataPanel
          title="Harness Knowledge Factory"
          subtitle="从历史项目、项目语料、附件、生产日志和 EvoPilot history 形成 reviewable HarnessTemplateEvolution。"
          rows={evolutions}
          columns={[
            ["Evolution", ["evolutionId"]],
            ["Status", ["status"]],
            ["Target", ["target"]],
            ["Sources", ["sourceTypesText"]],
            ["Match", ["autoMatchText"]],
            ["Domain", ["domainSignalsText"]],
            ["Gaps", ["gapClassificationsText"]]
          ]}
          empty="No HarnessTemplateEvolution runs returned by EvoPilot."
        />
      </section>
      {dialog && (
        <AdminDialog
          eyebrow="Template evolution"
          title="一键进化 Harness"
          subtitle={`${form.baseTemplateId || "auto-match"} · target ${form.targetVersion || "matched or next version"}`}
          primaryLabel="生成 review draft"
          busy={busyAction === action.id}
          disabled={!formReady}
          lastAction={lastAction}
          onClose={() => setDialog(false)}
          onSubmit={() => onRunAction(action)}
        >
          <label><span>Base Template</span><input placeholder="auto-match when empty" value={form.baseTemplateId} onChange={(event) => onForm({ ...form, baseTemplateId: event.currentTarget.value })} /></label>
          <label><span>Target Version</span><input value={form.targetVersion} onChange={(event) => onForm({ ...form, targetVersion: event.currentTarget.value })} /></label>
          <label><span>Intent</span><textarea value={form.intent} onChange={(event) => onForm({ ...form, intent: event.currentTarget.value })} /></label>
          <div className="form-two">
            <label><span>Source Type</span><select value={form.sourceType} onChange={(event) => onForm({ ...form, sourceType: event.currentTarget.value })}>{templateEvolutionSourceTypes.map((type) => <option key={type} value={type}>{type}</option>)}</select></label>
            <label><span>Source</span><input value={form.sourceUri} onChange={(event) => onForm({ ...form, sourceUri: event.currentTarget.value })} /></label>
          </div>
          <div className="dialog-inline-actions">
            <button className="btn ghost" type="button" disabled={busyAction === matchAction.id || !formReady} onClick={() => onRunAction(matchAction)}>
              {busyAction === matchAction.id ? "matching" : "Preview template match"}
            </button>
          </div>
          <MatchPreview match={matchPreview} />
        </AdminDialog>
      )}
    </main>
  );
}

const templateEvolutionSourceTypes = [
  "admin-note",
  "source-project",
  "source-corpus",
  "production-log",
  "evopilot-history",
  "attachment",
  "github-repo",
  "gitlab-repo",
  "web-url",
  "local-pack",
  "existing-template",
  "runtime-evidence"
];

function templateEvolutionSourceFromForm(form: TemplateEvolutionForm): Record<string, unknown> {
  const source: Record<string, unknown> = {
    type: form.sourceType,
    name: form.sourceUri || form.sourceType,
    metadata: {
      enteredFrom: "dashboard-harness-evolve"
    }
  };
  if (form.sourceType === "admin-note" || form.sourceType === "production-log") source.contentText = form.sourceUri;
  else source.uri = form.sourceUri;
  return source;
}

function listText(value: unknown): string {
  if (Array.isArray(value)) return value.map((item) => String(item)).filter(Boolean).slice(0, 4).join(", ");
  return typeof value === "string" ? value : "";
}

function autoMatchText(value: unknown): string {
  const match = asRecord(value);
  if (!match) return "-";
  return `${fieldText(match, ["decision"])} ${fieldText(match, ["confidence"])}`;
}

function matchPreviewFromAction(action?: DashboardActionResult): RowRecord | undefined {
  if (action?.actionId !== "admin-match-template-evolution" && action?.actionId !== "admin-harness-evolve") return undefined;
  const payload = asRecord(dataEnvelope(action.data));
  return asRecord(payload?.match) ?? asRecord(payload?.autoMatch);
}

function MatchPreview({ match }: { match?: RowRecord }) {
  if (!match) {
    return (
      <div className="drawer-card">
        <strong>Template match preview</strong>
        <small>No match preview yet.</small>
      </div>
    );
  }
  const base = asRecord(match.baseTemplateRef);
  const candidates = Array.isArray(match.candidateTemplates) ? match.candidateTemplates : [];
  return (
    <div className="drawer-card">
      <strong>Template match preview</strong>
      <small>{`${fieldText(match, ["decision"])} · confidence ${fieldText(match, ["confidence"])}`}</small>
      <div className="metric-grid compact">
        <MetricCell label="Base" value={`${fieldText(base, ["templateId"])}@${fieldText(base, ["version"])}`} />
        <MetricCell label="Target" value={`${fieldText(match, ["targetTemplateId"])}@${fieldText(match, ["targetVersion"])}`} />
        <MetricCell label="Domain" value={fieldText(match, ["targetDomain"])} />
        <MetricCell label="Candidates" value={String(candidates.length)} />
      </div>
    </div>
  );
}

function MetricCell({ label, value }: { label: string; value: string }) {
  return (
    <span className="metric-cell">
      <small>{label}</small>
      <strong>{value}</strong>
    </span>
  );
}
