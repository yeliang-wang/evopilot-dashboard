# Changelog

All notable changes to EvoPilot Dashboard are documented here.

Dashboard releases should focus on browser-operable EvoPilot workflows, API compatibility, AI Agent usability, and visible product evidence. Do not accept screenshot-only validation without API compatibility evidence.

## Unreleased

No unreleased changes yet.

## 3.1.1 - 2026-08-09

### Fixed

- Passed `EVOPILOT_HARNESS_HUB_URL` through the local and production Compose files so ECS/self-hosted Dashboard containers expose a browser-reachable external `evopilot-harness` Hub URL in `/config.js`.

## 3.1.0 - 2026-08-09

### Added

- Added `harnessHubUrl` runtime configuration and `EVOPILOT_HARNESS_HUB_URL` container configuration for the independent evopilot-harness Hub iframe.
- Added release notes for the Dashboard 3.1.0 embedded Hub boundary.

### Changed

- Replaced the Dashboard-owned Harness Hub Catalog projection page with an iframe host for the independently running `evopilot-harness` Hub.
- Removed Dashboard smoke/static contract expectations that Harness Hub reads EvoPilot Harness Catalog list/inspect APIs.
- Kept `selectedHarness.yaml` review in Agent Console as an EvoPilot goal-plan approval step.

### Validation

- Full release validation is required before publication: `npm run check`, `npm run test:browser`, `npm run release:artifact`, `npm run verify:release-artifact`, and `git diff --check`.

## 3.0.0 - 2026-08-09

### Added

- Added the v3 Harness Hub / 专家市场 read-only view for EvoPilot published Harness Catalogs, domain Harness experts, source types, available Harness entries, compatibility, entry paths, and digests.
- Added Dashboard flow support for EvoPilot `goal plan` responses that carry `plan.selectedHarness` as the owner-review artifact before phase-plan approval.
- Added mock API, browser E2E, visual, smoke, and static contract coverage for selectedHarness planning and read-only Catalog APIs.

### Changed

- Removed Dashboard calls to EvoPilot-owned Harness lifecycle and evolution endpoints. Dashboard no longer mounts, scans, imports, generates, activates, evolves, approves, or publishes Harness definitions.
- Reframed `selectedHarness.yaml` as a goal-plan binding, not a mutable Dashboard-managed project harness profile.
- Updated user, admin, AI Agent, operation, API, release, and governance docs for the EvoPilot v3 / `evopilot-harness` boundary.
- Updated package version, installer default image tag, release notes, and governance checks to `3.0.0`.

### Validation

- Full release validation is required before publication: `npm run check`, `npm run test:browser`, `npm run release:artifact`, `npm run verify:release-artifact`, and `git diff --check`.

## 2.5.0 - 2026-08-09

### Added

- Added Harness Hub / 专家市场 as the administrator surface for external Published Harness Catalog mounts, domain Harness experts, connector source types, available Harness rows, and Harness Knowledge Factory runs.
- Added Dashboard API wiring for EvoPilot `GET/POST /api/v1/harness/catalogs` and `POST /api/v1/harness/catalogs/{catalogId}/scan`.
- Added mock API and static contract coverage for external Catalog listing and scan actions while keeping file reading inside EvoPilot API.

### Changed

- Renamed the visible sidebar and docs from Harness Templates to Harness Hub while preserving the internal `TemplatesPage` component boundary.
- Kept Dashboard as an EvoPilot HTTP client: Catalog source scanning, file reads, template matching, project profile generation, approval, publish, and impact remain server responsibilities.
- Updated package version, installer default image tag, Cloud/Distribution docs, release notes, and governance checks to `2.5.0`.

### Validation

- Full release validation is required before publication: `npm run check`, `npm run test:browser`, `npm run release:artifact`, `npm run verify:release-artifact`, and `git diff --check`.

## 2.4.0 - 2026-08-08

### Added

- Added Dashboard API wiring for EvoPilot `POST /api/v1/harness/template-evolutions/evolve`.
- Added the one-command Harness evolution action on the Harness Templates page so administrators can submit a source project and goal to EvoPilot's server-governed evolve workflow.
- Added mock API and static contract coverage for `evopilot-harness-evolve-result/v1` review draft results.

### Changed

- Kept Dashboard as an EvoPilot HTTP client: source scanning, auto-match, draft generation, validation, approval, publish, and impact remain server responsibilities.
- Updated package version, Cloud/Distribution docs, release notes, and governance checks to `2.4.0`.

### Validation

- Full release validation is required before publication: `npm run check`, `npm run test:browser`, `npm run release:artifact`, `npm run verify:release-artifact`, and `git diff --check`.

## 2.3.0 - 2026-08-07

### Added

