# API Usage

Dashboard uses `src/api.ts` as its HTTP adapter. Do not copy OpenAPI schema into components. Components call typed adapter helpers and receive normalized `ApiResult` or `DashboardActionResult` values.

## Agent Console API Map

| Console Action | API |
|---|---|
| Auth bootstrap | `GET /api/v1/auth/bootstrap` |
| Login | `POST /api/v1/auth/login` |
| Password change | `POST /api/v1/auth/change-password` |
| Locked scope projections | headers `X-EvoPilot-Tenant`, `X-EvoPilot-Workspace`, `X-EvoPilot-Actor` |
| Project intake | `POST /api/v1/onboarding/project/checklist` |
| Project LLM usage | `GET /api/v1/projects/{projectId}/usage` |
| Harness draft | `POST /api/v1/projects/{projectId}/harness-profiles/generate` |
| Harness profile list/read | `GET /api/v1/projects/{projectId}/harness-profiles`, `GET /api/v1/projects/{projectId}/harness-profiles/{profileId}` |
| Harness activation | `POST /api/v1/projects/{projectId}/harness-profiles/{profileId}/activate` |
| Goal create | `POST /api/v1/goals` |
| Goal plan | `POST /api/v1/goals/{goalId}/plan` |
| Phase-plan approval | `POST /api/v1/goals/{goalId}/approve-plan` |
| Loop advance | `POST /api/v1/goals/{goalId}/advance` |
| Goal projections | `GET /api/v1/goals/{goalId}/run-status`, `phase-plan`, `phase-packages`, `target-packages`, `snapshot`, `evidence-matrix`, `final-report` |
| Loop projections | `GET /api/v1/loops/{loopId}/executor-graph`, `trace-tree`, `events`, `source-closure/preflight` |
| Release | `GET /api/v1/release/decisions`, `GET /api/v1/release/evidence` |
| Tenants | `GET /api/v1/tenants`, `POST /api/v1/tenants` |
| Workspaces | `GET /api/v1/workspaces`, `POST /api/v1/workspaces`, `GET /api/v1/workspaces/{workspaceId}/usage` |
| Users | `GET /api/v1/users`, `POST /api/v1/users` |
| Harness template evolution | `GET /api/v1/harness/template-evolutions`, `POST /api/v1/harness/template-evolutions` |
| Harness templates and policies | `GET /api/v1/harness/templates`, `GET /api/v1/harness/policies` |
| LLM profiles | `GET /api/v1/llm-profiles`, `POST /api/v1/llm-profiles`, `POST /api/v1/llm-profiles/{profileId}/preflight` |
| Project LLM default | `GET /api/v1/projects/{projectId}/llm`, `POST /api/v1/projects/{projectId}/llm`, `POST /api/v1/projects/{projectId}/llm/preflight` |
| Audit | `GET /api/v1/audit` |

## Projection Context

Dashboard projections are scoped by:

- `tenantId`
- `workspaceId`
- `actorId`
- `projectId`
- `goalId`
- `loopId`

Headers:

```text
X-EvoPilot-Tenant
X-EvoPilot-Workspace
X-EvoPilot-Actor
Authorization: Bearer <EvoPilot API token>
```

The token is an EvoPilot Dashboard/API token. It is not a GitHub, GitLab, LLM, deploy, or password secret.

After login, Dashboard locks tenant/workspace/actor scope from the server session. Ordinary users should not edit these values. Platform administrators may switch scope only when EvoPilot grants the role and the target action remains RBAC-authorized.

## Evidence Contract

Every mutating action should surface:

- method and path
- HTTP status
- `requestId`
- schema
- `nextAction`
- blockers
- profile digests or release evidence digests when returned

The **Evidence Drawer** is the UI place for these fields.

Workspace usage and project LLM usage are server projections. Dashboard displays `llmUsage.provider`, `llmUsage.model`, `inputTokens`, `outputTokens`, `totalTokens`, `creditsConsumed`, calls, and request evidence when EvoPilot returns them. Browser code must not calculate project token totals locally.

## Role-Based API Boundary

| Page | Scope |
|---|---|
| `# Agent Console` | ordinary project owner/operator flow |
| `Tenants`, `Workspaces`, `Users` | platform or tenant administration through EvoPilot RBAC |
| `Harness Templates` | administrator template evolution lifecycle, not direct project harness activation |
| `LLM Profiles` | workspace profile registration for project defaults and user profile registration for run overrides |
| `Audit` | current authorized audit scope |

Dashboard never mutates local EvoPilot files and never calls CLI commands. CLI and Dashboard remain separate adapters over the same EvoPilot server state.
