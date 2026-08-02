# Audit And History

> Verify operations, approvals, release decisions, source closure, and repairs after a workflow runs.

## Steps

1. Open **Ops**.
2. Refresh projections.
3. Filter or inspect by project, actor, request ID, or time range when available.
4. Inspect operation type, actor, tenant, workspace, target, and result.
5. Cross-check audit entries against Runs projections and release decision.

## Expected Result

- Each important operation has an actor.
- Mutating actions have tenant/workspace scope.
- Release decisions and approvals can be traced.
- Repair actions show the original failure and the repair result.

## Failure Modes

| Symptom | Meaning | Next Action |
|---|---|---|
| Missing audit record | Operation may not have reached API server. | Check network, request ID, and server logs. |
| Wrong actor | Browser session or token belongs to another user. | Re-login and verify user identity. |
| No history for a release | Release run did not reach closure stage. | Inspect Runs and release decision projections. |

## Digital Human Narration

Use audit evidence for statements such as "who approved", "who repaired", and "when the release decision was generated". Do not infer these from visual position in the UI.
