# Admin Guide

> Manage Dashboard access, credentials, governance boundaries, and compatibility checks without bypassing EvoPilot API.

## Audience

Platform administrators, tenant administrators, and operations staff.

## Admin Responsibilities

| Responsibility | Dashboard Area | Required Evidence |
|---|---|---|
| Bootstrap access | Auth Session / Ops | password changed, user role visible, tenant/workspace scope correct |
| User and scope setup | Ops | user role, tenant, workspace, status, audit row |
| Project credentials | Projects / Ops | server-side secret or tokenRef saved, checklist/preflight result |
| DevOps boundary | Projects | executionMode, devopsOwner, workflowRepository, credentialPrincipal, claimBoundary |
| Harness governance | Projects Review Pack | templateRef, policyRefs, profile validation, source/compiled digest |
| Phase governance | Projects Review Pack / Runs | Alpha/Beta/RC/GA phase plan, owner confirmation, approval audit |
| Release governance | Runs | TargetEvidencePackage, PhasePackage, releaseDecision |
| Troubleshooting | Ops | requestId, traceId, actor, operation, error, nextAction |

## Production Console Governance

The Dashboard exposes mutating controls, but EvoPilot API remains the enforcement point.

| Control | Admin Responsibility | Dashboard Evidence |
|---|---|---|
| Login and password change | Issue Dashboard users through EvoPilot auth, not GitHub/GitLab PATs. | Auth Session shows username, role, tenant, workspace, and password-change state. |
| Tenant/workspace scope | Ensure every admin, operator, and viewer belongs to the correct scope. | Header and Ops fields match the project owner. |
| Project onboarding checklist | Require real repository provider/url/branch, tokenRef, DevOps owner, and LLM profile where needed. | Review Pack shows `POST /api/v1/onboarding/project/checklist`, requestId, blockers, and nextAction. |
| Harness profile activation | Require owner review of the generated/edited DRAFT before activation. | Review Pack shows generated profile version/digest; Last API Action shows activate status. |
| Goal plan approval | Require Alpha/Beta/RC/GA phase plan review before approval. | Review Pack requires `confirmedBy` and `confirmation`; Ops/audit can verify approval. |
| Incident repair | Use requestId, traceId, failed node, root cause, and nextAction. | Ops shows troubleshooting contract; server logs remain authoritative. |

If EvoPilot returns `403`, `409`, `PROJECT_HARNESS_PROFILE_POLICY_STALE`, `WAITING_APPROVAL`, `NO-GO`, or a repair-oriented `nextAction`, do not bypass it from the browser. Repair the server-side condition and rerun the same action.

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

The mutating smoke creates a temporary project, generates/activates the returned `ProjectHarnessProfile`, creates a goal, plans it, and approves the plan through the Dashboard proxy. It may invoke real LLM-backed EvoPilot APIs.

## Do Not Do

- Do not create users without tenant/workspace scope.
- Do not approve human gates without reviewing evidence.
- Do not treat health checks as release decisions.
- Do not bypass blockers by manually editing browser state.
- Do not treat a passing screenshot as production compatibility without `npm run check` and Dashboard console smoke evidence.
