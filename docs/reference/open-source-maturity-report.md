# Open Source Maturity Report

> Current public maturity assessment for EvoPilot Dashboard as the browser Agent Console for EvoPilot.

## Conclusion

EvoPilot Dashboard has reached an enterprise open-source productization baseline for a standalone Agent Console. It has a focused browser product shape for administrator-provisioned users, screenshot-backed README, deployment docs, smoke validation, AI Agent operation docs, release process, security and contribution docs, and API compatibility boundaries.

It should not claim community parity with the most established public AI-agent consoles until it has external users, issue activity, releases, independent deployments, and public case studies.

## Capability Coverage

| Area | Current State | Evidence |
| --- | --- | --- |
| Browser product | Chat-first Agent Console v2 for users to connect GitHub/GitLab projects, submit goal loop targets, review generated harness DRAFTs, and run the core project evolution loop. | `src/App.tsx`, `src/dashboard/hooks/useAgentConsoleController.ts`, `src/dashboard/model.ts`, `src/dashboard/components/`, `docs/assets/agent-console.png` |
| API boundary | Standalone HTTP client over EvoPilot API. | `src/api.ts`, `docs/reference/api-usage.md` |
| Documentation shape | Concise product README plus role-based docs index, workflow guides, and AI Agent operation docs. | `README.md`, `docs/README.md`, `docs/ai-agents/README.md` |
| User flows | Project intake, EvoPilot template auto-match, `ProjectHarnessProfile.yaml` DRAFT review, loop execution, evidence, release decisions. | `docs/workflows/`, `docs/user-guide.md` |
| AI Agent readiness | WorkBuddy-readable page map, expected UI states, stop rules, AGENTS entrypoint. | `AGENTS.md`, `docs/ai-agents/` |
| Distribution | README CTA entries, local browser run, standalone container runner, tagged installer, self-hosted full-stack installer path, static deployment config, Dockerfile, production compose, Nginx template, immutable release archive, SBOM, provenance, checksum, and image digest metadata. | `README.md`, `install.sh`, `scripts/run-dashboard-container.mjs`, `docs/operations/distribution.md`, `Dockerfile`, `compose.production.yaml`, `deploy/`, `.github/workflows/release-artifacts.yml` |
| Release readiness | Versioned release notes, changelog, release checklist, smoke validation, browser test matrix, visual regression, PR artifacts, cloud runbook artifact, and immutable artifact workflow. | `CHANGELOG.md`, `docs/releases/2.4.0.md`, `docs/operations/release-management.md`, `docs/operations/test-matrix.md` |
| Code structure | Thin app shell, controller hook, shared model, focused component modules, and static boundary tests. | `src/App.tsx`, `src/dashboard/hooks/useAgentConsoleController.ts`, `src/dashboard/model.ts`, `src/dashboard/components/`, `tests/static-contract.test.mjs` |
| Community shell | License, notice, contribution guide, security policy, code of conduct, issue forms, PR template. | Root governance files and `.github/` |

## Top-Tier Gap Assessment

| Dimension | Status | Remaining Work |
| --- | --- | --- |
| Product shape | Strong baseline | Continue UI hardening from real operators. |
| API compatibility | Enforced by static and smoke checks | Keep pace with EvoPilot OpenAPI changes. |
| Code structure | App shell is bounded and feature modules are split | Continue extracting controller sub-hooks if real workflow growth pushes `useAgentConsoleController.ts` beyond its line budget. |
| Self-hosting | Documented, containerized, standalone-runner backed, and linked to the full-stack installer path | Add published deployment examples as users adopt it. |
| Community | Governance shell present | Build issue triage, contributor activity, and public demos. |
| Trust evidence | Local and production smoke paths plus immutable release artifact evidence present | Add public case studies and release screenshots over time. |

## Maturity Target

The next maturity objective is external adoption evidence:

```text
Make the Dashboard understandable, deployable, operable, and testable by external users and AI Agents without private EvoPilot context.
```

Acceptance signals:

- A new operator can choose a README CTA and deploy Dashboard next to EvoPilot API from docs or tagged `install.sh`.
- A browser-operating AI Agent can follow `AGENTS.md` and `docs/ai-agents/README.md`.
- A maintainer can tag and publish a Dashboard release from `docs/operations/release-management.md`.
- Dashboard and CLI lead to the same EvoPilot server state for core workflows.
