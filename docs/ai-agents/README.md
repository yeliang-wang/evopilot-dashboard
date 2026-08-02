# AI Agents

> WorkBuddy and browser-operating agents use EvoPilot Dashboard as a UI adapter over EvoPilot API.

## Agent Console v2

The visible flow is:

```text
Project Intake -> Harness Draft -> Owner Review -> Loop Execution -> Release Decision
```

The Dashboard is chat-first. The agent reads the conversation, stage bar, inline cards, and **Evidence Drawer**. It must not infer server state from color alone.

## Browser End-To-End Loop

1. Open the Dashboard URL.
2. Open the session drawer and log in if required.
3. Confirm tenant, workspace, and actor.
4. Enter repository URL.
5. Enter the user's goal loop target.
6. Click **Start intake**.
7. Wait for the inline `ProjectHarnessProfile.yaml` DRAFT.
8. Stop and show the DRAFT to the user or project owner.
9. If the user requests changes, enter the change request and click **Request changes**.
10. Repeat review until the user confirms.
11. Click **Confirm** to activate only the reviewed profile.
12. Review phase plan binding, fill real `Confirmed By` and `Confirmation`, then approve.
13. Start or advance the loop.
14. Use the **Evidence Drawer** to report request IDs, profile digests, policy refs, blockers, next actions, and release decisions.

## Stop Rules

Stop on:

- missing login or RBAC
- `nextAction`
- blocker
- `NO-GO`
- `BLOCKED`
- `FAILED`
- human approval
- policy review
- credential repair
- LLM repair
- source or DevOps repair
- missing `requestId` for an incident
- missing LLM provider/model/token evidence for LLM-backed terminal claims

Never invent `confirmedBy` or `confirmation`.

## Agent-Safe Smoke

When shell access is available, prefer the JSON smoke report:

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

Report the `evopilot-dashboard-console-smoke/v1` summary, report path, failed checks, request IDs, blockers, and next actions.
