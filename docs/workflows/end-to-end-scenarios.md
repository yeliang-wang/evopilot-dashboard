# End-To-End Scenarios

> WorkBuddy-readable browser flows that must produce the same EvoPilot server effects as CLI operation.

## Scenario 1: First-Time GitHub/GitLab Project To Harness Review

Use when an administrator-provisioned user gives a GitHub or GitLab repository and a business goal loop target.

### Browser Flow

1. Open Dashboard and log in from the first screen.
2. Complete password change if EvoPilot requires it.
3. Confirm `scope locked`, tenant, workspace, actor, role, and API status in the header.
4. Enter the GitHub/GitLab repository URL.
5. Enter goal loop target.
6. Click **Start intake**.
7. Wait for EvoPilot to automatically match the `HarnessTemplate`.
8. Wait for the `ProjectHarnessProfile.yaml` DRAFT.
9. Stop and show the DRAFT profile source/compiled content, validation, diff, digests, policy refs, generatedBy evidence, and request ID to the project owner.

### CLI-equivalent

```text
project onboard plan
harness profile generate
# STOP for owner review
```

### WorkBuddy deviation guard

Do not click **Confirm**, approve a phase plan, or start a loop until the user accepts the visible DRAFT.

Do not ask the ordinary user to choose a public `HarnessTemplate`; EvoPilot owns template matching from project context, policy, history when present, and the goal loop target.

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

## Scenario 6: Platform Admin Creates Tenant And User

Use when a platform administrator prepares a tenant/workspace and user for a real project team.

### Browser Flow

1. Log in as a platform administrator.
2. Confirm the left navigation includes **Tenants**, **Workspaces**, **Users**, **Harness Templates**, **LLM Profiles**, and **Audit**.
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

## Scenario 7: Platform Admin Starts Harness Template Evolution

Use when an administrator wants to evolve a public HarnessTemplate knowledge pack from historical projects, project corpora, attachments, production logs, EvoPilot goal/loop history, and existing evidence without manually editing server state.

### Browser Flow

1. Log in as a platform administrator.
2. Open **Harness Templates**.
3. Review existing template versions returned by EvoPilot.
4. Fill base template, target version, intent, source type, and source value. Source type may be `source-project`, `source-corpus`, `production-log`, `evopilot-history`, `attachment`, `github-repo`, `gitlab-repo`, `web-url`, `local-pack`, `existing-template`, `runtime-evidence`, or `admin-note`.
5. Click **创建 evolution draft**.
6. Review the Harness Knowledge Factory table for `sourceTypes`, `domainSignals`, `gapClassifications`, status, and target version.
7. Open evidence or audit and report `evolutionId`, requestId, status, and nextAction when returned.

### CLI-equivalent

```text
harness template evolution create
harness template evolution advance
# STOP before approve/publish until source coverage, generated pack, validation, diff, and project impact are shown
```

### WorkBuddy deviation guard

Do not approve or publish a template evolution from Dashboard unless EvoPilot exposes that gate and the administrator has reviewed source coverage, redaction status, generated pack, validation, diff, changelog, gap classifications, and project impact.
