# EvoPilot Dashboard

> Lightweight browser console for operating EvoPilot project loops through the EvoPilot HTTP API.

EvoPilot Dashboard is the UI layer for EvoPilot. It does not own project, goal, loop, harness, evidence, audit, or release state. EvoPilot API remains the system of record; the Dashboard only reads and writes through public HTTP APIs.

## Product Model

The Dashboard uses a task-first shape:

```text
Projects / Runs / Ops
```

The default end-to-end path is:

```text
Repository + Goal Loop Target
  -> Generate Review Pack
  -> Review ProjectHarnessProfile Draft
  -> Review Alpha/Beta/RC/GA Phase Plan
  -> Confirm
  -> Start Or Advance Loop
  -> Resolve Blockers
  -> Release Decision
```

The Dashboard intentionally hides low-level control fields by default. `projectId`, `profileId`, `goalId`, `loopId`, request IDs, and API paths live under **Advanced Control Details**, **Runs**, or **Ops** so WorkBuddy and administrators can inspect them without making daily users operate raw control-plane objects.

Dashboard is intentionally scoped to ordinary-user core end-to-end scenarios. It covers project onboarding, Review Pack review, harness activation, phase-plan approval, loop advance, blocker handling, evidence, and release-decision review. Full CLI-only administration and file-based control-plane operations, such as local template pack publishing, profile/plan file diff/apply, worker leases, sandbox replay, connector creation, and release-run repair, remain in the EvoPilot CLI/API runbooks.

## Page Model

| Page | User Job | Server Truth |
|---|---|---|
| Projects | Start or continue a project loop, generate the Review Pack, confirm review gates. | Onboarding checklist, ProjectHarnessProfile generation/activation, goal plan/approval. |
| Runs | Observe Alpha/Beta/RC/GA progress, active target, latest loop, evidence, blockers, release decision. | `run-status`, phase packages, target packages, evidence matrix, release decisions. |
| Ops | Repair blockers and troubleshoot with requestId, nextAction, credentials, LLM, policy, source closure, and release evidence. | Audit, logs, source/DevOps/LLM preflight, loop projections. |

## Review Pack

The Review Pack is a Dashboard UX wrapper over server-governed EvoPilot operations. It must not bypass user review.

| Review Pack Section | EvoPilot CLI/API Equivalent | Stop Rule |
|---|---|---|
| Project readiness | `project onboard plan`, `project preflight`, `project devops preflight`, `project llm preflight` | Stop on `store-secret`, `connect-github-account`, `connect-gitlab-account`, `configure-devops`, `configure-llm-profile`, `BLOCKED`. |
| Harness Draft | `harness profile generate`, `inspect`, `diff` | Show DRAFT source, compiled content, validation, diff, generatedBy, digests, policyRefs before activation. |
| Harness activation | `harness profile activate` | Activate only after user/project-owner review. Stop on validation failure or `PROJECT_HARNESS_PROFILE_POLICY_STALE`. |
| Phase Plan | `target plan` or `goal plan` | Show Alpha/Beta/RC/GA plan and project harness binding before approval. |
| Plan approval | `target plan approve` or `goal approve-plan` | Do not invent `confirmedBy` or `confirmation`. |
| Loop execution | `target run` or `goal advance` | Stop on `nextAction`, blocker, `NO-GO`, `BLOCKED`, `FAILED`, human approval, policy review, credential repair, LLM repair, timeout, or max-step boundary. |
| Release decision | `goal target-package`, `goal phase-package`, `release decisions` | Release truth comes from EvoPilot evidence packages and release decisions, not UI color. |

This mapping is deliberately aligned with the fixed EvoPilot CLI path in `docs/cli/AGENTS.md` and `docs/cli/quickstart.md` in the EvoPilot repository.

## Quick Start

Run a local EvoPilot API server first. For dashboard development only, use local test users; do not reuse these sample credentials in production.

```bash
cd /Users/wangyejing/project/harness/evopilot
npm run build
EVOPILOT_RUN_MODE=debug \
EVOPILOT_TOKENS='admin:local-admin-token:admin,operator:local-operator-token:operator,viewer:local-viewer-token:viewer' \
EVOPILOT_USERS='tenant-admin:tenant-password:admin:tenant-production:workspace-agent-products:Tenant Admin,tenant-operator:operator-password:operator:tenant-production:workspace-agent-products:Tenant Operator' \
npm run server
```

