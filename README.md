<div align="center">

# EvoPilot Dashboard

**The self-hosted Agent Console for EvoPilot project evolution loops.**

[![CI](https://github.com/yeliang-wang/evopilot-dashboard/actions/workflows/ci.yml/badge.svg)](https://github.com/yeliang-wang/evopilot-dashboard/actions/workflows/ci.yml)
[![Node.js](https://img.shields.io/badge/Node.js-22%2B-339933)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-61dafb)](https://react.dev/)
[![Release](https://img.shields.io/badge/Release-v1.0.0%20GA-2ea043)](./docs/releases/1.0.0.md)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue)](LICENSE)

Run login-scoped project intake, harness review, loop execution, blocker repair, evidence review, release decisions, and role-based administration from a browser.

[Quickstart](./docs/getting-started.md) | [Self-Hosting](./docs/operations/self-hosting.md) | [Docs](./docs/README.md) | [User Guide](./docs/user-guide.md) | [AI Agents](./docs/ai-agents/README.md) | [Changelog](./CHANGELOG.md) | [Security](./SECURITY.md)

![EvoPilot Dashboard Agent Console](./docs/assets/agent-console.png)

</div>

## What It Is

EvoPilot Dashboard is a chat-first **Agent Console v2** for the ordinary-user core flow:

```text
Project Intake -> Harness Draft -> Owner Review -> Loop Execution -> Release Decision
```

Users describe a repository and goal loop target, review the generated `ProjectHarnessProfile.yaml`, approve the bound phase plan, monitor execution, repair blockers, and inspect release decisions through the **Evidence Drawer**.

EvoPilot API remains the system of record. The Dashboard is a standalone React HTTP client; it does not own project, harness, loop, evidence, audit, or release state.

Login is the first screen. The left navigation follows the fixed product baseline: `# Agent Console`, `Tenants`, `Workspaces`, `Users`, `Harness Templates`, and `Audit`. Project context, sessions, decisions, and evidence stay inside the main console or drawer, not in the sidebar.

## Release Status

EvoPilot Dashboard is **v1.0.0 GA** for the Agent Console baseline: browser project intake, harness draft review, owner approval, loop execution, evidence inspection, blocker repair, release decision review, self-hosting docs, AI Agent docs, and smoke validation are ready for external adoption.

Current phase: **Production Adoption and Public Trust Building**. Public case studies, independent deployments, contributor activity, and ecosystem reputation will grow through real usage and sustained releases.

## Core Capabilities

| Area | What the Dashboard does |
| --- | --- |
| Project intake | Collects repository and goal loop target in a guided conversation. |
| Harness review | Shows `ProjectHarnessProfile.yaml` as a human-readable DRAFT before activation. |
| Loop operation | Starts or advances goal loops only after profile and phase-plan approval gates. |
| Evidence | Exposes request IDs, digests, policy refs, logs, blockers, `nextAction`, and token usage. |
| Auth and scope | Starts at login, locks tenant/workspace/actor from the EvoPilot session, and gates admin pages by role. |
| Administration | Lets platform admins operate tenants, workspaces, users, template evolution, and audit through EvoPilot APIs. |
| AI Agent use | Provides WorkBuddy-readable docs, page maps, expected UI states, and stop rules. |

## Quickstart

Prerequisites: a running EvoPilot API server, a Dashboard user, tenant/workspace context, Node.js 22, and npm.

```bash
git clone git@github.com:yeliang-wang/evopilot-dashboard.git
cd evopilot-dashboard
npm ci
EVOPILOT_API_BASE_URL=http://127.0.0.1:19876 npm run dev -- --port 5174
```

Open `http://127.0.0.1:5174`.

For same-origin production deployments, keep `public/config.js` as:

```js
window.EVOPILOT_DASHBOARD_CONFIG = {
  apiBaseUrl: ""
};
```

Use an absolute `apiBaseUrl` only when CORS is configured on the EvoPilot API server.

## Architecture Boundary

```text
Browser -> Dashboard static assets -> src/api.ts -> EvoPilot API
```

Dashboard must not call the EvoPilot CLI, read EvoPilot local data files, bypass RBAC, skip tenant/workspace scope, activate unreviewed harness profiles, or continue past server blockers, `nextAction`, `NO-GO`, `BLOCKED`, `FAILED`, policy review, credential repair, LLM repair, or human approval.

CLI and Dashboard are two adapters over the same EvoPilot server state.

## Development

```bash
npm run check
npm run smoke:console
```

`npm run check` runs typecheck, production build, and static contract tests. Use mutating smoke only against disposable or explicitly approved test data:

```bash
EVOPILOT_MUTATING_SMOKE=1 npm run smoke:console
```

## More Docs

- [End-to-end scenarios](./docs/workflows/end-to-end-scenarios.md)
- [Example project walkthroughs](./docs/workflows/example-project-walkthroughs.md)
- [AI Agent browser operation guide](./docs/ai-agents/README.md)
- [API usage map](./docs/reference/api-usage.md)
- [Self-hosting](./docs/operations/self-hosting.md)
- [Release management](./docs/operations/release-management.md)
- [Smoke test guide](./docs/operations/smoke-test.md)
- [Troubleshooting](./docs/operations/troubleshooting.md)
- [Open source readiness](./docs/reference/open-source-readiness.md)
- [Open source maturity report](./docs/reference/open-source-maturity-report.md)

## License

Apache-2.0, matching [EvoPilot](https://github.com/yeliang-wang/evopilot).
