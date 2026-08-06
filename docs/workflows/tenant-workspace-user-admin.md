# Tenant Workspace User Admin

> Create and manage tenants, workspaces, and users from the Dashboard.

## Actors

- Platform administrator owns cross-tenant setup.
- Tenant administrator owns users inside a tenant.
- Viewer can inspect but cannot mutate.

## Steps

1. Log in as a platform administrator or authorized tenant administrator.
2. Confirm `scope locked`, role, tenant, and workspace in the header.
3. Open **Tenants** to create or update tenant registry metadata when platform admin privileges are present.
4. Open **Workspaces** to create or inspect workspace boundaries and quotas for that tenant.
5. Open **Users** to create or update scoped users with `mustChangePassword=true` on first sign-in.
6. Open **Audit** and verify requestId, action, actor, scope, status, and nextAction when available.

## Expected Result

- User is scoped to exactly the intended tenant/workspace.
- Role matches the allowed product action.
- Audit records the create, update, or reset operation.

## Failure Modes

| Symptom | Likely Cause | Next Action |
|---|---|---|
| Save returns 403 | Current user lacks admin role | Switch to platform or tenant admin. |
| User cannot see project | Wrong workspace assignment | Edit user workspace through EvoPilot admin flow. |
| User can see too much | Role too broad or platformAdmin set incorrectly | Downgrade role and review audit. |
