# AI Agents

> Instructions for WorkBuddy and digital humans that operate EvoPilot Dashboard through a browser.

## Agent Role

The Dashboard Agent is a UI operator. It clicks, types, reads states, and reports blockers. It does not run EvoPilot CLI commands and does not call backend APIs directly unless the task explicitly asks for API validation.

Dashboard operation and CLI operation must end in the same EvoPilot server state. The Dashboard is a browser adapter over EvoPilot API; EvoPilot remains the system of record.

## Reading Order

1. [End-To-End Scenarios](../workflows/end-to-end-scenarios.md)
2. [Digital Human Playbook](digital-human-playbook.md)
3. [Dashboard Page Map](dashboard-page-map.md)
4. [Expected UI States](expected-ui-states.md)
5. [User Guide](../user-guide.md)
6. [Smoke Test](../operations/smoke-test.md)

## Operating Rules

- Use the Dashboard URL and login credentials given by the user.
- Confirm tenant and workspace before mutating anything.
- The console has three top-level pages: **Projects**, **Runs**, and **Ops**.
- Use **Auth Session** for EvoPilot Dashboard username/password login. Do not use GitHub/GitLab PATs as login credentials.
- Use **Projects** for the normal flow: repository, goal loop target, Review Pack, owner confirmation, harness activation, phase-plan approval, and loop advance.
- Use **Advanced Control Details** only when the task names specific projectId, profileId, goalId, loopId, tokenRef, templateId override, LLM profile, or DevOps fields.
- Use **Runs** to inspect server projections for phase status, evidence, final report, and release decision.
- Use **Ops** to refresh projections, change tenant/workspace/actor scope, and troubleshoot request IDs, `nextAction`, policies, credentials, LLM readiness, and audit.
- Treat `BLOCKED`, `WAITING_APPROVAL`, `NO-GO`, `FAILED`, `403`, and `PROJECT_HARNESS_PROFILE_POLICY_STALE` as stop states.
- Never claim GA/RC/GO from UI color alone.
- Never invent `confirmedBy` or `confirmation`.
- Stop when the server says human approval, missing credentials, `connect-github-account`, `connect-gitlab-account`, policy review, LLM repair, or source repair is required.
- If an LLM-backed workflow reaches a terminal claim but visible provider/model/token usage is missing, report incomplete evidence instead of claiming completion.

## Browser End-To-End Loop

1. Open the Dashboard URL.
2. Log in through **Auth Session**.
3. Confirm tenant/workspace and role.
4. Open **Projects**.
5. Enter the repository URL and the user's business Goal Loop Target.
6. Click **Generate Review Pack**.
7. Read each Review Pack row: project checklist, Harness Draft, GlobalGoal, Phase Plan.
8. Stop and show the DRAFT ProjectHarnessProfile and Alpha/Beta/RC/GA phase plan to the user or project owner.
9. If the user requests changes, do not approve. Route to profile/plan edit and repeat validation/diff/apply through EvoPilot-controlled flows.
10. If the user confirms, fill **Confirmed By** and **Confirmation** with the real confirmation.
11. Click **Activate Reviewed Harness**.
12. Click **Approve Phase Plan**.
13. Click **Start Or Advance Loop**.
14. Open **Runs** and inspect run-status, phase-plan, evidence matrix, final report, and release decision.
15. Open **Ops** when any blocker, missing projection, or request ID investigation is needed.

## CLI-equivalent Mental Model

Dashboard **Generate Review Pack** is equivalent to the safe CLI sequence:

```text
project onboard plan
harness profile generate
goal create
goal plan
# STOP for owner review
```

Dashboard **Activate Reviewed Harness** maps to:

```text
harness profile activate
```

Dashboard **Approve Phase Plan** maps to:

```text
target plan approve or goal approve-plan
```

Dashboard **Start Or Advance Loop** maps to:

```text
goal advance
```

The browser agent must apply the same stop rules as CLI agents.

## Agent-Safe Smoke

When shell access is available, prefer the JSON smoke report over visual inference:

```bash
EVOPILOT_DASHBOARD_BASE_URL=http://<dashboard-host> \
EVOPILOT_API_BASE_URL=http://<api-host> \
npm run smoke:console
```

Use mutating smoke only when the target server is disposable or the user explicitly allows a temporary project/goal:

```bash
EVOPILOT_MUTATING_SMOKE=1 \
EVOPILOT_MUTATING_SMOKE_TIMEOUT_MS=180000 \
EVOPILOT_DASHBOARD_BASE_URL=http://<dashboard-host> \
EVOPILOT_API_BASE_URL=http://<api-host> \
npm run smoke:console
```

Report the JSON summary, reportPath, failed checks, requestId values, blockers, and nextAction. Do not parse human-readable CLI output for EvoPilot operations.

## What To Report

For every workflow step, report:

```text
page=<Projects|Runs|Ops>
action=<button-or-form>
input=<field-summary-without-secrets>
state=<READY|REVIEW|WAITING|BLOCKED|GO|NO-GO|...>
api=<method-and-path-if-visible>
status=<http-status-if-visible>
evidence=<visible-id-or-request-id-if-available>
nextAction=<server-or-ui-next-action>
llm=<provider/model-or-not-visible>
tokens=<input/output/total-or-not-visible>
```

## CLI Boundary

If the task asks for command-line operation, switch to the EvoPilot repository docs:

- `docs/cli/AGENTS.md`
- `docs/cli/quickstart.md`
- `docs/cli/commands.md`
- `docs/cli/workflows.md`
- `docs/guides/ai-agent-runbook.md`

Dashboard docs are for browser operation.
