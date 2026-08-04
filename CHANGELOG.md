# Changelog

All notable changes to EvoPilot Dashboard are documented here.

Dashboard releases should focus on browser-operable EvoPilot workflows, API compatibility, AI Agent usability, and visible product evidence. Do not accept screenshot-only validation without API compatibility evidence.

## Unreleased

No unreleased changes yet.

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
