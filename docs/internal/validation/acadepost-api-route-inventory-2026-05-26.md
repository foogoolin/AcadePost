# AcadePost API Route Inventory

Дата: 2026-05-26
Проверенная версия: `v1.1.9`
Назначение: зафиксировать, какие API поверхности реально есть в коде, до запуска полного E2E smoke.

## Auth Boundaries

App API:

- `ApiModule` подключает `AuthMiddleware` только к authenticated controller list.
- Authenticated app controllers: users, analytics, integrations, settings, posts, media, billing, notifications, copilot, webhooks, signatures, autopost, sets, third-party, oauth authorized, announcements, admin, post templates, agent webhooks, provider credentials.
- Non-auth/public app controllers include auth, monitor, root, stripe, public preview endpoints, enterprise, no-auth integration OAuth callbacks and OAuth endpoints.

Public API:

- `PublicApiModule` applies `PublicAuthMiddleware` to `PublicIntegrationsController`.
- Public API requires `Authorization: Bearer <project-api-key>` unless OAuth public API is explicitly enabled.
- Negative deployed smoke on `v1.1.9` confirmed missing/invalid API keys return `401` for checked endpoints.

## Core App API Surface

| Area | Controller | Routes found | Current analysis status |
|---|---|---|---|
| Auth | `/auth` | register, login, forgot, activate, OAuth link/existence | Exists; auth smoke not run in this pass. |
| Users/projects | `/user` | self, personal, API key rotate, organizations, change-org, team-related helpers | Exists; project/tenant isolation smoke pending. |
| Posts/calendar | `/posts` | list, group, get, create, date, delete, tags, comments, missing, statistics, generator | Exists; draft/schedule lifecycle smoke pending. |
| Media | `/media` | upload-simple, upload-server, save-media, list, delete, generate-image/video, video options | Exists; deployed upload/list/render smoke pending. |
| Integrations/channels | `/integrations` | provider connect, social URL, settings, enable/disable, plugs, Telegram config/updates | Exists; live provider credentials and publish smoke pending. |
| Provider credentials | `/provider-credentials` | providers, list, get, create, update, test, delete | Exists; app-session/admin only, not Public API. Telegram live smoke pending. |
| Post templates/editor | `/post-templates` | list, create, update, delete, render-preview | Exists; browser render smoke pending. |
| Agent webhooks | `/agent-webhooks` | list, create, update, delete, test, run | Exists; n8n self-host smoke pending. |
| Webhooks | `/webhooks` | list/stats, create, update, delete, send | Exists; not yet smoke-tested. |
| Autopost | `/autopost` | list, create, update, delete, active toggle, send | Exists; not yet analyzed deeply. |
| Sets/signatures | `/sets`, `/signatures` | CRUD | Exists; lower-priority smoke. |
| Third party | `/third-party` | list, saved, submit, function, import, create/delete | Exists; provider-specific smoke pending. |
| Analytics/notifications | `/analytics`, `/notifications` | integration/post analytics, notification list | Exists; depends on connected channels. |
| Monitor | `/monitor` | health, ready, queue debug | Ready endpoint verified public 200. Queue endpoint needs admin/security review if exposed. |

## Public API Surface

| Workflow | Routes found | Current analysis status |
|---|---|---|
| Uploads | `POST /public/v1/upload`, `POST /public/v1/upload-from-url` | Exists; auth negative smoke passed; upload smoke pending with project API key. |
| Posts | `GET /posts`, `POST /posts`, `PUT /posts/:id`, `DELETE /posts/:id`, `DELETE /posts/group/:group`, `GET /posts/:id/missing`, `PUT /posts/:id/status`, `PUT /posts/:id/release-id` | Exists; workflow smoke pending with project API key and test integration. |
| Templates | `GET /post-templates`, `POST /post-templates/:id/render` | Exists; render smoke pending. |
| Agent runs | `POST /agent-runs`, `GET /agent-runs/:id` | Exists; requires project API key plus agent id/secret. n8n smoke pending. |
| Integrations | `GET /integrations`, `GET /is-connected`, `GET /social/:integration`, `DELETE /integrations/:id`, `GET /integration-settings/:id`, `POST /integration-trigger/:id` | Exists; connected-channel smoke pending. |
| Notifications/analytics | `GET /notifications`, `GET /analytics/:integration`, `GET /analytics/post/:postId` | Exists; depends on provider data. |
| Video helpers | `POST /generate-video`, `POST /video/function` | Exists; provider/runtime dependency pending. |

## Important Gaps

Content Routing:

- no app API route found;
- no Public API route found;
- no `CreatePostDto` routing field found;
- no Prisma `Post` routing metadata found.

Full Public API product control:

- provider credential CRUD is app API only;
- project/user/role administration is app API only;
- Content Routing has no API yet;
- some provider setup remains app-session/OAuth-specific.

## Next Checks

1. Run Public API workflow smoke with a test project API key.
2. Run app browser smoke for media upload, editor render, calendar draft/schedule.
3. Run n8n webhook smoke with a self-host n8n URL.
4. Attack tenant boundaries: project A ids must fail under project B key/session.
5. Review monitor/queue debug exposure before client deployment.
