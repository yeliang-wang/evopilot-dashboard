# EvoPilot Dashboard Documentation

> User-facing and AI-agent-facing operating docs for the standalone EvoPilot Dashboard.

EvoPilot Dashboard is the browser UI for EvoPilot. It reads and writes through the EvoPilot HTTP API. It does not own domain state, does not call the EvoPilot CLI, and does not infer release verdicts outside server responses.

## Fast Path

1. Read [Getting Started](getting-started.md) to connect the UI to an EvoPilot API server.
2. Read [User Guide](user-guide.md) for the normal project, Loop, approval, and release flow.
3. Read [AI Agents](ai-agents/README.md) when WorkBuddy or a digital human must operate the UI.
4. Read [Troubleshooting](operations/troubleshooting.md) when login, API data, workflow state, or release evidence does not match expectations.

## Documentation Map

| Need | Document |
|---|---|
| Install, run, connect, and smoke the Dashboard | [Getting Started](getting-started.md) |
| Operate the Dashboard as a product user | [User Guide](user-guide.md) |
| Manage tenants, workspaces, users, and credentials | [Admin Guide](admin-guide.md) |
| Drive the UI with WorkBuddy or a digital human | [AI Agents](ai-agents/README.md) |
| Deploy Dashboard as a standalone service | [Deployment](operations/deployment.md) |
| Diagnose UI/API/auth/proxy failures | [Troubleshooting](operations/troubleshooting.md) |
| Verify production compatibility | [Smoke Test](operations/smoke-test.md) |
| Understand API usage without duplicating OpenAPI | [API Usage](reference/api-usage.md) |
| Understand user roles and allowed actions | [Roles And Permissions](reference/roles-and-permissions.md) |

## Workflow Docs

| Workflow | Document |
|---|---|
| First login and password change | [First Login](workflows/first-login.md) |
| Tenant, workspace, and user administration | [Tenant Workspace User Admin](workflows/tenant-workspace-user-admin.md) |
| Project onboarding | [Project Onboarding](workflows/project-onboarding.md) |
| Credential and DevOps execution boundary | [Credential And DevOps Boundary](workflows/credential-and-devops-boundary.md) |
| Source-to-GA Loop | [Source To GA Loop](workflows/source-to-ga-loop.md) |
| GlobalGoal and Loop workflow visibility | [Global Goal Loop Workflow](workflows/global-goal-loop-workflow.md) |
| Release decision review | [Release Decision Review](workflows/release-decision-review.md) |
| Audit and history review | [Audit And History](workflows/audit-and-history.md) |

## Source Of Truth

Dashboard docs describe UI operations. The EvoPilot repository remains authoritative for:

- API behavior: `docs/api/README.md`
- OpenAPI schema: `docs/api/openapi.json`
- CLI commands and one-command workflows: `docs/cli/*`
- AI Agent CLI/API runbook: `docs/guides/ai-agent-runbook.md`
- Backend deployment and runtime operations: `docs/operations/*`

## Agent Reading Rule

An AI Agent should treat these docs as a UI playbook. For command-line execution, read EvoPilot CLI docs instead. For API schema generation, read EvoPilot OpenAPI instead. For Dashboard operation, follow the page names, input fields, expected states, blockers, and next actions in this repository.
