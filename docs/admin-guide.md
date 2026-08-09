# Admin Guide

> Manage Dashboard access, credentials, governance boundaries, and compatibility checks without bypassing EvoPilot API.

## Audience

Platform administrators, tenant administrators, and operations staff.

## Admin Responsibilities

| Responsibility | Dashboard Area | Required Evidence |
|---|---|---|
| Bootstrap access | Sign in / password change | password changed, user role visible, tenant/workspace scope correct |
| User and scope setup | Tenants / Workspaces / Users | user role, tenant, workspace, status, audit row |
| Project credentials | Agent Console | server-side secret or tokenRef saved, checklist/preflight result |
| DevOps boundary | Agent Console | executionMode, devopsOwner, workflowRepository, credentialPrincipal, claimBoundary |
| Harness governance | Agent Console Review Pack / Harness Hub | selectedHarness id/version/catalog/entry digests, Catalog compatibility, read-only Harness Hub evidence |
| Phase governance | Agent Console | Alpha/Beta/RC/GA phase plan, owner confirmation, approval audit |
| Release governance | Agent Console / Audit | TargetEvidencePackage, PhasePackage, releaseDecision |
| Troubleshooting | Audit / Evidence Drawer | requestId, traceId, actor, operation, error, nextAction |

## Production Console Governance

The Dashboard exposes mutating controls, but EvoPilot API remains the enforcement point.

| Control | Admin Responsibility | Dashboard Evidence |
|---|---|---|
| Login and password change | Issue Dashboard users through EvoPilot auth, not GitHub/GitLab PATs. | Login page and password-change screen show the auth boundary before the console loads. |
| Tenant/workspace scope | Ensure every admin, operator, and viewer belongs to the correct scope. | Header shows `scope locked`, tenant, workspace, actor, and role. |
| Project onboarding checklist | Require real repository provider/url/branch, tokenRef, DevOps owner, and LLM profile where needed. | Review Pack shows `POST /api/v1/onboarding/project/checklist`, requestId, blockers, and nextAction. |
| Harness plan approval | Require owner review of the selectedHarness binding before phase-plan approval. | Review Pack shows Harness id, version, Catalog id, entry path, Catalog digest, and entry digest. |
| Goal plan approval | Require Alpha/Beta/RC/GA phase plan review before approval. | Review Pack requires `confirmedBy` and `confirmation`; Audit can verify approval. |
| Incident repair | Use requestId, traceId, failed node, root cause, and nextAction. | Audit and Evidence Drawer show troubleshooting contract; server logs remain authoritative. |
| Harness lifecycle | Use `evopilot-harness` for versioned evolution, review, approval, and publication. | Harness Hub only reads published Catalogs and cannot create, approve, publish, or mutate Harness definitions. |

If EvoPilot returns `403`, `409`, `WAITING_APPROVAL`, missing selectedHarness, `NO-GO`, or a repair-oriented `nextAction`, do not bypass it from the browser. Repair the server-side condition and rerun the same action.

## Credential Policy

Dashboard users may configure source and DevOps references, but secrets are owned by EvoPilot API server state.

- GitHub/GitLab project writeback credentials should be saved as EvoPilot secret refs or server-side `tokenRef`.
- GitHub personal access tokens must not be stored in Dashboard static files.
- Browser login uses username/password and a server-issued session token, not GitHub PAT.
- Manually entered Dashboard API bearer tokens are kept for the current browser session only.
- AI Agent CLI API tokens belong to EvoPilot CLI/API docs, not Dashboard login.

## DevOps Boundary Policy

Every GitHub/GitLab project that claims CI/CD readiness must declare:

- `executionMode`
- `devopsOwner`
- `workflowRepository`
- `credentialRef`
- `credentialPrincipal`
- `claimBoundary`

For public upstream projects, prefer `fork-validated-pr`: upstream is read-only evidence, the working fork runs CI/CD, and the Dashboard must not claim upstream release completion.

If the user has no GitHub/GitLab account or group, admins should onboard the upstream as `read-only-public` only. Do not create a shared EvoPilot-owned account or generic CI/CD fallback for third-party upstreams.

## Validation Commands

After deploying or upgrading the Dashboard, run:

```bash
npm run check
EVOPILOT_DASHBOARD_BASE_URL=http://<dashboard-host> \
EVOPILOT_API_BASE_URL=http://<api-host> \
npm run smoke:console
```

Run the mutating smoke only against a test server or disposable tenant/workspace:

```bash
EVOPILOT_MUTATING_SMOKE=1 \
EVOPILOT_MUTATING_SMOKE_TIMEOUT_MS=180000 \
EVOPILOT_DASHBOARD_BASE_URL=http://<dashboard-host> \
EVOPILOT_API_BASE_URL=http://<api-host> \
npm run smoke:console
```

The mutating smoke creates a temporary project, creates a goal, generates a plan with `selectedHarness`, and approves the plan through the Dashboard proxy. It may invoke real LLM-backed EvoPilot APIs.

## Do Not Do

- Do not create users without tenant/workspace scope.
- Do not approve human gates without reviewing evidence.
- Do not treat health checks as release decisions.
- Do not bypass blockers by manually editing browser state.
- Do not treat a passing screenshot as production compatibility without `npm run check` and Dashboard console smoke evidence.
