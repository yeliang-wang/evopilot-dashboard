# Agent Console Surface Map

EvoPilot Dashboard no longer exposes a dense multi-menu operator console. It exposes one **Agent Console v2** surface.

## Regions

| Region | Purpose | Agent Notes |
|---|---|---|
| Left rail | Workspace/project, active sessions, recent decisions. | Use for orientation only. Do not infer release state from this rail. |
| Top bar | Current stage title, API/session chips, refresh. | Open session drawer when login or scope repair is needed. |
| Stage bar | `Project Intake -> Harness Draft -> Owner Review -> Loop Execution -> Release Decision`. | This is workflow orientation, not server truth by itself. |
| Conversation | Main ordinary-user interaction. | Read inline cards in order. |
| ProjectHarnessProfile.yaml card | Human-readable harness DRAFT. | Stop for owner review before activation. |
| Composer | Repository/goal input, change request, confirmation, loop/release actions. | Buttons map to EvoPilot APIs. |
| Evidence Drawer | Request IDs, digests, policy refs, generatedBy, API actions, logs, projections. | Use this for WorkBuddy reports and troubleshooting. |

## Button Recognition

| Button | Meaning |
|---|---|
| Start intake | Run project checklist and generate harness DRAFT. |
| Request changes | Ask EvoPilot to produce a revised DRAFT. |
| Confirm | Activate the reviewed `ProjectHarnessProfile.yaml`. |
| Approve plan & start loop | Approve reviewed phase plan with real confirmation, then advance goal. |
| View evidence | Open or close the Evidence Drawer. |
| Refresh | Reload EvoPilot projections through API. |

## Deviation Guard

If the visible card is not `ProjectHarnessProfile.yaml`, do not claim the harness has been reviewed. If the Evidence Drawer lacks `requestId` or digest fields for an incident, report incomplete evidence.
