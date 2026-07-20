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
2. Confirm the page shows the login form.
3. Enter username and password.
4. Submit the form.
5. If the server requires password change, enter a new password and submit.
6. Confirm the Dashboard loads the tenant/workspace context.

## Expected Result

- Login succeeds.
- The user role is visible or implied by available navigation.
- Protected pages can read `/api/v1/summary`.

## Validation

The browser should show tenant/workspace data. The API should return authenticated summary data through the Dashboard proxy:

```bash
curl -fsS \
  -H "Authorization: Bearer <session-or-api-token>" \
  -H "X-EvoPilot-Tenant: tenant-production" \
  -H "X-EvoPilot-Workspace: workspace-agent-products" \
  http://<dashboard-host>/api/v1/summary
```

## Failure Modes

| Symptom | Likely Cause | Next Action |
|---|---|---|
| Login rejected | Wrong username/password | Ask admin to reset password. |
| Login succeeds but data is empty | API proxy or tenant/workspace mismatch | Check Dashboard config and user scope. |
| Browser shows API errors | API server unavailable or wrong base URL | Run Dashboard smoke test. |

## Do Not Do

- Do not use a GitHub PAT as Dashboard login token.
- Do not store session tokens in docs, screenshots, or static config.
