# API Usage

> How Dashboard consumes EvoPilot API without duplicating the backend API contract.

## Source Of Truth

The EvoPilot repository owns:

- `docs/api/openapi.json`
- `docs/api/README.md`
- `docs/cli/*`
- `docs/guides/ai-agent-runbook.md`

This document only explains how Dashboard uses those APIs.

## Browser Calls

Dashboard calls relative `/api/v1/*` paths in same-origin deployments. The reverse proxy forwards them to EvoPilot API.

For cross-origin deployments, `public/config.js` may set an absolute API base URL:

```js
window.EVOPILOT_DASHBOARD_CONFIG = {
  apiBaseUrl: "http://127.0.0.1:19876"
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

Dashboard login obtains the session token from EvoPilot API. GitHub PATs are not Dashboard login tokens. When an operator manually enters an API bearer token in the Dashboard scope panel, the browser keeps it in `sessionStorage` for the current session only.

## Required API Surfaces

Dashboard needs these categories:

- Auth and user bootstrap.
- Tenants, workspaces, users.
- Secrets and GitHub App installation state.
- Project onboarding and source credentials.
- Project DevOps readiness.
- Harness templates, template evolutions, tenant policies, and project harness profiles.
- Maturity standards and release targets.
- GlobalGoal and Loop runtime projections.
- Server-projected LLM provider/model and token usage for Goal/Loop workflows.
- Source closure and source release run repair.
- Release decisions.
- Audit and history.

The React app keeps these calls behind `src/api.ts`. Components must not call `fetch` directly unless they are adding a new API adapter function in `src/api.ts` first.

## Review Pack API Map

Dashboard **Generate Review Pack** executes this API sequence through `executeDashboardAction`:

| Action ID | Method And Path | Required Context |
|---|---|---|
| `project-preflight` | `POST /api/v1/onboarding/project/checklist` | projectId, projectName, repository provider/url/defaultBranch, tokenRef when needed, DevOps fields, goalLoopTarget |
| `generate-harness-profile` | `POST /api/v1/projects/{projectId}/harness-profiles/generate` | projectId, profileId, optional templateId override, goalLoopTarget, optional llmProfileId |
| `create-goal` | `POST /api/v1/goals` | projectId, releaseTargetId `ga`, objective, optional llmProfileId |
| `plan-goal` | `POST /api/v1/goals/{goalId}/plan` | goalId |
| `activate-harness-profile` | `POST /api/v1/projects/{projectId}/harness-profiles/{profileId}/activate` | projectId, profileId, profileVersion, owner review already completed |
| `approve-goal-plan` | `POST /api/v1/goals/{goalId}/approve-plan` | goalId, confirmedBy, confirmation |
| `advance-goal` | `POST /api/v1/goals/{goalId}/advance` | goalId |

Each result records HTTP status, optional schema, requestId, nextAction, blockers, and server error text. Agents should read these fields instead of scraping localized UI copy.

## Projection Context

`loadDashboardApiSnapshot` reads summary, projects, templates, policies, release targets, maturity standards, goals, releases, audit, LLM profiles, and the currently selected project/goal/loop projections. The selected IDs come from Projects **Advanced Control Details** and Ops scope fields. If one of those resources does not exist, the UI may still show `API LIVE` with a partial-projection notice; update the IDs before claiming the full page is verified.

## LLM And Token Usage

Dashboard reads LLM/token usage from EvoPilot API responses. It does not calculate token totals in browser code.

Use these server fields when the UI or an AI Agent must explain cost and model usage:

- `GET /api/v1/goals/{goalId}/run-status` -> `data.llmUsage`
- `GET /api/v1/loops/{loopId}` or trace projection -> `data.trace.llmUsage`
- JSON response metadata -> `meta.llm`

Report `provider`, `model`, `inputTokens`, `outputTokens`, `totalTokens`, `creditsConsumed`, and related `requestId` or `loopId` when visible. If an LLM-backed workflow claims completion but those fields are missing, treat the run as incomplete evidence and compare against the EvoPilot API/CLI docs.

## Rules

- Do not copy OpenAPI schema into this repository.
- Do not reimplement release-decision logic in JavaScript.
- Do not infer LLM provider, model, tokens, or credits in JavaScript.
- Do not infer DevOps owner from repository URL.
- Do not build API request bodies from hidden sample repositories.
- Do not treat a public upstream as writable unless the EvoPilot API returns a non-read-only execution boundary and a resolvable GitHub/GitLab credential principal.
- Do not read server files, database tables, or `.codex-evidence`.
