# AcadePost Security Review Current

Date: 2026-05-26
Target release: `v1.1.10`
Review mode: BYAN evidence-first

## Summary

This is an incremental security review after the `v1.1.9` deployment and the follow-up hardening work for `v1.1.10`.

Current verdict:

- `v1.1.9` is deployed and healthy.
- Raw post request-body logging has been removed from backend runtime and source.
- Public API negative auth smoke rejects missing and invalid API keys with `401`.
- Two public debug surfaces were found after deployment:
  - `/api/docs` Swagger UI was public.
  - `/api/monitor/queue/:name` debug queue response was public.
- `v1.1.10` disables both by default.

This is still not a full production audit. Remaining production work includes rate-limit coverage, tenant-boundary attack tests, API-key rotation smoke, agent-secret rotation smoke, OAuth/provider flow review, clean self-host install proof, backup/restore and digest pinning.

## Fixed In v1.1.9

### Server-side raw body logging

Severity before fix: Medium.

Finding:

- App API `POST /posts` logged the full raw request body.
- This could leak post content, media payloads or provider settings into container logs.

Fix:

- Removed `console.log(JSON.stringify(rawBody, null, 2))` from `apps/backend/src/api/routes/posts.controller.ts`.
- Removed leftover `console.log('hello')` from `apps/backend/src/api/routes/media.controller.ts`.

Evidence:

- Runtime `acadepost-backend` grep found no `JSON.stringify(rawBody)` or `console.log('hello')`.
- Source grep found no `JSON.stringify(rawBody)` or `console.log('hello')`.
- `v1.1.9` deployed on `https://post.fgln.pro`; app containers healthy.

## Fixed In v1.1.10

### Public Swagger docs

Severity before fix: Low/Medium.

Finding:

- `https://post.fgln.pro/api/docs` returned `200`.
- Swagger route inventory is useful for developers, but should not be publicly exposed by default on client-facing deployments.

Fix:

- `loadSwagger(app)` now returns without registering Swagger unless `ENABLE_SWAGGER=true`.

File:

- `libraries/helpers/src/swagger/load.swagger.ts`

### Public monitor queue debug endpoint

Severity before fix: Low.

Finding:

- `https://post.fgln.pro/api/monitor/queue/main` returned `200` with a queue health message.
- The response is generic, but the endpoint is a debug surface and is not needed for public readiness.

Fix:

- `/monitor/queue/:name` now throws `NotFoundException` unless `ENABLE_MONITOR_QUEUE=true`.

File:

- `apps/backend/src/api/routes/monitor.controller.ts`

## Current Positive Evidence

Deployment:

- `v1.1.9` runtime app containers are healthy:
  - backend
  - frontend
  - orchestrator
  - proxy
- Public readiness endpoint returns:
  - `{"status":"ok","service":"backend"}`
- `/` redirects to `/auth` with final HTTP `200`.

Public API auth:

- `GET /api/public/v1/posts` without `Authorization` returns `401`.
- `GET /api/public/v1/integrations` without `Authorization` returns `401`.
- `GET /api/public/v1/post-templates` without `Authorization` returns `401`.
- invalid bearer key returns `401` on checked endpoints.

Build/test:

- Targeted Jest suite passed: 4 suites / 16 tests.
- `scripts/docker/test-update-script.sh` passed.
- Backend build passed with `NODE_OPTIONS=--max-old-space-size=4096`.

## Remaining Risks

### Rate limits are narrow

Current evidence:

- `ThrottlerBehindProxyGuard` only applies throttling to `POST /public/v1/posts`.

Risk:

- Other public/API endpoints can still be hammered unless protected elsewhere by reverse proxy or infrastructure.

Next action:

- Expand rate limits to public auth, uploads, agent runs and provider-trigger endpoints.

### Public API key blast radius

Current evidence:

- Public API key loads an organization and creates a synthetic `SUPERADMIN` role context for public routes.

Risk:

- A leaked project API key has broad project-level power.

Next action:

- Add API key rotation smoke, audit logging, and consider scoped API keys.

### Agent secret rotation not smoke-tested

Current evidence:

- Agent runs verify `x-acadepost-agent-id` and `x-acadepost-agent-secret`.
- Human-in-the-loop schedule/now is blocked in code.

Risk:

- Rotation and revocation behavior has not been E2E tested against deployed stack.

Next action:

- Run n8n self-host smoke with wrong-secret, disabled-agent and rotated-secret cases.

### Tenant boundary not attacked yet

Current evidence:

- Most services accept `org.id` and models include `organizationId`.

Risk:

- Direct object reference bugs can still exist until tested with project A/project B IDs.

Next action:

- Create two projects and attempt cross-project reads/writes for media, posts, credentials, templates and integrations.

### Upload and remote fetch need negative deployed tests

Current evidence:

- Public URL upload has SSRF-safe dispatcher, timeout, content-length guard and MIME detection in code.

Risk:

- Deployed behavior still needs negative tests for local/private addresses, oversized content and disallowed MIME.

Next action:

- Run upload negative smoke with a test project API key.

### Docker production hardening remains

Current evidence:

- Current demo/shared-infra deployment is healthy on versioned GHCR image.
- Deploy wrapper one-shot migrate handling has been fixed in repo.

Risk:

- Clean client install, rollback, digest pinning, backup/restore, resource limits and migration strategy are still not proven.

Next action:

- Run a clean client-like install/update/rollback test.

## Immediate Security Queue

1. Build and deploy `v1.1.10`.
2. Verify `/api/docs` is no longer public.
3. Verify `/api/monitor/queue/main` is no longer public.
4. Run Public API workflow smoke with a test project API key.
5. Run n8n agent secret negative tests.
6. Expand rate limits beyond `POST /public/v1/posts`.
