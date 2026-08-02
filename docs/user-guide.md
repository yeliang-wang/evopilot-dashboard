# User Guide

> Operate project onboarding, harness review, phase-plan approval, loop execution, blockers, and release decisions from the Dashboard.

## Fast Path

1. Log in with an EvoPilot Dashboard user.
2. Confirm tenant, workspace, and role in the header and Auth Session panel.
3. Open **Projects**.
4. Enter the repository URL and the business **Goal Loop Target**.
5. Click **Generate Review Pack**.
6. Review the project checklist, generated `ProjectHarnessProfile` DRAFT, created GlobalGoal, Alpha/Beta/RC/GA phase plan, request IDs, blockers, and `nextAction`.
7. If the DRAFT harness or phase plan needs changes, use EvoPilot CLI/API review flows or administrator edits, then generate/apply a new reviewed version.
8. Enter **Confirmed By** and **Confirmation** only after the project owner has actually reviewed the harness DRAFT and phase plan.
9. Click **Activate Reviewed Harness**, then **Approve Phase Plan**, then **Start Or Advance Loop**.
10. Open **Runs** for run-status, phase-plan, evidence matrix, final report, blockers, and release decision.
11. Open **Ops** for projections, request IDs, policy stale errors, credential repair, LLM readiness, audit, and troubleshooting.

## Product Model

The top-level navigation is:

```text
Projects / Runs / Ops
```

| UI Area | User Question | Server Source |
|---|---|---|
| Projects | Can this repository and business goal enter a governed loop? | onboarding checklist, ProjectHarnessProfile generation/activation, GlobalGoal creation, phase-plan generation/approval |
| Runs | What phase, blocker, evidence package, or release decision is current? | goal run-status, phase-plan, evidence matrix, final report, release decisions |
| Ops | Why did something fail, and what should be repaired? | summary, projects, templates, policies, maturity standards, goals, audit, LLM profiles, request IDs |

Dashboard does not call CLI commands. WorkBuddy can either operate the Dashboard UI by reading this repository's docs, or operate EvoPilot through CLI/API by reading the EvoPilot repository's `docs/cli/*` and `docs/guides/ai-agent-runbook.md`. Both paths talk to the same EvoPilot API server state.

Dashboard is intentionally scoped to ordinary-user core flows. If a scenario requires local files, template pack publication, plan/profile export-diff-apply, worker lease management, sandbox replay, connector creation, release-run repair, or other low-level administrator operations, switch to the EvoPilot CLI/API runbooks instead of adding hidden UI-only behavior.

## Review Pack

The Review Pack is the daily user's main workflow. It hides raw control-plane objects by default but still shows enough evidence for review.

| Review Pack Step | EvoPilot CLI-equivalent | Dashboard API |
|---|---|---|
| Project checklist | `evopilot project onboard plan ... --json` | `POST /api/v1/onboarding/project/checklist` |
| Harness DRAFT | `evopilot harness profile generate ... --json` | `POST /api/v1/projects/{projectId}/harness-profiles/generate` |
| GlobalGoal | `evopilot target plan --project ... --objective ... --json` goal creation phase | `POST /api/v1/goals` |
| Phase plan | `evopilot target plan ... --json` plan generation phase | `POST /api/v1/goals/{goalId}/plan` |
| Harness activation | `evopilot harness profile activate ... --json` | `POST /api/v1/projects/{projectId}/harness-profiles/{profileId}/activate` |
| Plan approval | `evopilot target plan approve ... --confirmed-by ... --confirmation ... --json` | `POST /api/v1/goals/{goalId}/approve-plan` |
| Loop advance | `evopilot goal advance <goal-id> --json` | `POST /api/v1/goals/{goalId}/advance` |

Stop after the DRAFT profile and phase plan are generated. Show the user or project owner:

- `profile.sourceContent`
- `profile.compiledContent`
- `profile.validation`
- `profile.diffFromActive`
- `profile.generatedBy`
- `profile.sourceDigest`
- `profile.compiledDigest`
- `profile.policyRefs`
- `phasePlan.projectHarness`
- `phasePlan.phases[]`
- `phasePlan.targets[]`
- request IDs and blockers

## Production Action Map

| Page | Button | EvoPilot API | Stop Before Continuing When |
|---|---|---|---|
| Projects | Generate Review Pack | `POST /api/v1/onboarding/project/checklist`, `POST /api/v1/projects/{projectId}/harness-profiles/generate`, `POST /api/v1/goals`, `POST /api/v1/goals/{goalId}/plan` | missing repository, tokenRef, DevOps boundary, LLM profile, stale policy, generated DRAFT not reviewed, or phase plan not reviewed |
| Projects | Activate Reviewed Harness | `POST /api/v1/projects/{projectId}/harness-profiles/{profileId}/activate` | owner has not confirmed the generated or edited profile, validation failed, or `PROJECT_HARNESS_PROFILE_POLICY_STALE` |
| Projects | Approve Phase Plan | `POST /api/v1/goals/{goalId}/approve-plan` | `confirmedBy` or `confirmation` is missing, or Alpha/Beta/RC/GA plan was not shown to the owner |
| Projects / Runs | Start Or Advance Loop | `POST /api/v1/goals/{goalId}/advance` | blocker, WAITING_APPROVAL, NO-GO, FAILED, source credential repair, LLM repair, policy review, or `nextAction` requiring human action |
| Runs | Inspect Projections | `GET /api/v1/goals/{goalId}/run-status`, `phase-plan`, `evidence-matrix`, `final-report` | projection missing, request ID missing for an incident, or release evidence incomplete |
| Ops | Refresh Projections | summary/projects/templates/policies/maturity/goals/release/audit/LLM endpoints | `401`, `403`, wrong tenant/workspace, missing selected IDs, or server unavailable |

## Expected States

| State | Meaning | User Action |
|---|---|---|
| `READY` | The server preflight says the next action can continue. | Continue to the next review gate. |
| `REVIEW` | A DRAFT, plan, or evidence package must be read by a human. | Do not activate or approve until review is explicit. |
| `WAITING` | Required context is missing or the next server action has not run. | Fill the field or run the prior action. |
| `BLOCKED` | A required credential, policy, project, DevOps, or LLM condition is missing. | Stop and fix the blocker. |
| `NO-GO` | Release criteria did not pass. | Read blockers and repair or re-run after changes. |
| `GO` | Release criteria passed in EvoPilot release decision. | Archive evidence and continue release process. |

## Release Truth

Dashboard progress views are explanatory. The release verdict comes from EvoPilot release decisions and evidence packages, not from UI color, local tests, screenshots, or CI success alone.

For third-party open-source GitHub/GitLab projects, full Loop Target execution requires a user-owned or organization-owned account/group that can fork or maintain the repository. Without that principal, use `read-only-public` and stop before PR, CI/CD, merge, deploy, or release-readiness claims.

## LLM And Token Visibility

Goal/Loop pages should use server-projected usage from run-status or loop trace when explaining a run. Report LLM provider, model, input tokens, output tokens, total tokens, credits consumed, and related loop/request identifiers when visible.

Do not estimate tokens from page text. If an LLM-backed Loop reaches a terminal state but provider/model or token totals are missing, treat the evidence as incomplete and collect the page, goalId/loopId, requestId, and API server URL for troubleshooting.
