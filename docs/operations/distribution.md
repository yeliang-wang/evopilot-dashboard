# Distribution

> Run or deploy EvoPilot Dashboard as the browser surface for an EvoPilot API server.

EvoPilot Dashboard has three supported public entry points. These labels match the root README CTA block:

| README CTA | Audience | Command |
| --- | --- | --- |
| Run Dashboard | Developers and operators with an EvoPilot API server | `npm run dashboard:run -- --api-url http://127.0.0.1:19876 --start` |
| Self-host with EvoPilot | Operators bringing up the full EvoPilot stack | `npx create-evopilot@1.1.8 self-host --dir evopilot-stack --init-env` |
| Connect to API | Platform teams deploying Dashboard static assets behind a proxy | `window.EVOPILOT_DASHBOARD_CONFIG = { apiBaseUrl: "" }` |

The Dashboard is a standalone React HTTP client. It does not publish a separate npm CLI, does not call the EvoPilot CLI, and does not own server state. EvoPilot API remains the system of record for users, tenant/workspace scope, projects, harness profiles, loops, evidence, audit, release decisions, and credentials.

Desktop app and hosted Cloud trial are not published Dashboard distribution surfaces in this version. Do not present them as available paths until the product ships a signed desktop package or a hosted tenant onboarding flow.

## Local Browser Run

Use this path for development or compatibility checks against a local EvoPilot API server:

```bash
npm ci
EVOPILOT_API_BASE_URL=http://127.0.0.1:19876 npm run dev -- --port 5174
```

Open `http://127.0.0.1:5174`, then log in with an EvoPilot Dashboard user provisioned by an administrator.

## Container Run

Generate a standalone Dashboard container run directory:

```bash
npm run dashboard:run -- --api-url http://127.0.0.1:19876 --dir evopilot-dashboard-run
cd evopilot-dashboard-run
docker compose up -d
./verify.sh
```

When Dashboard should resolve EvoPilot by service name on an existing Compose network:

```bash
npm run dashboard:run -- \
  --api-url http://evopilot-server:19876 \
  --network evopilot_default \
  --dir evopilot-dashboard-run
```

From a release tag, bootstrap without cloning:

```bash
curl -fsSL https://raw.githubusercontent.com/yeliang-wang/evopilot-dashboard/v1.0.14/install.sh | bash -s -- --api-url http://127.0.0.1:19876 --dir evopilot-dashboard-run
```

## Self-Hosted Stack

Use the EvoPilot installer when you want Dashboard, API, loop worker, code-upgrader, and Postgres generated together:

```bash
npx create-evopilot@1.1.8 self-host --dir evopilot-stack --init-env
cd evopilot-stack
docker compose up -d
./verify.sh
```

Edit `.env` before production use. Do not leave placeholder passwords, tokens, LLM keys, or image tags in place.

## Static Deployment

For same-origin production deployments, serve Dashboard static assets at `/` and proxy EvoPilot API under `/api/*`. Keep browser config empty:

```js
window.EVOPILOT_DASHBOARD_CONFIG = {
  apiBaseUrl: ""
};
```

Use an absolute `apiBaseUrl` only when CORS is explicitly configured on EvoPilot API.

## Cloud Deployment

Use [Cloud Deployment](../deployment/cloud.md) when the Dashboard container or static assets run on Cloud Run, Fly.io, a managed container service, or object storage/CDN. Dashboard Cloud in this document means operator-deployed cloud infrastructure; it is not a hosted EvoPilot SaaS trial.

## Validation

Before publishing or deploying Dashboard changes, run:

```bash
npm run check
npm run verify:distribution
npm run smoke:console
```

Use mutating smoke only against disposable or explicitly approved data:

```bash
EVOPILOT_MUTATING_SMOKE=1 npm run smoke:console
```

Release artifacts are validated separately with:

```bash
npm run release:artifact
npm run verify:release-artifact
```
