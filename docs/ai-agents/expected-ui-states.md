# Expected UI States

## Authentication States

| State | Expected visible elements |
|---|---|
| Sign in | `Control plane access starts here.`, username, password, `登录`, `API auth required` |
| Password change | `必须先修改默认密码`, current password, new password, `完成改密` |
| Signed in | `scope locked`, tenant id, workspace id, role chip, API status chip |

Ordinary users must not edit tenant/workspace/actor scope. Platform administrators may switch scope only when the server session grants that role.

## Navigation States

| Expected navigation |
|---|
| `# Agent Console`, `Tenants`, `Workspaces`, `Users`, `Harness Hub`, `LLM Profiles`, `Audit` |

The sidebar must not show workspace/project cards, active sessions, recent decisions, user footers, or a `Projects` menu.

## Stage States

| Stage | Expected State Labels |
|---|---|
| Project Intake | `editing goal`, `done` |
| Template Auto-Match | `matching template`, `done` |
| selectedHarness binding | `planning harness`, `done` |
| Owner Review | `needs owner review`, `changes applied`, `done` |
| Loop Execution | `planning`, `running`, `blocked repair`, `done` |
| Release Decision | `not started`, `GO review`, `NO-GO`, `BLOCKED` |

## selectedHarness YAML Review

Expected visible elements:

- card title `selectedHarness.yaml`
- Markdown owner review summary
- YAML block with `selectedHarness`
- Harness id and version
- Catalog id and entry path
- Catalog digest and entry digest
- selection reasons or match score when returned
- phase-plan relationship
- `Confirm`
- `Request changes`
- `View evidence`

Do not continue to phase-plan approval until this binding has been shown to the user or project owner.

## Evidence Drawer States

Expected fields:

- `requestId`
- `selectedHarness`
- `compiledDigest`
- `policyRefs`
- `generatedBy`
- `lastAction`
- `nextAction`
- log trace
- server projections when available

## Admin Page States

| Page | Expected elements |
|---|---|
| Tenants | tenant table, `初始化新租户`, create action, audit evidence |
| Workspaces | workspace table, owner and quota fields, project LLM/token usage projection, create action |
| Users | user table, role/status fields, `mustChangePassword=true` behavior in docs |
| Harness Hub | Published Harness Catalog table, domain expert rows, source types, inspect action |
| Audit | audit rows, requestId, last action, nextAction, blockers, failure trace |

## Blocker State

Expected visible elements:

- `BLOCKED`
- failing capability or action
- request ID if server returned one
- `nextAction` or blockers
- minimal repair scope

The agent must stop unless the user or administrator approves repair.
