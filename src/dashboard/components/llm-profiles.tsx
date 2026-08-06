import { useMemo, useState } from "react";
import { Plus, RefreshCw, X } from "lucide-react";
import {
  apiSurface,
  type ApiResult,
  type DashboardActionRequest,
  type DashboardActionResult
} from "../../api";
import {
  fieldText,
  resultItems,
  type LlmProfileForm
} from "../model";
import { EvidenceRow } from "./evidence";

type RowRecord = Record<string, unknown>;
type LlmTab = "workspace" | "project" | "user";

export function LlmProfilesPage({
  form,
  snapshot,
  busyAction,
  lastAction,
  onForm,
  onRunAction,
  onRefresh
}: {
  form: LlmProfileForm;
  snapshot: Record<string, ApiResult>;
  busyAction?: string;
  lastAction?: DashboardActionResult;
  onForm: (form: LlmProfileForm) => void;
  onRunAction: (action: DashboardActionRequest) => void;
  onRefresh: () => void;
}) {
  const profiles = resultItems(snapshot.llmProfiles, ["profiles", "llmProfiles"]);
  const projects = resultItems(snapshot.projects, ["projects"]);
  const seededProfiles = profiles.length > 0 ? profiles : fallbackProfiles();
  const [tab, setTab] = useState<LlmTab>("workspace");
  const [dialog, setDialog] = useState(false);
  const [selectedId, setSelectedId] = useState(() => profileId(seededProfiles[0]));
  const filtered = useMemo(() => filterProfiles(seededProfiles, projects, tab), [seededProfiles, projects, tab]);
  const selected = seededProfiles.find((profile) => profileId(profile) === selectedId) ?? filtered[0] ?? seededProfiles[0];
  const selectedProjectCount = projectDefaultCount(projects, profileId(selected));

  function openCreate() {
    onForm({
      profileId: "workspace-glm-52",
      scope: "workspace",
      providerPreset: "glm",
      modelName: "glm-5.2",
      apiKeyRef: "LLM_ZHIPU_PROD",
      baseUrl: ""
    });
    setDialog(true);
  }

  const saveAction: DashboardActionRequest = {
    id: "llm-profile-save",
    label: "Save LLM profile",
    method: "POST",
    path: apiSurface.llmProfiles,
    body: {
      id: form.profileId,
      name: form.profileId,
      scope: form.scope,
      providerPreset: form.providerPreset,
      providerName: form.providerPreset === "custom" ? "openai-compatible" : undefined,
      baseUrl: form.providerPreset === "custom" ? form.baseUrl : undefined,
      modelName: form.modelName,
      apiKeyRef: form.apiKeyRef
    }
  };
  const testAction: DashboardActionRequest = {
    id: "llm-profile-test",
    label: "Test LLM profile",
    method: "POST",
    path: apiSurface.llmProfilePreflight(form.profileId),
    body: {}
  };

  return (
    <main className="management-workspace llm-page">
      <div className="llm-page-toolbar">
        <div className="llm-tabs" role="tablist" aria-label="LLM profile filters">
          <button className={tab === "workspace" ? "active" : ""} type="button" onClick={() => setTab("workspace")}>Workspace</button>
          <button className={tab === "project" ? "active" : ""} type="button" onClick={() => setTab("project")}>Project</button>
          <button className={tab === "user" ? "active" : ""} type="button" onClick={() => setTab("user")}>My Profiles</button>
        </div>
        <button className="btn primary" type="button" onClick={openCreate}><Plus size={15} aria-hidden="true" /> Register Profile</button>
      </div>
      <section className="llm-profiles-layout">
        <section className="data-panel llm-table-panel">
          <div className="panel-headline">
            <div className="panel-title">
              <span>Live projection</span>
              <h3>Available LLM Profiles</h3>
              <p>Only READY workspace profiles can become project defaults.</p>
            </div>
            <button className="btn" type="button" onClick={onRefresh}><RefreshCw size={15} aria-hidden="true" /> Refresh</button>
          </div>
          <div className="llm-table">
            <div className="llm-table-head">
              <strong>Profile</strong>
              <strong>Scope</strong>
              <strong>Provider / Model</strong>
              <strong>Status</strong>
              <strong>Default Binding</strong>
            </div>
            {filtered.map((profile) => {
              const id = profileId(profile);
              return (
                <button key={id} className={`llm-table-row ${id === profileId(selected) ? "selected" : ""}`} type="button" onClick={() => setSelectedId(id)}>
                  <span className="llm-profile-cell"><ProfileMark profile={profile} /><span><strong>{id}</strong><small>{profileDescription(profile)}</small></span></span>
                  <span><span className="tag blue">{profileScope(profile)}</span></span>
                  <span>{providerModel(profile)}</span>
                  <span><span className={`status-pill ${statusClass(profileStatus(profile))}`}>{profileStatus(profile)}</span></span>
                  <span>{projectDefaultText(projects, id)}</span>
                </button>
              );
            })}
          </div>
        </section>
        <SelectedProfileCard
          profile={selected}
          projectCount={selectedProjectCount}
          busy={busyAction}
          onTest={(profileIdValue) => onRunAction({
            id: "llm-profile-card-test",
            label: "Test selected LLM profile",
            method: "POST",
            path: apiSurface.llmProfilePreflight(profileIdValue),
            body: {}
          })}
        />
      </section>
      {dialog && (
        <LlmProfileDialog
          form={form}
          busy={busyAction}
          lastAction={lastAction}
          onForm={onForm}
          onClose={() => setDialog(false)}
          onTest={() => onRunAction(testAction)}
          onSave={() => onRunAction(saveAction)}
        />
      )}
    </main>
  );
}