Run the dashboard:

```bash
cd /Users/wangyejing/project/harness/evopilot-dashboard
npm install
EVOPILOT_API_BASE_URL=http://127.0.0.1:19876 npm run dev
```

Open the Vite URL. In development, `/api`, `/health`, and `/ready` are proxied to `EVOPILOT_API_BASE_URL`.

## User Flow

1. Sign in with an EvoPilot Dashboard user.
2. Open **Projects**.
3. Enter repository URL and `Goal Loop Target`.
4. Expand **Advanced Control Details** only when a real project needs tokenRef, DevOps, LLM profile, profile version, goalId, or loopId values.
5. Click **Generate Review Pack**.
6. Review project readiness, Harness Draft, Phase Plan, blockers, request IDs, and nextAction.
7. Activate the reviewed harness only after owner confirmation.
8. Approve the phase plan only after owner confirmation.
9. Start or advance the loop.
10. Use **Runs** and **Ops** to handle blockers and read release evidence.

## AI Agent Entry Points

WorkBuddy and browser-operating agents should start here:

- [docs/ai-agents/README.md](docs/ai-agents/README.md)
- [docs/ai-agents/dashboard-page-map.md](docs/ai-agents/dashboard-page-map.md)
- [docs/ai-agents/expected-ui-states.md](docs/ai-agents/expected-ui-states.md)
- [docs/workflows/end-to-end-scenarios.md](docs/workflows/end-to-end-scenarios.md)

Agents must treat Dashboard as a browser UI adapter over EvoPilot. If the same scenario is executed through the CLI, the same review gates and stop rules apply.

## Configuration

The static app reads runtime configuration from `public/config.js`, copied to `/config.js` in the production build:

```js
window.EVOPILOT_DASHBOARD_CONFIG = {
  apiBaseUrl: ""
};
```

Use empty `apiBaseUrl` when the Dashboard and API are exposed through the same origin:

```text
/       -> EvoPilot Dashboard
/api/*  -> EvoPilot API
```

Use an absolute API URL only when CORS is configured on the EvoPilot API server.

## Docker

```bash
docker build -t evopilot-dashboard .
docker run --rm -p 8080:8080 \
  -e EVOPILOT_API_BASE_URL=http://host.docker.internal:19876 \
  evopilot-dashboard
```

For a separate Dashboard Compose project on the same host as EvoPilot API:

```bash
EVOPILOT_DOCKER_NETWORK=evopilot_default \
EVOPILOT_API_BASE_URL=http://evopilot-server:19876 \
EVOPILOT_DASHBOARD_PORT=8080 \
docker compose -f compose.production.yaml up -d --build
```

## Development

```bash
npm run dev
npm run typecheck
npm run build
npm run check
npm run smoke:console
```

`npm run check` type-checks, builds the dashboard, and runs static contract tests that keep the Dashboard aligned with EvoPilot API/CLI boundaries.

`npm run smoke:console` validates browser service, proxy, auth bootstrap, login, authenticated summary, templates/projects reads, worker queue, and unauthenticated `401`. It is non-mutating by default.

Run mutating smoke only against a disposable local server or test tenant/workspace:

```bash
EVOPILOT_MUTATING_SMOKE=1 \
EVOPILOT_MUTATING_SMOKE_TIMEOUT_MS=180000 \
npm run smoke:console
```

Mutating smoke may generate project profiles, goals, plans, audit entries, and LLM usage on the configured EvoPilot API server.

## Architecture Boundary

- Dashboard calls EvoPilot HTTP APIs.
- Dashboard must not call the EvoPilot CLI.
- Dashboard must not read EvoPilot data files, database tables, or `.codex-evidence` directly.
- Dashboard uses `src/api.ts` as the HTTP adapter boundary.
- Dashboard keeps session tokens in browser `sessionStorage`, never in `public/config.js` or long-lived `localStorage`.
- Dashboard must show generated ProjectHarnessProfile DRAFTs before activation.
- Dashboard must show Alpha/Beta/RC/GA phase plans before approval.
- Dashboard must stop on server blockers and `nextAction`.
- Dashboard must use EvoPilot evidence packages and release decisions for GO/NO-GO.

## Related Repositories

- EvoPilot API and CLI: `git@github.com:yeliang-wang/evopilot.git`
- Dashboard repository: `git@github.com:yeliang-wang/evopilot-dashboard.git`
