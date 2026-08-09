# User Guide

EvoPilot Dashboard is an **Agent Console v3** for users who have already been provisioned by an EvoPilot administrator. You operate the main flow through a conversation, not a dense admin menu. Login comes first; EvoPilot locks tenant/workspace/actor scope from the signed-in session.

## Ordinary-User Core Flow

This is the ordinary-user core flow for provisioned project owners and operators.

```text
Project Intake -> Template Auto-Match -> selectedHarness binding -> Owner Review -> Loop Execution -> Release Decision
```

1. Open Dashboard and sign in with the account assigned by an administrator.
2. Complete password change when EvoPilot requires it.
3. Confirm the header shows `scope locked`, tenant, workspace, role, and API status.
4. Enter a GitHub, GitLab, or local repository URL.
5. Select the delivery chain: GitHub source + GitHub Actions, GitLab source + GitLab CI, or GitHub source + GitLab CI Bridge.
6. Describe the goal loop target in normal language.
7. Click **Start intake**.
8. Wait for EvoPilot to automatically match a published `Harness` and return `selectedHarness.yaml` inside the goal plan.
9. Review the generated `selectedHarness.yaml` plan binding.
10. Click **Request changes** when the selected Harness or phase plan does not fit the target.
11. Click **Confirm** only after the selectedHarness binding and phase plan are acceptable.
12. Provide real `Confirmed By` and `Confirmation` text for phase-plan approval.
13. Start or advance the loop.
14. Open the **Evidence Drawer** for request IDs, source/CI boundary, LLM profile, digests, policy refs, blockers, next actions, and logs.

Ordinary users do not choose or mutate the public `Harness` manually. Template selection belongs to EvoPilot and is based on repository context, runtime signals, tenant/workspace policy, history when present, and the goal loop target. Harness lifecycle, evolution, approval, versioning, and publication belong to `evopilot-harness`.

## Role-Based Pages

| Left navigation |
|---|
| `# Agent Console` |
| `Tenants` |
| `Workspaces` |
| `Users` |
| `Harness Hub` |
| `LLM Profiles` |
| `Audit` |

Project context, active sessions, recent decisions, and user details are not sidebar content. They appear in the main Agent Console, the relevant admin page, or the Evidence Drawer. `Tenants`, `Workspaces`, `Users`, and `LLM Profiles` call EvoPilot APIs and still obey RBAC, audit, and `nextAction` stop rules. `Harness Hub` embeds the independent `evopilot-harness` UI configured by `harnessHubUrl`.

## Delivery Chain

Agent Console intake supports three EvoPilot project chains:

- GitHub source + GitHub Actions
- GitLab source + GitLab CI
- GitHub source + GitLab CI Bridge

For the bridge chain, Dashboard submits EvoPilot's explicit `sourceMode=external-source` contract and keeps GitHub source credentials separate from the GitLab CI DevOps tokenRef.

## selectedHarness.yaml

This is the key owner-review artifact in the generated goal plan. It should be readable as Markdown/YAML and show:

- Harness id, version, domain, and layer
- Catalog id, Catalog digest, entry path, and entry digest
- selection reasons and match score when EvoPilot returns them
- required domain actions and evidence adapters when present
- release blockers or missing capabilities when present
- Alpha/Beta/RC/GA phase-plan relationship

Confirming the review does not mutate Harness definitions. It allows EvoPilot to approve the generated phase plan against the selectedHarness binding.

## Evidence Drawer

Use **View evidence** when you need audit or AI-agent details:

- `requestId`
- source system
- CI/Loop executor and workflow repository
- LLM profile
- `sourceDigest`
- `compiledDigest`
- `policyRefs`
- `generatedBy`
- `nextAction`
- blockers
- API method and path
- log trace

## Production Action Map

| User Action | EvoPilot API |
|---|---|
| Login | `POST /api/v1/auth/login` |
| Change password | `POST /api/v1/auth/change-password` |
| Start intake | `POST /api/v1/onboarding/project/checklist` |
| Create goal | `POST /api/v1/goals` |
| Generate phase plan | `POST /api/v1/goals/{goalId}/plan` |
| Approve phase plan | `POST /api/v1/goals/{goalId}/approve-plan` |
| Start or advance loop | `POST /api/v1/goals/{goalId}/advance` |
| Read evidence | `GET /api/v1/goals/{goalId}/evidence-matrix`, `GET /api/v1/release/decisions` |
| Create tenant | `POST /api/v1/tenants` |
| Create workspace | `POST /api/v1/workspaces` |
| Create user | `POST /api/v1/users` |
| Open Harness Hub | Browser iframe to configured `harnessHubUrl` |
| Read audit | `GET /api/v1/audit` |

Dashboard does not call CLI commands. It uses EvoPilot HTTP APIs through `src/api.ts` for EvoPilot-owned state, and embeds the independent `evopilot-harness` Hub for Harness lifecycle screens.

The Harness Hub / 专家市场 page is an iframe container. Source extraction, production-log redaction, snapshots, draft validation, approval, publish, impact, `CATALOG.md` maintenance, lifecycle UI, and atomic plus one-click CLI are owned by `evopilot-harness`, not Dashboard.
