# Changelog

All notable changes to EvoPilot Dashboard are documented here.

Dashboard releases should focus on browser-operable EvoPilot workflows, API compatibility, AI Agent usability, and visible product evidence. Do not accept screenshot-only validation without API compatibility evidence.

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
