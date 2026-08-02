# End-To-End Scenarios

> WorkBuddy-readable browser flows that must produce the same EvoPilot server effects as CLI operation.

## Scenario 1: First-Time GitHub Project To Harness Review

Use when a user gives a GitHub repository and a business goal loop target.

### Browser Flow

1. Open Dashboard and log in.
2. Enter repository URL.
3. Enter goal loop target.
4. Click **Start intake**.
5. Wait for the `ProjectHarnessProfile.yaml` DRAFT.
6. Stop and show the DRAFT profile source/compiled content, validation, diff, digests, policy refs, generatedBy evidence, and request ID to the project owner.

### CLI-equivalent

```text
project onboard plan
harness profile generate
# STOP for owner review
```

### WorkBuddy deviation guard

Do not click **Confirm**, approve a phase plan, or start a loop until the user accepts the visible DRAFT.

## Scenario 2: User Requests Harness Changes

### Browser Flow

1. Type the requested change in the composer.
2. Click **Request changes**.
3. Wait for a revised DRAFT and diff evidence.
4. Show the revised `ProjectHarnessProfile.yaml` again.

### CLI-equivalent

```text
harness profile validate
harness profile diff
harness profile apply
# STOP for owner review
```

### WorkBuddy deviation guard

Do not treat local browser text as active configuration. Only EvoPilot-returned DRAFTs can be reviewed and activated.

## Scenario 3: User Accepts The Harness And Plan

### Browser Flow

1. Click **Confirm** only after the owner accepts the `ProjectHarnessProfile.yaml`.
2. Verify activation succeeded or stop on blocker.
3. Review the generated phase plan and project harness binding.
4. Fill real `Confirmed By` and `Confirmation`.
5. Click **Approve plan & start loop**.

### CLI-equivalent

```text
harness profile activate
target plan or goal plan
target plan approve or goal approve-plan
goal advance
```

### Stop conditions

Stop on stale policy, missing active harness binding, missing confirmation, `nextAction`, `BLOCKED`, `FAILED`, `NO-GO`, or missing evidence.

## Scenario 4: Blocker Repair

### Browser Flow

1. Open the **Evidence Drawer**.
2. Read request ID, failing action, `nextAction`, blockers, and log trace.
3. Report the minimal repair scope.
4. Stop until the project owner or administrator approves repair.

### CLI-equivalent

```text
logging inspect
audit list
goal run-status
```

## Scenario 5: Release Decision Review

### Browser Flow

1. Refresh evidence.
2. Open the **Evidence Drawer**.
3. Read release decisions, target packages, phase packages, final report, digests, risk, and next action.
4. Report GO/NO-GO only from EvoPilot server evidence.

### CLI-equivalent

```text
goal target-package
goal phase-package
release decisions
```

### WorkBuddy deviation guard

Do not claim GO, RC, or GA from UI color, local tests, or CI success alone.
