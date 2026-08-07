import { useState } from "react";
import { Plus } from "lucide-react";
import {
  apiSurface,
  type ApiResult,
  type DashboardActionRequest,
  type DashboardActionResult
} from "../../api";
import {
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
    domainSignalsText: listText(row.domainSignals) || "-",
    gapClassificationsText: listText(row.gapClassifications) || "-"
  }));
  const [dialog, setDialog] = useState(false);

  function openEvolution(row?: RowRecord) {
    if (row) onForm({ ...form, baseTemplateId: fieldText(row, ["id", "templateId", "name"], form.baseTemplateId) });
    setDialog(true);
  }

  const action: DashboardActionRequest = {
    id: "admin-create-template-evolution",
    label: "Create HarnessTemplateEvolution",
    method: "POST",
    path: apiSurface.harnessTemplateEvolutions,
    body: {
      baseTemplateId: form.baseTemplateId,
      targetVersion: form.targetVersion || undefined,
      intent: form.intent,
      sources: [templateEvolutionSourceFromForm(form)]
    }
  };

  return (
    <main className="management-workspace">
      <section className="management-stack">
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
          toolbar={<button className="btn primary" type="button" onClick={() => openEvolution()}><Plus size={15} aria-hidden="true" /> 创建 evolution draft</button>}
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
            ["Domain", ["domainSignalsText"]],
            ["Gaps", ["gapClassificationsText"]]
          ]}
          empty="No HarnessTemplateEvolution runs returned by EvoPilot."
        />
      </section>
      {dialog && (
        <AdminDialog
          eyebrow="Template evolution"
          title="创建进化 run"
          subtitle={`${form.baseTemplateId || "base template"} · target ${form.targetVersion || "next version"}`}
          primaryLabel="创建 evolution draft"
          busy={busyAction === action.id}
          disabled={!form.baseTemplateId || !form.intent}
          lastAction={lastAction}
          onClose={() => setDialog(false)}
          onSubmit={() => onRunAction(action)}
        >
          <label><span>Base Template</span><input value={form.baseTemplateId} onChange={(event) => onForm({ ...form, baseTemplateId: event.currentTarget.value })} /></label>
          <label><span>Target Version</span><input value={form.targetVersion} onChange={(event) => onForm({ ...form, targetVersion: event.currentTarget.value })} /></label>
          <label><span>Intent</span><textarea value={form.intent} onChange={(event) => onForm({ ...form, intent: event.currentTarget.value })} /></label>
          <div className="form-two">
            <label><span>Source Type</span><select value={form.sourceType} onChange={(event) => onForm({ ...form, sourceType: event.currentTarget.value })}>{templateEvolutionSourceTypes.map((type) => <option key={type} value={type}>{type}</option>)}</select></label>
            <label><span>Source</span><input value={form.sourceUri} onChange={(event) => onForm({ ...form, sourceUri: event.currentTarget.value })} /></label>
          </div>
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
      enteredFrom: "dashboard-knowledge-factory"
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
