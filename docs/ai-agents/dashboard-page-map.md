# Dashboard Page Map

EvoPilot Dashboard exposes a login-first **Agent Console v3** plus a small role-based administration surface. Ordinary users should stay in the core project evolution flow; platform administrators get additional tenant, user, Harness Hub, LLM profile, and audit pages.

## Entry States

| State | Purpose | Agent Notes |
|---|---|---|
| Sign in | Authenticate with EvoPilot Dashboard credentials. | Do not paste GitHub, GitLab, LLM, deploy, or raw API secrets. |
| Password change | Replace a default or expired password. | Stop if the user does not know the current password. |
| Scope locked | Header shows tenant, workspace, actor, role, and API status. | Treat the session scope as authoritative. Ordinary users must not edit scope. |

## Left Navigation

The sidebar is intentionally fixed and compact:

`# Agent Console`, `Tenants`, `Workspaces`, `Users`, `Harness Hub`, `LLM Profiles`, `Audit`

```text
# Agent Console
Tenants
Workspaces
Users
Harness Hub
LLM Profiles
Audit
```

Do not expect workspace/project cards, active sessions, recent decisions, user footers, or a Projects menu in the left navigation.

## Agent Console Regions

| Region | Purpose | Agent Notes |
|---|---|---|
| Left rail | Fixed navigation only. | Use for orientation only. Do not infer release state from this rail. |
| Top bar | Current page or stage title, locked scope, API/session chips, refresh. | Open session drawer only for session details or administrator scope repair. |
| Stage bar | `Project Intake -> Template Auto-Match -> selectedHarness binding -> Owner Review -> Loop Execution -> Release Decision`. | This is workflow orientation, not server truth by itself. |
| Conversation | Main ordinary-user interaction. | Read inline cards in order. |
| selectedHarness.yaml card | Human-readable selected Harness plan binding. | Stop for owner review before phase-plan approval. |
| Composer | Repository, delivery chain, goal input, change request, confirmation, loop/release actions. | Buttons map to EvoPilot APIs. |
| Evidence Drawer | Request IDs, source system, CI/Loop executor, workflow repository, LLM profile, digests, policy refs, generatedBy, API actions, logs, projections. | Use this for WorkBuddy reports and troubleshooting. |

## Administration Pages

| Page | Main capability | Stop rule |
|---|---|---|
| Tenants | Create tenant, workspace, and tenant admin. | Stop on `403`, missing platform admin role, or missing tenant/workspace id. |
| Workspaces | Create tenant-scoped workspace with owner and quota. | Stop on tenant mismatch or quota policy failure. |
| Users | Create scoped user with `mustChangePassword=true`. | Stop if the requested role exceeds the signed-in user's authority. |
| Harness Hub | Read configured published Harness Catalogs and domain Harness experts. | Do not expect Dashboard to create, approve, publish, or mutate Harness definitions. |
| LLM Profiles | Register workspace profiles for project defaults or user profiles for run overrides. | Do not paste raw keys into screenshots; stop on profile readiness or secret-ref blockers. |
| Audit | Read request, action, scope, blockers, and failure trace. | Do not claim root cause without requestId or server trace evidence. |

## Button Recognition

| Button | Meaning |
|---|---|
| Start intake | Run project checklist, create a goal, and generate a plan with selectedHarness. |
| Request changes | Ask EvoPilot to regenerate the goal plan. |
| Confirm | Confirm the reviewed `selectedHarness.yaml` and phase plan. |
| Approve plan & start loop | Approve reviewed phase plan with real confirmation, then advance goal. |
| View evidence | Open or close the Evidence Drawer. |
| Refresh | Reload EvoPilot projections through API. |

## Deviation Guard

If the visible card is not `selectedHarness.yaml`, do not claim the selectedHarness binding has been reviewed. If the Evidence Drawer lacks `requestId` or digest fields for an incident, report incomplete evidence.
