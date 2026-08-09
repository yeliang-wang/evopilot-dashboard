# Getting Started

> Connect the standalone Dashboard to an EvoPilot API server and verify that administrator-provisioned users can operate real server state from the browser.

## Audience

Dashboard users, WorkBuddy setup agents, and developers validating the split dashboard repository.

## Prerequisites

- A running EvoPilot API server.
- A Dashboard login user created by an EvoPilot administrator, not a GitHub or GitLab PAT.
- Tenant and workspace identifiers.
- Node.js 22 for local development.

## Start Choices

| Entry | Use when | Command |
| --- | --- | --- |
| Run Dashboard | You have an EvoPilot API server and want a containerized browser surface | `npm run dashboard:run -- --api-url http://127.0.0.1:19876 --start` |
| Self-host with EvoPilot | You want Dashboard generated with the full EvoPilot stack | `npx create-evopilot@3.0.0 self-host --dir evopilot-stack --init-env` |
| Connect to API | You deploy static assets behind a same-origin proxy | `window.EVOPILOT_DASHBOARD_CONFIG = { apiBaseUrl: "", harnessHubUrl: "http://127.0.0.1:4176" }` |

Desktop app and hosted Cloud trial are not published Dashboard surfaces yet. Use [Distribution](operations/distribution.md) for the supported entry points.

## Run Locally

```bash
cd /Users/wangyejing/project/harness/evopilot-dashboard
npm ci
EVOPILOT_API_BASE_URL=http://127.0.0.1:19876 npm run dev -- --port 5174
```

Open `http://127.0.0.1:5174`.

Use empty `apiBaseUrl` when Dashboard and API share the same origin:

```text
/       -> EvoPilot Dashboard
/api/*  -> EvoPilot API
```

For cross-origin development, set `public/config.js`:

```js
window.EVOPILOT_DASHBOARD_CONFIG = {
  apiBaseUrl: "http://127.0.0.1:19876",
  harnessHubUrl: "http://127.0.0.1:4176"
};
```

Do not put bearer tokens, GitHub PATs, GitLab tokens, LLM keys, or deploy credentials in `public/config.js`.

## First Browser Check

1. Open the Dashboard URL.
2. Confirm the first screen is the EvoPilot login page.
3. Log in with a Dashboard user issued by EvoPilot.
4. If EvoPilot requires a password change, complete it before entering the console.
5. Confirm the header shows `scope locked`, tenant, workspace, role, and API status.
6. Confirm the left navigation shows only **# Agent Console**, **Tenants**, **Workspaces**, **Users**, **Harness Hub**, **LLM Profiles**, and **Audit**.
7. Confirm it does not show project cards, active sessions, recent decisions, a user footer, or a **Projects** menu.
8. Open **# Agent Console**, enter a GitHub/GitLab repository URL and goal loop target, and click **Start intake** only when using a real or disposable EvoPilot server.
9. Confirm EvoPilot auto-matches the `Harness`; ordinary users do not pick the template manually.
10. Stop at the visible `selectedHarness.yaml` plan binding until the project owner confirms or requests changes.

## Non-Mutating Compatibility Check

```bash
curl -fsS http://127.0.0.1:5174/health
curl -fsS http://127.0.0.1:5174/ready
curl -i http://127.0.0.1:5174/api/v1/summary
```

`/api/v1/summary` should be proxied to EvoPilot. An unauthenticated `401` is acceptable and proves the proxy reaches the API auth boundary.

## Automated Check

```bash
npm run check
npm run verify:distribution
```

This type-checks the React app, builds the production bundle, runs static contract tests, checks governance files, and verifies the Dashboard distribution runner.

For a complete self-hosted stack, use [Self-Hosting](operations/self-hosting.md). For public release validation, use [Release Management](operations/release-management.md).

## Agent-Safe Smoke

When shell access is available, prefer the JSON smoke report over screenshots:

```bash
EVOPILOT_DASHBOARD_BASE_URL=http://127.0.0.1:5174 \
EVOPILOT_API_BASE_URL=http://127.0.0.1:19876 \
npm run smoke:console
```

Use mutating smoke only against a disposable server or after explicit administrator approval.

## Do Not Do

- Do not paste GitHub personal access tokens into Dashboard login.
- Do not use Dashboard docs as the OpenAPI source of truth.
- Do not claim CLI and Dashboard compatibility from health checks alone.
- Do not continue when EvoPilot returns `nextAction`, blockers, `NO-GO`, `BLOCKED`, `FAILED`, or human approval.
