# Credential And DevOps Boundary

> Make explicit which GitHub or GitLab account owns source writeback and CI/CD execution.

## Why This Matters

Dashboard users, WorkBuddy, and digital humans must not guess DevOps ownership from a repository URL. A public upstream such as `apache/skywalking` can be inspected by EvoPilot, while CI/CD may run in an operator-owned fork.

## Required Fields

| Field | Meaning |
|---|---|
| `executionMode` | `owned-repository`, `read-only-public`, `fork-validated-pr`, or `upstream-authorized` |
| `devopsOwner` | GitHub owner or GitLab namespace whose account runs CI/CD |
| `workflowRepository` | Repository where GitHub Actions or GitLab CI runs |
| `sourceMode` | `repository-native` or `external-source` for GitHub source + GitLab CI bridge |
| `workflowProvider` | GitLab when a GitHub source project uses a GitLab CI bridge |
| `credentialRef` | Server-side credentialRef/tokenRef secret reference used by EvoPilot |
| `credentialPrincipal` | Operator-readable GitHub/GitLab execution principal label |
| `claimBoundary` | Maximum result the UI or Agent may claim |

## Execution Modes

| Mode | Dashboard Claim |
|---|---|
| `owned-repository` | Source writeback and CI/CD run in the same owned repo. |
| `read-only-public` | Analysis only. No PR, merge, CI/CD, or release readiness claim. |
| `fork-validated-pr` | EvoPilot writes to a fork and can claim fork CI plus upstream PR readiness. |
| `upstream-authorized` | Maintainer credentials allow upstream writeback and release readiness after preflight. |

## Steps

1. Open **# Agent Console**.
2. Fill repository and Goal Loop Target.
3. Select the delivery chain: GitHub source + GitHub Actions, GitLab source + GitLab CI, or GitHub source + GitLab CI Bridge.
4. Fill source `tokenRef` when writeback is needed.
5. Fill `executionMode`.
6. Fill `devopsOwner`.
7. For GitHub-native, fill CI workflow and required check if known.
8. For GitLab-native, fill required stage/job and optional workflow repository or ready URL.
9. For GitHub source + GitLab CI bridge, fill GitLab base URL, GitLab CI project, GitLab ref, and DevOps tokenRef.
10. Click **Start intake**.
11. Continue only if the checklist status is acceptable and the displayed blocker is intentionally accepted.

## Expected Result

Dashboard displays or preserves the server-returned execution boundary. The user can answer:

- Which account owns CI/CD?
- Which system owns source and which system runs CI/Loop?
- Which repository runs the workflow?
- Which credential reference is used?
- What release claim is allowed?
- Whether `nextAction` is `connect-github-account` or `connect-gitlab-account`.

## Do Not Do

- Do not infer `devopsOwner` from the upstream URL.
- Do not enable GitHub source + GitLab CI by provider mismatch; select bridge mode explicitly.
- Do not use `read-only-public` for a workflow that claims PR, merge, or release readiness.
- Do not store raw GitHub PATs in static Dashboard files.
- Do not add a generic CI/CD fallback or shared EvoPilot DevOps account for third-party upstreams.
