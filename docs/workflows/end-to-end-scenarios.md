# End-To-End Scenarios

> WorkBuddy-readable browser flows that must produce the same EvoPilot server effects as CLI operation.

## Scenario 1: First-Time GitHub/GitLab Project To selectedHarness Review

Use when an administrator-provisioned user gives a GitHub or GitLab repository and a business goal loop target.

### Browser Flow

1. Open Dashboard and log in from the first screen.
2. Complete password change if EvoPilot requires it.
3. Confirm `scope locked`, tenant, workspace, actor, role, and API status in the header.
4. Enter the GitHub/GitLab repository URL.
5. Enter goal loop target.
6. Click **Start intake**.
7. Wait for EvoPilot to automatically match the `Harness`.
8. Wait for the `selectedHarness.yaml` plan binding.
9. Stop and show the selectedHarness id/version/catalog/entry digests, phase-plan summary, blockers, generatedBy evidence, and request ID to the project owner.

### CLI-equivalent

```text
project onboard plan
target plan or goal plan
# STOP for owner review
```

### WorkBuddy deviation guard

Do not click **Confirm**, approve a phase plan, or start a loop until the user accepts the visible selectedHarness binding and phase plan.

Do not ask the ordinary user to choose a public `Harness`; EvoPilot owns template matching from project context, policy, history when present, and the goal loop target.

## Scenario 2: User Requests Harness Changes

### Browser Flow

1. Type the requested change in the composer.
2. Click **Request changes**.
3. Wait for a regenerated plan and selectedHarness evidence.
4. Show the revised `selectedHarness.yaml` again.

### CLI-equivalent

```text
target plan or goal plan
# STOP for owner review
```

### WorkBuddy deviation guard

Do not treat local browser text as active configuration. Only EvoPilot-returned goal plans can be reviewed and approved.

## Scenario 3: User Accepts The Harness And Plan

### Browser Flow

1. Click **Confirm** only after the owner accepts the `selectedHarness.yaml`.
2. Review the generated phase plan and selectedHarness binding.
3. Stop on missing selectedHarness, blocker, or stale plan evidence.
4. Fill real `Confirmed By` and `Confirmation`.
5. Click **Approve plan & start loop**.

### CLI-equivalent

```text
target plan or goal plan
target plan approve or goal approve-plan
goal advance
```

### Stop conditions

Stop on stale policy, missing selectedHarness binding, missing confirmation, `nextAction`, `BLOCKED`, `FAILED`, `NO-GO`, or missing evidence.

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

## Scenario 6: Platform Admin Creates Tenant And User

Use when a platform administrator prepares a tenant/workspace and user for a real project team.

### Browser Flow

1. Log in as a platform administrator.
2. Confirm the left navigation includes **Tenants**, **Workspaces**, **Users**, **Harness Hub**, **LLM Profiles**, and **Audit**.
3. Open **Tenants** and create the tenant, initial workspace, and tenant admin.
4. Open **Users** and create project owner or operator users with `mustChangePassword=true`.
5. Open **Audit** and verify the request IDs and actions are visible.

### CLI-equivalent

```text
users/tenants/workspaces through EvoPilot API or CLI admin commands
audit list
```

### WorkBuddy deviation guard

Do not create cross-tenant users from an ordinary operator session. Stop on `403`, missing role, missing tenant/workspace id, or server `nextAction`.

## Scenario 7: Platform Admin Opens Embedded Harness Hub

Use when an administrator wants to operate the independent `evopilot-harness` Hub from the Dashboard left menu without making Dashboard own Harness lifecycle state.

### Browser Flow

1. Log in as a platform administrator.
2. Open **Harness Hub**.
3. Confirm the right-side page renders an iframe whose source is the configured `harnessHubUrl`.
4. Operate Harness lifecycle inside the embedded `evopilot-harness` UI, or open the Hub in a separate tab.
5. If the needed Harness is missing or stale, use the Hub or `evopilot-harness` CLI to evolve, approve, and publish a usable Harness.

### CLI-equivalent

```text
evopilot-harness hub serve
evopilot-harness hub snapshot --json
evopilot-harness evolve --source-project /path/to/project --goal "..." --json
```

### WorkBuddy deviation guard

Do not claim Dashboard created, approved, published, or evolved a Harness. The embedded Hub is an `evopilot-harness` surface; Dashboard is only the iframe host.
