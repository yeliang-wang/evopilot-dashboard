# Open Source Maturity Report

> Current public maturity assessment for EvoPilot Dashboard as the browser Agent Console for EvoPilot.

## Conclusion

EvoPilot Dashboard has reached an enterprise open-source productization baseline for a standalone Agent Console. It has a focused browser product shape, screenshot-backed README, deployment docs, smoke validation, AI Agent operation docs, release process, security and contribution docs, and API compatibility boundaries.

It should not claim community parity with the most established public AI-agent consoles until it has external users, issue activity, releases, independent deployments, and public case studies.

## Capability Coverage

| Area | Current State | Evidence |
| --- | --- | --- |
| Browser product | Chat-first Agent Console v2 for the core project evolution loop. | `src/App.tsx`, `docs/assets/agent-console.png` |
| API boundary | Standalone HTTP client over EvoPilot API. | `src/api.ts`, `docs/reference/api-usage.md` |
| User flows | Project intake, harness draft review, loop execution, evidence, release decisions. | `docs/workflows/`, `docs/user-guide.md` |
| AI Agent readiness | WorkBuddy-readable page map, expected UI states, stop rules, AGENTS entrypoint. | `AGENTS.md`, `docs/ai-agents/` |
| Distribution | Dockerfile, production compose, Nginx template, self-hosting docs. | `Dockerfile`, `compose.production.yaml`, `deploy/nginx/`, `docs/operations/self-hosting.md` |
| Release readiness | Versioned release notes, changelog, release checklist, smoke validation. | `CHANGELOG.md`, `docs/releases/1.0.0.md`, `docs/operations/release-management.md` |
| Community shell | License, notice, contribution guide, security policy, code of conduct, issue forms, PR template. | Root governance files and `.github/` |

## Top-Tier Gap Assessment

| Dimension | Status | Remaining Work |
| --- | --- | --- |
| Product shape | Strong baseline | Continue UI hardening from real operators. |
| API compatibility | Enforced by static and smoke checks | Keep pace with EvoPilot OpenAPI changes. |
| Self-hosting | Documented and containerized | Add published deployment examples as users adopt it. |
| Community | Governance shell present | Build issue triage, contributor activity, and public demos. |
| Trust evidence | Local and production smoke paths present | Add public case studies and release screenshots over time. |

## Maturity Target

The next maturity objective is external adoption evidence:

```text
Make the Dashboard understandable, deployable, operable, and testable by external users and AI Agents without private EvoPilot context.
```

Acceptance signals:

- A new operator can deploy Dashboard next to EvoPilot API from docs.
- A browser-operating AI Agent can follow `AGENTS.md` and `docs/ai-agents/README.md`.
- A maintainer can tag and publish a Dashboard release from `docs/operations/release-management.md`.
- Dashboard and CLI lead to the same EvoPilot server state for core workflows.
