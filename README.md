# EvoPilot Dashboard

> Chat-first Agent Console for operating EvoPilot project intake, harness review, goal loops, blocker repair, evidence, and release decisions from a browser.

<p align="center">
  <a href="./docs/README.md"><strong>Docs</strong></a> ·
  <a href="./docs/user-guide.md">User Guide</a> ·
  <a href="./docs/workflows/end-to-end-scenarios.md">End-to-End Scenarios</a> ·
  <a href="./docs/ai-agents/README.md">AI Agent Guide</a> ·
  <a href="./docs/operations/deployment.md">Deployment</a> ·
  <a href="./docs/operations/smoke-test.md">Smoke Test</a>
</p>

EvoPilot Dashboard is the ordinary-user browser surface for EvoPilot. It lets a project owner describe a repository and goal loop target, review the generated `ProjectHarnessProfile.yaml`, approve the phase plan, monitor loop execution, repair blockers, and inspect release decisions without switching to the CLI.

The Dashboard is not a second control plane. EvoPilot API remains the system of record for tenants, workspaces, projects, harness profiles, goals, loop state, evidence, audit records, and release decisions. This repository is a standalone React UI that talks to EvoPilot through HTTP APIs.

## The Core Flow

```text
Project Intake -> Harness Draft -> Owner Review -> Loop Execution -> Release Decision
```

This is the ordinary-user core flow. For a new or evolving project, the expected user path is:

1. Enter the repository, tenant/workspace context, and goal loop target.
2. Let EvoPilot auto-match a HarnessTemplate and generate a project-level harness draft.
3. Review `ProjectHarnessProfile.yaml` as a human-readable Markdown/YAML contract.
4. Confirm the draft or request changes and repeat the review cycle.
5. Activate the reviewed profile, approve the bound phase plan, and start or advance the loop.
6. Use the Evidence Drawer to inspect request IDs, profile digests, policy refs, logs, blockers, `nextAction`, token usage, and release decision evidence.

## What It Provides

| Area | Dashboard capability | EvoPilot source of truth |
| --- | --- | --- |
| Project intake | Chat-first repository and goal loop target collection | Project onboarding APIs |
| Harness review | `ProjectHarnessProfile.yaml` draft review, change request, validation, activation | Project harness profile APIs |
| Loop operation | Goal planning, phase-plan approval, loop start/resume/advance, blocker review | Goal and loop APIs |
| Evidence | On-demand Evidence Drawer with request IDs, digests, policy refs, logs, blockers, and `nextAction` | Evidence, audit, history, and observability APIs |
| Release decision | GO/NO-GO/BLOCKED review through EvoPilot evidence packages | Release APIs |
| Agent operation | Browser-readable flows for WorkBuddy and other AI Agents | Dashboard docs plus EvoPilot API contracts |

## Quick Start

Prerequisites:

- A running EvoPilot API server.
- A Dashboard user, tenant, and workspace configured in EvoPilot.
- Node.js 22 and npm for local development.

Run the Dashboard locally:

```bash
git clone git@github.com:yeliang-wang/evopilot-dashboard.git
cd evopilot-dashboard
npm ci
EVOPILOT_API_BASE_URL=http://127.0.0.1:19876 npm run dev -- --port 5174
```

Open `http://127.0.0.1:5174`.

During development, Vite proxies `/api`, `/health`, and `/ready` to `EVOPILOT_API_BASE_URL`.

## Docker

Build and run a standalone Dashboard container:

```bash
docker build -t evopilot-dashboard .
docker run --rm -p 8080:8080 \
  -e EVOPILOT_API_BASE_URL=http://host.docker.internal:19876 \
  evopilot-dashboard
```

For a production-style deployment where Dashboard and EvoPilot API run in separate Compose projects on the same host:

```bash
EVOPILOT_DOCKER_NETWORK=evopilot_default \
EVOPILOT_API_BASE_URL=http://evopilot-server:19876 \
EVOPILOT_DASHBOARD_PORT=8080 \
docker compose -f compose.production.yaml up -d --build
```

Recommended production routing:

```text
/                 -> EvoPilot Dashboard
/api/*            -> EvoPilot API
/health, /ready   -> EvoPilot API
/dashboard-health -> Dashboard container health
```

## Configuration

The static app reads runtime configuration from `public/config.js`, copied to `/config.js` in the production build:

```js
window.EVOPILOT_DASHBOARD_CONFIG = {
  apiBaseUrl: ""
};
```

