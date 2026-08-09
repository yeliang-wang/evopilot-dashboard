import { RefreshCw } from "lucide-react";
import {
  apiSurface,
  type ApiResult,
  type DashboardActionRequest,
  type DashboardActionResult
} from "../../api";
import {
  asRecord,
  fieldText,
  resultItems
} from "../model";
import { DataPanel } from "./management-widgets";

type RowRecord = Record<string, unknown>;

export function TemplatesPage({
  snapshot,
  busyAction,
  lastAction,
  onRunAction
}: {
  snapshot: Record<string, ApiResult>;
  busyAction?: string;
  lastAction?: DashboardActionResult;
  onRunAction: (action: DashboardActionRequest) => void;
}) {
  const catalogs = resultItems(snapshot.harnessCatalogs, ["catalogs"]).slice(0, 8);
  const mounts = resultItems(snapshot.harnessCatalogs, ["mounts"]).slice(0, 8);
  const scans = resultItems(snapshot.harnessCatalogs, ["scans"]).slice(0, 8);
  const templates = publishedTemplates(snapshot.harnessCatalogs).slice(0, 16);
  const catalogRows = catalogs.map((catalog) => {
    const catalogId = fieldText(catalog, ["catalogId"]);
    const mount = mounts.find((row) => fieldText(row, ["catalogId"]) === catalogId);
    const scan = scans.find((row) => fieldText(asRecord(row.catalog), ["catalogId"]) === catalogId || fieldText(row, ["catalogId"]) === catalogId);
    return {
      ...catalog,
      nameText: fieldText(mount, ["name"], fieldText(catalog, ["name"], catalogId)),
      sourceText: fieldText(mount, ["source"], "server configured directory"),
      readStatusText: `${fieldText(mount, ["lastReadStatus", "status"], fieldText(scan, ["status"], "READY"))} · ${fieldText(scan, ["templateCount"], String(templates.length))} Harness`,
      digestText: fieldText(catalog, ["catalogDigest"], fieldText(mount, ["catalogDigest"])),
      compatibleText: fieldText(catalog, ["compatibleEvopilot"], ">=3.0.0")
    };
  });
  const expertRows = templates
    .filter((row) => fieldText(row, ["harnessLayer", "layer"], fieldText(asRecord(row.runtimePatterns), ["harnessLayer"], "runtime")) === "domain")
    .map((row) => ({
      ...row,
      expert: `${fieldText(row, ["name", "id"])} Expert`,
      domainText: fieldText(row, ["domain"], fieldText(asRecord(row.runtimePatterns), ["domain"])),
      versionText: `${fieldText(row, ["id", "name"])}@${fieldText(row, ["version"])}`,
      catalogText: fieldText(asRecord(row.catalogRef), ["catalogId"], fieldText(row, ["catalogId"], "published catalog"))
    }))
    .slice(0, 8);
  const connectorRows = connectorCatalogRows();
  const lastInspect = lastAction?.actionId.startsWith("admin-inspect-harness-catalog") ? lastAction : undefined;

  return (
    <main className="management-workspace">
      <section className="management-stack">
        <DataPanel
          title="Published Harness Catalog"
          subtitle="EvoPilot v3 动态读取服务端配置目录中的 CATALOG.md；Dashboard 只展示可用目录，不导入、不挂载、不发布 Harness。"
          rows={catalogRows}
          columns={[
            ["Catalog", ["nameText", "catalogId"]],
            ["Source", ["sourceText"]],
            ["Status", ["readStatusText"]],
            ["Compatible", ["compatibleText"]],
            ["Digest", ["digestText"]]
          ]}
          empty="No published Harness Catalog directory is configured in EvoPilot."
          toolbar={<button className="btn ghost" type="button" onClick={() => onRunAction({ id: "admin-refresh-harness-catalogs", label: "Refresh Harness Catalogs", method: "GET", path: apiSurface.harnessCatalogs })}><RefreshCw size={15} aria-hidden="true" /> 刷新 Hub</button>}
          actionLabel="inspect"
          actionIcon="eye"
          onRowAction={(row) => onRunAction({
            id: `admin-inspect-harness-catalog-${fieldText(row, ["catalogId"])}`,
            label: "Inspect Published Harness Catalog",
            method: "GET",
            path: apiSurface.harnessCatalog(fieldText(row, ["catalogId"])),
            body: {}
          })}
        />
        <DataPanel
          title="领域专家资产"
          subtitle="专家资产由已发布领域 Harness 表达；项目接入后由 EvoPilot goal plan 自动选择 selectedHarness。"
          rows={expertRows}
          columns={[
            ["Expert", ["expert"]],
            ["Domain", ["domainText"]],
            ["Version", ["versionText"]],
            ["Catalog", ["catalogText"]]
          ]}
          empty="No domain Harness experts returned by EvoPilot Catalogs."
        />
        <DataPanel
          title="可用 Harness"
          subtitle="Catalog 目录中新增或升级 Harness 后，EvoPilot 下一次读取 Catalog 时自动进入候选池。"
          rows={templates}
          columns={[
            ["Harness", ["id", "name"]],
            ["Version", ["version"]],
            ["Layer", ["harnessLayer", "layer", "languageFamily"]],
            ["Domain", ["domain"]],
            ["Digest", ["digest", "entryDigest"]]
          ]}
          empty="No Harness definitions returned by EvoPilot Catalogs."
        />
        <DataPanel
          title="Harness 进化入口"
          subtitle="生命周期与进化在 evopilot-harness 中完成；Dashboard 只提示管理员可用于发布 Harness 的来源类型。"
          rows={connectorRows}
          columns={[
            ["Connector", ["name"]],
            ["Source", ["sourceType"]],
            ["Scope", ["scope"]],
            ["Owner", ["owner"]]
          ]}
          empty="No connectors configured."
        />
        {lastInspect && (
          <DataPanel
            title="Catalog Inspect Result"
            subtitle={lastInspect.requestId ?? "inspect request"}
            rows={publishedTemplates(lastInspect).slice(0, 12)}
            columns={[
              ["Harness", ["id", "name"]],
              ["Version", ["version"]],
              ["Domain", ["domain"]],
              ["Path", ["entryPath", "path"]]
            ]}
            empty="Inspect did not return Harness entries."
          />
        )}
      </section>
    </main>
  );
}

