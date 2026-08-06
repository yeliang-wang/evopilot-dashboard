# Cloud Deployment

> Deploy EvoPilot Dashboard on operator-owned cloud infrastructure while keeping EvoPilot API as the system of record.

This guide covers cloud container and static hosting entrypoints for Dashboard `v1.0.11`. It does not announce a hosted EvoPilot Cloud trial or a managed SaaS product. Operators own the cloud project, DNS, TLS, secrets, and EvoPilot API endpoint.

## Required Contract

| Requirement | Value |
| --- | --- |
| Dashboard image | `ghcr.io/yeliang-wang/evopilot-dashboard:1.0.11` |
| Runtime port | `8080` |
| Health path | `/health` |
| Browser config | `EVOPILOT_API_BASE_URL` for container injection or `public/config.js` for static assets |
| API system of record | EvoPilot API `v1.1.6` or later |

Do not put bearer tokens, GitHub PATs, GitLab tokens, LLM keys, deploy credentials, or passwords in browser config. Dashboard only needs the EvoPilot API base URL.

## Cloud Run

Use a container service when the platform should serve the built Dashboard image directly:

```bash
gcloud run deploy evopilot-dashboard \
  --image ghcr.io/yeliang-wang/evopilot-dashboard:1.0.11 \
  --port 8080 \
  --set-env-vars EVOPILOT_API_BASE_URL=https://evopilot.example.com \
  --allow-unauthenticated
```

After rollout:

```bash
curl -fsS https://dashboard.example.com/health
curl -i https://dashboard.example.com/api/v1/summary
```

`/api/v1/summary` should reach EvoPilot through the configured API route and return either authenticated JSON or `401` before login.

## Fly.io Or Managed Containers

Use the same container contract on Fly.io, ECS, Azure Container Apps, or any managed container service:

```text
image: ghcr.io/yeliang-wang/evopilot-dashboard:1.0.11
port: 8080
env:
  EVOPILOT_API_BASE_URL: https://evopilot.example.com
health:
  path: /health
```

Prefer a same-origin reverse proxy when possible:

```text
/       -> Dashboard container
/api/*  -> EvoPilot API
```

With same-origin routing, set `EVOPILOT_API_BASE_URL` to an empty string or omit it and keep `public/config.js` empty.

## Static hosting

Static hosting is appropriate for object storage/CDN platforms. Build assets from the tagged release and inject only the public API base URL:

```bash
npm ci
EVOPILOT_API_BASE_URL=https://evopilot.example.com npm run build
```

Upload `dist/` to the static host. Configure the CDN or edge proxy so `/api/*` reaches EvoPilot API when using same-origin routing.

## Smoke

Run non-mutating smoke from a trusted operator machine:

```bash
EVOPILOT_DASHBOARD_BASE_URL=https://dashboard.example.com \
EVOPILOT_API_BASE_URL=https://evopilot.example.com \
npm run smoke:console
```

Do not run mutating smoke against production unless an administrator approved disposable project and goal data.

## Rollback

1. Repoint the cloud service image to the previous Dashboard digest or tag.
2. Keep the EvoPilot API unchanged unless the API release caused the failure.
3. Verify `/health`, `/api/v1/summary`, login, Agent Console project intake, Evidence Drawer, and release decision rendering.
4. Preserve browser console logs and EvoPilot `requestId` values for the incident report.
