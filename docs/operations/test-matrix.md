# Test Matrix

> Validate Dashboard as a browser client, visual surface, API adapter, and release artifact producer before a release or production rollout.

## Local Commands

| Layer | Command | Purpose |
| --- | --- | --- |
| Static contract | `npm run check` | Type-check, production build, static contract tests, and OSS governance. |
| Mock browser E2E | `npm run test:e2e:mock` | Runs Playwright against the Agent Console using a mocked EvoPilot API that returns `requestId`, `nextAction`, and blockers. |
| Visual regression | `npm run test:visual` | Captures stable desktop and mobile Agent Console baselines for review, blocker, and release states. |
| Browser matrix | `npm run test:browser` | Runs mock browser E2E and visual regression together. |
| Live E2E | `EVOPILOT_LIVE_E2E=1 EVOPILOT_API_BASE_URL=http://127.0.0.1:19876 EVOPILOT_E2E_USERNAME=<user> EVOPILOT_E2E_PASSWORD=<password> npm run test:e2e:live` | Verifies login against a real or approved disposable EvoPilot API. |

Install Chromium before the first Playwright run:

```bash
npx playwright install chromium
```

Use `npx playwright install --with-deps chromium` in Linux CI.

## Browser E2E Scope

`tests/e2e/agent-console.spec.ts` covers:

- All nine demo stages through `?demo=1&step=1` to `?demo=1&step=9`.
- Login through `/api/v1/auth/login` with a mocked EvoPilot response.
- Protected project intake through `/api/v1/onboarding/project/checklist`.
- `ProjectHarnessProfile` draft generation through `/api/v1/projects/{projectId}/harness-profiles/generate`.
- Governed preflight blockers where the API returns `409`, `requestId`, `nextAction`, and `blockers`.

The mock API fixture is intentionally server-shaped, not product logic. It exists to prove the Dashboard preserves EvoPilot stop rules and evidence fields in the browser.

## Visual Regression Scope

`tests/visual/agent-console-visual.spec.ts` captures:

- Owner review desktop baseline.
- Blocker repair mobile baseline.
- Release decision desktop baseline.

The test disables animations and waits for fonts before comparison. Screenshots and traces are retained under `test-results/` and `playwright-report/` on failure.

## Live E2E Boundary

`npm run test:e2e:live` is opt-in. It skips unless `EVOPILOT_LIVE_E2E=1` is set and the API URL plus credentials are provided.

Run live E2E only against:

- A local EvoPilot server.
- A disposable staging server.
- A production environment explicitly approved for non-mutating login smoke.

Do not run mutating project, goal, loop, or release actions against production unless the administrator approved a disposable project and target.

## CI Workflows

| Workflow | Trigger | Required evidence |
| --- | --- | --- |
| `.github/workflows/browser-e2e.yml` | push to `main`, pull request | Playwright mock E2E report, trace, screenshots, videos on failure. |
| `.github/workflows/visual-regression.yml` | push to `main`, pull request | Visual baselines and Playwright report. |
| `.github/workflows/pr-artifacts.yml` | pull request | `npm run check`, browser matrix, release artifact build, release artifact verification, uploaded artifacts. |

## PR Artifacts

Every release-impacting pull request should preserve:

- `playwright-report/`
- `test-results/`
- `dist/release/`

## Release Readiness Gate

A Dashboard release is not ready from screenshots or static contract tests alone. Before tagging, collect:

- `npm run check`
- `npm run test:browser`
- approved `npm run test:e2e:live` or `npm run smoke:console` evidence against a real EvoPilot API
- `npm run release:artifact`
- `npm run verify:release-artifact`
- `git diff --check`

If any browser test returns a blocker, `nextAction`, console error, trace, visual diff, or release artifact mismatch, stop and repair before release publication.
