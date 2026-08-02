# Expected UI States

## Stage States

| Stage | Expected State Labels |
|---|---|
| Project Intake | `editing goal`, `done` |
| Harness Draft | `matching template`, `drafting profile`, `done` |
| Owner Review | `needs owner review`, `changes applied`, `done` |
| Loop Execution | `planning`, `running`, `blocked repair`, `done` |
| Release Decision | `not started`, `GO review`, `NO-GO`, `BLOCKED` |

## ProjectHarnessProfile YAML Review

Expected visible elements:

- card title `ProjectHarnessProfile.yaml`
- Markdown owner review summary
- YAML block with `projectHarnessProfile`
- `inherits`
- `scope`
- `controls`
- `exceptionHandling`
- `logging`
- `observability`
- `releaseGates`
- `Confirm`
- `Request changes`
- `View evidence`

Do not continue to activation until this DRAFT has been shown to the user or project owner.

## Evidence Drawer States

Expected fields:

- `requestId`
- `profileDraft`
- `compiledDigest`
- `policyRefs`
- `generatedBy`
- `lastAction`
- `nextAction`
- log trace
- server projections when available

## Blocker State

Expected visible elements:

- `BLOCKED`
- failing capability or action
- request ID if server returned one
- `nextAction` or blockers
- minimal repair scope

The agent must stop unless the user or administrator approves repair.
