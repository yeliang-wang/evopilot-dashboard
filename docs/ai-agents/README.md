# AI Agents

> WorkBuddy and browser-operating agents use EvoPilot Dashboard as the browser path for administrator-provisioned users to connect GitHub/GitLab projects, submit goal loop targets, and review EvoPilot-generated project harness drafts.

## Agent Console v2

The visible flow is:

```text
Project Intake -> Template Auto-Match -> ProjectHarnessProfile DRAFT -> Owner Review -> Loop Execution -> Release Decision
```

The Dashboard is login-first and chat-first. The agent reads the login result, locked tenant/workspace scope, role-based left navigation, conversation, stage bar, inline cards, and **Evidence Drawer**. It must not infer server state from color alone.

Assume the user account has already been created by an EvoPilot administrator. Do not self-register users, switch tenant/workspace scope, or ask for raw GitHub/GitLab/LLM/deploy secrets during the ordinary-user flow.

## Browser End-To-End Loop

1. Open the Dashboard URL.
2. Log in on the first screen. Do not use GitHub/GitLab/LLM/deploy secrets as Dashboard login credentials.
3. Complete password change if shown.
4. Confirm the header shows `scope locked`, tenant, workspace, actor, role, and API status.
5. Confirm the fixed left navigation from the table below.
6. Enter the GitHub/GitLab repository URL.
7. Enter the user's goal loop target.
8. Click **Start intake**.
9. Wait while EvoPilot automatically matches a `HarnessTemplate` and returns the inline `ProjectHarnessProfile.yaml` DRAFT.
10. Stop and show the DRAFT to the user or project owner.
11. If the user requests changes, enter the change request and click **Request changes**.
12. Repeat review until the user confirms.
13. Click **Confirm** to activate only the reviewed profile.
14. Review phase plan binding, fill real `Confirmed By` and `Confirmation`, then approve.
15. Start or advance the loop.
16. Use the **Evidence Drawer** to report request IDs, profile digests, policy refs, blockers, next actions, and release decisions.

| Expected left navigation |
|---|
| `# Agent Console`, `Tenants`, `Workspaces`, `Users`, `Harness Templates`, `Audit` |

The left navigation must not contain workspace/project cards, active sessions, recent decisions, a user footer, or a `Projects` menu.

## Admin Browser Operations

Only operate these pages when the signed-in user is a platform administrator and the server permits the action:

| Page | Primary action | EvoPilot API |
|---|---|---|
| Tenants | Create tenant, workspace, tenant admin | `POST /api/v1/tenants` |
| Workspaces | Create workspace boundary and quota | `POST /api/v1/workspaces` |
| Users | Create scoped user with `mustChangePassword=true` | `POST /api/v1/users` |
| Harness Templates | Create `HarnessTemplateEvolution` draft | `POST /api/v1/harness/template-evolutions` |
| Audit | Read request/action/failure trace | `GET /api/v1/audit` |

If RBAC hides a page or the server returns `403`, stop and report a scope or role problem. Do not try to switch tenant/workspace as an ordinary user.

## Stop Rules

Stop on:

- missing login or RBAC
- `nextAction`
- blocker
- `NO-GO`
- `BLOCKED`
- `FAILED`
- human approval
- policy review
- credential repair
- LLM repair
- source or DevOps repair
- missing `requestId` for an incident
- missing LLM provider/model/token evidence for LLM-backed terminal claims

Never invent `confirmedBy` or `confirmation`.

## Agent-Safe Smoke

When shell access is available, prefer the JSON smoke report:

```bash
EVOPILOT_DASHBOARD_BASE_URL=http://<dashboard-host> \
EVOPILOT_API_BASE_URL=http://<api-host> \
npm run smoke:console
```

Use mutating smoke only when the target server is disposable or the user explicitly allows a temporary project/goal:

```bash
EVOPILOT_MUTATING_SMOKE=1 \
EVOPILOT_MUTATING_SMOKE_TIMEOUT_MS=180000 \
EVOPILOT_DASHBOARD_BASE_URL=http://<dashboard-host> \
EVOPILOT_API_BASE_URL=http://<api-host> \
npm run smoke:console
```

Report the `evopilot-dashboard-console-smoke/v1` summary, report path, failed checks, request IDs, blockers, and next actions.