- Added HarnessTemplate match preview on the Harness Templates page through EvoPilot `POST /api/v1/harness/template-matches`.
- Added Dashboard action coverage for creating `HarnessTemplateEvolution` runs with `autoMatch: true`.
- Added mock API and static contract coverage for distributed-cache auto-match reports returned by EvoPilot.

### Changed

- Kept Dashboard as an EvoPilot HTTP client: template match decisions, candidate scoring, source digests, and next actions remain server-derived.
- Updated package version, installer defaults, Cloud/Distribution docs, release notes, and governance checks to `2.3.0`.
- Removed the default evolution target version from the dialog so EvoPilot's auto-match result can select either an existing template upgrade or a new domain target version.

### Validation

- Full release validation is required before publication: `npm run check`, `npm run test:browser`, `npm run release:artifact`, `npm run verify:release-artifact`, and `git diff --check`.

## 2.2.0 - 2026-08-07

### Added

- Added Harness Knowledge Factory projection on the Harness Templates page, including source types, domain signals, gap classifications, status, and target version.
- Added a template evolution creation dialog that can submit historical projects, project corpora, production logs, EvoPilot history, attachments, repositories, existing templates, runtime evidence, and administrator notes to EvoPilot.
- Added browser/API documentation for the Knowledge Factory admin flow and stop/report fields.

### Changed

- Kept Dashboard as an EvoPilot HTTP client: extraction, redaction, snapshots, approval, publish, and impact remain server responsibilities.
- Updated demo fixtures, static contracts, package version, installer defaults, Cloud/Distribution docs, release notes, and governance checks to `2.2.0`.

### Validation

- `npm run check`
- Full release validation is required before publication: `npm run test:browser`, `npm run release:artifact`, `npm run verify:release-artifact`, and `git diff --check`.

## 2.1.0 - 2026-08-07

### Added

- Added Agent Console display for EvoPilot v2.1 domain Harness execution fields: required actions, evidence adapters, release blockers, repository probe status, and missing module boundaries.
- Updated demo mode and mocked browser API fixtures to use `database-product-harness@2.1.0` with structured `domainHarnessRequiredActions`, `evidenceAdapters`, `domainHarnessReleaseBlockers`, and `repoProbe` data.
- Added static contract coverage for the v2.1 domain execution fields.

### Changed

- Updated package version, installer default image tag, Cloud/Distribution docs, release notes, and open-source governance pointers to `2.1.0`.
- Kept Dashboard as an EvoPilot HTTP client; domain Harness matching and release-blocking evidence remain server-derived.

### Validation

- `npm run check`
- `npm run smoke:console`
- `npm run test:visual`
- `npm run release:artifact`
- `npm run verify:release-artifact`
- `git diff --check`

## 2.0.0 - 2026-08-07

### Added

- Added Agent Console display for EvoPilot v2 domain HarnessTemplate metadata: harness layer, domain, compatibility profiles, architecture profiles, runtime profiles, and reference boundary.
- Updated demo and browser test fixtures to use `database-product-harness@2.0.0` with structured `ProjectHarnessProfile` source content.
- Added static contract coverage for v2 domain Harness fields and Dashboard rendering.

### Changed

- Updated package version, installer default image tag, Cloud/Distribution docs, release notes, and open-source governance pointers to `2.0.0`.
- Kept Dashboard as an EvoPilot HTTP client; template matching still comes from EvoPilot API evidence, not local browser logic.

### Validation

- `npm run check`
- `npm run smoke:console`
- `npm run test:visual`
- `npm run release:artifact`
- `npm run verify:release-artifact`
- `git diff --check`

## 1.0.14 - 2026-08-06

### Fixed

- Updated the mobile Agent Console blocker visual baseline after the `LLM Profiles` navigation item became part of the production UI.

### Validation

- `npm run check`
- `npm run smoke:console`
- `npm run test:visual`
- `npm run release:artifact`
- `npm run verify:release-artifact`
- `git diff --check`

## 1.0.13 - 2026-08-06

### Added

- Added an `LLM Profiles` left-navigation page with Workspace, Project, and My Profiles tabs.
- Added a compact profile registration modal for profile name, scope, provider preset, model, secret ref, and optional custom base URL.
- Added selected-profile preflight from the LLM Profiles page so operators can test the profile registered in EvoPilot.
- Added Agent Console project LLM binding controls for workspace defaults and user-owned per-run overrides.
- Added Dashboard API calls for `GET /api/v1/llm-profiles`, `POST /api/v1/llm-profiles`, profile preflight, project LLM binding, and project LLM preflight.

### Changed

- Kept Dashboard as a browser HTTP client and rendered EvoPilot's LLM profile, provider/model, request ID, and token projections instead of calculating usage locally.
- Updated AI-agent, user-guide, workflow, troubleshooting, and static contract documentation for the project default plus user override model.

