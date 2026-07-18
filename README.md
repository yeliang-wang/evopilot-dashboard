# EvoPilot Dashboard

> Standalone dashboard for operating EvoPilot through its HTTP API contract.

EvoPilot Dashboard is the UI layer for EvoPilot. It does not own GlobalGoal, LoopRun, ReleaseDecision, Evidence, or Audit state. Those remain in the EvoPilot API server. The dashboard reads and writes through the public EvoPilot API only.

## Quick Start

Run EvoPilot API locally first:

```bash
cd /Users/wangyejing/project/harness/EvoPilot
npm run build
npm run server:debug
```

Run the dashboard:

```bash
cd /Users/wangyejing/project/harness/evopilot-dashboard
npm install
EVOPILOT_API_BASE_URL=http://127.0.0.1:19876 npm run dev
```

Open the Vite URL printed by the command. In development, `/api`, `/health`, and `/ready` are proxied to `EVOPILOT_API_BASE_URL`.

## Configuration

The static app reads runtime configuration from `public/config.js`, which is copied to `/config.js` in the production build:

```js
window.EVOPILOT_DASHBOARD_CONFIG = {
  apiBaseUrl: ""
};
```

Use an empty `apiBaseUrl` when the dashboard and API are exposed through the same origin:

```text
/       -> EvoPilot Dashboard
/api/*  -> EvoPilot API
```

Use an absolute API URL only when CORS is configured on the EvoPilot API server.

## Docker

Build and run the dashboard as a standalone static service:

```bash
docker build -t evopilot-dashboard .
docker run --rm -p 8080:8080 \
  -e EVOPILOT_API_BASE_URL=http://host.docker.internal:19876 \
  evopilot-dashboard
```

Or use the included Compose file:

```bash
EVOPILOT_API_BASE_URL=http://host.docker.internal:19876 \
EVOPILOT_DASHBOARD_PORT=8080 \
docker compose up -d --build
```

When the Dashboard runs on the same host as the EvoPilot API Compose project, attach it to the EvoPilot network and proxy to the service name:

```bash
EVOPILOT_DOCKER_NETWORK=evopilot_default \
EVOPILOT_API_BASE_URL=http://evopilot-server:19876 \
EVOPILOT_DASHBOARD_PORT=8080 \
docker compose -f compose.production.yaml up -d --build
```

The container exposes:

| Path | Owner |
|---|---|
| `/` | EvoPilot Dashboard |
| `/health` | Dashboard container health |
| `/api/*` | Proxied to `EVOPILOT_API_BASE_URL` |

For same-origin production deployments, keep `window.EVOPILOT_DASHBOARD_CONFIG.apiBaseUrl` empty and let Nginx proxy `/api/*`. For cross-origin deployments, update `/config.js` to the public EvoPilot API base URL and configure CORS on the API server.

On Linux hosts where the dashboard Compose project is separate from the EvoPilot API Compose project, prefer `compose.production.yaml` with `EVOPILOT_DOCKER_NETWORK=evopilot_default`. Use the default `compose.yaml` host-gateway mode only when direct service-network access is unavailable.

If a host-level Nginx owns port 80, use `deploy/nginx/evopilot-dashboard.conf.example` as the routing shape:

| Public path | Upstream |
|---|---|
| `/` | `127.0.0.1:18080` Dashboard |
| `/api/*` | `127.0.0.1:19876` EvoPilot API |
| `/health`, `/ready` | `127.0.0.1:19876` EvoPilot API |
| `/dashboard-health` | `127.0.0.1:18080/health` Dashboard |

## Development

```bash
npm run dev
npm run build
npm run check
```

`npm run check` builds the dashboard and verifies that the static app still uses the EvoPilot API contract instead of backend internals.

## Architecture Boundary

- Dashboard calls EvoPilot HTTP APIs.
- Dashboard must not call the EvoPilot CLI.
- Dashboard must not read EvoPilot data files, database tables, or `.codex-evidence` directly.
- Release status comes from EvoPilot release decisions, not from UI-side inference.
- GlobalGoal workflow views should consume server projections such as `run-status`, `snapshot`, `graph`, `timeline`, and `evidence-matrix`.
- Workflow actions send `controlPlaneUrl` from the configured API base URL, falling back to the current origin only for same-origin proxy deployments.

## Related Repositories

- EvoPilot API and CLI: `git@github.com:yeliang-wang/EvoPilot.git`
- Dashboard repository: `git@github.com:yeliang-wang/evopilot-dashboard.git`
- Integration contract: `docs/dashboard-integration.md` in the EvoPilot repository
