# AcadePost Current State Analysis

Дата: 2026-05-26
Язык рабочего анализа: русский
Контроль процесса: BYAN, evidence-first

## Текущая точка

На сервере сейчас развернут рабочий AcadePost `v1.1.9`; следующий security hardening release `v1.1.10` подготовлен в репозитории:

- публичный URL: `https://post.fgln.pro`;
- backend readiness: `GET /api/monitor/ready` возвращает `200`;
- backend, frontend и orchestrator работают на `ghcr.io/foogoolin/acadepost:v1.1.9`;
- frontend runtime `NEXT_PUBLIC_VERSION` равен `v1.1.9-6c99f9a8`;
- версия в репозитории была поднята до `1.1.9` перед деплоем, согласно правилу: каждый деплой приложения требует обновления версии AcadePost.

Hotfix `v1.1.9` подготовлен, собран, опубликован в GHCR и развернут:

- удалено логирование полного тела создания поста из app API;
- удален остаточный debug log из media video route;
- `package.json` обновлен до `1.1.9`;
- `version.txt` обновлен до `v1.1.9`;
- changelog обновлен.

Security hardening `v1.1.10`:

- Swagger docs disabled by default unless `ENABLE_SWAGGER=true`.
- Monitor queue debug disabled by default unless `ENABLE_MONITOR_QUEUE=true`.
- `package.json` updated to `1.1.10`.
- `version.txt` updated to `v1.1.10`.
- Backend build passed with `NODE_OPTIONS=--max-old-space-size=4096`.

Статус `v1.1.9`:

- локальные таргетные тесты прошли: 4 suites / 16 tests;
- GitHub `Build` прошел;
- GitHub `Code Quality Analysis` прошел;
- GitHub `Build demo image` прошел, включая size gate, Compose smoke и GHCR push;
- сервер переключен на `ghcr.io/foogoolin/acadepost:v1.1.9`;
- backend/frontend/orchestrator/proxy healthy;
- `acadepost-migrate` завершился с `Exited (0)`.

Deployment note:

- update wrapper пришлось остановить вручную после успешного runtime health, потому что `docker compose ps -q acadepost-migrate` не вернул stopped migrate container, хотя `docker ps -a` показывал `acadepost-migrate ... Exited (0)`.
- дефект deploy script исправлен в репозитории: health gate теперь делает fallback на `docker compose ps -a -q` для one-shot services, а `scripts/docker/test-update-script.sh` покрывает этот кейс.

## Что уже сделано по процессу анализа

Созданы и зафиксированы документы контроля:

- `docs/acadepost-functional-validation-plan.md` - общий BYAN-план проверки функционала.
- `docs/feature-readiness-matrix.md` - матрица готовности функций по статусам `UI_ONLY`, `API_EXISTS`, `E2E_VERIFIED` и так далее.
- `docs/public-api-readiness.md` - отдельный разбор Public API: что покрыто, что не покрыто, какие smoke-проверки нужны.
- `docs/acadepost-api-route-inventory-2026-05-26.md` - inventory app/Public API routes and auth boundaries found in code.
- `docs/security/acadepost-security-review-current.md` - current incremental security review after `v1.1.9`, with `v1.1.10` hardening findings.
- `docs/integrations/n8n-acadepost-smoke.md` - smoke-процедура для self-host n8n.
- `docs/integrations/n8n-acadepost-agent-smoke-workflow.json` - импортируемый workflow для n8n.
- `docs/content-routing.md` - продуктовый brief по будущему routing engine.

Эти документы переводят работу из режима “ощущений” в режим проверяемых статусов.

## Главные выводы на текущий момент

### Content Routing

Текущий статус: `UI_ONLY`.

Фактическое состояние:

- `/content-routing` существует как frontend-страница;
- на странице есть группы `video`, `short_text`, `carousel`;
- страница только показывает рекомендации и ссылки на `/editor`, `/launches`, `/media`;
- нет найденного backend route для routing;
- нет поля routing metadata в `CreatePostDto`;
- нет поля routing metadata в Prisma `Post`;
- нет механизма “контент пришел -> AcadePost выбрал каналы -> создал посты/черновики”.

Продуктовое уточнение владельца:

Content Routing должен решать, куда отправлять публикации для отложенной и прямой публикации. Пример: короткий текст не должен по умолчанию идти в Instagram; вертикальное видео должно идти в TikTok, YouTube Shorts, Reels; лонгриды должны идти в Telegram/Facebook, а Instagram только при наличии изображения.

Вывод:

это отдельная продуктовая реализация следующей версии, а не косметическая доработка текущей страницы.

### Public API

Текущий статус: `API_EXISTS`, но не “полное управление всем AcadePost”.

Покрыто API-поверхностью:

- upload;
- upload-from-url;
- posts create/list/update/delete/status/release-id;
- templates list/render;
- agent-runs create/get;
- integrations list/social URL/settings/tools;
- notifications;
- analytics.

Не доказано или не покрыто как полноценное публичное управление:

- Content Routing;
- provider credential CRUD;
- project/user/role administration;
- полный provider setup;
- client-grade API collection с негативными тестами.

Вывод:

через API уже можно автоматизировать часть publishing/agent workflows, но нельзя честно говорить “всем функционалом AcadePost можно управлять через API”.

### n8n / External Agents

Текущий статус: `API_EXISTS`, self-host smoke еще не выполнен.

Что есть:

