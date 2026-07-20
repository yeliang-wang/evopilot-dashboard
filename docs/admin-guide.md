# Admin Guide

> Manage tenants, workspaces, users, credentials, and governance boundaries in the Dashboard.

## Audience

Platform administrators, tenant administrators, and operations staff.

## Admin Responsibilities

| Responsibility | Dashboard Area | Required Evidence |
|---|---|---|
| Bootstrap access | 登录页, 用户与权限 | Password changed, user role visible |
| Tenant setup | 租户总览 | Tenant created, workspace assigned |
| Workspace membership | 用户与权限 | User role, status, tenant, workspace |
| Project credentials | 凭据, 接入项目 | Secret/tokenRef saved, preflight result |
| DevOps boundary | 接入项目 | executionMode, devopsOwner, workflowRepository, claimBoundary |
| Release governance | 发布证据, Loops | Human gate, policy evidence, release decision |
| Audit | 审计 | requestId, actor, operation, result |

## First Admin Path

1. Open Dashboard login.
2. Log in with the bootstrap platform admin account.
3. Change the default password if prompted.
4. Create or inspect the tenant.
5. Create or inspect the workspace.
6. Create tenant administrators and workspace users.
7. Confirm each user has the correct role before project onboarding.

See [First Login](workflows/first-login.md) and [Tenant Workspace User Admin](workflows/tenant-workspace-user-admin.md).

## Credential Policy

Dashboard users may configure source and DevOps references, but secrets are owned by EvoPilot API server state.

- GitHub/GitLab project writeback credentials should be saved as EvoPilot secret refs or server-side `tokenRef`.
- GitHub personal access tokens must not be stored in Dashboard static files.
- Browser login uses username/password and session token, not GitHub PAT.
- AI Agent CLI API tokens belong to EvoPilot CLI/API docs, not Dashboard login.

## DevOps Boundary Policy

Every GitHub/GitLab project that claims CI/CD readiness must declare:

- `executionMode`
- `devopsOwner`
- `workflowRepository`
- `credentialRef`
- `claimBoundary`

For public upstream projects, prefer `fork-validated-pr`: upstream is read-only evidence, the working fork runs CI/CD, and the Dashboard must not claim upstream release completion.

## Do Not Do

- Do not create users without tenant/workspace scope.
- Do not approve human gates without reviewing evidence.
- Do not treat health checks as release decisions.
- Do not bypass blockers by manually editing browser state.
