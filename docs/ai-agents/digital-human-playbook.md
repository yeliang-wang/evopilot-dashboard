# Digital Human Playbook

> Browser-operation script for simulated product users.

## Session Setup

1. Open Dashboard URL.
2. Log in with assigned username and password.
3. Confirm current tenant and workspace.
4. Confirm the left navigation is visible.
5. Start from the requested workflow document.

## Standard Step Format

For each UI action:

1. Announce the page.
2. Identify the target button, tab, or form.
3. Fill required fields.
4. Submit.
5. Wait for visible state change or server error.
6. Read state and blocker text.
7. Decide continue, stop, or route.

## Core Product Journey

```text
登录 -> 租户/工作区 -> 用户/权限 -> 凭据 -> 接入项目 -> DevOps 边界 -> Loops -> GlobalGoal/Loop 详情 -> 审批 -> 发布证据 -> 审计
```

## Stop Conditions

Stop and report when the UI shows:

- Missing or invalid credentials.
- `WAITING_APPROVAL`.
- Policy review required.
- Source credential blocker.
- DevOps owner mismatch.
- Release decision `NO-GO`.
- API `401`, `403`, `409`, or repeated network failure.

## Secret Handling

- Never speak or store raw tokens.
- Mask tokens in reports.
- GitHub PAT is for EvoPilot project secret/tokenRef workflows, not Dashboard login.
- Dashboard login uses EvoPilot username/password and server-issued session.

## Successful Completion

A workflow is complete only when the expected UI state appears and the relevant server-derived evidence is visible: project ID, goal ID, loop ID, release decision ID, request ID, or audit row.
