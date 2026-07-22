# Source To GA Loop

> Start or inspect a source-to-production Loop that moves a project toward a release decision.

## Preconditions

- Project is registered.
- Source credential preflight has acceptable state.
- DevOps boundary is explicit.
- User has permission to start or approve Loop work.

## Steps

1. Open **Loops**.
2. Review Target Backlog and current Loop Runtime list.
3. Choose or create the project target.
4. Start the source-to-GA workflow.
5. Open Loop details.
6. Read the workflow graph from left to right:
   `SCM/Git Project -> Discovery Candidate -> Target Backlog -> Executor Graph -> Worker + Sandbox -> Human Gate -> Source Closure -> CI/CD + Deploy -> Release Decision -> GA Release`.
7. If a node is blocked, open its detail panel and follow `nextAction`.
8. If the loop waits for approval, review evidence before approving.
9. Check LLM provider/model and token totals if the loop executed an LLM-backed step.
10. After source closure, check CI/CD and deploy evidence.
11. Finish by reading the release decision.

## Expected Result

- The active Loop has a loop ID.
- The graph shows active, completed, pending, and blocked nodes.
- Timeline and trace explain every state transition.
- LLM usage shows provider, model, input tokens, output tokens, total tokens, and credits when the server has usage evidence.
- Release decision is available or blockers explain why it is not.

## Failure Modes

| Blocker | Meaning | Next Action |
|---|---|---|
| `configure-source-credentials` | Source writeback cannot proceed. | Configure tokenRef and re-run preflight. |
| `human-approval` | Governance requires a human decision. | Review evidence, then approve or reject. |
| `policy-review` | Release policy blocks continuation. | Read policy blockers and repair evidence. |
| `repair` | A source release run failed or is stale. | Open repair queue and execute repair. |
| missing LLM/token usage | The UI cannot prove which LLM ran or how many tokens were used. | Record loopId/requestId, inspect trace, and compare against EvoPilot API/CLI docs. |

## Release Rule

A source-to-GA Loop is not GA just because CI passes. The final claim must come from EvoPilot release decision data.
