# EvoPilot Dashboard Agent Instructions

This file is for AI coding agents and browser-operating agents that read this repository.

## Product Boundary

EvoPilot Dashboard is a standalone React HTTP client for EvoPilot. It is not the system of record. EvoPilot API owns tenants, workspaces, projects, harness profiles, goals, loops, evidence, audit, release decisions, users, and credentials.

## Operating Rules

- Start with [docs/ai-agents/README.md](docs/ai-agents/README.md) for WorkBuddy and browser automation.
- Use [docs/workflows/end-to-end-scenarios.md](docs/workflows/end-to-end-scenarios.md) to understand real user flows.
- Use [docs/reference/api-usage.md](docs/reference/api-usage.md) to map UI operations to EvoPilot API calls.
- Do not paste GitHub, GitLab, LLM, deploy, or password secrets into screenshots, public config, issue reports, or docs.
- Do not bypass EvoPilot RBAC, tenant/workspace scope, human approval, profile review, source closure, release policy, or audit.
- Stop on EvoPilot `nextAction`, blockers, `NO-GO`, `BLOCKED`, `FAILED`, policy review, credential repair, LLM repair, deploy repair, or human approval.
- Treat the Evidence Drawer as the primary operator-readable side channel for request IDs, digests, policy refs, token usage, blockers, and logs.
- When claiming CLI and Dashboard parity, verify both the Dashboard static contract and EvoPilot OpenAPI or smoke evidence.

## Coding Rules

- Keep Dashboard as a browser client over EvoPilot HTTP APIs.
- Do not import or execute the EvoPilot CLI from the browser app.
- Do not read EvoPilot local files, Postgres, Docker state, or host secrets from Dashboard code.
- Keep page text and docs aligned with EvoPilot CLI semantics for project onboarding, `ProjectHarnessProfile` review, phase plan approval, loop execution, evidence review, and release decisions.
- Run validation after edits:

```bash
npm run check
```

For API compatibility work, also run:

```bash
npm run smoke:console
```

Use mutating smoke only against approved disposable data.

## Documentation Map

- [docs/README.md](docs/README.md) - documentation index.
- [docs/getting-started.md](docs/getting-started.md) - local setup and first checks.
- [docs/ai-agents/README.md](docs/ai-agents/README.md) - AI Agent browser operation guide.
- [docs/workflows/example-project-walkthroughs.md](docs/workflows/example-project-walkthroughs.md) - two end-to-end example flows.
- [docs/operations/self-hosting.md](docs/operations/self-hosting.md) - complete self-hosted deployment with EvoPilot API.
- [docs/operations/release-management.md](docs/operations/release-management.md) - Dashboard release checklist and tag rules.
- [docs/reference/open-source-maturity-report.md](docs/reference/open-source-maturity-report.md) - public maturity assessment.
