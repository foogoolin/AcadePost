# AcadePost Functional Validation Plan

Date: 2026-05-26
Owner language: Russian
Document purpose: BYAN-controlled work plan for proving what actually works in AcadePost before client delivery.

## BYAN Control Contract

BYAN controls this process with these gates:

1. Discovery: identify the real feature surface from code, docs and running deployment.
2. Challenge: do not accept UI presence as proof of functionality.
3. Evidence: every feature must produce a reproducible artifact.
4. Client-repeatability: every smoke test must be repeatable on a clean self-host client install, not only on the current server.
5. Security: public API, agents, uploads, credentials, Docker and OAuth changes require explicit abuse review.
6. Documentation: findings must be written back into a readiness matrix.

## Validation Status Labels

Use only these labels in the readiness matrix:

- `UI_ONLY`: visible screen or copy exists, but no meaningful workflow is proven.
- `API_EXISTS`: endpoint or service exists, but no end-to-end proof yet.
- `BACKEND_WORKS`: backend behavior is verified with local/API checks.
- `E2E_VERIFIED`: browser/API workflow is verified on the deployed stack.
- `SELF_HOST_VERIFIED`: the same workflow is verified on a clean self-host install path.
- `CLIENT_READY`: repeatable, documented, and safe enough for a client demo or install.
- `BLOCKED`: missing credentials, external approval, code defect, or unsafe behavior blocks verification.

## Phase 0 - Evidence Harness

Goal: create one place where every claim is tracked.

Tasks:

- Create `docs/feature-readiness-matrix.md`.
- Add columns: feature, UI route, API route, backend service, persistence, auth boundary, Docker/env impact, smoke command, current status, evidence, blocker, next action.
- Create or update a Postman/Bruno collection for Public API checks.
- Create a browser smoke checklist for deployed `https://post.fgln.pro`.
- Record current deployed image and version before every validation run.

Acceptance:

- Every feature in this plan has a row in the matrix.
- No feature may be marked `CLIENT_READY` without evidence.

## Phase 1 - Content Routing

Current challenge:

`/content-routing` is currently likely `UI_ONLY`. The page lists three groups and links to Editor, Calendar and Media Library. It does not appear to create a draft, persist a routing choice, select integrations, or pass a content type into the publishing flow.

Validation tasks:

- Inspect UI route `/content-routing`.
- Click each available action and record whether it carries routing context.
- Check whether any backend model stores routing type: `video`, `short_text`, `carousel`.
- Check whether post creation or scheduling accepts routing metadata.
- Check whether platform recommendations become selected integrations automatically.
- Try to create a post through the routing page and verify the resulting calendar item.

Expected finding if unchanged:

- Status: `UI_ONLY`.
- Required product decision: either label it honestly as a demo guide, or build a real routing workflow.

Minimum real MVP for routing:

- User chooses content type.
- AcadePost recommends target providers.
- User can select connected channels from that group.
- Draft or scheduled post is created with routing metadata.
- Calendar shows the routed content type.
- API can expose or update the routing metadata.

Acceptance for `CLIENT_READY`:

- Browser E2E: routing selection -> draft/scheduled post -> calendar item.
- Backend evidence: persisted routing metadata.
- Negative case: unavailable/unconnected providers are blocked or clearly marked.

## Phase 2 - Projects, Roles and Tenant Isolation

Validation tasks:

- Create two projects.
- Create or invite users for owner/admin/editor roles.
- Verify visible labels map correctly to internal roles.
- Create posts, media, credentials and templates in project A.
- Switch to project B and confirm project A data is not visible or mutable.
- Try direct API access to project A resources while scoped to project B.
- Verify editor role cannot perform admin-only actions.

Acceptance:

- No cross-project read/write for posts, media, credentials, tags, integrations or templates.
- Admin-only routes reject editor role.
- Findings documented with request/response evidence.

## Phase 3 - Media Library and Uploads

Validation tasks:

- Upload image through UI.
- Upload video if size and runtime allow.
- Upload via Public API `/public/v1/upload`.
- Upload from URL via `/public/v1/upload-from-url`.
- Verify media appears in library and can be reused in Editor and Posts.
- Verify `/uploads/...` route serves local files after `v1.1.8`.
- Check old-host upload URL normalization.
- Test delete behavior and cross-project access.
- Test disallowed MIME type and oversized file behavior.

Acceptance:

- UI upload, API upload and render reuse work.
- Bad file type is rejected.
- Cross-project media access is blocked.
- Docker volume path is documented and survives container recreation.

## Phase 4 - Editor and Templates

Validation tasks:

