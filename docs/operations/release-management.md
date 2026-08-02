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
- Immutable release artifacts: release archive with built `dist/`, SHA256SUMS, SPDX SBOM, provenance, and image digest metadata.

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
npm run release:artifact
npm run verify:release-artifact
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
git tag -a <version> -m "EvoPilot Dashboard <version>"
git push origin main
git push origin <version>
git ls-remote origin refs/heads/main refs/tags/<version>
```

If `gh` is unavailable, create the GitHub Release manually from the pushed tag and paste the body from `docs/releases/<version>.md`.

## Immutable Release Artifacts

Patch releases publish immutable deployment evidence from `.github/workflows/release-artifacts.yml`.

Expected assets:

- `evopilot-dashboard-<version>-source.tar.gz`
- `evopilot-dashboard-<version>-sbom.spdx.json`
- `evopilot-dashboard-<version>-provenance.json`
- `evopilot-dashboard-<version>-image-metadata.json`
- `SHA256SUMS`

The release archive includes built `dist/` assets for static inspection. Production deployment should prefer the immutable image reference recorded in `evopilot-dashboard-<version>-image-metadata.json`:

```bash
export EVOPILOT_DASHBOARD_IMAGE='ghcr.io/yeliang-wang/evopilot-dashboard@sha256:<digest>'
docker compose -p evopilot-dashboard --env-file .env -f deploy/ecs/compose.immutable.yaml up -d --no-build
```

Before using release assets, verify checksums:

```bash
sha256sum -c SHA256SUMS
```

Do not treat a source checkout plus production build as immutable artifact deployment. That remains a valid source-ref rollout path, but it is weaker release evidence.

## Rollback

1. Keep EvoPilot API running.
2. Roll Dashboard container image or checkout back to the previous tag.
3. Confirm `/health` and `/api/v1/summary`.
4. Run `npm run smoke:console` from the deployed checkout or CI runner.
5. Preserve console logs and API `requestId` values if the rollback was caused by API compatibility.
