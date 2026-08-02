# End-To-End Scenarios

> WorkBuddy-readable browser flows that must produce the same EvoPilot server effects as CLI operation.

## Scenario 1: First-Time GitHub Project To Reviewed Plan

Use when a user gives a GitHub repository and a business Goal Loop Target.

### Browser Flow

1. Open Dashboard and log in.
2. Open **Projects**.
3. Fill **Repository** with the GitHub URL.
4. Fill **Goal Loop Target** with the business objective.
5. Open **Advanced Control Details** only if the user supplied tokenRef, executionMode, DevOps owner, LLM profile, projectId, or branch.
6. Click **Generate Review Pack**.
7. Read Review Pack rows in order:
   - Project Onboarding Checklist
   - Harness Draft
   - GlobalGoal
   - Phase Plan
8. Stop after the harness DRAFT and Alpha/Beta/RC/GA phase plan are visible.
9. Show the DRAFT profile source/compiled content, validation, diff, digests, policyRefs, and generatedBy to the project owner.
10. Show the phase plan, projectHarness binding, phases, targets, blockers, and request IDs.

### CLI-equivalent

```text
evopilot project onboard plan ... --json
evopilot harness profile generate ... --json
evopilot harness profile inspect ... --json
evopilot harness profile diff ... --json
evopilot target plan ... --json
# STOP for owner review
```

### WorkBuddy deviation guard

Do not click **Activate Reviewed Harness**, **Approve Phase Plan**, or **Start Or Advance Loop** until the user gives real confirmation.

## Scenario 2: User Accepts The Review Pack

Use after Scenario 1 when the project owner accepts both the harness DRAFT and phase plan.

### Browser Flow

1. Stay on **Projects**.
2. Fill **Confirmed By** with the real user or project-owner identity.
3. Fill **Confirmation** with the real review statement.
4. Click **Activate Reviewed Harness**.
5. Read Last API Action or appended Review Pack row. Continue only if activation succeeded and no stale-policy blocker exists.
6. Click **Approve Phase Plan**.
7. Read Last API Action. Continue only if approval succeeded.
8. Click **Start Or Advance Loop**.
9. Open **Runs** and inspect run-status, phase-plan, evidence matrix, and final report.

### CLI-equivalent

```text
evopilot harness profile activate ... --json
evopilot target plan approve <goal-id> --confirmed-by <user-or-owner> --confirmation <text> --json
evopilot goal advance <goal-id> --json
```

### Stop conditions

Stop on `PROJECT_HARNESS_PROFILE_POLICY_STALE`, `approve-plan`, `WAITING_APPROVAL`, `NO-GO`, `BLOCKED`, `FAILED`, missing LLM usage, missing requestId for an incident, or any `nextAction` requiring repair.

## Scenario 3: User Requests Harness Or Plan Changes

Use when the DRAFT harness or phase plan is not accepted.

### Browser Flow

1. Do not activate or approve.
2. Record projectId, profileId/version, goalId, requestId, and requested change.
3. Route the change to an EvoPilot-controlled profile or plan edit flow:
   - profile source edit -> validate -> diff -> apply -> inspect/diff -> show again
   - phase plan export/edit -> diff -> apply -> show again
4. Return to **Projects** and regenerate or refresh the Review Pack evidence.
5. Repeat owner review.

### CLI-equivalent

```text
evopilot harness profile validate --project <project> --file <profile.yaml> --json
evopilot harness profile diff default --project <project> --file <profile.yaml> --json
evopilot harness profile apply --project <project> --file <profile.yaml> --json
evopilot target plan export <goal-id> --format json > plan.json
evopilot target plan diff <goal-id> --file plan.json --json
evopilot target plan apply <goal-id> --file plan.json --json
```

### WorkBuddy deviation guard

Do not silently edit browser local state. The edited artifact must go through EvoPilot validate/diff/apply before approval.

## Scenario 4: Second Onboarding Or Project Evolution

Use when a project already has an active ProjectHarnessProfile and the user provides a new Goal Loop Target.

### Browser Flow

1. Open **Projects**.
2. Enter the repository and new Goal Loop Target.
3. If the projectId is already known, open **Advanced Control Details** and enter it.
4. Click **Generate Review Pack**.
5. Verify the Harness Draft evidence includes previous active profile context or diffFromActive when the server returns it.
6. Stop for owner review as in Scenario 1.

### CLI-equivalent

```text
evopilot harness profile generate --project <project> --goal-loop-target <new-target> --json
evopilot harness profile inspect default --project <project> --version <version> --json
evopilot harness profile diff default --project <project> --version <version> --json
# STOP for owner review
```

### Stop conditions

Stop if `generatedBy.evidence[]` is missing previous-active-profile evidence for a known existing project, or if the server returns a stale policy blocker.

## Scenario 5: Runs Evidence And Release Decision Review

Use after a loop has started or advanced.

### Browser Flow

1. Open **Runs**.
2. Confirm the selected goalId and loopId if supplied.
3. Read Server Projections:
   - run-status
   - phase-plan
   - evidence-matrix
   - final-report
   - release decisions
4. Report phase status, blockers, nextAction, LLM provider/model/tokens if visible, TargetEvidencePackage, PhasePackage, and releaseDecision.

### CLI-equivalent

```text
evopilot goal run-status <goal-id> --json
evopilot goal phase-package <goal-id> --phase <alpha|beta|rc|ga> --json
evopilot goal target-package <goal-id> --target <target-id> --json
evopilot release decisions --project <project-id> --json
```

### WorkBuddy deviation guard

Do not claim `GO`, `NO-GO`, RC, or GA from UI color, local tests, or CI success alone.

## Scenario 6: Troubleshooting And Repair

Use when any action fails or projection is incomplete.

### Browser Flow

1. Open **Ops**.
2. Click **Refresh Projections**.
3. Read failed projection key, HTTP status, requestId, error, blockers, and nextAction.
4. Follow the Troubleshooting Contract:
   - credential repair
   - harness stale
   - human gate
   - release verdict
5. Stop when repair requires administrator, owner, credential, policy, LLM, or source access.

### CLI-equivalent

```text
evopilot status --json
evopilot logging inspect --json
evopilot audit list --limit 50 --json
```

### Required report

```text
page=<Projects|Runs|Ops>
action=<button-or-projection>
status=<http-status-or-ui-state>
requestId=<id-or-not-visible>
nextAction=<server-next-action>
blockers=<server-blockers>
repair=<needed-human-or-admin-action>
```
