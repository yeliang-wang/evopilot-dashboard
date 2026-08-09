# Open Source Readiness

This checklist defines EvoPilot Dashboard's public-product readiness baseline. It is about trust, distribution, and external operability, not adding new features.

## Positioning

EvoPilot Dashboard is a chat-first Agent Console for administrator-provisioned users to connect GitHub/GitLab projects, submit goal loop targets, review EvoPilot-generated `selectedHarness.yaml` plan bindings, and run governed project evolution loops. It is an HTTP API adapter over EvoPilot and must not become a separate system of record.

## Public Trust Assets

| Asset | Status | Evidence |
| --- | --- | --- |
| README first screen | Present | `README.md` |
| Product screenshot | Present | `docs/assets/agent-console.png` |
| License | Present | `LICENSE`, Apache-2.0 |
| Notice | Present | `NOTICE` |
| Changelog | Present | `CHANGELOG.md` |
| Contribution guide | Present | `CONTRIBUTING.md` |
| Security policy | Present | `SECURITY.md` |
| Code of conduct | Present | `CODE_OF_CONDUCT.md` |
| CI workflow | Present | `.github/workflows/ci.yml` |
| Release artifact workflow | Present | `.github/workflows/release-artifacts.yml` |
| Issue forms | Present | `.github/ISSUE_TEMPLATE/` |
| Pull request template | Present | `.github/pull_request_template.md` |
| AI Agent entrypoint | Present | `docs/ai-agents/README.md` |
| API compatibility docs | Present | `docs/reference/api-usage.md` |
| Root agent instructions | Present | `AGENTS.md`, `llms.txt` |
| Distribution guide | Present | `docs/operations/distribution.md` |
| Installable Dashboard runner | Present | `install.sh`, `scripts/run-dashboard-container.mjs`, `npm run verify:distribution` |
| Self-hosting guide | Present | `docs/operations/self-hosting.md` |
| Release playbook | Present | `docs/operations/release-management.md` |
| Release notes | Present | `docs/releases/3.1.1.md` |
| Immutable release artifacts | Present | `scripts/build-release-artifacts.mjs`, `scripts/verify-release-artifacts.mjs`, `deploy/ecs/compose.immutable.yaml` |
| Open-source maturity report | Present | `docs/reference/open-source-maturity-report.md` |

## Documentation Shape

The public documentation model is:

- root `README.md` as the concise product entry with badges, screenshot, quickstart, architecture boundary, and selected docs links
- `docs/README.md` as the role-based index for users, administrators, AI Agents, operators, and maintainers
- workflow and AI Agent docs as the detailed operating source for browser automation and end-to-end scenarios

## Product Evidence Assets

| Capability | Evidence |
| --- | --- |
| Agent Console v3 | `src/App.tsx`, `src/dashboard/hooks/useAgentConsoleController.ts`, `src/dashboard/model.ts`, `src/dashboard/components/`, `src/styles.css` |
| Code structure boundaries | `src/App.tsx`, `src/dashboard/hooks/useAgentConsoleController.ts`, `src/dashboard/model.ts`, `src/dashboard/components/`, `tests/static-contract.test.mjs` |
| selectedHarness review | `docs/user-guide.md`, `docs/ai-agents/expected-ui-states.md` |
| Evidence Drawer | `docs/reference/api-usage.md`, `docs/operations/troubleshooting.md` |
| WorkBuddy operation | `docs/ai-agents/README.md`, `docs/workflows/end-to-end-scenarios.md` |
| Smoke validation | `scripts/dashboard-console-smoke.mjs`, `scripts/production-compat-smoke.mjs` |
| Example walkthroughs | `docs/workflows/example-project-walkthroughs.md` |
| Distribution, self-hosting, cloud, and upgrade | `docs/operations/distribution.md`, `docs/deployment/cloud.md`, `install.sh`, `scripts/run-dashboard-container.mjs`, `docs/operations/self-hosting.md`, `docs/operations/release-management.md` |
| Immutable deployment evidence | `docs/operations/release-management.md`, `deploy/ecs/compose.immutable.yaml`, `npm run release:artifact` |

## Validation Commands

```bash
npm run check
npm run verify:distribution
npm run release:artifact
npm run verify:release-artifact
npm run smoke:console
git diff --check
```

## Top-Tier Open Source Boundary

The repository now provides the assets needed for external users and AI Agents to understand, deploy, operate, validate, and contribute to the Dashboard. This is the open-source productization baseline. Public community maturity still depends on sustained releases, external deployments, issue traffic, contributor activity, and real user case studies. Track the current assessment in [Open Source Maturity Report](open-source-maturity-report.md).

## What This Does Not Prove

This checklist does not prove community adoption, external user satisfaction, public demo uptime, release cadence, or ecosystem maturity. Those require public releases, users, and sustained maintenance.
