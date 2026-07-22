# API Usage

> How Dashboard consumes EvoPilot API without duplicating the backend API contract.

## Source Of Truth

The EvoPilot repository owns:

- `docs/api/openapi.json`
- `docs/api/README.md`
- `docs/guides/dashboard-integration.md`

This document only explains how Dashboard uses those APIs.

## Browser Calls

Dashboard calls relative `/api/v1/*` paths in same-origin deployments. The reverse proxy forwards them to EvoPilot API.

For cross-origin deployments, `public/config.js` may set an absolute API base URL:

```js
window.EVOPILOT_DASHBOARD_CONFIG = {
  apiBaseUrl: "http://8.153.72.80"
};
```

## Auth Headers

Protected requests require server-issued session token and scope:

```http
Authorization: Bearer <session-token>
X-EvoPilot-Tenant: <tenant-id>
X-EvoPilot-Workspace: <workspace-id>
X-EvoPilot-Actor: <actor-id>
```

Dashboard login obtains the session token from EvoPilot API. GitHub PATs are not Dashboard login tokens.

## Required API Surfaces

Dashboard needs these categories:

- Auth and user bootstrap.
- Tenants, workspaces, users.
- Secrets and GitHub App installation state.
- Project onboarding and source credentials.
- Project DevOps readiness.
- GlobalGoal and Loop runtime projections.
- Server-projected LLM provider/model and token usage for Goal/Loop workflows.
- Source closure and source release run repair.
- Release decisions.
- Audit and history.

## LLM And Token Usage

Dashboard reads LLM/token usage from EvoPilot API responses. It does not calculate token totals in browser code.

Use these server fields when the UI or an AI Agent must explain cost and model usage:

- `GET /api/v1/goals/{goalId}/run-status` -> `data.llmUsage`
- `GET /api/v1/loops/{loopId}` -> `data.trace.llmUsage`
- JSON response metadata -> `meta.llm`

Report `provider`, `model`, `inputTokens`, `outputTokens`, `totalTokens`, `creditsConsumed`, and related `requestId` or `loopId` when visible. If an LLM-backed workflow claims completion but those fields are missing, treat the run as incomplete evidence and compare against the EvoPilot API/CLI docs.

## Rules

- Do not copy OpenAPI schema into this repository.
- Do not reimplement release-decision logic in JavaScript.
- Do not infer LLM provider, model, tokens, or credits in JavaScript.
- Do not infer DevOps owner from repository URL.
- Do not treat a public upstream as writable unless the EvoPilot API returns a non-read-only execution boundary and a resolvable GitHub/GitLab credential principal.
- Do not read server files, database tables, or `.codex-evidence`.
