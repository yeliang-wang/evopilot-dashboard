# Dashboard Page Map

> Page-level guide for browser agents.

## Navigation

| Page | Purpose | Primary Evidence |
|---|---|---|
| 登录页 | Authenticate user and change default password when required. | Login result, user role |
| 租户总览 | Inspect tenant/workspace health and release summaries. | Summary cards, release status |
| 用户与权限 | Create users, edit roles, reset passwords. | User table, role/status |
| 工作区 | Inspect workspace usage and scope. | Workspace ID, usage |
| 凭据 | Manage secret refs and GitHub App installation evidence. | secretRef, installation status |
| 接入项目 | Register projects and configure credentials/DevOps boundary. | projectId, readiness, blockers |
| Loops | Operate GlobalGoal, GoalTarget, LoopRun, worker, trace, and source closure views. | goalId, targetId, loopId, nextAction |
| 发布证据 | Read release decisions and repair release runs. | decision status, criteria, risks |
| 审计 | Review actions and history. | actor, requestId, target, result |
| 帮助手册 | In-app guided help. | Scenario steps and role map |

## Field Recognition

Common fields:

- Project ID
- Repository URL
- Default branch
- tokenRef
- executionMode
- devopsOwner
- workflowRepository
- target template
- objective

## Page Selection Rule

If the task is about:

- Login or password: use **登录页**.
- User/tenant/workspace: use **用户与权限** or **租户总览**.
- GitHub/GitLab project: use **接入项目**.
- Goal/Loop execution: use **Loops**.
- GO/NO-GO: use **发布证据**.
- Who did what: use **审计**.
