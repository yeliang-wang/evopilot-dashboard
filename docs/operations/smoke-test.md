# Smoke Test

> Verify Dashboard and EvoPilot API compatibility after changes or deployment.

## Local Smoke

Start EvoPilot API:

```bash
cd /Users/wangyejing/project/harness/EvoPilot
npm run build
npm run server:debug
```

Start Dashboard:

```bash
cd /Users/wangyejing/project/harness/evopilot-dashboard
EVOPILOT_API_BASE_URL=http://127.0.0.1:19876 npm run dev -- --port 5174
```

Run checks:

```bash
curl -fsS http://127.0.0.1:5174/health
curl -fsS http://127.0.0.1:5174/ready
curl -i http://127.0.0.1:5174/api/v1/summary
```

## Automated Check

```bash
npm run check
```

This builds the Dashboard and runs static contract tests.

## Production Compatibility Smoke

```bash
EVOPILOT_DASHBOARD_BASE_URL=http://<dashboard-host> \
EVOPILOT_API_BASE_URL=http://<api-host> \
EVOPILOT_API_TOKEN=<token> \
npm run smoke:production
```

Expected:

- Dashboard root returns 200.
- Dashboard health returns 200. Direct container checks can return `ok`; host-level routing can return EvoPilot API `UP`.
- EvoPilot ready returns 200.
- Dashboard `/api/v1/version` returns EvoPilot version through the proxy.
- Unauthenticated summary returns 401.
- Authenticated summary returns 200.
- Non-mutating onboarding checklist can be called.

## Do Not Accept

- Health-only proof.
- Screenshots without API compatibility evidence.
- UI success when API contract tests fail.
