# Deployment

> Deploy EvoPilot Dashboard as a standalone static service that talks to EvoPilot API.

## Production Shape

Recommended routing:

```text
/       -> evopilot-dashboard
/api/*  -> evopilot-api
/health -> evopilot-api health
/ready  -> evopilot-api readiness
/dashboard-health -> dashboard container health
```

## Docker Compose

When Dashboard and EvoPilot API run on the same host with separate compose projects:

```bash
cd /opt/evopilot-dashboard
git pull --ff-only origin main
EVOPILOT_DOCKER_NETWORK=evopilot_default \
EVOPILOT_API_BASE_URL=http://evopilot-server:19876 \
EVOPILOT_DASHBOARD_PORT=8080 \
docker compose -f compose.production.yaml up -d --build
```

## Host Nginx

Use `deploy/nginx/evopilot-dashboard.conf.example` as the host-level route template:

| Public Path | Upstream |
|---|---|
| `/` | `127.0.0.1:18080` Dashboard |
| `/api/*` | `127.0.0.1:19876` EvoPilot API |
| `/health`, `/ready` | `127.0.0.1:19876` EvoPilot API |
| `/dashboard-health` | `127.0.0.1:18080/health` Dashboard |

## Configuration

`public/config.js` controls browser API base URL:

```js
window.EVOPILOT_DASHBOARD_CONFIG = {
  apiBaseUrl: ""
};
```

Use empty `apiBaseUrl` for same-origin `/api/*` proxy. Use an absolute URL only when CORS is configured.

## Validation

```bash
curl -fsS http://127.0.0.1:18080/health
curl -fsS http://127.0.0.1:19876/ready
curl -i http://127.0.0.1:18080/api/v1/summary
```

Expected:

- Dashboard health returns `UP`.
- EvoPilot readiness returns `READY`.
- Unauthenticated API summary returns `401`.
