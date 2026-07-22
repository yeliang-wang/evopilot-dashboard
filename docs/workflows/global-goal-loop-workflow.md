# Global Goal Loop Workflow

> Inspect a GlobalGoal that decomposes a user objective into multiple GoalTargets and LoopRuns.

## Purpose

GlobalGoal makes long-running product goals visible. A user can see the plan, each target, dependencies, active LoopRun, blockers, evidence, and final report.

## Steps

1. Open **Loops**.
2. Locate **GlobalGoal Cockpit**.
3. Read goal objective, status, progress, and active target.
4. Open GoalTarget map.
5. Inspect dependencies and target statuses.
6. If a target is active, open its Loop details.
7. If a blocker exists, read blocker type and `nextAction`.
8. If final report exists, compare it with release decision.

## Expected Result

- User can explain which GoalTarget is running.
- User can explain why the workflow is continuing, blocked, waiting, or complete.
- Evidence matrix lists required evidence and current status.
- If an LLM-backed target has run, provider/model and token usage are visible from server-projected usage fields.
- Final report does not replace release decision.

## Digital Human Rule

When narrating progress, speak from server state:

- "The current active target is..."
- "The next action is..."
- "This is waiting for human approval because..."
- "This used <provider>/<model> and <totalTokens> tokens..." when usage is visible.
- "The release verdict is..."

Do not narrate assumptions from colors or layout alone.

## Related API

- `GET /api/v1/goals/{goalId}/run-status`
- `GET /api/v1/goals/{goalId}/snapshot`
- `GET /api/v1/goals/{goalId}/graph`
- `GET /api/v1/goals/{goalId}/timeline`
- `GET /api/v1/goals/{goalId}/evidence-matrix`

`run-status` is the preferred single projection for white-box workflow UI. It includes `llmUsage` when the server has usage evidence for the Goal/Loop chain.
