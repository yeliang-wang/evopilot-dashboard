# Tenant Workspace User Admin

> Create and manage tenants, workspaces, and users from the Dashboard.

## Actors

- Platform administrator owns cross-tenant setup.
- Tenant administrator owns users inside a tenant.
- Viewer can inspect but cannot mutate.

## Steps

1. Open **Ops**.
2. Confirm the current tenant and workspace.
3. Inspect user, tenant, and workspace projections.
4. Use EvoPilot administrator flows for create/edit/reset when the current Dashboard build does not expose a direct form.
5. Refresh projections and verify the user, tenant, or workspace state.
6. Check audit when available.

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