- Open `/editor`.
- Create templates for post and carousel variants.
- Select image from Media Library.
- Upload a local image inside the Editor.
- Save template.
- Render preview.
- Confirm rendered PNG appears in Media Library.
- Reopen saved template and verify media link persists.
- Render through Public API `/public/v1/post-templates/:id/render`.

Acceptance:

- UI template creation and API render both work.
- Local preview URL cleanup does not break final uploaded media.
- Template belongs to current project only.
- Render limits and SSRF protections are verified for remote image input.

## Phase 5 - Calendar, Posts and Publishing Core

Validation tasks:

- Create draft post from normal UI.
- Create draft post through Public API `/public/v1/posts`.
- List posts through UI and API.
- Update status and publish date through UI and API.
- Move scheduled date.
- Delete a post and a group.
- Verify status transitions: draft, schedule, published/failed where possible.
- Verify missing-settings endpoint before publish.

Acceptance:

- Draft/schedule lifecycle works without social provider credentials.
- API and UI remain consistent.
- Tenant boundary is enforced on post id and group id.

## Phase 6 - Provider Credentials

Validation tasks:

- Confirm `ACADEPOST_CREDENTIALS_ENCRYPTION_KEY` is valid in runtime.
- Open `Paramètres > Identifiants`.
- List provider definitions.
- Create Telegram credential.
- Verify secrets are masked after save.
- Edit credential without replacing secret.
- Test credential.
- Create multiple credentials for one provider and verify Add Channel asks which one to use.
- Verify incompatible or cross-project `credentialId` is rejected.

Acceptance:

- Credential save/test/edit/delete works.
- Secrets never return in plaintext.
- Missing or malformed encryption key disables saving.
- Credential selection is bound to the new channel connection.

## Phase 7 - Social Provider Smoke Tests

Split providers into proof groups.

Low-friction first:

- Telegram
- Bluesky
- Mastodon
- WordPress
- Dev.to
- Hashnode
- Reddit

High-friction/client credentials required:

- Facebook Pages
- Instagram Business
- Threads
- YouTube
- TikTok
- LinkedIn Page
- Pinterest
- X

Validation for each provider:

- Create developer app or token.
- Configure exact callback URL.
- Save provider credential in AcadePost.
- Run credential test if available.
- Connect channel.
- Create draft.
- Schedule post.
- Publish now if provider supports it.
- Verify release URL/status on platform.
- Verify token refresh path if OAuth provider supports refresh.

Acceptance:

- Do not mark provider `CLIENT_READY` without a real publish or schedule smoke.
- If platform review is required, status remains `BLOCKED` or `API_EXISTS`, not `CLIENT_READY`.

## Phase 8 - n8n and External Agents

User question answered:

Yes, BYAN/Codex can test a provided self-host n8n connection, but credentials must be handled as runtime secrets and rotated if pasted into chat. The real goal is repeatable client self-host validation: AcadePost plus an external n8n instance over HTTPS.

Validation tasks with owner's n8n:

- Create an n8n workflow with a webhook trigger.
- Create AcadePost agent webhook in `/agents/new`.
- Test webhook from AcadePost.
- Run agent manually from AcadePost.
- Verify payload received in n8n.
- Return a valid response and verify AcadePost records result.
- Create `human_in_the_loop` agent run through Public API.
- Verify it creates proposal/draft only.
- Create `full_access` agent with explicit scopes.
- Verify schedule/now requires correct agent id and secret.
- Rotate or disable agent secret and confirm old secret fails.

Client-repeatability tasks:

- Document required n8n public URL, TLS, webhook path and firewall rules.
- Document required AcadePost headers:
  - `Authorization: Bearer <project-api-key>`
  - `x-acadepost-agent-id`
  - `x-acadepost-agent-secret`
- Provide a minimal importable n8n workflow JSON for client testing.

Acceptance:

- Human-in-the-loop cannot publish directly.
- Full Access can only publish with explicit scopes and valid agent secret.
- Failed n8n webhook is visible and does not silently create a false success.

## Phase 9 - Public API

Current challenge:

The Public API exists and covers many areas, but it should not be described as "full control of every feature" until endpoint coverage and workflow coverage are proven.

API surfaces to validate:

- Auth with project API key.
- `/public/v1/upload`
- `/public/v1/upload-from-url`
- `/public/v1/posts`
- `/public/v1/posts/:id`
- `/public/v1/posts/:id/status`
- `/public/v1/posts/:id/release-id`
- `/public/v1/post-templates`
- `/public/v1/post-templates/:id/render`
- `/public/v1/agent-runs`
- `/public/v1/agent-runs/:id`
- `/public/v1/integrations`
- `/public/v1/is-connected`
- `/public/v1/integration-settings/:id`
- `/public/v1/integration-trigger/:id`
- analytics and notifications endpoints.

