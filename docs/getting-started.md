# Getting Started

> Connect the standalone Dashboard to an EvoPilot API server and verify the UI can operate real API state.

## Audience

Dashboard users, product operators, WorkBuddy setup agents, and developers validating the split repository.

## Prerequisites

- Node.js 22.
- An EvoPilot API server reachable by HTTP.
- A Dashboard login user, not a CLI-only token.
- Tenant and workspace scope assigned by EvoPilot.

## Run Locally

Start EvoPilot API:

```bash
cd /Users/wangyejing/project/harness/EvoPilot
npm run build
npm run server:debug
```

Start Dashboard:

```bash
cd /Users/wangyejing/project/harness/evopilot-dashboard
npm install
EVOPILOT_API_BASE_URL=http://127.0.0.1:19876 npm run dev
```

Open the Vite URL printed by the command.

## Connect To Production

Use same-origin deployment when possible:

```text
/       -> EvoPilot Dashboard
/api/*  -> EvoPilot API
/health -> EvoPilot API health
/ready  -> EvoPilot API readiness
```

If the Dashboard runs on a different origin, set `public/config.js`:

```js
window.EVOPILOT_DASHBOARD_CONFIG = {
  apiBaseUrl: "http://8.153.72.80"
};
```

Use `http://8.153.72.80` for the current production API unless a TLS proxy is explicitly configured.

## First Verification

Run:

```bash
curl -fsS http://127.0.0.1:5174/health
curl -fsS http://127.0.0.1:5174/ready
curl -i http://127.0.0.1:5174/api/v1/summary
```

Expected result:

- `/health` returns `200`.
- `/ready` returns `200`.
- Unauthenticated `/api/v1/summary` returns `401`.
- After login, Dashboard overview loads real tenant and workspace state.

## Do Not Do

- Do not paste GitHub personal access tokens into Dashboard login.
- Do not embed EvoPilot API tokens in `public/config.js`.
- Do not use Dashboard docs as the OpenAPI source of truth.
- Do not ask the browser UI to run the EvoPilot CLI.

## Next

- New user path: [User Guide](user-guide.md).
- Admin path: [Admin Guide](admin-guide.md).
- Digital human path: [AI Agents](ai-agents/README.md).
