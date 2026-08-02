# Example Project Walkthroughs

> Browser paths for the two public examples that should stay aligned with EvoPilot CLI examples.

## Shared Flow

```text
Project Intake -> Harness Draft -> Owner Review -> Phase Plan -> Loop Execution -> Evidence Drawer -> Release Decision
```

Use these walkthroughs to train human users and browser-operating AI Agents. EvoPilot API remains the system of record.

## Example 1: Node API Service

Goal loop target:

```text
Make the Node API service production-releasable by enforcing health/readiness checks, latency evidence, CI validation, and release-decision evidence.
```

Browser steps:

1. Open Dashboard and log in.
2. Open **# Agent Console**.
3. Enter the repository URL for the disposable or owned Node API service.
4. Select the execution boundary shown by the owner: owned repository, fork CI PR, or read-only public.
5. Paste the goal loop target.
6. Click **Start intake**.
7. Read the `ProjectHarnessProfile.yaml` draft.
8. If the owner requests changes, edit through EvoPilot profile apply/diff flow and regenerate the review pack.
9. Activate only after owner confirmation.
10. Review the Alpha/Beta/RC/GA phase plan.
11. Start or continue the loop after approval.
12. Use the Evidence Drawer to record `requestId`, profile digest, blockers, token usage, and `nextAction`.
13. Inspect the release decision and stop on `NO-GO`, `BLOCKED`, or policy review.

Expected evidence:

- Harness draft and active digest.
- Phase plan approval.
- Build, smoke, CI, latency, and release evidence.
- Product-native release decision.

## Example 2: EvoPilot Dashboard

Goal loop target:

```text
Keep EvoPilot Dashboard aligned with EvoPilot API and CLI semantics while preserving a simple browser flow for project intake, harness review, loop execution, evidence review, and release decisions.
```

Browser steps:

1. Open **# Agent Console** and enter `https://github.com/yeliang-wang/evopilot-dashboard`.
2. Choose `read-only-public` for analysis or `owned-repository` only with owner-approved credentials stored server-side.
3. Paste the goal loop target.
4. Click **Start intake** to generate the review pack.
5. Inspect the YAML-like harness draft and ensure it covers React build, static contract, smoke, API compatibility, screenshots, and release docs.
6. Show the draft to the owner.
7. Activate the reviewed profile.
8. Review the Alpha/Beta/RC/GA phase plan.
9. Start the loop only after approval.
10. Inspect Evidence Drawer fields for API requests, blockers, logs, and token usage.
11. Confirm release decision or stop at the server's next action.

Expected evidence:

- `npm run check` evidence.
- API compatibility evidence against EvoPilot OpenAPI.
- Dashboard smoke evidence when a real EvoPilot API is available.
- Release decision or a clear server blocker.

## AI Agent Stop Rules

Stop and return control to the user when EvoPilot returns:

- Generated `ProjectHarnessProfile` draft.
- Phase plan waiting for approval.
- `nextAction`.
- `NO-GO`, `BLOCKED`, or `FAILED`.
- Credential, LLM, deploy, source closure, policy, or human approval repair.
- Missing `requestId`, missing profile digest, or missing release decision evidence.
