# Roles And Permissions

> Dashboard role model for UI operation and digital human simulation.

## Roles

| Role | Can Do | Must Not Do |
|---|---|---|
| Platform administrator | Create tenants, workspaces, tenant admins, and cross-tenant audit views. | Bypass release gates. |
| Tenant administrator | Manage users and project setup inside tenant/workspace. | Grant platform admin privileges. |
| Workspace developer | Onboard projects, configure project credentials, start Loops. | Approve high-risk release gates without authority. |
| Release owner | Review release decisions, approve release actions, repair failed release runs. | Change unrelated credentials or user roles. |
| Loop operator | Inspect worker queue, replay, trace, sandbox proof, and runtime blockers. | Approve business release decisions. |
| Audit viewer | Read tenant/workspace evidence and audit history. | Mutate state. |

## Scope Rule

Every protected operation must respect:

- tenant
- workspace
- actor
- role
- target resource

If the server returns `403`, the Dashboard or digital human must stop and report the scope problem.

## Permission Evidence

Before performing a mutating action, confirm:

- User role permits the action.
- Tenant/workspace matches the project.
- Action will produce audit evidence.
- Any human gate is intentional.
