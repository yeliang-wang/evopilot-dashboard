# Open Source Readiness

This checklist defines EvoPilot Dashboard's public-product readiness baseline. It is about trust, distribution, and external operability, not adding new features.

## Positioning

EvoPilot Dashboard is a chat-first Agent Console for EvoPilot project evolution loops. It is an HTTP API adapter over EvoPilot and must not become a separate system of record.

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
| Issue forms | Present | `.github/ISSUE_TEMPLATE/` |
| Pull request template | Present | `.github/pull_request_template.md` |
| AI Agent entrypoint | Present | `docs/ai-agents/README.md` |
| API compatibility docs | Present | `docs/reference/api-usage.md` |

## Product Evidence Assets

| Capability | Evidence |
| --- | --- |
| Agent Console v2 | `src/App.tsx`, `src/styles.css` |
| ProjectHarnessProfile review | `docs/user-guide.md`, `docs/ai-agents/expected-ui-states.md` |
| Evidence Drawer | `docs/reference/api-usage.md`, `docs/operations/troubleshooting.md` |
| WorkBuddy operation | `docs/ai-agents/README.md`, `docs/workflows/end-to-end-scenarios.md` |
| Smoke validation | `scripts/dashboard-console-smoke.mjs`, `scripts/production-compat-smoke.mjs` |

## Validation Commands

```bash
npm run check
npm run smoke:console
git diff --check
```

## What This Does Not Prove

This checklist does not prove community adoption, external user satisfaction, public demo uptime, release cadence, or ecosystem maturity. Those require public releases, users, and sustained maintenance.
