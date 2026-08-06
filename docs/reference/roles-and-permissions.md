# Roles And Permissions

> Dashboard role model for UI operation and digital human simulation.

## Roles

| Role | Can Do | Must Not Do |
|---|---|---|
| Platform administrator | Create tenants, workspaces, users, HarnessTemplateEvolution drafts, and cross-tenant audit views. | Bypass release gates or publish template evolution without administrator review. |
| Tenant administrator | Manage users and project setup inside tenant/workspace when EvoPilot grants the action. | Grant platform admin privileges. |
| Workspace developer | Onboard projects and start or advance reviewed goal loops from `# Agent Console`. | Approve high-risk release gates without authority. |
| Release owner | Review release decisions, approve release actions, repair failed release runs. | Change unrelated credentials or user roles. |
| Loop operator | Inspect loop progress, evidence, blockers, and runtime failures through Agent Console and Audit. | Approve business release decisions. |
| Audit viewer | Read tenant/workspace evidence and audit history. | Mutate state. |

## Dashboard Navigation By Role

| Navigation |
|---|
| `# Agent Console`, `Tenants`, `Workspaces`, `Users`, `Harness Templates`, `LLM Profiles`, `Audit` |

The sidebar is fixed. RBAC is enforced by EvoPilot API responses and page actions, not by adding extra project/session blocks to the left navigation.

## Scope Rule

Every protected operation must respect:

- tenant
- workspace
- actor
- role
- target resource

If the server returns `403`, the Dashboard or digital human must stop and report the scope problem.

Dashboard locks tenant/workspace/actor after login. Ordinary users must not switch scope in the browser. Platform administrators may switch scope only for authorized administration and must still report requestId and audit evidence.

## Permission Evidence

Before performing a mutating action, confirm:

- User role permits the action.
- Tenant/workspace matches the project.
- Action will produce audit evidence.
- Any human gate is intentional.
