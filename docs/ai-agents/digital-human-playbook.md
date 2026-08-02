# Digital Human Playbook

> Browser-operation script for WorkBuddy, digital humans, and real-user-operation skills.

## Session Setup

1. Open Dashboard URL.
2. Log in with assigned EvoPilot username and password.
3. Confirm current tenant and workspace.
4. Confirm the left navigation shows **Projects**, **Runs**, and **Ops**.
5. Start from the requested workflow document.

## Standard Step Format

For each UI action:

1. Announce the page.
2. Identify the target button or form field.
3. Fill required fields without exposing secrets.
4. Submit.
5. Wait for visible state change or server error.
6. Read Review Pack row or Last API Action method/path/status/requestId/blockers/nextAction when an action was run.
7. Decide continue, stop, or route.

## Core Product Journey

```text
Login
  -> Projects
  -> Repository + Goal Loop Target
  -> Generate Review Pack
  -> Review ProjectHarnessProfile DRAFT
  -> Review Alpha/Beta/RC/GA Phase Plan
  -> Owner Confirmation
  -> Activate Harness
  -> Approve Phase Plan
  -> Start Or Advance Loop
  -> Runs Evidence
  -> Ops Troubleshooting/Audit
```

## Stop Conditions

Stop and report when the UI or API result shows:

- Missing or invalid credentials.
- `WAITING_APPROVAL`.
- Policy review required.
- `PROJECT_HARNESS_PROFILE_POLICY_STALE`.
- Source credential blocker.
- DevOps owner mismatch.
- LLM profile not ready or token usage missing for an LLM-backed terminal claim.
- Release decision `NO-GO`.
- API `401`, `403`, `409`, or repeated network failure.
- Any `nextAction` requiring human, credential, policy, LLM, source, or release repair.

## Secret Handling

- Never speak or store raw tokens.
- Mask tokens in reports.
- GitHub PAT is for EvoPilot project secret/tokenRef workflows, not Dashboard login.
- Dashboard login uses EvoPilot username/password and server-issued session.

## WorkBuddy Deviation Guard

WorkBuddy must not deviate from the real UI in these ways:

- Do not jump directly to Runs before Review Pack generation unless a user supplied an existing goalId.
- Do not approve a phase plan without visible `Confirmed By` and `Confirmation`.
- Do not activate a harness before the DRAFT has been shown to the project owner.
- Do not treat Ops projection failures as release failures; read the actual release decision.
- Do not use CLI commands while claiming to operate the browser UI.

## Successful Completion

A workflow is complete only when the expected UI state appears and the relevant server-derived evidence is visible: project ID, profile ID/version, goal ID, loop ID, release decision ID, request ID, schema, nextAction, blockers, LLM usage, or audit row.
