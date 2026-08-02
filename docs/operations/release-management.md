# Release Management

> Release the Dashboard only when it is compatible with the current EvoPilot API and its public docs describe the same user flows.

## Release Policy

Dashboard release readiness requires:

- A compatible EvoPilot API version.
- Current screenshots or UI docs.
- Static contract tests.
- Production build.
- Smoke evidence against a real or approved disposable EvoPilot API.
- Updated docs for humans and AI Agents.

Dashboard is not accepted from screenshot review alone.

## Versioning

Use semantic versions:

```text
vMAJOR.MINOR.PATCH
```

Rules:

- Do not move an existing public tag.
- Update `package.json`, `package-lock.json`, `CHANGELOG.md`, and `docs/releases/`.
- State compatible EvoPilot API version in the release notes.
- Keep `LICENSE` aligned with EvoPilot.

## Release Checklist

```bash
npm ci
npm run check
EVOPILOT_DASHBOARD_BASE_URL=http://127.0.0.1:5174 \
EVOPILOT_API_BASE_URL=http://127.0.0.1:19876 \
npm run smoke:console
git diff --check
```

Use mutating smoke only against approved disposable data:

```bash
EVOPILOT_MUTATING_SMOKE=1 npm run smoke:console
```

## Tag And Push

```bash
git tag -a v1.0.0 -m "EvoPilot Dashboard v1.0.0"
git push origin main
git push origin v1.0.0
git ls-remote origin refs/heads/main refs/tags/v1.0.0
```

If `gh` is unavailable, create the GitHub Release manually from the pushed tag and paste the body from `docs/releases/1.0.0.md`.

## Rollback

1. Keep EvoPilot API running.
2. Roll Dashboard container image or checkout back to the previous tag.
3. Confirm `/health` and `/api/v1/summary`.
4. Run `npm run smoke:console` from the deployed checkout or CI runner.
5. Preserve console logs and API `requestId` values if the rollback was caused by API compatibility.