function publishedTemplates(result?: ApiResult | DashboardActionResult): RowRecord[] {
  const templates = resultItems(result, ["templates"]);
  if (templates.length > 0) return templates.map(normalizeTemplateRow);
  const catalogs = resultItems(result, ["catalogs", "catalog"]);
  return catalogs.flatMap((catalog) => {
    const catalogId = fieldText(catalog, ["catalogId"]);
    const catalogDigest = fieldText(catalog, ["catalogDigest"]);
    const entries = Array.isArray(catalog.entries) ? catalog.entries : [];
    return entries.filter((entry): entry is RowRecord => Boolean(asRecord(entry))).map((entry) => normalizeTemplateRow({
      ...entry,
      id: fieldText(entry, ["id", "name"]),
      catalogId,
      catalogDigest,
      catalogRef: {
        catalogId,
        catalogDigest,
        entryPath: fieldText(entry, ["path"]),
        entryDigest: fieldText(entry, ["digest"])
      }
    }));
  });
}

function normalizeTemplateRow(row: RowRecord): RowRecord {
  const catalogRef = asRecord(row.catalogRef);
  return {
    ...row,
    id: fieldText(row, ["id", "name"]),
    harnessLayer: fieldText(row, ["harnessLayer", "layer"], fieldText(asRecord(row.runtimePatterns), ["harnessLayer"], "runtime")),
    domain: fieldText(row, ["domain"], fieldText(asRecord(row.runtimePatterns), ["domain"], "")),
    entryPath: fieldText(catalogRef, ["entryPath"], fieldText(row, ["path"])),
    entryDigest: fieldText(catalogRef, ["entryDigest"], fieldText(row, ["digest"]))
  };
}

function connectorCatalogRows(): RowRecord[] {
  return [
    { name: "Source Project", sourceType: "source-project", scope: "local path or registered project", owner: "evopilot-harness CLI" },
    { name: "Source Corpus", sourceType: "source-corpus", scope: "multiple historical projects", owner: "evopilot-harness CLI" },
    { name: "Attachment", sourceType: "attachment", scope: "ppt, pdf, word, xlsx, text", owner: "evopilot-harness CLI" },
    { name: "Production Log", sourceType: "production-log", scope: "redacted runtime logs", owner: "evopilot-harness CLI" },
    { name: "EvoPilot History", sourceType: "evopilot-history", scope: "goal loop history and evidence export", owner: "evopilot-harness CLI" },
    { name: "Runtime Evidence", sourceType: "runtime-evidence", scope: "evidence bundle reference", owner: "evopilot-harness CLI" }
  ];
}