### Validation

- `npm run check`
- Chrome desktop screenshots for LLM Profiles registration and Agent Console LLM binding
- `git diff --check`

## 1.0.12 - 2026-08-06

### Added

- Added Agent Console delivery chain selection for GitHub source + GitHub Actions, GitLab source + GitLab CI, and GitHub source + GitLab CI Bridge.
- Added bridge intake fields for GitLab base URL, GitLab CI project, GitLab ref, source tokenRef, DevOps tokenRef, required stage, and required job.
- Added Evidence Drawer rows for project, source system, CI/Loop executor, workflow repository, and LLM profile so AI agents can report the actual connected-project boundary.
- Added static contract coverage for the bridge payload fields that Dashboard sends to EvoPilot onboarding.

### Changed

- Kept Dashboard as a browser HTTP client and mapped the new UI controls to EvoPilot's server-governed onboarding checklist instead of calculating readiness locally.
- Split the Composer into its own component module to preserve Agent Console file-size boundaries after adding the new intake controls.

### Validation

- `npm run check`

## 1.0.11 - 2026-08-06

### Changed

- Converted Tenants, Workspaces, Users, and Harness Templates management forms from persistent right-side panels into scoped modal dialogs opened from page and row actions.
- Converted Audit evidence review into a row/detail modal that shows selected audit event fields plus last action evidence.
- Kept the left sidebar and Agent Console flow unchanged while giving management pages full-width list/projection surfaces.
- Aligned Tenants management copy and submit body with the real EvoPilot tenant upsert API, leaving workspace and user setup to their own pages.

### Validation

- `npm run check`
- `npm run test:e2e:mock`
- `npm run typecheck`
- Chrome local screenshots for Tenants, Workspaces, Users, Harness Templates, Audit, and mobile Workspaces

## 1.0.10 - 2026-08-05

### Fixed

- Fixed production Workspaces usage rendering so slow non-critical projections such as audit do not block already-returned workspace token usage data.
- Added per-request Dashboard API timeouts with a longer window for usage projections.
- Updated the Workspaces usage table layout for real production project and loop identifiers, keeping the first five token rows readable while retaining workspace totals.

### Validation

- `npm run check`
- `npm run typecheck`
- `npm run build`
- `node tests/static-contract.test.mjs`
- `git diff --check`
- Chrome local verification against production EvoPilot API

## 1.0.9 - 2026-08-05

### Added

- Added a Workspaces-page `接入项目 LLM 用量追踪` panel backed by EvoPilot workspace usage projections.
- Added workspace metric cards for total tokens, connected projects with LLM usage, LLM provider/model/profile combinations, and top token project.
- Added a project/LLM table that shows project id/name, actual provider/model/profile, calls, input/output/total tokens, workspace share, latest loop token total, latest loop id/status, and request id.

### Changed

- Extended the Dashboard API adapter to call `GET /api/v1/workspaces/{workspaceId}/usage` and `GET /api/v1/projects/{projectId}/usage`.
- Updated static contracts and AI-agent docs so Dashboard treats EvoPilot as the system of record for token totals and does not calculate project usage locally.

### Validation

- `npm run typecheck`
- `npm run build`
- `node tests/static-contract.test.mjs`
- `npm run check`
- `npm run test:browser`
- `npm run release:artifact`
- `npm run verify:release-artifact`
- `git diff --check`

## 1.0.8 - 2026-08-04

### Changed

- Split the Dashboard shell from the Agent Console controller, domain model, and component modules.
- Reduced `src/App.tsx` to a thin render shell while keeping login, scoped operation, project intake, harness review, evidence drawer, blocker, and release flows intact.
- Added static contract checks for Dashboard module boundaries and line budgets.

### Documented

- Updated open-source readiness and maturity evidence to reference `src/dashboard/` modules instead of treating `src/App.tsx` as the full UI implementation.
- Added v1.0.8 release notes for the Dashboard module-boundary cleanup release.

### Validation

- `npm run check`
- `npm run test:browser`
- `npm run release:artifact`
- `npm run verify:release-artifact`
- `git diff --check`

## 1.0.7 - 2026-08-03

### Added

- Added a cloud deployment runbook for container and static hosting entrypoints.
- Added release artifact packaging and verification for `evopilot-dashboard-<version>-cloud-runbook.md`.
- Updated distribution validation to assert cloud deployment docs, image tag pinning, and API base URL configuration.

### Documented

- Updated README, distribution, self-hosting, getting started, release management, readiness, and maturity docs for the P2 cloud deployment entrypoint.
- Added v1.0.7 release notes for Dashboard cloud deployment documentation and artifact validation.

### Validation

- `npm run check`
- `npm run verify:distribution`
- `npm run release:artifact`
- `npm run verify:release-artifact`
- `git diff --check`

