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
2. Confirm the page shows **Projects / Runs / Ops** navigation and the **Auth Session** panel.
3. Enter username and password.
4. Click **Login**.
5. If the server requires password change, enter current and new password, then submit.
6. Confirm tenant, workspace, actor, and role.
7. Open **Ops** and click **Refresh Projections** if the API state did not load automatically.

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
