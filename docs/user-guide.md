# User Guide

EvoPilot Dashboard is an **Agent Console v2** for ordinary users. You operate the main flow through a conversation, not a dense admin menu.

## Ordinary-User Core Flow

```text
Project Intake -> Harness Draft -> Owner Review -> Loop Execution -> Release Decision
```

1. Sign in through the session drawer when protected EvoPilot APIs are required.
2. Enter a GitHub, GitLab, or local repository URL.
3. Describe the goal loop target in normal language.
4. Click **Start intake**.
5. Review the generated `ProjectHarnessProfile.yaml` DRAFT.
6. Click **Request changes** when the harness definition is wrong or incomplete.
7. Click **Confirm** only after the DRAFT harness is acceptable.
8. Provide real `Confirmed By` and `Confirmation` text for phase-plan approval.
9. Start or advance the loop.
10. Open the **Evidence Drawer** for request IDs, digests, policy refs, blockers, next actions, and logs.

## ProjectHarnessProfile.yaml

This is the key owner-review artifact. It should be readable as Markdown/YAML and show:

- inherited template and policy references
- project scope and exclusions
- capability controls
- exception handling rules
- logging and triage fields
- observability and APM requirements
- release gates and rollback evidence

Confirming the DRAFT activates a project-level harness contract. It is not just a visual summary.

## Evidence Drawer

Use **View evidence** when you need audit or AI-agent details:

- `requestId`
- `sourceDigest`
- `compiledDigest`
- `policyRefs`
- `generatedBy`
- `nextAction`
- blockers
- API method and path
- log trace

## Production Action Map

| User Action | EvoPilot API |
|---|---|
| Start intake | `POST /api/v1/onboarding/project/checklist` |
| Generate harness draft | `POST /api/v1/projects/{projectId}/harness-profiles/generate` |
| Confirm harness | `POST /api/v1/projects/{projectId}/harness-profiles/{profileId}/activate` |
| Create goal | `POST /api/v1/goals` |
| Generate phase plan | `POST /api/v1/goals/{goalId}/plan` |
| Approve phase plan | `POST /api/v1/goals/{goalId}/approve-plan` |
| Start or advance loop | `POST /api/v1/goals/{goalId}/advance` |
| Read evidence | `GET /api/v1/goals/{goalId}/evidence-matrix`, `GET /api/v1/release/decisions` |

Dashboard does not call CLI commands. It uses EvoPilot HTTP APIs through `src/api.ts`.
