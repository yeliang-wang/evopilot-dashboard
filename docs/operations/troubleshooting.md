# Troubleshooting

> Diagnose Dashboard browser, API proxy, auth, review pack, and EvoPilot compatibility failures.

## First Checks

1. Confirm Dashboard URL is correct.
2. Confirm the first page is login, or after login the page shows **Agent Console v2** with left navigation, locked scope, stage bar, conversation, composer, and evidence drawer entry.
3. Confirm `public/config.js` points at the intended EvoPilot API server or uses same-origin proxy.
4. Log in again if the API status is `401`.
5. Open **Audit** or the **Evidence Drawer** and click **Refresh**.
6. Read failed projection names, HTTP status, requestId, and error text.

## Common Symptoms

| Symptom | Likely Cause | Next Action |
|---|---|---|
| Login rejected | Wrong Dashboard username/password | Ask an EvoPilot admin to reset the user. |
| API banner never reaches API LIVE | Wrong API base URL, proxy failure, or auth failure | Run `npm run smoke:console` and check `/api/v1/summary`. |
| Start intake stops at checklist | Missing repository, tokenRef, DevOps boundary, LLM profile, or SCM principal | Read blockers and `nextAction`; repair server-side setup. |
| Harness activation fails | DRAFT not reviewed, bad version, validation failure, or `PROJECT_HARNESS_PROFILE_POLICY_STALE` | Regenerate/apply a reviewed profile revision and retry activation. |
| Approve Phase Plan disabled | goalId, confirmedBy, or confirmation missing | Generate the review pack first and enter real owner confirmation. |
| Approve Phase Plan returns `409` | Plan not reviewable, stale harness policy, or missing confirmation payload | Read Last API Action and repair the stated condition. |
| Loop execution shows partial projections | goalId or loopId does not exist on this server | Open Advanced Control Details in the Evidence Drawer and correct the ID if the user supplied it. |
| UI and CLI disagree | Different server URL, tenant/workspace, actor, or token | Compare Dashboard config with EvoPilot CLI env vars. |
| Release status seems inconsistent | UI color or local evidence is being used instead of release decision | Read release decisions, TargetEvidencePackage, and PhasePackage. |

## Request ID Rule

When reporting a failure, include:

```text
dashboardUrl=<url>
apiBaseUrl=<url-or-same-origin>
tenant=<tenant-id>
workspace=<workspace-id>
page=<Agent Console|Tenants|Workspaces|Users|Harness Templates|LLM Profiles|Audit>
action=<button-or-projection>
status=<http-status-or-ui-state>
requestId=<request-id-or-not-visible>
nextAction=<server-next-action-or-not-visible>
blockers=<server-blockers-or-not-visible>
```

## Logging Rule

EvoPilot server logs are controlled by EvoPilot, not Dashboard. Use EvoPilot CLI/API docs for `logging inspect` and temporary debug changes. Only administrators should raise logging to `debug`, and they should restore `info` after diagnosis.

## WorkBuddy Repair Rule

WorkBuddy may retry after fixing a clear input error. It must stop and ask for owner/admin action when the failure is a governance gate, credential blocker, policy stale state, LLM profile repair, release NO-GO, or human approval.
