# AcadePost Public API Readiness

Date: 2026-05-26
Runtime target: `https://post.fgln.pro`
Version checked: `v1.1.8`

## Bottom Line

AcadePost has a real Public API under `/public/v1`, but it is not complete remote administration for the whole product.

It can manage core publishing workflows such as uploads, posts, templates, integrations listing/tools, notifications/analytics and external agent runs. It does not currently prove full control over provider credentials, project/user administration, role management, or Content Routing.

## Authentication

Primary auth:

```http
Authorization: Bearer <project-api-key>
```

Agent-scoped operations can also require:

```http
x-acadepost-agent-id: <external-agent-id>
x-acadepost-agent-secret: <external-agent-secret>
```

Evidence:

- `apps/backend/src/services/auth/public.auth.middleware.ts` accepts `Authorization: Bearer ...`, loads the organization by API key, rejects missing/invalid keys with 401, and defaults Public API org role context to `SUPERADMIN`.
- OAuth-style `pos_` tokens are rejected unless `PUBLIC_API_ALLOW_OAUTH=true`.

Security note:

Public API requests run with organization-level authority. That is useful for automation, but it means API key rotation, storage and audit logging matter. A leaked project API key is a high-impact incident.

## Endpoint Coverage

| Workflow | Endpoints | Status | Notes |
|---|---|---|---|
| Upload file | `POST /public/v1/upload` | `API_EXISTS` | Uses file validation pipe and saves media to current org. Needs deployed upload smoke. |
| Upload from URL | `POST /public/v1/upload-from-url` | `API_EXISTS` | Has SSRF-safe dispatcher, timeout, content-length and MIME checks. Needs negative tests. |
| Find posting slot | `GET /public/v1/find-slot/:id` | `API_EXISTS` | Depends on integration id. Needs connected channel. |
| List posts | `GET /public/v1/posts` | `API_EXISTS` | Uses org-scoped posts service. |
| Create posts | `POST /public/v1/posts` | `API_EXISTS` | Supports draft/schedule/now/update payload shape through post mapper. Needs smoke with real project key. |
| Update post | `PUT /public/v1/posts/:id` | `API_EXISTS` | Can update status, publish date and release id. |
| Delete post/group | `DELETE /public/v1/posts/:id`, `DELETE /public/v1/posts/group/:group` | `API_EXISTS` | Deletes by resolved group or explicit group. Needs tenant negative test. |
| Missing settings | `GET /public/v1/posts/:id/missing` | `API_EXISTS` | Useful before publish. |
| Status/release id | `PUT /public/v1/posts/:id/status`, `PUT /public/v1/posts/:id/release-id` | `API_EXISTS` | Needs lifecycle smoke. |
| Templates list/render | `GET /public/v1/post-templates`, `POST /public/v1/post-templates/:id/render` | `API_EXISTS` | Render can verify agent scope when agent headers/body are supplied. |
| Agent runs | `POST /public/v1/agent-runs`, `GET /public/v1/agent-runs/:id` | `API_EXISTS` | Verifies agent id/secret/scopes. Human-in-the-loop cannot schedule or publish now. |
| Integrations list | `GET /public/v1/integrations` | `API_EXISTS` | Lists connected channels only. |
| Integration connect URL | `GET /public/v1/social/:integration` | `API_EXISTS` | Generates OAuth URL for providers that do not require external URL flow. Requires live provider config. |
| Integration settings/tools | `GET /public/v1/integration-settings/:id`, `POST /public/v1/integration-trigger/:id` | `API_EXISTS` | Depends on connected provider and provider tool support. |
| Notifications | `GET /public/v1/notifications` | `API_EXISTS` | Paginated by org. |
| Analytics | `GET /public/v1/analytics/:integration`, `GET /public/v1/analytics/post/:postId` | `API_EXISTS` | Depends on provider support and connected channels. |
| Video generation/tools | `POST /public/v1/generate-video`, `POST /public/v1/video/function` | `API_EXISTS` | Depends on configured video providers. |

## Not Covered as Full Product Control

| Area | Status | Reason |
|---|---|---|
| Content Routing | `MISSING` | No Public API route, DTO field, or persistence field was found for `video`, `short_text`, `carousel` routing metadata. |
| Provider credential CRUD | `APP_API_ONLY` | Credential CRUD/test exists at `/provider-credentials`, guarded by app session/admin policy, not Public API. |
| Project creation/switching | `APP_API_ONLY` | Project/org APIs exist under `/user/organizations` and `/user/change-org`, but not Public API. |
| Team/user/role management | `APP_API_ONLY` / `UNVERIFIED` | Needs role tests. Not a stable public automation surface yet. |
| Full provider OAuth app/admin config | `APP_API_ONLY` / `PARTIAL` | Some public integration URL generation exists, but provider credentials and app-level setup are not fully public. |
| Billing/subscription | `APP_API_ONLY` | Not part of client self-host automation target unless explicitly required. |

## Required Smoke Collection

Use a client/test organization API key. Do not run these against a production client workspace unless test data is acceptable.

Environment variables:

```bash
export ACADEPOST_BASE_URL="https://post.fgln.pro"
export ACADEPOST_API_KEY="<project-api-key>"
export ACADEPOST_AGENT_ID="<agent-id>"
export ACADEPOST_AGENT_SECRET="<agent-secret>"
```

Checks:

1. Negative auth:
   `GET /public/v1/posts` without key must return 401.
2. Upload:
   `POST /public/v1/upload` with a small PNG must create a media record scoped to the project.
3. Upload-from-url:
   Valid public image succeeds; private/local/oversized/disallowed MIME fails.
4. Templates:
   `GET /public/v1/post-templates`; render one template if available.
5. Integrations:
   `GET /public/v1/integrations`; if empty, post lifecycle can only be partially tested.
6. Posts:
   Create draft with one connected integration, list it, update date/status, delete it.
7. Agent run:
   Create proposal with agent headers; verify `GET /agent-runs/:id`.
8. Agent negative:
   Wrong agent secret must fail. Human-in-the-loop mode must not allow `schedule` or `now`.
9. Tenant boundary:
   API key from project B must not read/update/delete IDs created by project A.

## Current Readiness Answer

Can AcadePost be controlled through API?

Partially, yes. Core publishing automation and agent workflows have API surfaces. Full AcadePost administration through API is not proven and is currently missing important product areas: Content Routing, provider credential management, users/roles/projects, and complete provider setup.

Do not claim "all functionality is API-manageable" until the smoke collection and missing endpoint map are complete.

## Evidence Log

2026-05-26, deployed `v1.1.9` negative auth smoke:

| Request | Result |
|---|---|
| `GET /api/public/v1/posts` without `Authorization` | `401 {"msg":"No API Key found"}` |
| `GET /api/public/v1/integrations` without `Authorization` | `401 {"msg":"No API Key found"}` |
| `GET /api/public/v1/post-templates` without `Authorization` | `401 {"msg":"Invalid API key"}` |
| `GET /api/public/v1/posts` with `Authorization: Bearer invalid-acadepost-key` | `401 {"msg":"Invalid API key"}` |
| `GET /api/public/v1/integrations` with `Authorization: Bearer invalid-acadepost-key` | `401 {"msg":"Invalid API key"}` |

Finding:

- Public API rejects missing and invalid API keys on checked endpoints.
- Error message consistency can be cleaned up later, but no auth bypass was observed in this negative smoke.
