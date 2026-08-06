import { useState } from "react";
import {
  Check,
  CheckCircle2,
  ChevronRight,
  Eye,
  GitBranch,
  KeyRound,
  Play,
  Send,
  Wrench
} from "lucide-react";
import { type ApiResult } from "../../api";
import {
  deliveryChainLabel,
  fieldText,
  normalizeDeliveryChain,
  repositoryProviderForChain,
  resultItems,
  type ConsoleStep,
  type ProjectDeliveryChain,
  type ProjectLoopContext
} from "../model";

export function Composer({
  consoleStep,
  context,
  goal,
  ownerChange,
  busyAction,
  onPatchContext,
  onGoalChange,
  onOwnerChange,
  onStart,
  onRequestChanges,
  onConfirm,
  onApproveAndAdvance,
  onViewEvidence,
  onViewRelease,
  llmProfilesResult,
  projectLlmResult,
  onBindProjectLlm,
  onManageLlmProfiles
}: {
  consoleStep: ConsoleStep;
  context: ProjectLoopContext;
  goal: string;
  ownerChange: string;
  busyAction?: string;
  llmProfilesResult?: ApiResult;
  projectLlmResult?: ApiResult;
  onPatchContext: (patch: Partial<ProjectLoopContext>) => void;
  onGoalChange: (goal: string) => void;
  onOwnerChange: (value: string) => void;
  onStart: () => void;
  onRequestChanges: () => void;
  onConfirm: () => void;
  onApproveAndAdvance: () => void;
  onViewEvidence: () => void;
  onViewRelease: () => void;
  onBindProjectLlm: (profileId: string) => void;
  onManageLlmProfiles: () => void;
}) {
  const disabled = Boolean(busyAction);
  if (consoleStep === "intake" || consoleStep === "template-match" || consoleStep === "drafting") {
    const chain = normalizeDeliveryChain(context.deliveryChain) ?? "github-native";
    const gitlabExecutor = chain !== "github-native";
    const bridgeMode = chain === "github-source-gitlab-ci";
    const setChain = (nextChain: ProjectDeliveryChain) => onPatchContext({
      deliveryChain: nextChain,
      repositoryProvider: repositoryProviderForChain(nextChain),
      workflowProvider: nextChain === "github-source-gitlab-ci" ? "gitlab" : context.workflowProvider
    });

    return (
      <section className="composer" aria-label="Project goal composer">
        <div className="composer-grid intake">
          <label>
            <span>Repository</span>
            <input
              value={context.repositoryUrl}
              placeholder={chain === "gitlab-native" ? "https://gitlab.example.com/group/project.git" : "https://github.com/org/project.git"}
              onChange={(event) => onPatchContext({ repositoryUrl: event.currentTarget.value })}
            />
          </label>
          <label>
            <span>Goal Loop Target</span>
            <textarea value={goal} placeholder="Describe the project goal..." onChange={(event) => onGoalChange(event.currentTarget.value)} />
          </label>
        </div>
        <div className="delivery-chain" role="group" aria-label="Delivery chain">
          {(["github-native", "gitlab-native", "github-source-gitlab-ci"] as ProjectDeliveryChain[]).map((option) => (
            <button
              key={option}
              className={`chain-option ${chain === option ? "selected" : ""}`}
              type="button"
              onClick={() => setChain(option)}
            >
              <GitBranch size={15} aria-hidden="true" />
              <span>{deliveryChainLabel(option)}</span>
            </button>
          ))}
        </div>
        <LlmBindingControl
          context={context}
          llmProfilesResult={llmProfilesResult}
          projectLlmResult={projectLlmResult}
          onPatchContext={onPatchContext}
          onBindProjectLlm={onBindProjectLlm}
          onManageLlmProfiles={onManageLlmProfiles}
        />
        <div className="composer-grid devops">
          <label>
            <span>Source tokenRef</span>
            <input
              value={context.tokenRef}
              placeholder={chain === "gitlab-native" ? "GITLAB_SOURCE_TOKEN_REF" : "GITHUB_SOURCE_TOKEN_REF"}
              onChange={(event) => onPatchContext({ tokenRef: event.currentTarget.value })}
            />
          </label>
          <label>
            <span>DevOps owner</span>
            <input value={context.devopsOwner} placeholder={chain === "gitlab-native" ? "group/subgroup" : "org or group"} onChange={(event) => onPatchContext({ devopsOwner: event.currentTarget.value })} />
          </label>
          {chain === "github-native" ? (
            <>
              <label>
                <span>GitHub Actions workflow</span>
                <input value={context.ciWorkflow} placeholder="ci.yml" onChange={(event) => onPatchContext({ ciWorkflow: event.currentTarget.value })} />
              </label>
              <label>
                <span>Required check</span>
                <input value={context.ciRequiredCheck} placeholder="build" onChange={(event) => onPatchContext({ ciRequiredCheck: event.currentTarget.value })} />
              </label>
            </>
          ) : (
            <>
              <label>
                <span>Required stage</span>
                <input value={context.ciRequiredStage} placeholder="test" onChange={(event) => onPatchContext({ ciRequiredStage: event.currentTarget.value })} />
              </label>
              <label>
                <span>Required job</span>
                <input value={context.ciRequiredJob} placeholder="build" onChange={(event) => onPatchContext({ ciRequiredJob: event.currentTarget.value })} />
              </label>
            </>
          )}
        </div>
        {gitlabExecutor && (
          <div className="composer-grid bridge">
            <label>
              <span>{bridgeMode ? "GitLab base URL" : "GitLab workflow repo"}</span>
              <input
                value={bridgeMode ? context.workflowBaseUrl : context.workflowRepository}
                placeholder={bridgeMode ? "https://gitlab.example.com" : "group/project"}
                onChange={(event) => bridgeMode
                  ? onPatchContext({ workflowBaseUrl: event.currentTarget.value })
                  : onPatchContext({ workflowRepository: event.currentTarget.value })}
              />
            </label>
            <label>
              <span>{bridgeMode ? "GitLab CI project" : "GitLab ref"}</span>
              <input
                value={bridgeMode ? context.workflowProjectId || context.workflowRepository : context.gitlabRef}
                placeholder={bridgeMode ? "group/project" : "main"}
                onChange={(event) => bridgeMode
                  ? onPatchContext({ workflowProjectId: event.currentTarget.value, workflowRepository: event.currentTarget.value })
                  : onPatchContext({ gitlabRef: event.currentTarget.value })}
              />
            </label>
            <label>
              <span>{bridgeMode ? "GitLab ref" : "Ready URL"}</span>
              <input
                value={bridgeMode ? context.gitlabRef : context.readyUrl}
                placeholder={bridgeMode ? "main" : "https://app.example.com/ready"}
                onChange={(event) => bridgeMode
                  ? onPatchContext({ gitlabRef: event.currentTarget.value, workflowBranch: event.currentTarget.value })
                  : onPatchContext({ readyUrl: event.currentTarget.value })}
              />
            </label>
            <label>
              <span>DevOps tokenRef</span>
              <input value={context.devopsTokenRef} placeholder="GITLAB_CI_TOKEN_REF" onChange={(event) => onPatchContext({ devopsTokenRef: event.currentTarget.value })} />
            </label>
          </div>
        )}
        <div className="composer-footer">
          <span>{deliveryChainLabel(chain)} · EvoPilot stores only secret refs in the Dashboard request.</span>
          <button className="btn primary" type="button" onClick={onStart} disabled={disabled || !goal.trim()}>
            <Send size={15} aria-hidden="true" /> {disabled ? "Working..." : "Start intake"}
          </button>
        </div>
      </section>
    );
  }

  if (consoleStep === "review" || consoleStep === "changes") {
    return (
      <section className="composer" aria-label="Owner review composer">
        <textarea
          value={ownerChange}
          placeholder="Request a harness change, or confirm the displayed ProjectHarnessProfile.yaml."
          onChange={(event) => onOwnerChange(event.currentTarget.value)}
        />
        <div className="composer-footer">
          <span>修改会生成新的 DRAFT 差异，不会直接激活。</span>
          <div className="actions">
            <button className="btn primary" type="button" onClick={onRequestChanges} disabled={disabled || !ownerChange.trim()}>
              <Send size={15} aria-hidden="true" /> Request changes
            </button>
            <button className="btn green" type="button" onClick={onConfirm} disabled={disabled}>
              <CheckCircle2 size={15} aria-hidden="true" /> Confirm
            </button>
            <button className="btn" type="button" onClick={onViewEvidence}>
              <Eye size={15} aria-hidden="true" /> View evidence
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (consoleStep === "activated") {
    return (
      <section className="composer" aria-label="Phase plan approval composer">
        <div className="composer-grid approval">
          <label>
            <span>Confirmed By</span>
            <input value={context.confirmedBy} placeholder="real project owner" onChange={(event) => onPatchContext({ confirmedBy: event.currentTarget.value })} />
          </label>
          <label>
            <span>Confirmation</span>
            <textarea value={context.confirmation} placeholder="Project owner reviewed the active harness binding and Alpha/Beta/RC/GA phase plan." onChange={(event) => onPatchContext({ confirmation: event.currentTarget.value })} />
          </label>
        </div>
        <div className="composer-footer">
          <span>Phase plan approval needs real confirmation. Dashboard will not invent it.</span>
          <button className="btn primary" type="button" onClick={onApproveAndAdvance} disabled={disabled || !context.confirmedBy.trim() || !context.confirmation.trim()}>
            <Play size={15} aria-hidden="true" /> Approve plan & start loop
          </button>
        </div>
      </section>
    );
  }

  if (consoleStep === "blocker") {
    return (
      <section className="composer" aria-label="Blocker composer">
        <textarea readOnly value="批准修复 blocker 前，请先查看 requestId、日志、失败能力和建议修复范围。" />
        <div className="composer-footer">
          <span>Stop on blocker unless the project owner or administrator approves repair.</span>
          <div className="actions">
            <button className="btn warn" type="button" onClick={onViewEvidence}><Wrench size={15} aria-hidden="true" /> View repair evidence</button>
            <button className="btn" type="button" onClick={onViewRelease}>Refresh release evidence</button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="composer" aria-label="Release decision composer">
      <textarea readOnly value="确认发布前，请读取 release decision、TargetEvidencePackage、PhasePackage 和 residual risk。" />
      <div className="composer-footer">
        <span>Release truth comes from EvoPilot evidence packages and release decisions.</span>
        <div className="actions">
          <button className="btn green" type="button" onClick={onViewRelease}><CheckCircle2 size={15} aria-hidden="true" /> Confirm release</button>
          <button className="btn" type="button" onClick={onViewEvidence}><Eye size={15} aria-hidden="true" /> View evidence</button>
        </div>
      </div>
    </section>
  );
}

function LlmBindingControl({
  context,
  llmProfilesResult,
  projectLlmResult,
  onPatchContext,
  onBindProjectLlm,
  onManageLlmProfiles
}: {
  context: ProjectLoopContext;
  llmProfilesResult?: ApiResult;
  projectLlmResult?: ApiResult;
  onPatchContext: (patch: Partial<ProjectLoopContext>) => void;
  onBindProjectLlm: (profileId: string) => void;
  onManageLlmProfiles: () => void;
}) {
  const [open, setOpen] = useState(false);
  const profiles = resultItems(llmProfilesResult, ["profiles", "llmProfiles"]);
  const visibleProfiles = profiles.length > 0 ? profiles.slice(0, 4) : fallbackProfiles();
  const projectProfileId = projectLlmProfileId(projectLlmResult) || profileId(visibleProfiles.find((profile) => profileScope(profile) === "workspace" && profileStatus(profile) === "READY"));
  const selectedRunProfile = profiles.find((profile) => profileId(profile) === context.llmProfileId);

  return (
    <div className="llm-binding-strip">
      <label>
        <span>Run override profile</span>
        <button className="llm-select" type="button" onClick={() => setOpen((current) => !current)}>
          <ProfileAvatar profile={selectedRunProfile ?? visibleProfiles.find((profile) => profileScope(profile) === "user") ?? visibleProfiles[0]} />
          <strong>{context.llmProfileId || profileId(selectedRunProfile) || "Select LLM profile"}</strong>
          <small>{selectedRunProfile ? `${profileScope(selectedRunProfile)}-owned · this run only` : "project default unless overridden"}</small>
        </button>
      </label>
      <label>
        <span>Override boundary</span>
        <button className="llm-boundary" type="button" onClick={() => setOpen((current) => !current)}>
          <KeyRound size={15} aria-hidden="true" />
          <strong>Use my profile for this run</strong>
          <small>actual provider/model/tokens recorded on EvoPilot</small>
        </button>
      </label>
      {open && (
        <section className="llm-popover" aria-label="Project LLM Profile">
          <header>
            <div>
              <h3>Project LLM Profile</h3>
            </div>
            <span className="tag blue">workspace scope</span>
          </header>
          <div className="llm-option-list">
            {visibleProfiles.map((profile) => {
              const id = profileId(profile);
              const scope = profileScope(profile);
              const status = profileStatus(profile);
              const isProjectDefault = id === projectProfileId;
              const isRunOverride = id === context.llmProfileId;
              return (
                <div className={`llm-option ${isProjectDefault || isRunOverride ? "selected" : ""}`} key={id}>
                  <ProfileAvatar profile={profile} />
                  <div>
                    <strong>{id}</strong>
                    <small>{profileOptionDetail(profile, projectProfileId)}</small>
                  </div>
                  <span className={`status-pill ${status === "READY" ? "" : "draft"}`}>{status}</span>
                  {isProjectDefault ? (
                    <Check size={15} aria-label="Project default" />
                  ) : scope === "user" ? (
                    <button className="text-action" type="button" onClick={() => onPatchContext({ llmProfileId: id })}>{isRunOverride ? "Override" : "Override"}</button>
                  ) : status === "READY" ? (
                    <button className="text-action" type="button" onClick={() => onBindProjectLlm(id)} disabled={!context.projectId}>Bind</button>
                  ) : (
                    <button className="text-action" type="button" onClick={onManageLlmProfiles}>Test</button>
                  )}
                </div>
              );
            })}
          </div>
          <button className="llm-manage" type="button" onClick={onManageLlmProfiles}>
            <span>Manage LLM Profiles</span>
            <ChevronRight size={15} aria-hidden="true" />
          </button>
        </section>
      )}
    </div>
  );
}

function ProfileAvatar({ profile }: { profile?: Record<string, unknown> }) {
  return <span className="profile-avatar">{profileInitial(profile)}</span>;
}

function projectLlmProfileId(result?: ApiResult): string {
  const rows = resultItems(result, ["projectLlm", "llm"]);
  const row = rows[0];
  const llm = row?.llm && typeof row.llm === "object" && !Array.isArray(row.llm) ? row.llm as Record<string, unknown> : undefined;
  const selection = row?.selection && typeof row.selection === "object" && !Array.isArray(row.selection) ? row.selection as Record<string, unknown> : undefined;
  return fieldText(llm, ["profileId"], fieldText(selection, ["profileId"], ""));
}

function profileId(profile?: Record<string, unknown>): string {
  return fieldText(profile, ["id", "profileId", "name"], "");
}

function profileScope(profile?: Record<string, unknown>): string {
  return fieldText(profile, ["scope"], "workspace");
}

function profileStatus(profile?: Record<string, unknown>): string {
  const lastPreflight = profile?.lastPreflight && typeof profile.lastPreflight === "object" && !Array.isArray(profile.lastPreflight)
    ? profile.lastPreflight as Record<string, unknown>
    : undefined;
  return fieldText(lastPreflight, ["status"], fieldText(profile, ["readiness", "status"], "UNTESTED")).toUpperCase();
}

function profileOptionDetail(profile: Record<string, unknown>, projectProfileId: string) {
  if (profileId(profile) === projectProfileId) return `${providerModel(profile)} · Project default`;
  if (profileScope(profile) === "user") return "Only available as run override";
  return `${profileScope(profile)} profile · ${providerModel(profile)}`;
}

function providerModel(profile?: Record<string, unknown>) {
  const provider = fieldText(profile, ["providerName", "providerPreset", "provider"], "provider");
  const model = fieldText(profile, ["modelName", "model"], "model");
  return `${provider}/${model}`;
}

function profileInitial(profile?: Record<string, unknown>) {
  const text = `${fieldText(profile, ["providerName", "providerPreset", "provider"], "")} ${fieldText(profile, ["modelName", "model"], "")}`.toLowerCase();
  if (text.includes("zhipu") || text.includes("glm")) return "Z";
  if (text.includes("moonshot") || text.includes("kimi")) return "K";
  if (text.includes("gemma")) return "G";
  if (text.includes("minimax")) return "M";
  return profileId(profile).slice(0, 1).toUpperCase() || "L";
}

function fallbackProfiles(): Record<string, unknown>[] {
  return [
    { id: "workspace-glm-51", scope: "workspace", providerName: "zhipu", modelName: "glm-5.1", lastPreflight: { status: "READY" } },
    { id: "workspace-kimi-code", scope: "workspace", providerName: "moonshot", modelName: "kimi-k2", lastPreflight: { status: "READY" } },
    { id: "private-gemma-gateway", scope: "workspace", providerName: "openai-compatible", modelName: "gemma", status: "UNTESTED" },
    { id: "my-minimax-debug", scope: "user", providerName: "minimax", modelName: "debug", status: "user" }
  ];
}
