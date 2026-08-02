# EvoPilot Dashboard Docs

Dashboard docs describe browser operations for **Agent Console v2**. The Dashboard is not a full CLI replacement; it is the ordinary-user browser surface for the core project evolution loop.

```text
Project Intake -> Harness Draft -> Owner Review -> Loop Execution -> Release Decision
```

Read these first:

- [User Guide](user-guide.md)
- [End-To-End Scenarios](workflows/end-to-end-scenarios.md)
- [AI Agents](ai-agents/README.md)
- [Dashboard Page Map](ai-agents/dashboard-page-map.md)
- [Expected UI States](ai-agents/expected-ui-states.md)
- [API Usage](reference/api-usage.md)
- [Smoke Test](operations/smoke-test.md)

## Core Principle

The Dashboard is chat-first. Users describe a repository and goal loop target; EvoPilot generates a `ProjectHarnessProfile.yaml` DRAFT; users confirm or request changes; only then can the reviewed profile be activated and used for planning, loop execution, and release decisions.

The **Evidence Drawer** is the agent-readable side channel for `requestId`, digests, policy refs, API action metadata, blockers, `nextAction`, and logs.
