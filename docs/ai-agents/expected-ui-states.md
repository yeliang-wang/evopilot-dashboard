# Expected UI States

> State vocabulary for WorkBuddy and digital human validation.

## Review Pack States

| State | Treat As | Agent Action |
|---|---|---|
| `READY` | The step is ready or the server accepted the preflight/action. | Continue to the next review step. |
| `REVIEW` | The step produced a human-reviewable DRAFT, plan, or evidence package. | Stop and show the user or project owner before activation/approval. |
| `WAITING` | Required context or an earlier server step is missing. | Fill the missing field or run the previous action. |
| `BLOCKED` | Required condition is missing or the server returned a non-2xx action result. | Stop and report blocker, requestId, and nextAction. |
| `DONE` | The explicit reviewed action completed. | Continue only if the next gate is allowed. |

## Workflow States

| State | Treat As | Agent Action |
|---|---|---|
| `READ_ONLY` | Source can be inspected but not written. | Configure credentials before writeback. |
| `connect-github-account` | GitHub account/org/service principal is required for writeback or Actions. | Stop until the operator connects the principal and stores tokenRef. |
| `connect-gitlab-account` | GitLab account/group/deploy principal is required for writeback or CI. | Stop until the operator connects the principal and stores tokenRef. |
| `WAITING_APPROVAL` | Governance stop. | Ask for approval or rejection. |
| `RUNNING` | Active execution. | Wait or refresh until terminal/blocker. |
| `SUCCEEDED` | Step completed. | Continue to next server-authorized step. |
| `FAILED` | Step failed. | Read failure signature and nextAction. |
| `GO` | Release criteria passed in EvoPilot evidence. | Archive evidence. |
| `CONDITIONAL-GO` | Release can proceed with stated conditions. | Report conditions. |
| `NO-GO` | Release cannot proceed. | Report failed criteria and repair path. |

## API Error States

| HTTP | Meaning | Agent Action |
|---|---|---|
| `401` | Not authenticated or invalid token/session. | Re-login. |
| `403` | Role or tenant/workspace scope denied. | Stop and report permission issue. |
| `404` | Wrong route or missing resource. | Verify URL, project ID, goal ID, or loop ID. |
| `409` | Business guardrail or blocker. | Read blocker and nextAction. |
| `500` | Server error. | Record request ID and report. |

## Evidence Needed Before Claiming Done

- For project onboarding: Review Pack checklist status, requestId, blockers, and nextAction.
- For harness review: generated ProjectHarnessProfile DRAFT with source/compiled content, validation, diff, generatedBy, sourceDigest, compiledDigest, and policyRefs.
- For phase planning: Alpha/Beta/RC/GA phase plan with projectHarness binding, targets, editable plan or projection, and requestId.
- For approval: visible `confirmedBy`, `confirmation`, and audit or Last API Action evidence.
- For production action execution: method/path/status/requestId/schema/blockers/nextAction from Review Pack row or Last API Action.
- For DevOps boundary: executionMode, devopsOwner, workflowRepository, credentialPrincipal, and claimBoundary.
- For Loop workflow: goalId or loopId plus run-status, phase-plan, evidence matrix, final report, and nextAction.
- For LLM-backed Loop workflow: provider, model, token totals, and visible requestId or loopId.
- For release: release decision status and decision ID.
- For troubleshooting: requestId, traceId, failed node, root cause, and repair evidence.
