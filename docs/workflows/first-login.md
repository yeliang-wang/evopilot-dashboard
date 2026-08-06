# First Login

> Log in to Dashboard and establish the user session used for UI operations.

## When To Use

Use this when a user, WorkBuddy browser operator, or digital human opens Dashboard for the first time.

## Inputs

- Dashboard URL.
- Username and password assigned by EvoPilot admin.
- Tenant and workspace expected for the user.

## Steps

1. Open the Dashboard URL.
2. Confirm the page shows the EvoPilot login screen.
3. Enter username and password.
4. Click **登录**.
5. If the server requires password change, enter current and new password, then submit.
6. Confirm tenant, workspace, actor, role, and `scope locked` in the header.
7. Confirm the left navigation shows only `# Agent Console`, `Tenants`, `Workspaces`, `Users`, `Harness Templates`, `LLM Profiles`, and `Audit`.
8. Click the API refresh chip if projections did not load automatically.

## Expected Result

- Login succeeds.
- The user role is visible.
- Protected projections can read `/api/v1/summary`.

## Failure Modes

| Symptom | Likely Cause | Next Action |
|---|---|---|
| Login rejected | Wrong username/password | Ask admin to reset password. |
| Login succeeds but data is empty | API proxy or tenant/workspace mismatch | Check Dashboard config and user scope. |
| Browser shows API errors | API server unavailable or wrong base URL | Run Dashboard smoke test. |

## Do Not Do

- Do not use a GitHub PAT as Dashboard login token.
- Do not store session tokens in docs, screenshots, or static config.