Validation tasks:

- Build API collection.
- Run create/list/update/delete flows.
- Compare UI-visible state after API changes.
- Verify unauthorized, wrong org and wrong agent-secret cases.
- Identify missing endpoints for full product management.

Likely missing or unstable for "full control":

- Full provider credential management may be authenticated app API, not public API.
- Full project/user/admin management likely not stable as public API.
- Content routing likely has no real API yet.
- Some integration settings are provider-specific and require connected channels.

Acceptance:

- Produce `docs/development/public-api-readiness.md`.
- Mark each workflow as supported, partial, missing or unsafe.

## Phase 10 - Docker and Self-Hosted Install

Current status:

The demo Docker path is stronger than earlier versions: prebuilt GHCR images, split backend/frontend/orchestrator/proxy services, health checks, non-root app runner and no server build for normal update. This is good for demo/self-host MVP, but not yet complete production hardening.

Validation tasks:

- Clean VPS install with `docker-compose.demo.yaml`.
- Shared-infra install with `docker-compose.demo.shared-infra.yaml`.
- Verify no local `docker build` is needed for normal install/update.
- Verify public URL and callback URL are runtime config, not baked into image.
- Verify volumes survive recreate.
- Verify app-only update with `--no-deps`.
- Verify rollback to previous tag or digest.
- Verify health checks for backend, frontend, orchestrator and proxy.
- Verify Temporal/Redis/Elasticsearch startup behavior.
- Verify image tag and `NEXT_PUBLIC_VERSION` match release policy.

Production hardening backlog:

- Pin image digest for client installs.
- Add resource limits.
- Add backup/restore runbook for DB, uploads and Redis/Temporal data if needed.
- Replace demo `db push` with migration strategy.
- Review Temporal and Elasticsearch security for public production networks.
- Add secrets management guidance beyond `.env`.

Acceptance:

- A clean client server can install, update and rollback from docs alone.
- No secrets are committed or baked into Docker image.
- Public readiness endpoint returns 200 after update.

## Phase 11 - Security Review

Validation tasks:

- Review public API auth and tenant scoping.
- Review project API key generation and rotation.
- Review agent secret storage, masking and revocation.
- Review provider credential encryption and API responses.
- Review uploads and remote URL fetch for SSRF and size limits.
- Review logs for secret/token leakage.
- Review rate limits on public and auth endpoints.
- Review OAuth callback state handling.
- Review Docker exposed ports and network boundaries.
- Review admin/editor role enforcement.

Known baseline:

- Previous demo security pass fixed agent-run bypass, OAuth public API default, SSRF edge case, timeout/size guards and readiness disclosure.
- Remaining production risks include rate limits, digest pinning, migration strategy, backup/restore, OAuth/provider hardening and broader e2e security tests.

Acceptance:

- Produce updated `docs/security/acadepost-security-review-current.md`.
- No critical or high issue remains untracked before client demo.

## Phase 12 - Browser E2E and Client Demo Runbook

Validation tasks:

- Auth login/register/forgot if enabled.
- Project switch.
- Media upload.
- Editor render.
- Calendar schedule.
- Provider credential save/test.
- Add Channel with selected credential.
- n8n agent test.
- Public API post creation.
- Docker update and rollback.

Acceptance:

- Produce a dated demo evidence folder with screenshots/log snippets.
- Update `docs/customer-demo-runbook.md`.
- Final readiness summary lists what is real, what is demo-only and what is blocked by external credentials.

## Priority Order

P0 - Stop false claims:

1. Feature readiness matrix.
2. Content Routing truth check.
3. Public API coverage check.
4. n8n self-host smoke.
5. Docker clean install/update/rollback proof.

P1 - Core product proof:

1. Projects and tenant isolation.
2. Media Library.
3. Editor templates.
4. Calendar draft/schedule lifecycle.
5. Provider Credentials with Telegram.

P2 - Provider proof:

1. Low-friction providers.
2. Meta/Google/TikTok/LinkedIn/Pinterest/X with owner-supplied apps.
3. Publish and refresh-token smoke.

P3 - Production hardening:

1. Security review update.
2. Digest pinning.
3. Migration strategy.
4. Backup/restore.
5. Rate limits and audit logs.

## Immediate Next Work Package

Recommended first work package:

1. Create `docs/feature-readiness-matrix.md`.
2. Mark Content Routing as suspected `UI_ONLY` with code evidence.
3. Build the first API collection for posts, uploads, templates and agent-runs.
4. Test one real n8n webhook connection.
5. Test one real Telegram credential and channel connection.

Exit criteria:

- We can tell a client exactly which AcadePost features are real today.
- We know which features are demo-only.
- We know which gaps block client self-host deployment.