## 1.0.6 - 2026-08-03

### Added

- Added `npm run dashboard:run` to generate a standalone Docker Compose run directory for Dashboard connected to an EvoPilot API server.
- Added tagged `install.sh` for `curl -fsSL ... | bash` Dashboard container bootstrap from GitHub Releases.
- Added `npm run verify:distribution` and wired it into `npm run check`.
- Added release artifact packaging for the Dashboard installer script.

### Documented

- Added README CTA-style Dashboard entry points for local browser run, self-hosted full-stack install, and static API-connected deployment.
- Added the Dashboard distribution guide and linked it from docs index, getting started, self-hosting, readiness, and maturity documentation.
- Clarified that Desktop app and hosted Cloud trial are not published Dashboard distribution surfaces in this version.

### Validation

- `npm run check`
- `npm run verify:distribution`
- `npm run release:artifact`
- `npm run verify:release-artifact`
- `git diff --check`

## 1.0.5 - 2026-08-03

### Fixed

- Stabilized the mobile blocker visual regression baseline by using a viewport screenshot for the 390px blocker state.

### Documented

- Added v1.0.5 release notes and marked v1.0.4 as superseded for production rollout because its Visual Regression workflow failed on Ubuntu screenshot height variance.

### Validation

- `npm run check`
- `npm run test:browser`
- `npm run test:e2e:live` skipped without live API URL and credentials
- `npm run release:artifact`
- `npm run verify:release-artifact`
- `git diff --check`

## 1.0.4 - 2026-08-03

Superseded by v1.0.5 after the tag-triggered Visual Regression workflow exposed cross-platform mobile full-page screenshot height variance.

### Added

- Added Playwright browser E2E coverage for Agent Console demo stages, mocked EvoPilot API login, project intake, `ProjectHarnessProfile` generation, and governed blocker evidence.
- Added visual regression baselines for owner review, blocker repair, and release decision states.
- Added opt-in live E2E login smoke against a real or approved disposable EvoPilot API.
- Added CI workflows for browser E2E, visual regression, and PR review artifacts.

### Fixed

- Fixed mobile layout constraints so the Agent Console remains usable at 390px mobile viewport width.

### Documented

- Added the Dashboard test matrix guide and updated smoke-test, release-management, and docs index entries for browser E2E, visual regression, live E2E, and PR artifacts.

### Validation

- `npm run check`
- `npm run test:browser`
- `npm run test:e2e:live` skipped without live API URL and credentials
- `npm run release:artifact`
- `npm run verify:release-artifact`
- `git diff --check`

## 1.0.3 - 2026-08-02

### Fixed

- Fixed immutable ECS compose defaults so the template keeps the `evopilot-dashboard` project name.
- Updated immutable deployment docs to use explicit project name, env file, and no-build rollout commands for pinned image digests.

### Validation

- `npm run release:artifact`
- `npm run verify:release-artifact`
- `npm run check`
- `git diff --check`

## 1.0.2 - 2026-08-02

### Added

- Added immutable release artifact publishing for the Dashboard: release archive with built `dist/`, SPDX SBOM, provenance, SHA256 checksums, and GHCR image digest metadata.
- Added tag-triggered GitHub Actions release artifact workflow.
- Added ECS immutable compose template that deploys a pinned Dashboard image digest.

### Validation

- `npm run release:artifact`
- `npm run verify:release-artifact`
- `npm run check`
- `git diff --check`

## 1.0.1 - 2026-08-02

### Changed

- Published the latest README Agent Console screenshot as the patch-level GA publication baseline.
- Aligned release notes and version metadata with the post-v1.0.0 public documentation state.

### Validation

- `npm run check`
- `npm run smoke:console`
- `git diff --check`

## 1.0.0 - 2026-08-02

### Added

- Agent Console v2 product model for the ordinary-user project evolution loop.
- Chat-first flow for `Project Intake -> Harness Draft -> Owner Review -> Loop Execution -> Release Decision`.
- Human-readable `ProjectHarnessProfile.yaml` DRAFT review card before activation.
- Evidence Drawer for request IDs, profile digests, policy refs, blockers, next actions, logs, and token usage.
- Dashboard smoke tests for local and production compatibility checks.
- AI Agent docs for WorkBuddy and browser-operating agents.
- GitHub README screenshot and Apache-2.0 license alignment with EvoPilot.
- Root `AGENTS.md` and `llms.txt` entry points for AI Agent discovery.
- Self-hosting guide, release management playbook, v1.0.0 release notes, example walkthroughs, and open-source maturity report.

### Validation

- `npm run check`
- `npm run smoke:console`

## Unreleased

Track future user-facing UI, API compatibility, documentation, and release changes here before tagging a release.
