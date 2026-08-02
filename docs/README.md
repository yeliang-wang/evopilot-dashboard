# EvoPilot Dashboard Docs

Dashboard docs describe UI operations for **Agent Console v2**. The Dashboard is not a full CLI replacement; it is the ordinary-user browser surface for the core project evolution loop.

```text
Project Intake -> Harness Draft -> Owner Review -> Loop Execution -> Release Decision
```

Read these first:

- [User Guide](user-guide.md)
- [End-To-End Scenarios](workflows/end-to-end-scenarios.md)
- [Example Project Walkthroughs](workflows/example-project-walkthroughs.md)
- [AI Agents](ai-agents/README.md)
- [Dashboard Page Map](ai-agents/dashboard-page-map.md)
- [Expected UI States](ai-agents/expected-ui-states.md)
- [API Usage](reference/api-usage.md)
- [Self-Hosting](operations/self-hosting.md)
- [Release Management](operations/release-management.md)
- [Smoke Test](operations/smoke-test.md)
- [Open Source Readiness](reference/open-source-readiness.md)
- [Open Source Maturity Report](reference/open-source-maturity-report.md)
- [GitHub Metadata](reference/github-metadata.md)

## Core Principle

The Dashboard is chat-first. Users describe a repository and goal loop target; EvoPilot generates a `ProjectHarnessProfile.yaml` DRAFT; users confirm or request changes; only then can the reviewed profile be activated and used for planning, loop execution, and release decisions.

The **Evidence Drawer** is the agent-readable side channel for `requestId`, digests, policy refs, API action metadata, blockers, `nextAction`, and logs.

## Release And Self-Hosting

- [Self-Hosting](operations/self-hosting.md) explains how to run Dashboard next to EvoPilot API.
- [Release Management](operations/release-management.md) defines versioning, tag, compatibility, and smoke rules.
- [EvoPilot Dashboard v1.0.0 Release Notes](releases/1.0.0.md) is the GitHub Release body for the public production baseline.
