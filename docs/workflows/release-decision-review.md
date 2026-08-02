# Release Decision Review

> Review the authoritative release verdict for a project, target, or GlobalGoal.

## Principle

The release decision from EvoPilot API is authoritative. Dashboard cards, workflow graph state, CI success, screenshots, or operator notes are supporting evidence only.

## Steps

1. Open **Runs**.
2. Select or confirm projectId, goalId, targetId, or loopId if filters are available.
3. Read current release decision projections.
4. Check status: `GO`, `CONDITIONAL-GO`, or `NO-GO`.
5. Read failed criteria, open risks, scenario matrix, source release run, and CI/CD evidence.
6. If the decision is `NO-GO`, route to the recommended repair workflow.
7. If the decision is `GO`, archive evidence and audit references.

## Expected Result

- The user can quote the exact release verdict.
- The user can list blockers or residual risks.
- The user can find the audit trail for the decision.

## Failure Modes

| Symptom | Likely Cause | Next Action |
|---|---|---|
| No current decision | Target has not produced release evidence. | Run or advance the goal. |
| Decision is stale | Evidence was updated after decision. | Regenerate release decision through EvoPilot-controlled flow. |
| UI and CLI disagree | One client is deriving state or using a different server. | Check API server URL and release decision endpoint. |
