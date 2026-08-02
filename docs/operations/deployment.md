# Deployment

> Deploy EvoPilot Dashboard as a standalone static service that talks to EvoPilot API.

For the complete operator path, start with [Self-Hosting](self-hosting.md). Release versioning, tags, compatibility notes, and rollback rules are in [Release Management](release-management.md).

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
curl -fsS http://127.0.0.1:18080/api/v1/version
curl -i http://127.0.0.1:18080/api/v1/summary
```

Expected:

- Dashboard container health returns `ok`.
- EvoPilot readiness returns `READY`.
- Dashboard `/api/v1/version` returns EvoPilot version through the proxy.
- Unauthenticated API summary returns `401`.

Then run Dashboard console smoke from the deployed checkout or CI runner:

```bash
EVOPILOT_DASHBOARD_BASE_URL=http://<public-dashboard-host> \
EVOPILOT_API_BASE_URL=http://<api-host> \
npm run smoke:console
```

Production deployment is not accepted from health checks alone. It must also prove auth/bootstrap, login or supplied session token, authenticated summary, templates/projects reads, worker queue, and a JSON smoke report. Run mutating smoke only against an approved disposable project/goal.
