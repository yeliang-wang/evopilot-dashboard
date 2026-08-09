# AI Agents

> WorkBuddy and browser-operating agents use EvoPilot Dashboard as the browser path for administrator-provisioned users to connect GitHub/GitLab projects, submit goal loop targets, review EvoPilot-selected Harness bindings, and run governed loops.

## Agent Console v3

The visible flow is:

```text
Project Intake -> Template Auto-Match -> selectedHarness binding -> Owner Review -> Loop Execution -> Release Decision
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
8. Select the delivery chain; when source and CI/Loop differ, use the explicit GitHub source + GitLab CI bridge chain.
9. Click **Start intake**.
10. Wait while EvoPilot creates or reads the goal and generates a phase plan.
11. Read the inline `selectedHarness.yaml` card. It must show Harness id, version, Catalog id, entry path, Catalog digest, and entry digest.
12. Stop and show the binding to the user or project owner.
13. If the user requests changes, enter the change request and click **Request changes**. This regenerates the plan; it does not edit Harness definitions.
14. Repeat review until the user confirms.
15. Click **Confirm** to move to explicit phase-plan approval.
16. Fill real `Confirmed By` and `Confirmation`, then approve.
17. Start or advance the loop.
18. Use the **Evidence Drawer** to report request IDs, source system, CI/Loop executor, workflow repository, LLM profile, selectedHarness digests, blockers, next actions, and release decisions.

| Expected left navigation |
|---|
| `# Agent Console`, `Tenants`, `Workspaces`, `Users`, `Harness Hub`, `LLM Profiles`, `Audit` |

The left navigation must not contain workspace/project cards, active sessions, recent decisions, a user footer, or a `Projects` menu.

## Admin Browser Operations

Only operate these pages when the signed-in user is a platform administrator and the server permits the action:

| Page | Primary action | EvoPilot API |
|---|---|---|
| Tenants | Create tenant, workspace, tenant admin | `POST /api/v1/tenants` |
| Workspaces | Create workspace boundary and quota | `POST /api/v1/workspaces` |
| Users | Create scoped user with `mustChangePassword=true` | `POST /api/v1/users` |
| Harness Hub | Read configured Catalogs and inspect published Harness definitions | `GET /api/v1/harness/catalogs`, `GET /api/v1/harness/catalogs/{catalogId}` |
| Audit | Read request/action/failure trace | `GET /api/v1/audit` |

Harness lifecycle and evolution are not Dashboard browser operations. Use `evopilot-harness` to scan source projects, attachments, notes, EvoPilot history exports, and production logs; approve drafts; publish a usable Harness Catalog; then let EvoPilot read the configured Catalog directory.

If RBAC hides a page or the server returns `403`, stop and report a scope or role problem. Do not try to switch tenant/workspace as an ordinary user.

## Stop Rules

Stop on:

- missing login or RBAC
- missing `selectedHarness`
- missing Catalog digest or entry digest
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
