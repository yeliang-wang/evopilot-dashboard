# User Guide

EvoPilot Dashboard is an **Agent Console v2** for ordinary users. You operate the main flow through a conversation, not a dense admin menu. Login comes first; EvoPilot locks tenant/workspace/actor scope from the signed-in session.

## Ordinary-User Core Flow

```text
Project Intake -> Harness Draft -> Owner Review -> Loop Execution -> Release Decision
```

1. Open Dashboard and sign in.
2. Complete password change when EvoPilot requires it.
3. Confirm the header shows `scope locked`, tenant, workspace, role, and API status.
4. Enter a GitHub, GitLab, or local repository URL.
5. Describe the goal loop target in normal language.
6. Click **Start intake**.
7. Review the generated `ProjectHarnessProfile.yaml` DRAFT.
8. Click **Request changes** when the harness definition is wrong or incomplete.
9. Click **Confirm** only after the DRAFT harness is acceptable.
10. Provide real `Confirmed By` and `Confirmation` text for phase-plan approval.
11. Start or advance the loop.
12. Open the **Evidence Drawer** for request IDs, digests, policy refs, blockers, next actions, and logs.

## Role-Based Pages

| Left navigation |
|---|
| `# Agent Console` |
| `Tenants` |
| `Workspaces` |
| `Users` |
| `Harness Templates` |
| `Audit` |

Project context, active sessions, recent decisions, and user details are not sidebar content. They appear in the main Agent Console, the relevant admin page, or the Evidence Drawer. `Tenants`, `Workspaces`, `Users`, and `Harness Templates` call EvoPilot APIs and still obey RBAC, audit, and `nextAction` stop rules.

## ProjectHarnessProfile.yaml

This is the key owner-review artifact. It should be readable as Markdown/YAML and show:

- inherited template and policy references
- project scope and exclusions
- capability controls
- exception handling rules
- logging and triage fields
- observability and APM requirements
- release gates and rollback evidence

Confirming the DRAFT activates a project-level harness contract. It is not just a visual summary.

## Evidence Drawer

Use **View evidence** when you need audit or AI-agent details:

- `requestId`
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
| Generate harness draft | `POST /api/v1/projects/{projectId}/harness-profiles/generate` |
| Confirm harness | `POST /api/v1/projects/{projectId}/harness-profiles/{profileId}/activate` |
| Create goal | `POST /api/v1/goals` |
| Generate phase plan | `POST /api/v1/goals/{goalId}/plan` |
| Approve phase plan | `POST /api/v1/goals/{goalId}/approve-plan` |
| Start or advance loop | `POST /api/v1/goals/{goalId}/advance` |
| Read evidence | `GET /api/v1/goals/{goalId}/evidence-matrix`, `GET /api/v1/release/decisions` |
| Create tenant | `POST /api/v1/tenants` |
| Create workspace | `POST /api/v1/workspaces` |
| Create user | `POST /api/v1/users` |
| Create template evolution | `POST /api/v1/harness/template-evolutions` |
| Read audit | `GET /api/v1/audit` |

Dashboard does not call CLI commands. It uses EvoPilot HTTP APIs through `src/api.ts`.
