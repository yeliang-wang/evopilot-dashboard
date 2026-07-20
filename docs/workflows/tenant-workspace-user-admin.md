# Tenant Workspace User Admin

> Create and manage tenants, workspaces, and users from the Dashboard.

## Actors

- Platform administrator owns cross-tenant setup.
- Tenant administrator owns users inside a tenant.
- Viewer can inspect but cannot mutate.

## Steps

1. Open **租户总览**.
2. Confirm the current tenant and workspace.
3. Open **用户与权限**.
4. Create or edit a user.
5. Assign role, tenant, workspace, and status.
6. Save and verify the user appears in the table.
7. If needed, reset password and tell the user to change it on next login.

## Expected Result

- User is scoped to exactly the intended tenant/workspace.
- Role matches the allowed product action.
- Audit records the create, update, or reset operation.

## Failure Modes

| Symptom | Likely Cause | Next Action |
|---|---|---|
| Save returns 403 | Current user lacks admin role | Switch to platform or tenant admin. |
| User cannot see project | Wrong workspace assignment | Edit user workspace. |
| User can see too much | Role too broad or platformAdmin set incorrectly | Downgrade role and review audit. |

## Related API

- `GET /api/v1/tenants`
- `POST /api/v1/tenants`
- `GET /api/v1/workspaces`
- `POST /api/v1/workspaces`
- `GET /api/v1/users`
- `POST /api/v1/users`
- `PATCH /api/v1/users/{userId}`
- `POST /api/v1/users/{userId}/reset-password`
