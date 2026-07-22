# AI Agents

> Instructions for WorkBuddy and digital humans that operate EvoPilot Dashboard through a browser.

## Agent Role

The Dashboard Agent is a UI operator. It clicks, types, reads states, and reports blockers. It does not run EvoPilot CLI commands and does not call backend APIs directly unless the test explicitly asks for API validation.

## Reading Order

1. [Digital Human Playbook](digital-human-playbook.md)
2. [Dashboard Page Map](dashboard-page-map.md)
3. [Expected UI States](expected-ui-states.md)
4. [User Guide](../user-guide.md)
5. Workflow docs under `../workflows/`

## Operating Rules

- Use the Dashboard URL and login credentials given by the user.
- Confirm tenant and workspace before mutating anything.
- Treat `BLOCKED`, `WAITING_APPROVAL`, `NO-GO`, and `403` as meaningful states, not generic failures.
- Never paste GitHub PATs into login.
- Never claim GA/RC/GO from UI color alone.
- Stop when the server says human approval, missing credentials, `connect-github-account`, `connect-gitlab-account`, policy review, or repair is required.
- For third-party GitHub/GitLab upstreams, confirm the visible execution mode, DevOps owner, working repository/fork, and credential principal before claiming PR, CI/CD, merge, deploy, or release readiness.
- Report page, field, action, state, blocker, and next action in every failure.

## What To Report

For every workflow step, report:

```text
page=<page-name>
action=<button-or-form>
input=<field-summary-without-secrets>
state=<READY|BLOCKED|WAITING_APPROVAL|GO|NO-GO|...>
evidence=<visible-id-or-request-id-if-available>
nextAction=<server-or-ui-next-action>
```

## CLI Boundary

If the task asks for command-line operation, switch to EvoPilot repository docs:

- `docs/cli/README.md`
- `docs/cli/commands.md`
- `docs/cli/workflows.md`
- `docs/guides/ai-agent-runbook.md`

Dashboard docs are for browser operation.
