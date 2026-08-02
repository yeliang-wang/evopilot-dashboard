# API Usage

Dashboard uses `src/api.ts` as its HTTP adapter. Do not copy OpenAPI schema into components. Components call typed adapter helpers and receive normalized `ApiResult` or `DashboardActionResult` values.

## Agent Console API Map

| Console Action | API |
|---|---|
| Auth bootstrap | `GET /api/v1/auth/bootstrap` |
| Login | `POST /api/v1/auth/login` |
| Project intake | `POST /api/v1/onboarding/project/checklist` |
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