- app API `/agent-webhooks`;
- Public API `/public/v1/agent-runs`;
- `ExternalAgent` и `AgentRun` модели;
- agent id/secret проверяются;
- `human_in_the_loop` агенту запрещено `schedule`/`now`;
- подготовлен n8n workflow для теста.

Что нужно доказать:

- AcadePost реально достучится до self-host n8n по HTTPS;
- n8n получит payload;
- AcadePost корректно обработает response;
- wrong secret fails;
- human-in-the-loop не может публиковать напрямую;
- тот же тест повторяется на клиентском self-host сервере.

### Docker / Deployment

Текущий статус: `E2E_VERIFIED` для текущего demo/shared-infra сервера, но не `SELF_HOST_VERIFIED`.

Что доказано:

- `v1.1.9` развернут через GHCR image;
- backend/frontend/orchestrator healthy;
- public readiness endpoint отвечает `200`;
- app-only update path работает на текущем сервере;
- версия перед деплоем была обновлена.

Что не доказано:

- чистая установка на клиентском VPS с нуля;
- rollback на предыдущий tag/digest;
- backup/restore;
- production resource limits;
- digest pinning;
- миграционная стратегия вместо demo `db push`.

### Security

Текущий статус: `NEEDS_REVIEW`, но один найденный риск уже исправлен в `v1.1.9`.

Что найдено:

- app API `POST /posts` логировал полный request body;
- это могло уносить контент поста, media payload и provider settings в container logs.

Что сделано:

- лог удален в `v1.1.9`;
- заодно удален leftover `console.log('hello')` из media video route.

Что дальше:

- отдельный security review после деплоя `v1.1.9`;
- rate limits;
- API key rotation;
- agent secret rotation;
- upload SSRF/size/MIME negative tests;
- OAuth state/provider flows;
- Docker exposed ports and secret handling.

## Что уже реально доказано

1. `v1.1.9` реально развернут на `https://post.fgln.pro`.
2. Readiness endpoint публично отвечает `200`.
3. Текущая версия приложения перед деплоем была обновлена.
4. Основные regression tests для последних изменений прошли.
5. Content Routing сейчас не является работающим routing engine.
6. Public API существует, но не покрывает весь продукт.
7. n8n интеграция имеет backend/API основу, но требует self-host smoke.
8. Docker demo/shared-infra путь работает на текущем сервере, но clean client install еще не доказан.
9. Один security finding уже переведен в hotfix `v1.1.9`.
10. Deploy script bug по one-shot `acadepost-migrate` найден и исправлен в репозитории.
11. Runtime `v1.1.9` и исходники не содержат удаленный server-side raw body log в `POST /posts`.
12. API route inventory создан; Public API и app API поверхности разделены по auth boundary.

## Дополнительные наблюдения по UI/API связям

Public API UI:

- экран Public API показывает project API key;
- экран умеет показывать MCP-конфиги для Claude Code, Codex, Cursor, VS Code/Copilot и других клиентов;
- ключ маскируется до явного reveal;
- это подтверждает наличие пользовательского API-entrypoint, но не подтверждает полноту управления всем продуктом.

Media UI:

- `/media` подключен к media layout;
- media picker ходит в app API `/media`;
- upload UI использует Uppy;
- client-side ограничения: изображения до 30MB, видео до 1GB;
- backend validation все равно должен оставаться источником истины, потому что client-side checks можно обойти.

Provider Credentials UI:

- UI загружает `/provider-credentials/providers` и `/provider-credentials`;
- сохранение идет в `/provider-credentials` или `/provider-credentials/:id`;
- проверка credential идет в `/provider-credentials/:id/test`;
- UI показывает warning, если `ACADEPOST_CREDENTIALS_ENCRYPTION_KEY` не включен;
- это подтверждает app-workflow для credential management, но Public API credential management пока не подтвержден.

Minor follow-up:

- в frontend uploader найден `console.log(result)` после завершения upload. Это browser console log, не server container log, поэтому риск ниже, чем у удаленного raw body logging в `POST /posts`, но его стоит убрать в одном из следующих cleanup/hardening шагов.

## Логика дальнейшего анализа

Для каждого функционального блока идем одинаково:

1. Находим UI route.
2. Находим app API и Public API route.
3. Находим service/model/persistence.
4. Проверяем auth boundary: session, role, project API key, agent secret.
5. Проверяем Docker/env зависимость.
6. Делаем smoke на текущем deployed stack.
7. Делаем негативный тест: чужой org, wrong key/secret, bad payload.
8. Если функция должна быть client-ready, повторяем на clean self-host path.
9. Обновляем `docs/feature-readiness-matrix.md`.

## Следующая очередь работ

P0:

1. Зафиксировать deployment evidence для `v1.1.9`.
2. Протянуть исправленный deploy script в серверный checkout перед следующим деплоем.
3. Продолжить smoke-проверки по матрице.

P1:

1. Продолжить анализ Public API через smoke collection.
2. Прогнать n8n self-host smoke, когда будет доступен n8n URL/credential.
3. Проверить media upload/list/render на deployed stack.
4. Проверить draft/schedule lifecycle без внешнего provider.
5. Проверить Telegram credential как первый low-friction provider.

P2:

1. Спроектировать и реализовать Content Routing как routing engine.
2. Добавить routing metadata.
3. Добавить preview API.
4. Подключить UI к реальному workflow.
5. Добавить tests.
