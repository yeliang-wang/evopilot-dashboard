# Expected UI States

> State vocabulary for WorkBuddy and digital human validation.

## Workflow States

| State | Treat As | Agent Action |
|---|---|---|
| `READY` | The next action can continue. | Continue. |
| `OBSERVABLE` | The system can observe but may not be fully ready. | Read details before continuing. |
| `READ_ONLY` | Source can be inspected but not written. | Configure credentials before writeback. |
| `BLOCKED` | Required condition is missing. | Stop and report blocker. |
| `WAITING_APPROVAL` | Governance stop. | Ask for approval or reject. |
| `RUNNING` | Active execution. | Wait or refresh until terminal/blocker. |
| `SUCCEEDED` | Step completed. | Continue to next step. |
| `FAILED` | Step failed. | Read failure signature and next action. |
| `GO` | Release criteria passed. | Archive evidence. |
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

- For project onboarding: project row and onboarding checklist status.
- For DevOps boundary: executionMode, devopsOwner, workflowRepository, claimBoundary.
- For Loop workflow: goalId or loopId plus nextAction.
- For approval: audit row or visible approval state.
- For release: release decision status and decision ID.
