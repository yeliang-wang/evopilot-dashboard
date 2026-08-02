# Self-Hosting

> Deploy EvoPilot Dashboard as the browser surface for a self-hosted EvoPilot API.

## Audience

Use this guide when deploying the Dashboard next to EvoPilot API for a real operator, tenant admin, ordinary user, or AI Agent demo.

## Prerequisites

- A running EvoPilot API server.
- Docker with Compose v2.
- The Dashboard repository.
- A network route from Dashboard to EvoPilot API.
- A reverse proxy if exposing a public host.

## 15 Minute Path

Start EvoPilot API first. From a sibling checkout:

```bash
cd /opt/evopilot-stack/evopilot
docker compose up -d --build
curl -fsS http://127.0.0.1:19876/ready
```

Start Dashboard:

```bash
cd /opt/evopilot-stack/evopilot-dashboard
EVOPILOT_DOCKER_NETWORK=evopilot_default \
EVOPILOT_API_BASE_URL=http://evopilot-server:19876 \
EVOPILOT_DASHBOARD_PORT=8080 \
docker compose -f compose.production.yaml up -d --build
```

Verify:

```bash
curl -fsS http://127.0.0.1:8080/health
curl -i http://127.0.0.1:8080/api/v1/summary
```

Expected:

- `/health` returns Dashboard container health.
- `/api/v1/summary` is proxied to EvoPilot. `401` is acceptable before login.

## Same-Origin Routing

Recommended public routing:

```text
/       -> evopilot-dashboard
/api/*  -> evopilot-api
/health -> evopilot-api health
/ready  -> evopilot-api readiness
/dashboard-health -> dashboard health
```

Use empty browser config for same-origin routing:

```js
window.EVOPILOT_DASHBOARD_CONFIG = {
  apiBaseUrl: ""
};
```

Use an absolute API URL only when CORS is explicitly configured on EvoPilot API.

## Upgrade Path

1. Read `CHANGELOG.md`.
2. Confirm the compatible EvoPilot API version in the release notes.
3. Pull with `git pull --ff-only origin main`.
4. Rebuild the Dashboard container.
5. Validate `/health`, `/api/v1/summary`, and console smoke.

```bash
git pull --ff-only origin main
EVOPILOT_DOCKER_NETWORK=evopilot_default \
EVOPILOT_API_BASE_URL=http://evopilot-server:19876 \
EVOPILOT_DASHBOARD_PORT=8080 \
docker compose -f compose.production.yaml up -d --build

EVOPILOT_DASHBOARD_BASE_URL=http://127.0.0.1:8080 \
EVOPILOT_API_BASE_URL=http://127.0.0.1:19876 \
npm run smoke:console
```

## Acceptance Checklist

- Dashboard is reachable in Chrome on desktop.
- Dashboard calls EvoPilot through HTTP only.
- Login, project intake, harness review, phase plan approval, loop monitor, evidence drawer, and release decision pages match current EvoPilot API behavior.
- `npm run check` passes in the repository.
- `npm run smoke:console` passes against the deployed API or reports a clear auth/setup blocker.
- No secrets are stored in `public/config.js`, screenshots, docs, or issue reports.
