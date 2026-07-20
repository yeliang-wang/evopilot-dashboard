# Audit And History

> Verify operations, approvals, release decisions, source closure, and repairs after a workflow runs.

## Steps

1. Open **审计**.
2. Filter by project, actor, request ID, or time range when available.
3. Inspect operation type, actor, tenant, workspace, target, and result.
4. Open **历史** or related detail view for release and code-upgrade history.
5. Cross-check audit entries against Loop timeline and release decision.

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
| No history for a release | Release run did not reach closure stage. | Inspect Loop details and source release run. |

## Digital Human Narration

Use audit evidence for statements such as "who approved", "who repaired", and "when the release decision was generated". Do not infer these from visual position in the UI.
