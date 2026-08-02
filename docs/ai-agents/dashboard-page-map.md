# Dashboard Page Map

> Page-level guide for browser agents.

## Navigation

| Page | Purpose | Primary Evidence |
|---|---|---|
| Projects | Start or continue a project loop through repository, goal target, Review Pack, owner gates, and loop advance. | projectId, checklist result, profileId/version, goalId, phase plan, requestId, blockers |
| Runs | Inspect current Goal/Loop execution and release evidence. | run-status, phase-plan, evidence matrix, final report, release decision |
| Ops | Troubleshoot system scope and server projections. | tenant/workspace/actor, requestId, traceId, failed projection, nextAction, audit |

Projects | Runs | Ops is the complete top-level navigation.

## Main Surfaces

| Surface | Location | Use It For |
|---|---|---|
| Auth Session | Above every page | Login, password-change state, role/scope, sign-out. |
| Repository | Projects | Enter the GitHub, GitLab, or local-git source. |
| Goal Loop Target | Projects | Enter the business objective used to draft the harness and phase plan. |
| Review Pack | Projects | Read project checklist, Harness DRAFT, GlobalGoal, Phase Plan, request IDs, blockers, and nextAction. |
| Owner Review Gates | Projects | Activate reviewed harness, approve reviewed phase plan, and start/advance loop after explicit confirmation. |
| Advanced Control Details | Projects | Inspect or edit projectId, tokenRef, DevOps, LLM profile, profileId/version, goalId, loopId, and template override. |
| Server Projections | Runs / Ops | Read server-returned statuses and request IDs. |
| Last API Action | Runs / Ops | Read method/path/status/schema/requestId/blockers/nextAction from the last mutating call. |
| Troubleshooting Contract | Ops | Follow stop rules for credentials, stale harness policy, human gates, and release verdicts. |

## Field Recognition

Common fields:

- Repository
- Goal Loop Target
- Project ID
- Project Name
- Provider
- Default Branch
- tokenRef
- executionMode
- devopsOwner
- CI Workflow
- CI Required Check
- LLM Profile
- Profile ID
- Profile Version
- Template ID Override
- Goal ID
- Loop ID
- Confirmed By
- Confirmation
- requestId
- nextAction
- blockers

## Review Pack Action Recognition

| Visible Button | Expected API |
|---|---|
| Generate Review Pack | `POST /api/v1/onboarding/project/checklist`, then `POST /api/v1/projects/{projectId}/harness-profiles/generate`, then `POST /api/v1/goals`, then `POST /api/v1/goals/{goalId}/plan` |
| Activate Reviewed Harness | `POST /api/v1/projects/{projectId}/harness-profiles/{profileId}/activate` |
| Approve Phase Plan | `POST /api/v1/goals/{goalId}/approve-plan` |
| Start Or Advance Loop | `POST /api/v1/goals/{goalId}/advance` |
| Refresh Projections | summary/projects/templates/policies/maturity/goals/release/audit/LLM projection calls |

## Page Selection Rule

If the task is about:

- Login or password: use **Auth Session**.
- New project loop: use **Projects**.
- Harness DRAFT or phase-plan review: use **Projects** Review Pack.
- Context values for action buttons: open **Advanced Control Details** in Projects, or use **Ops** for tenant/workspace/actor.
- Goal/Loop execution: use **Runs**.
- GO/NO-GO: use **Runs** and read release decisions/evidence packages.
- Who did what or why it failed: use **Ops**.
- CLI commands: leave this repository and read EvoPilot CLI docs.
