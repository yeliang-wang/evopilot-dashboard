# EvoPilot Dashboard Docs

Dashboard docs describe the browser operation path for EvoPilot **Agent Console v2**. The root README stays short; this directory carries the human, administrator, AI Agent, operator, and maintainer details.

```text
Admin provisions user -> User logs in -> Project intake -> Template auto-match
-> ProjectHarnessProfile.yaml DRAFT -> Owner review -> Loop execution -> Release decision
```

## Start Here

| Reader | Start with |
| --- | --- |
| Project owner or ordinary user | [User Guide](user-guide.md) |
| WorkBuddy or browser AI Agent | [AI Agents](ai-agents/README.md) |
| Platform administrator | [Admin Guide](admin-guide.md) |
| New operator | [Distribution](operations/distribution.md) |
| Self-hosting operator | [Self-Hosting](operations/self-hosting.md) |
| Cloud operator | [Cloud Deployment](deployment/cloud.md) |
| Maintainer | [Test Matrix](operations/test-matrix.md) and [Release Management](operations/release-management.md) |

## Core Principle

The Dashboard is login-first and chat-first. Administrators create users and assign tenant/workspace scope. Users connect GitHub/GitLab projects and describe goal loop targets. EvoPilot automatically matches a `HarnessTemplate`, combines it with project context and the target, and returns a `ProjectHarnessProfile.yaml` DRAFT for review.

Users can request changes or confirm the DRAFT. Only after confirmation can EvoPilot activate the project harness profile, bind a phase plan, run the loop, and produce release evidence.

Ordinary users do not choose public `HarnessTemplate` files manually. Template matching belongs to EvoPilot.

## Operation Guides

- [End-to-end scenarios](workflows/end-to-end-scenarios.md) - WorkBuddy-readable primary flows.
- [Example project walkthroughs](workflows/example-project-walkthroughs.md) - complete sample project runs.
- [Dashboard page map](ai-agents/dashboard-page-map.md) - UI landmarks and expected controls.
- [Expected UI states](ai-agents/expected-ui-states.md) - screenshots/states agents should recognize.
- [API usage map](reference/api-usage.md) - Dashboard action to EvoPilot API mapping.
- [Roles and permissions](reference/roles-and-permissions.md) - page access and scope rules.
- [Smoke test](operations/smoke-test.md) - local, production, and mutating smoke.
- [Distribution](operations/distribution.md) - README CTA entry points for local run, self-hosted stack, and static deployment.
- [Cloud Deployment](deployment/cloud.md) - operator-owned cloud container and static hosting runbook.
- [Test Matrix](operations/test-matrix.md) - browser E2E, visual regression, live E2E, and PR artifacts.
- [Troubleshooting](operations/troubleshooting.md) - request ID and Evidence Drawer diagnosis.

## Release And Trust

- [Distribution](operations/distribution.md) explains the supported public entry points.
- [Cloud Deployment](deployment/cloud.md) explains operator-owned cloud deployment paths.
- [Self-Hosting](operations/self-hosting.md) explains how to run Dashboard next to EvoPilot API.
- [Release Management](operations/release-management.md) defines versioning, tag, compatibility, and smoke rules.
- [EvoPilot Dashboard v2.0.0 Release Notes](releases/2.0.0.md) is the EvoPilot v2 domain HarnessTemplate compatibility body for the current public production baseline.
- [EvoPilot Dashboard v1.0.13 Release Notes](releases/1.0.13.md) is the initial LLM Profiles and Agent Console project-binding body superseded by later Dashboard releases.
- [EvoPilot Dashboard v1.0.10 Release Notes](releases/1.0.10.md) is the Workspaces usage rendering resilience body for the previous public production baseline.
- [EvoPilot Dashboard v1.0.9 Release Notes](releases/1.0.9.md) is the project LLM usage visibility body for the previous public production baseline.
- [EvoPilot Dashboard v1.0.7 Release Notes](releases/1.0.7.md) is the cloud deployment entrypoint body for the previous public production baseline.
- [EvoPilot Dashboard v1.0.6 Release Notes](releases/1.0.6.md) is the distribution-expansion body for the previous public production baseline.
- [EvoPilot Dashboard v1.0.4 Release Notes](releases/1.0.4.md) was superseded after Visual Regression CI exposed cross-platform mobile screenshot height variance.
- [EvoPilot Dashboard v1.0.3 Release Notes](releases/1.0.3.md) is the immutable ECS deployment body for the previous public production baseline.
- [EvoPilot Dashboard v1.0.2 Release Notes](releases/1.0.2.md) is the immutable release artifact body for the previous public production baseline.
- [EvoPilot Dashboard v1.0.1 Release Notes](releases/1.0.1.md) is the publication-hardening release body for the previous public production baseline.
- [Open Source Readiness](reference/open-source-readiness.md) tracks repository trust assets.
- [Open Source Maturity Report](reference/open-source-maturity-report.md) states the current product maturity boundary.
- [GitHub Metadata](reference/github-metadata.md) keeps About, topics, and social preview aligned with the README.
