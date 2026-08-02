# Project Onboarding

> Register or verify a GitHub, GitLab, or local Git project before starting a governed loop.

## Inputs

- Repository URL or local path.
- Goal Loop Target as a business objective.
- Optional projectId and project name.
- Source provider, default branch, tokenRef, execution mode, DevOps owner, CI workflow, required check, and LLM profile when needed.

## Steps

1. Open **# Agent Console**.
2. Fill **Repository**.
3. Fill **Goal Loop Target**.
4. Open **Advanced Control Details** only when real project, DevOps, credential, LLM, or profile IDs are known.
5. Click **Start intake**.
6. Read **Project Onboarding Checklist** status, blockers, requestId, and nextAction.
7. Continue only when the checklist allows harness profile generation and phase planning.

## Expected Result

- The Review Pack includes `Project Onboarding Checklist`.
- The server returns `evopilot-project-onboarding-checklist/v1` when available.
- `nextAction` is clear.
- Source credential readiness is `READY`, `READ_ONLY`, or `BLOCKED`.

## Failure Modes

| Symptom | Meaning | Next Action |
|---|---|---|
| `READ_ONLY` | Public repo is visible but writeback credential is missing. | Configure source credentials before source closure. |
| `connect-github-account` | GitHub writeback or GitHub Actions needs a user/org/service principal. | Connect or create the GitHub account/org, fork or authorize the repo, store tokenRef, and re-run checklist. |
| `connect-gitlab-account` | GitLab writeback or GitLab CI needs a user/group/deploy principal. | Connect or create the GitLab account/group, fork or authorize the project, store tokenRef, and re-run checklist. |
| `BLOCKED` | Required provider, branch, tokenRef, or repository condition is missing. | Fix blockers and re-run Review Pack. |
| Provider mismatch | GitHub project configured with GitLab CI or inverse. | Correct provider and DevOps config. |

## Do Not Do

- Do not skip onboarding checklist.
- Do not claim source writeback from a public repo without credentials.
- Do not enter GitHub PAT into browser fields unless the field explicitly stores it through EvoPilot API secret handling.
- Do not continue from a third-party open-source upstream to PR/CI/CD/release without a user-owned fork or maintainer-authorized principal.
