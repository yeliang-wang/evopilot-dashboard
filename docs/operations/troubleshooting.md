# Troubleshooting

> Diagnose Dashboard UI, API proxy, authentication, and workflow-state issues.

## Common Issues

| Symptom | Likely Cause | Fix |
|---|---|---|
| Dashboard loads but data is empty | API base URL or `/api/*` proxy is wrong | Check `public/config.js`, compose env, and Nginx route. |
| Login rejected | Wrong Dashboard username/password | Reset password through admin workflow. |
| `401` on API calls | Missing or expired session token | Re-login. |
| `403` on write actions | Role or tenant/workspace scope denied | Ask admin to correct role/scope. |
| `409` on workflow action | Server business guardrail blocked the action | Read blocker and nextAction. |
| Release card disagrees with CLI | Different server URL or UI-side inference | Use release decisions from same API server. |
| GitHub project cannot write source | Missing tokenRef or read-only public mode | Configure source credentials. |
| DevOps readiness blocked | devopsOwner does not match workflow repo owner | Correct execution boundary. |

## Network Checks

```bash
curl -fsS http://<dashboard-host>/health
curl -fsS http://<dashboard-host>/ready
curl -i http://<dashboard-host>/api/v1/summary
```

Expected:

- Health and ready return 200.
- Summary without auth returns 401, not network failure.

## Production URL Rule

Use `http://8.153.72.80` for the current public EvoPilot API endpoint unless a TLS proxy is configured. Do not use `https://8.153.72.80:19876` against a plain HTTP service.

## Evidence To Collect

- Page name.
- Button or form action.
- Visible state.
- HTTP status.
- requestId if visible or available in network logs.
- tenant/workspace.
- projectId, goalId, loopId, or release decision ID.
