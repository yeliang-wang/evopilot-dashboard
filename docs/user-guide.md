# User Guide

> Operate projects, credentials, Goal/Loop workflows, approvals, release decisions, and audit evidence from the Dashboard.

## Fast Path

1. Log in with an EvoPilot Dashboard user.
2. Confirm tenant and workspace in the top context area.
3. Open **接入项目** and onboard a GitHub, GitLab, or local Git project.
4. Configure source credentials, execution mode, DevOps owner, and project DevOps boundary.
5. Open **Loops** and start or inspect a Source-to-GA workflow.
6. Approve human gates only when evidence and scope are clear.
7. Open **发布证据** and read the server release decision.
8. Open **审计** to verify who did what and why.

## Product Model

| UI Area | User Question | Server Source |
|---|---|---|
| 租户总览 | Is the control plane healthy for this tenant/workspace? | `/api/v1/summary` |
| 接入项目 | Is the project ready for source writeback and DevOps? | onboarding checklist and preflight APIs |
| Loops | Which GoalTarget or LoopRun is active, blocked, waiting, or done? | goal run-status, loop runtime, trace APIs |
| 发布证据 | Is this project or target GO, CONDITIONAL-GO, or NO-GO? | `/api/v1/release/decisions` |
| 审计 | Can the operation be replayed and attributed? | `/api/v1/audit`, `/api/v1/history` |

## Normal Workflow

Use these workflow docs in order:

1. [First Login](workflows/first-login.md)
2. [Project Onboarding](workflows/project-onboarding.md)
3. [Credential And DevOps Boundary](workflows/credential-and-devops-boundary.md)
4. [Source To GA Loop](workflows/source-to-ga-loop.md)
5. [Global Goal Loop Workflow](workflows/global-goal-loop-workflow.md)
6. [Release Decision Review](workflows/release-decision-review.md)
7. [Audit And History](workflows/audit-and-history.md)

## Expected States

| State | Meaning | User Action |
|---|---|---|
| `READY` | The server preflight says the next action can continue. | Continue the workflow. |
| `BLOCKED` | A required credential, policy, project, or DevOps condition is missing. | Stop and fix the blocker. |
| `WAITING_APPROVAL` | Governance intentionally stopped for human approval. | Review evidence before approving. |
| `NO-GO` | Release criteria did not pass. | Read blockers and repair or re-run. |
| `GO` | Release criteria passed. | Archive evidence and continue release process. |

## Release Truth

Dashboard progress views are explanatory. The release verdict comes from EvoPilot release decisions. Do not claim RC, GA, GO, or NO-GO from a UI color, local test output, or screenshot alone.

For third-party open-source GitHub/GitLab projects, full Loop Target execution requires a user-owned or organization-owned account/group that can fork or maintain the repository. Without that principal, use read-only public onboarding and stop before PR, CI/CD, merge, deploy, or release-readiness claims.

## CLI Relationship

Dashboard does not call CLI commands. WorkBuddy can either:

- Operate the Dashboard UI by reading this repository's docs.
- Operate EvoPilot through CLI/API by reading the EvoPilot repository's `docs/cli/*` and `docs/guides/ai-agent-runbook.md`.

Both paths talk to the same EvoPilot API server state.
