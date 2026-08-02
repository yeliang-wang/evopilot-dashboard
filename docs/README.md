# EvoPilot Dashboard Documentation

> Browser-operation and AI-agent-operation docs for the standalone EvoPilot Dashboard.

EvoPilot Dashboard is the browser UI for EvoPilot. It reads and writes through the EvoPilot HTTP API. It does not own domain state, does not call the EvoPilot CLI, and does not infer release verdicts outside server responses.

## Current Console Model

The Dashboard uses three top-level pages:

```text
Projects / Runs / Ops
```

Daily users start in **Projects**. They enter a repository and a business goal loop target, then generate a **Review Pack**. The Review Pack wraps the same server-governed operations that CLI agents run step by step:

```text
Repository + Goal Loop Target
  -> Project onboarding checklist
  -> ProjectHarnessProfile DRAFT
  -> GlobalGoal + Alpha/Beta/RC/GA phase plan
  -> owner review
  -> activation / approval
  -> loop advance
  -> evidence and release decision
```

Advanced IDs and low-level fields stay under **Advanced Control Details** or **Ops** so WorkBuddy and administrators can inspect them without forcing daily users to operate raw control-plane objects.

The Dashboard is not a full CLI replacement. It is the ordinary-user browser surface for the core end-to-end path: project onboarding, Review Pack review, owner confirmation, loop advance, evidence, and release-decision review. CLI-only administrator, worker, replay, file import/export, template pack publishing, and release-run repair operations stay in EvoPilot CLI/API documentation.

## Page Map

| Page | Primary Job | Server Source |
|---|---|---|
| Projects | Start or continue a project loop, generate the Review Pack, and confirm owner gates. | onboarding checklist, ProjectHarnessProfile generation/activation, GlobalGoal creation, phase-plan generation/approval |
| Runs | Inspect Alpha/Beta/RC/GA execution, evidence packages, blockers, and release decisions. | run-status, phase-plan, evidence matrix, final report, release decisions |
| Ops | Troubleshoot by requestId, nextAction, policy, credential, LLM, source closure, audit, and projections. | summary, projects, templates, policies, maturity standards, goals, audit, LLM profiles |

## Fast Path

1. Read [Getting Started](getting-started.md) to connect the UI to an EvoPilot API server.
2. Read [User Guide](user-guide.md) for normal project and Review Pack operation.
3. Read [End-To-End Scenarios](workflows/end-to-end-scenarios.md) before letting WorkBuddy operate real browser flows.
4. Read [AI Agents](ai-agents/README.md) when a browser-operating agent must learn the UI.
5. Read [Troubleshooting](operations/troubleshooting.md) when login, API data, workflow state, or release evidence does not match expectations.

## Documentation Map

| Need | Document |
|---|---|
| Install, run, connect, and smoke the Dashboard | [Getting Started](getting-started.md) |
| Operate the Dashboard as a product user | [User Guide](user-guide.md) |
| Run all core browser end-to-end scenarios | [End-To-End Scenarios](workflows/end-to-end-scenarios.md) |
| Manage users, credentials, and governance boundaries | [Admin Guide](admin-guide.md) |
| Drive the UI with WorkBuddy or a digital human | [AI Agents](ai-agents/README.md) |
| Deploy Dashboard as a standalone service | [Deployment](operations/deployment.md) |
| Diagnose UI/API/auth/proxy failures | [Troubleshooting](operations/troubleshooting.md) |
| Verify production compatibility | [Smoke Test](operations/smoke-test.md) |
| Understand API usage without duplicating OpenAPI | [API Usage](reference/api-usage.md) |
| Understand user roles and allowed actions | [Roles And Permissions](reference/roles-and-permissions.md) |

## Source Of Truth

Dashboard docs describe browser operations. The EvoPilot repository remains authoritative for:

- API behavior: `docs/api/README.md`
- OpenAPI schema: `docs/api/openapi.json`
- CLI commands and one-command workflows: `docs/cli/*`
- AI Agent CLI/API runbook: `docs/guides/ai-agent-runbook.md`
- Backend deployment and runtime operations: `docs/operations/*`

## Verification Rule

For dashboard code changes, run `npm run check`. For local API compatibility, run `npm run smoke:console`. For a disposable end-to-end mutation against a test EvoPilot server, run:

```bash
EVOPILOT_MUTATING_SMOKE=1 \
EVOPILOT_MUTATING_SMOKE_TIMEOUT_MS=180000 \
npm run smoke:console
```

Treat the generated JSON report as the agent-readable evidence. Screenshots are supporting evidence only.

## Agent Reading Rule

An AI Agent should treat these docs as a UI playbook. For command-line execution, read EvoPilot CLI docs instead. For API schema generation, read EvoPilot OpenAPI instead. For Dashboard operation, follow the page names, input fields, expected states, blockers, requestId values, and next actions in this repository.