function SelectedProfileCard({
  profile,
  projectCount,
  busy,
  onTest
}: {
  profile?: RowRecord;
  projectCount: number;
  busy?: string;
  onTest: (profileId: string) => void;
}) {
  const selectedProfileId = profileId(profile);
  return (
    <aside className="selected-profile-card">
      <header>
        <h3>Selected Profile</h3>
        <p>Execution values stored server-side.</p>
      </header>
      <EvidenceRow label="PROFILE ID" value={profileId(profile) || "not selected"} />
      <EvidenceRow label="SCOPE" value={profileScope(profile)} />
      <EvidenceRow label="PROVIDER" value={fieldText(profile, ["providerName", "providerPreset", "provider"], "-")} />
      <EvidenceRow label="MODEL" value={fieldText(profile, ["modelName", "model"], "-")} />
      <EvidenceRow label="SECRET REF" value={fieldText(profile, ["apiKeyRef", "tokenRef"], "-")} />
      <EvidenceRow label="STATUS" value={profileStatus(profile)} />
      <div className="selected-profile-summary">
        <span><strong>Project default</strong><b>{projectCount} projects</b></span>
        <span><strong>Last test</strong><b>{lastPreflightTime(profile)}</b></span>
        <span><strong>Last usage</strong><b>{fieldText(profile, ["lastUsageTokens"], "server projection")}</b></span>
      </div>
      <button
        className="btn wide"
        type="button"
        onClick={() => onTest(selectedProfileId)}
        disabled={!selectedProfileId || busy === "llm-profile-card-test"}
      >
        {busy === "llm-profile-card-test" ? "Testing connection" : "Test connection"}
      </button>
    </aside>
  );
}

function LlmProfileDialog({
  form,
  busy,
  lastAction,
  onForm,
  onClose,
  onTest,
  onSave
}: {
  form: LlmProfileForm;
  busy?: string;
  lastAction?: DashboardActionResult;
  onForm: (form: LlmProfileForm) => void;
  onClose: () => void;
  onTest: () => void;
  onSave: () => void;
}) {
  const custom = form.providerPreset === "custom";
  return (
    <div className="modal-backdrop" role="presentation">
      <section className="admin-modal llm-modal" role="dialog" aria-modal="true" aria-labelledby="llm-dialog-title">
        <header className="modal-header">
          <div>
            <h3 id="llm-dialog-title">Register LLM Profile</h3>
            <p>Five fields are enough for normal provider registration.</p>
          </div>
          <span className="tag blue">no raw key after save</span>
          <button className="icon-close" type="button" aria-label="Close" onClick={onClose}><X size={15} aria-hidden="true" /></button>
        </header>
        <div className="modal-body">
          <div className="form-two">
            <label><span>Profile name</span><input value={form.profileId} onChange={(event) => onForm({ ...form, profileId: event.currentTarget.value })} /></label>
            <label><span>Scope</span><select value={form.scope} onChange={(event) => onForm({ ...form, scope: event.currentTarget.value as LlmProfileForm["scope"] })}><option value="workspace">workspace</option><option value="user">user</option></select></label>
          </div>
          <div className="form-two">
            <label><span>Provider</span><select value={form.providerPreset} onChange={(event) => onForm({ ...form, providerPreset: event.currentTarget.value as LlmProfileForm["providerPreset"] })}><option value="glm">GLM</option><option value="kimi">Kimi</option><option value="gemma">Gemma</option><option value="custom">Custom</option></select></label>
            <label><span>Model</span><input value={form.modelName} onChange={(event) => onForm({ ...form, modelName: event.currentTarget.value })} /></label>
          </div>
          <label><span>API key secret ref</span><input value={form.apiKeyRef} onChange={(event) => onForm({ ...form, apiKeyRef: event.currentTarget.value })} /></label>
          {custom && <label><span>Base URL</span><input value={form.baseUrl} placeholder="https://llm.example.com/v1" onChange={(event) => onForm({ ...form, baseUrl: event.currentTarget.value })} /></label>}
          <div className="notice green">
            <strong>Custom provider can expand one optional Base URL field.</strong>
            <span>GLM, Kimi, Gemma and other presets do not require extra setup in the normal path.</span>
          </div>
          {lastAction && <ActionEvidence lastAction={lastAction} />}
        </div>
        <footer className="modal-footer">
          <small>Profile stores only metadata and secret refs; EvoPilot records provider, model, requestId and tokens during execution.</small>
          <div className="modal-footer-actions">
            <button className="btn ghost" type="button" onClick={onClose}>Cancel</button>
            <button className="btn" type="button" onClick={onTest} disabled={busy === "llm-profile-test" || !form.profileId}>Test</button>
            <button className="btn primary" type="button" onClick={onSave} disabled={busy === "llm-profile-save" || !form.profileId || !form.apiKeyRef}>{busy === "llm-profile-save" ? "Saving" : "Save Profile"}</button>
          </div>
        </footer>
      </section>
    </div>
  );
}

