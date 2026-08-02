# Security Policy

EvoPilot Dashboard operates project onboarding, harness review, loop execution, evidence, and release decision workflows through EvoPilot APIs. Security reports should be handled privately.

## Supported Versions

| Version | Supported |
| --- | --- |
| 0.1.x | Yes |
| Earlier versions | No |

## Reporting a Vulnerability

Do not disclose vulnerabilities in public GitHub issues or discussions.

Use GitHub private vulnerability reporting for `yeliang-wang/evopilot-dashboard` if available. If private reporting is not available, contact the repository maintainers through a private channel and include:

- affected version or commit
- reproduction steps
- impact and affected tenant/workspace boundary, if known
- whether tokens, session storage, API proxying, CORS, or EvoPilot governance gates are involved
- logs or screenshots with secrets removed

## Security Baseline

Security-sensitive changes should preserve:

- browser session tokens in `sessionStorage`, not long-lived `localStorage`
- no secrets in `public/config.js`
- EvoPilot API as the system of record
- tenant/workspace/actor headers for authenticated API calls
- owner review before ProjectHarnessProfile activation
- stop behavior on blockers, `nextAction`, `NO-GO`, `BLOCKED`, `FAILED`, policy review, credential repair, LLM repair, or human approval
