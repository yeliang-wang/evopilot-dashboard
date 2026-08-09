# Source To GA Loop

> Start or inspect a source-to-production loop that moves a project toward a release decision.

## Preconditions

- Project checklist is acceptable.
- Source credential preflight has acceptable state.
- DevOps boundary is explicit.
- selectedHarness binding has been reviewed in the goal plan.
- Alpha/Beta/RC/GA phase plan has been reviewed and approved.

## Steps

1. Open **# Agent Console**.
2. Click **Start intake** to generate the review pack if needed.
3. Review the selectedHarness binding returned by the goal plan.
4. Approve the reviewed phase plan.
5. Click **Start Or Advance Loop**.
6. Stay in **# Agent Console** and open **View evidence** when details are needed.
7. Read run-status, phase-plan, evidence matrix, final report, blockers, nextAction, and release decisions.
8. If a node is blocked, open **Audit** or the **Evidence Drawer** and follow requestId/nextAction repair guidance.

## Expected Result

- The active Goal has a goal ID.
- The workflow preserves Alpha/Beta/RC/GA.
- Evidence explains every state transition.
- LLM usage shows provider, model, input tokens, output tokens, total tokens, and credits when the server has usage evidence.
- Release decision is available or blockers explain why it is not.

## Failure Modes

| Blocker | Meaning | Next Action |
|---|---|---|
| `configure-source-credentials` | Source writeback cannot proceed. | Configure tokenRef and re-run Review Pack. |
| `human-approval` | Governance requires a human decision. | Review evidence, then approve or reject. |
| `policy-review` | Release policy blocks continuation. | Read policy blockers and repair evidence. |
| `repair` | A source release run failed or is stale. | Open Audit or Evidence Drawer and execute only the server-directed repair path after approval. |
| missing LLM/token usage | The UI cannot prove which LLM ran or how many tokens were used. | Record goalId/loopId/requestId and compare against EvoPilot API/CLI docs. |

## Release Rule

A source-to-GA loop is not GA just because CI passes. The final claim must come from EvoPilot release decision data.