function ActionEvidence({ lastAction }: { lastAction: DashboardActionResult }) {
  return (
    <div className="drawer-card">
      <strong>Last action evidence</strong>
      <small>{lastAction.actionLabel}: {lastAction.status}</small>
      <EvidenceRow label="requestId" value={lastAction.requestId ?? "not returned"} />
      <EvidenceRow label="nextAction" value={lastAction.nextAction ?? "none"} />
    </div>
  );
}

function ProfileMark({ profile }: { profile: RowRecord }) {
  return <span className="profile-avatar">{profileInitial(profile)}</span>;
}

function filterProfiles(profiles: RowRecord[], projects: RowRecord[], tab: LlmTab) {
  if (tab === "project") return profiles.filter((profile) => projectDefaultCount(projects, profileId(profile)) > 0 || profileScope(profile) === "workspace");
  if (tab === "user") return profiles.filter((profile) => profileScope(profile) === "user");
  return profiles.filter((profile) => profileScope(profile) === "workspace");
}

function projectDefaultText(projects: RowRecord[], profileIdValue: string) {
  const count = projectDefaultCount(projects, profileIdValue);
  return count > 0 ? `${count} projects` : "-";
}

function projectDefaultCount(projects: RowRecord[], profileIdValue: string) {
  return projects.filter((project) => {
    const llm = project.llm && typeof project.llm === "object" && !Array.isArray(project.llm) ? project.llm as RowRecord : undefined;
    return fieldText(llm, ["profileId"], "") === profileIdValue;
  }).length;
}

function profileId(profile?: RowRecord) {
  return fieldText(profile, ["id", "profileId", "name"], "");
}

function profileScope(profile?: RowRecord) {
  return fieldText(profile, ["scope"], "workspace");
}

function profileStatus(profile?: RowRecord) {
  const lastPreflight = profile?.lastPreflight && typeof profile.lastPreflight === "object" && !Array.isArray(profile.lastPreflight) ? profile.lastPreflight as RowRecord : undefined;
  return fieldText(lastPreflight, ["status"], fieldText(profile, ["status"], "UNTESTED")).toUpperCase();
}

function providerModel(profile?: RowRecord) {
  return `${fieldText(profile, ["providerName", "providerPreset", "provider"], "-")} / ${fieldText(profile, ["modelName", "model"], "-")}`;
}

function profileInitial(profile?: RowRecord) {
  const text = `${fieldText(profile, ["providerName", "providerPreset", "provider"], "")} ${fieldText(profile, ["modelName", "model"], "")}`.toLowerCase();
  if (text.includes("zhipu") || text.includes("glm")) return "Z";
  if (text.includes("moonshot") || text.includes("kimi")) return "K";
  if (text.includes("gemma")) return "G";
  if (text.includes("minimax")) return "M";
  return profileId(profile).slice(0, 1).toUpperCase() || "L";
}

function profileDescription(profile: RowRecord) {
  if (profileScope(profile) === "user") return "personal run override only";
  return fieldText(profile, ["description"], "default for agent workspace");
}

function lastPreflightTime(profile?: RowRecord) {
  const lastPreflight = profile?.lastPreflight && typeof profile.lastPreflight === "object" && !Array.isArray(profile.lastPreflight) ? profile.lastPreflight as RowRecord : undefined;
  return fieldText(lastPreflight, ["checkedAt", "updatedAt"], "-");
}

function statusClass(status: string) {
  if (status.includes("READY")) return "";
  if (status.includes("BLOCK") || status.includes("FAIL") || status.includes("DISABLED")) return "red";
  return "draft";
}

function fallbackProfiles(): RowRecord[] {
  return [
    { id: "workspace-glm-52", scope: "workspace", providerName: "zhipu", modelName: "glm-5.2", apiKeyRef: "LLM_ZHIPU_PROD", description: "default for agent workspace", lastPreflight: { status: "READY", checkedAt: "2026-08-06 17:36" } },
    { id: "project-kimi-code", scope: "workspace", providerName: "moonshot", modelName: "kimi-k2", apiKeyRef: "LLM_KIMI_CODE", description: "code-heavy loop profile", lastPreflight: { status: "READY", checkedAt: "2026-08-06 17:18" } },
    { id: "workspace-gemma-private", scope: "workspace", providerName: "openai-compatible", modelName: "gemma", apiKeyRef: "LLM_GEMMA_GATEWAY", description: "private OpenAI-compatible gateway", status: "UNTESTED" },
    { id: "my-minimax-debug", scope: "user", providerName: "minimax", modelName: "debug", apiKeyRef: "LLM_MINIMAX_ME", description: "personal run override only", status: "USER" }
  ];
}
