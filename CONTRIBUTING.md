# Contributing to EvoPilot Dashboard

EvoPilot Dashboard is the browser Agent Console for EvoPilot. Contributions should preserve the product boundary: the Dashboard is an HTTP API client, while EvoPilot API remains the system of record.

## Start Here

1. Fork or branch from `main`.
2. Install dependencies:

```bash
npm ci
```

3. Run the local gate:

```bash
npm run check
```

## Contribution Areas

| Area | Good contribution shape |
| --- | --- |
| Agent Console UX | Improves the ordinary-user project evolution loop without adding dense admin menus. |
| Harness review | Makes `ProjectHarnessProfile.yaml` easier to review without bypassing owner confirmation. |
| Evidence | Improves requestId, digest, blocker, nextAction, log, or token visibility. |
| API compatibility | Keeps Dashboard behavior aligned with EvoPilot CLI/API governance. |
| Documentation | Helps humans and WorkBuddy-style AI Agents operate the real browser flow. |

## Pull Request Expectations

- Explain the user or AI Agent workflow affected by the change.
- Include screenshots for visible UI changes.
- Run `npm run check`.
- Update docs when UI labels, workflow steps, API paths, or stop rules change.
- Do not introduce local EvoPilot file reads, CLI calls, direct evidence-folder parsing, or secret storage in `public/config.js`.

## Security Issues

Do not open public issues for vulnerabilities. Follow [SECURITY.md](SECURITY.md).

## License

By contributing, you agree that your contribution is licensed under the Apache License, Version 2.0.
