# Credential And DevOps Boundary

> Make explicit which GitHub or GitLab account owns source writeback and CI/CD execution.

## Why This Matters

Dashboard users, WorkBuddy, and digital humans must not guess DevOps ownership from a repository URL. A public upstream such as `apache/skywalking` can be inspected by EvoPilot, while CI/CD may run in `my-org/skywalking-fork`.

## Required Fields

| Field | Meaning |
|---|---|
| `executionMode` | `owned-repository`, `read-only-public`, `fork-validated-pr`, or `upstream-authorized` |
| `devopsOwner` | GitHub owner or GitLab namespace whose account runs CI/CD |
| `workflowRepository` | Repository where GitHub Actions or GitLab CI runs |
| `credentialRef` | Server-side secret reference used by EvoPilot |
| `claimBoundary` | Maximum result the UI or Agent may claim |

## Execution Modes

| Mode | Dashboard Claim |
|---|---|
| `owned-repository` | Source writeback and CI/CD run in the same owned repo. |
| `read-only-public` | Analysis only. No PR, merge, CI/CD, or release readiness claim. |
| `fork-validated-pr` | EvoPilot writes to a fork and can claim fork CI plus upstream PR readiness. |
| `upstream-authorized` | Maintainer credentials allow upstream writeback and release readiness after preflight. |

## Steps

1. Open **接入项目**.
2. Select the project.
3. Open credential or DevOps settings.
4. Fill source credential `tokenRef` when writeback is needed.
5. Select provider: GitHub Actions or GitLab CI.
6. Fill `executionMode`.
7. Fill `devopsOwner`.
8. For fork mode, fill upstream repo and working repo.
9. Run DevOps preflight.
10. Continue only if status is `READY` or the displayed blocker is intentionally accepted.

## Expected Result

Dashboard displays the server-returned execution boundary. The user can answer:

- Which account owns CI/CD?
- Which repository runs the workflow?
- Which credential reference is used?
- What release claim is allowed?

## Do Not Do

- Do not infer `devopsOwner` from the upstream URL.
- Do not use `read-only-public` for a workflow that claims PR, merge, or release readiness.
- Do not store raw GitHub PATs in static Dashboard files.
