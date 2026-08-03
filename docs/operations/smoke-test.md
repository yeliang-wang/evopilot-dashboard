# Smoke Test

> Verify Dashboard and EvoPilot API compatibility after changes or deployment.

## Local Smoke

Start EvoPilot API from the EvoPilot repository if needed:

```bash
cd /Users/wangyejing/project/harness/evopilot
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

This type-checks the Dashboard, builds it, and runs static contract tests.

## Browser And Visual Matrix

Run the Playwright browser matrix before release readiness review:

```bash
npx playwright install chromium
npm run test:e2e:mock
npm run test:visual
```

`npm run test:e2e:mock` verifies the Agent Console browser flow with an EvoPilot-shaped mocked API. It covers login, project intake, ProjectHarnessProfile generation, and a governed blocker carrying `requestId`, `nextAction`, and `blockers`.

`npm run test:visual` verifies review, blocker, and release decision baselines across desktop and mobile-sized viewports.

Use live E2E only against a real or approved disposable EvoPilot API:

```bash
EVOPILOT_LIVE_E2E=1 \
EVOPILOT_API_BASE_URL=http://127.0.0.1:19876 \
EVOPILOT_E2E_USERNAME=<user> \
EVOPILOT_E2E_PASSWORD=<password> \
npm run test:e2e:live
```

## Dashboard Console Smoke

Run the non-mutating Dashboard console smoke against a running Dashboard and EvoPilot API:

```bash
EVOPILOT_DASHBOARD_BASE_URL=http://127.0.0.1:5174 \
EVOPILOT_API_BASE_URL=http://127.0.0.1:19876 \
npm run smoke:console
```

Default coverage:

- EvoPilot API `/health` and `/ready`.
- Dashboard root and `/config.js`.
- Dashboard health and ready endpoints.
- Auth bootstrap.
- Unauthenticated summary returns `401`.
- Dashboard login succeeds when smoke credentials are configured.
- Authenticated summary, templates, projects, goals, release targets, maturity standards, and worker queue return expected statuses.
- JSON report includes schema `evopilot-dashboard-console-smoke/v1`, requestId when returned, blockers, nextAction, and reportPath.

Run mutating smoke only against a disposable local server, test tenant, or explicitly approved environment:

```bash
EVOPILOT_MUTATING_SMOKE=1 \
EVOPILOT_MUTATING_SMOKE_TIMEOUT_MS=180000 \
EVOPILOT_DASHBOARD_BASE_URL=http://127.0.0.1:5174 \
EVOPILOT_API_BASE_URL=http://127.0.0.1:19876 \
npm run smoke:console
```

Mutating coverage:

- Creates a temporary local project.
- Generates a ProjectHarnessProfile through Dashboard proxy.
- Activates the actual returned profileId/version.
- Creates a goal.
- Generates a phase plan.
- Approves the phase plan.

This path may call real LLM-backed EvoPilot APIs and consume tokens. Do not run it against production unless the administrator explicitly approved a disposable project and goal.

## Production Compatibility Smoke

```bash
EVOPILOT_DASHBOARD_BASE_URL=http://<dashboard-host> \
EVOPILOT_API_BASE_URL=http://<api-host> \
EVOPILOT_API_TOKEN=<token> \
npm run smoke:production
```

Expected:

- Dashboard root returns 200.
- Dashboard health returns 200.
- EvoPilot ready returns 200.
- Dashboard `/api/v1/version` returns EvoPilot version through the proxy.
- Unauthenticated summary returns 401.
- Authenticated summary returns 200.
- Non-mutating onboarding checklist can be called.

## Do Not Accept

- Health-only proof.
- Screenshots without API compatibility evidence.
- UI success when API contract tests fail.
- Dashboard behavior that differs from the EvoPilot CLI stop rules.