Use an empty `apiBaseUrl` when Dashboard and EvoPilot API share the same origin. Use an absolute API URL only when CORS is configured on the EvoPilot API server.

Do not put GitHub tokens, GitLab tokens, LLM API keys, deploy credentials, passwords, or bearer tokens in `public/config.js`. Dashboard login tokens are kept in browser `sessionStorage`.

## Architecture Boundary

```text
Browser
  -> EvoPilot Dashboard static assets
  -> src/api.ts HTTP adapter
  -> EvoPilot API
  -> EvoPilot governance, evidence, audit, loop, and release stores
```

Dashboard must not:

- Call the EvoPilot CLI.
- Read EvoPilot local data files or evidence folders directly.
- Bypass RBAC, tenant/workspace/actor scope, approval gates, source closure, release policy, or audit.
- Activate a generated `ProjectHarnessProfile` before the user or project owner has reviewed the draft.
- Continue past server blockers, `nextAction`, `NO-GO`, `BLOCKED`, `FAILED`, policy review, credential repair, LLM repair, human approval, timeout, or max-step boundaries.

CLI and Dashboard are two adapters over the same EvoPilot server state. They must produce the same governed outcome for the same project, goal loop target, harness profile, and approval state.

## Validation

Run local static validation before committing UI or docs changes:

```bash
npm run check
```

This runs TypeScript checks, builds the production bundle, and validates static contracts for the Agent Console v2 UI and EvoPilot API surface.

Run non-mutating smoke against a running Dashboard and EvoPilot API:

```bash
EVOPILOT_DASHBOARD_BASE_URL=http://127.0.0.1:5174 \
EVOPILOT_API_BASE_URL=http://127.0.0.1:19876 \
npm run smoke:console
```

Run production compatibility smoke when a deployed Dashboard should be checked against a deployed EvoPilot API:

```bash
EVOPILOT_DASHBOARD_BASE_URL=http://<dashboard-host> \
EVOPILOT_API_BASE_URL=http://<api-host> \
EVOPILOT_API_TOKEN=<token> \
npm run smoke:production
```

Mutating smoke is opt-in because it creates a temporary project, generates and activates a harness profile, creates a goal, generates a phase plan, and approves that plan:

```bash
EVOPILOT_MUTATING_SMOKE=1 \
EVOPILOT_MUTATING_SMOKE_TIMEOUT_MS=180000 \
EVOPILOT_DASHBOARD_BASE_URL=http://127.0.0.1:5174 \
EVOPILOT_API_BASE_URL=http://127.0.0.1:19876 \
npm run smoke:console
```

Use mutating smoke only against disposable local servers or explicitly approved test tenant/workspace data.

## Documentation

| Reader | Start here | Purpose |
| --- | --- | --- |
| Project owner | [docs/user-guide.md](docs/user-guide.md) | Operate the browser console end to end |
| WorkBuddy or AI Agent | [docs/ai-agents/README.md](docs/ai-agents/README.md) | Follow browser-safe steps and stop rules |
| Scenario reviewer | [docs/workflows/end-to-end-scenarios.md](docs/workflows/end-to-end-scenarios.md) | Understand the core flow from intake to release decision |
| API integrator | [docs/reference/api-usage.md](docs/reference/api-usage.md) | Map Dashboard behavior to EvoPilot HTTP APIs |
| Operator | [docs/operations/deployment.md](docs/operations/deployment.md) | Deploy with Docker, Nginx, and same-origin API routing |
| Troubleshooter | [docs/operations/troubleshooting.md](docs/operations/troubleshooting.md) | Diagnose auth, proxy, API, and smoke-test failures |

## Repository Layout

```text
src/                  React Agent Console and HTTP API adapter
public/config.js      Runtime browser configuration
scripts/              Dashboard smoke and compatibility checks
tests/                Static contract tests
docs/                 User, agent, workflow, API, and operations docs
deploy/nginx/         Host Nginx route example
compose.production.yaml
Dockerfile
```

## Project Status

EvoPilot Dashboard currently implements the Agent Console v2 product model:

```text
Project Intake -> Harness Draft -> Owner Review -> Loop Execution -> Release Decision
```

It is intended to stay focused on the main ordinary-user journey. Administrative template-harness lifecycle management, deep server policy changes, and system-of-record mutations remain governed by EvoPilot API and CLI surfaces.
