# Global Goal Loop Workflow

> Inspect a GlobalGoal that decomposes a user objective into multiple GoalTargets and loop steps.

## Purpose

GlobalGoal makes long-running product goals visible. A user can see the plan, each target, dependencies, active loop, blockers, evidence, and final report.

## Steps

1. Open **Runs**.
2. Confirm the selected goalId in the visible projections or Projects **Advanced Control Details**.
3. Read goal objective, status, progress, and active target from run-status.
4. Inspect phase-plan and evidence-matrix projections.
5. If a blocker exists, read blocker type and `nextAction`.
6. If final report exists, compare it with release decision.

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
