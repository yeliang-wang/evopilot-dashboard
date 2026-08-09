import { useState } from "react";
import { Plus, RefreshCw } from "lucide-react";
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
  const templates = resultItems(snapshot.templates, ["templates"]).slice(0, 12);
  const catalogMounts = resultItems(snapshot.harnessCatalogs, ["mounts"]).slice(0, 8).map((row) => ({
    ...row,
    sourceText: fieldText(row, ["source"]),
    readStatusText: `${fieldText(row, ["lastReadStatus", "status"])} · ${fieldText(row, ["templateCount"], "0")} Harness`,
    digestText: fieldText(row, ["catalogDigest"])
  }));
  const expertRows = templates
    .filter((row) => fieldText(row, ["harnessLayer"], fieldText(asRecord(row.runtimePatterns), ["harnessLayer"], "runtime")) === "domain")
    .map((row) => ({
      ...row,
      expert: `${fieldText(row, ["name", "id"])} Expert`,
      domainText: fieldText(row, ["domain"], fieldText(asRecord(row.runtimePatterns), ["domain"])),
      versionText: `${fieldText(row, ["id"])}@${fieldText(row, ["version"])}`,
      catalogText: fieldText(asRecord(row.catalogRef), ["catalogId"], "built-in")
    }))
    .slice(0, 8);
  const connectorRows = connectorCatalogRows();
  const evolutions = resultItems(snapshot.templateEvolutions, ["evolutions"]).slice(0, 8).map((row) => ({
    ...row,
    target: `${fieldText(row, ["targetTemplateId"])}@${fieldText(row, ["targetVersion"])}`,
    sourceTypesText: listText(row.sourceTypes) || String(row.sourceCount ?? "-"),
    autoMatchText: autoMatchText(row.autoMatch),
    domainSignalsText: listText(row.domainSignals) || "-",
    gapClassificationsText: listText(row.gapClassifications) || "-"
  }));
  const [dialog, setDialog] = useState<"evolution" | "catalog" | undefined>();
  const [hubTab, setHubTab] = useState<"experts" | "harness" | "connectors">("experts");
  const [catalogForm, setCatalogForm] = useState({
    source: "/path/to/evopilot-harness/published",
    catalogId: "local-harness-catalog",
    name: "Local Harness Catalog"
  });
  const matchPreview = matchPreviewFromAction(lastAction);

  function openEvolution(row?: RowRecord) {
    if (row) onForm({ ...form, baseTemplateId: fieldText(row, ["id", "templateId", "name"], form.baseTemplateId) });
    setDialog("evolution");
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
  const mountCatalogAction: DashboardActionRequest = {
    id: "admin-mount-harness-catalog",
    label: "Mount Published Harness Catalog",
    method: "POST",
    path: apiSurface.harnessCatalogs,
    body: {
      source: catalogForm.source,
      catalogId: catalogForm.catalogId || undefined,
      name: catalogForm.name || undefined
    }
  };
  const formReady = Boolean(form.intent && form.sourceUri);

  return (
    <main className="management-workspace">
      <section className="management-stack">
        <div className="hub-tabs" role="tablist" aria-label="Harness Hub">
          <button type="button" className={hubTab === "experts" ? "active" : ""} onClick={() => setHubTab("experts")}>专家</button>
          <button type="button" className={hubTab === "harness" ? "active" : ""} onClick={() => setHubTab("harness")}>Harness</button>
          <button type="button" className={hubTab === "connectors" ? "active" : ""} onClick={() => setHubTab("connectors")}>连接器</button>
        </div>
        <DataPanel
          title="Catalog 挂载"
          subtitle="从 EvoPilot 已挂载的 Published Harness Catalog 展示领域专家资产、可用 Harness 和连接器入口。"
          rows={catalogMounts}
          columns={[
            ["Catalog", ["name", "catalogId"]],
            ["Source", ["sourceText"]],
            ["Status", ["readStatusText"]],
            ["Digest", ["digestText"]]
          ]}
          empty="No Published Harness Catalog mounted in EvoPilot."
          toolbar={<button className="btn primary" type="button" onClick={() => setDialog("catalog")}><Plus size={15} aria-hidden="true" /> 挂载 Catalog</button>}
          actionLabel="scan"
          actionIcon="eye"
          onRowAction={(row) => onRunAction({
            id: `admin-scan-harness-catalog-${fieldText(row, ["catalogId"])}`,
            label: "Scan Published Harness Catalog",
            method: "POST",
            path: apiSurface.harnessCatalogScan(fieldText(row, ["catalogId"])),
            body: {}
          })}
        />
        {hubTab === "experts" && (
          <DataPanel
            title="领域专家资产"
            subtitle="专家资产由领域 Harness 表达；项目接入时 EvoPilot 仍自动匹配并生成 ProjectHarnessProfile DRAFT。"
            rows={expertRows}
            columns={[
              ["Expert", ["expert"]],
              ["Domain", ["domainText"]],
              ["Version", ["versionText"]],
              ["Catalog", ["catalogText"]]
            ]}
            empty="No domain Harness experts returned by EvoPilot."
            actionLabel="进化"
            actionIcon="plus"
            onRowAction={openEvolution}
          />
        )}
        {hubTab === "harness" && (
          <DataPanel
            title="可用 Harness"
            subtitle="EvoPilot 自动匹配这些 Harness；Catalog 新增 Harness 后，下一次读取即可进入候选池。"
            rows={templates}
            columns={[
              ["Template", ["id", "templateId", "name"]],
              ["Version", ["version"]],
              ["Layer", ["harnessLayer", "languageFamily"]],
              ["Digest", ["digest"]]
            ]}
            empty="No templates returned by EvoPilot."
            toolbar={<button className="btn ghost" type="button" onClick={() => onRunAction({ id: "admin-refresh-harness-catalogs", label: "Refresh Harness Catalogs", method: "GET", path: apiSurface.harnessCatalogs })}><RefreshCw size={15} aria-hidden="true" /> 刷新 Hub</button>}
            actionLabel="进化"
            actionIcon="plus"
            onRowAction={openEvolution}
          />
        )}
        {hubTab === "connectors" && (
          <DataPanel
            title="Harness 进化连接器"
            subtitle="连接器用于把历史项目、附件、生产日志和运行证据提交给 EvoPilot HarnessTemplateEvolution。"
            rows={connectorRows}
            columns={[
              ["Connector", ["name"]],
              ["Source", ["sourceType"]],
              ["Scope", ["scope"]],
              ["Status", ["status"]]
            ]}
            empty="No connectors configured."
            actionLabel="使用"
            actionIcon="plus"
            onRowAction={(row) => {
              onForm({ ...form, sourceType: fieldText(row, ["sourceType"], form.sourceType) });
              setDialog("evolution");
            }}
          />
        )}
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
          toolbar={<button className="btn primary" type="button" onClick={() => openEvolution()}><Plus size={15} aria-hidden="true" /> 一键进化 Harness</button>}
        />
        <DataPanel
          title="Legacy HarnessTemplate 投影"
          subtitle="兼容旧模板 projection；后续用户入口优先使用 Harness Hub。"
          rows={templates}
          columns={[
            ["Template", ["id", "templateId", "name"]],
            ["Version", ["version"]],
            ["Type", ["softwareType", "language", "category"]],
            ["Status", ["status", "state"]]
          ]}
          empty="No templates returned by EvoPilot."
          actionLabel="进化"
          actionIcon="plus"
          onRowAction={openEvolution}
        />
      </section>
      {dialog === "catalog" && (
        <AdminDialog
          eyebrow="Published Harness Catalog"
          title="挂载 Catalog"
          subtitle={catalogForm.catalogId || "local catalog"}
          primaryLabel="挂载并扫描"
          busy={busyAction === mountCatalogAction.id}
          disabled={!catalogForm.source}
          lastAction={lastAction}
          onClose={() => setDialog(undefined)}
          onSubmit={() => onRunAction(mountCatalogAction)}
        >
          <label><span>Catalog Source</span><input value={catalogForm.source} onChange={(event) => setCatalogForm({ ...catalogForm, source: event.currentTarget.value })} /></label>
          <div className="form-two">
            <label><span>Catalog ID</span><input value={catalogForm.catalogId} onChange={(event) => setCatalogForm({ ...catalogForm, catalogId: event.currentTarget.value })} /></label>
            <label><span>Name</span><input value={catalogForm.name} onChange={(event) => setCatalogForm({ ...catalogForm, name: event.currentTarget.value })} /></label>
          </div>
        </AdminDialog>
      )}
      {dialog === "evolution" && (
        <AdminDialog
          eyebrow="Template evolution"
          title="一键进化 Harness"
          subtitle={`${form.baseTemplateId || "auto-match"} · target ${form.targetVersion || "matched or next version"}`}
          primaryLabel="生成 review draft"
          busy={busyAction === action.id}
          disabled={!formReady}
          lastAction={lastAction}
          onClose={() => setDialog(undefined)}
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

function connectorCatalogRows(): RowRecord[] {
  return [
    { name: "Source Project", sourceType: "source-project", scope: "local path or registered project", status: "available" },
    { name: "Source Corpus", sourceType: "source-corpus", scope: "multiple historical projects", status: "available" },
    { name: "Attachment", sourceType: "attachment", scope: "ppt, pdf, word, xlsx, text", status: "available" },
    { name: "Production Log", sourceType: "production-log", scope: "redacted runtime logs", status: "available" },
    { name: "EvoPilot History", sourceType: "evopilot-history", scope: "goal loop history and evidence", status: "available" },
    { name: "Runtime Evidence", sourceType: "runtime-evidence", scope: "evidence bundle reference", status: "available" }
  ];
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
