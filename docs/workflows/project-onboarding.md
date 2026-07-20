# Project Onboarding

> Register a GitHub, GitLab, or local Git project and verify it before starting a Loop.

## Inputs

- Project ID and name.
- Source provider: GitHub, GitLab, or local Git.
- Repository URL or local path.
- Default branch.
- Optional credential reference.
- Target template such as Alpha, Beta, RC, or GA.

## Steps

1. Open **接入项目**.
2. Click the project registration action.
3. Fill project identity and repository fields.
4. For GitHub/GitLab, declare source credential reference if writeback is required.
5. Run onboarding checklist.
6. Review blockers, suggested commands, and next action.
7. Submit registration only when the checklist is acceptable.
8. Re-open the project row and verify onboarding status.

## Expected Result

- The project appears in the project list.
- The server returns `evopilot-project-onboarding-checklist/v1`.
- `nextAction` is clear.
- Source credential readiness is `READY`, `READ_ONLY`, or `BLOCKED`.

## Failure Modes

| Symptom | Meaning | Next Action |
|---|---|---|
| `READ_ONLY` | Public repo is visible but writeback credential is missing. | Configure source credentials before source closure. |
| `BLOCKED` | Required provider, branch, tokenRef, or repository condition is missing. | Fix blockers and re-run preflight. |
| Provider mismatch | GitHub project configured with GitLab CI or inverse. | Correct provider and DevOps config. |

## Do Not Do

- Do not skip onboarding checklist.
- Do not claim source writeback from a public repo without credentials.
- Do not enter GitHub PAT into browser fields unless the field explicitly stores it through EvoPilot API secret handling.

## Related Workflow

Continue to [Credential And DevOps Boundary](credential-and-devops-boundary.md).
