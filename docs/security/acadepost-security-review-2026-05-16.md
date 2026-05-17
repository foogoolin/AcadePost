# Security review AcadePost - 2026-05-16

## Résumé exécutif

Проверка была сфокусирована на новых зонах риска после добавления n8n agents, Editor templates, Public API и Docker demo deployment.

Вердикт после правок: demo-путь стал заметно безопаснее для клиентского показа и тестового деплоя. Критичные найденные bypass-риски закрыты в коммите `fd9309d5 Harden n8n agent and demo deploy security`.

Это не production-аудит. Перед production всё ещё нужны отдельные hardening-задачи: pin image digest, изоляция Temporal, нормальная миграционная стратегия вместо `db push`, rate limits и полноценные e2e/security tests.

## Scope

Проверялись:

- Public API endpoints для n8n и external agents.
- Full Access / Human in the loop модель прав.
- Agent secrets и risk of leakage.
- SSRF surfaces: webhook URL, upload-from-url, template render image URL.
- Docker demo и shared-infra compose.
- Health endpoints и disclosure internal topology.
- GHCR/update path.
- `.env.demo*.example` и placeholder-секреты.

Не проверялось глубоко:

- Полный OAuth product flow.
- Все старые social provider integrations.
- Полный production threat model.
- Реальный сервер Contabo через SSH.
- Полный browser e2e после security-pass.

## BYAN workflow

Использованные роли:

- BYAN Skeptic: проверка agent scopes, Full Access, public API bypass, secret persistence, SSRF edge cases.
- BYAN Rachid: проверка Docker/GHCR/update path, ports, env defaults, healthcheck disclosure.

Основные подтверждённые выводы BYAN были исправлены в этом security-pass.

## Sources

Внешние источники, использованные для проверки типичных ошибок AI/agent security:

- OWASP LLM06 Excessive Agency: https://genai.owasp.org/llmrisk/llm062025-excessive-agency/
- OWASP LLM02 Sensitive Information Disclosure: https://genai.owasp.org/llmrisk/llm022025-sensitive-information-disclosure/
- OWASP SSRF Prevention Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html
- GitHub push protection: https://docs.github.com/en/code-security/concepts/secret-security/about-push-protection
- OpenSSF guidance on AI code assistant instructions: https://openssf.org/blog/2025/09/16/new-openssf-guidance-on-ai-code-assistant-instructions/

## Token model

Правильная модель для AcadéPost + n8n:

- Project API key: главный server-to-server ключ проекта AcadéPost.
- Agent token/headers: отдельная пара для конкретного n8n-агента:
  - `x-acadepost-agent-id`
  - `x-acadepost-agent-secret`

Full Access остаётся возможным и намеренно широким, но теперь он должен быть выдан конкретному агенту. Это важно: если агент скомпрометирован, его можно отключить или ротировать отдельно от project API key.

Human in the loop остаётся default-режимом. Такой агент создаёт proposal/draft, а человек подтверждает публикацию в календаре.

## Fixed findings

### 1. Full Access bypass через `/public/v1/agent-runs`

Severity before fix: High.

Проблема: endpoint мог создать `schedule` или `now` без `externalAgentId`, то есть без проверки agent secret/scopes.

Fix:

- `/public/v1/agent-runs` теперь требует agent id.
- Secret проверяется через `x-acadepost-agent-secret`.
- Required scopes зависят от mode:
  - `draft` / `proposal` -> `posts:write`
  - `schedule` -> `posts:write`, `posts:schedule`
  - `now` -> `posts:write`, `posts:publish`

Files:

- `apps/backend/src/public-api/routes/v1/public.integrations.controller.ts`
- `libraries/nestjs-libraries/src/dtos/external-agents/external.agents.dto.ts`

### 2. Agent secret мог попасть в persisted `AgentRun.input`

Severity before fix: Medium.

Проблема: DTO разрешал `secret` в body, а body сохранялся в `AgentRun.input`. Потом `GET /public/v1/agent-runs/:id` мог вернуть сохранённый input.

Fix:

- `secret` удалён из `PublicAgentRunDto`.
- Для agent-runs secret принимается только через header.
- Перед сохранением input проходит `sanitizeAgentRunInput`.

Files:

- `libraries/nestjs-libraries/src/dtos/external-agents/external.agents.dto.ts`
- `apps/backend/src/public-api/routes/v1/public.integrations.controller.ts`

### 3. OAuth `pos_` tokens были эквивалентны Public API key

Severity before fix: High.

Проблема: Public API принимал `Bearer pos_...` OAuth token и выдавал synthetic `SUPERADMIN` org context. Для demo/n8n это слишком широкая поверхность.

Fix:

- Добавлен `PUBLIC_API_ALLOW_OAUTH=false`.
- По умолчанию Public API принимает project API key, а OAuth tokens отключены.
- UI developer note обновлён: OAuth tokens для Public API в demo disabled by default.

Files:

- `apps/backend/src/services/auth/public.auth.middleware.ts`
- `apps/frontend/src/components/developer/developer.component.tsx`
- `.env.demo.example`
- `.env.demo.shared-infra.example`

### 4. SSRF edge case: IPv4-mapped IPv6 hex

Severity before fix: Medium.

Проблема: `::ffff:127.0.0.1` блокировался, но hex-форма вроде `::ffff:7f00:1` могла пройти как IPv6.

Fix:

- Добавлен разбор IPv4-mapped IPv6 в dotted и hex формах.
- Неизвестные `::ffff:*` теперь fail-closed.

File:

- `libraries/nestjs-libraries/src/dtos/webhooks/webhook.url.validator.ts`

### 5. Public fetch без timeout / size guard

Severity before fix: Medium.

Проблема: external webhook и remote image/url fetch могли зависать или скачивать слишком большой payload.

Fix:

- 15s timeout для webhook calls.
- 15s timeout для public upload-from-url.
- 15s timeout для template render image fetch.
- Size limits:
  - images: 10 MB
  - videos: 1 GB
  - template source image: 10 MB

Files:

- `libraries/nestjs-libraries/src/database/prisma/external-agents/external.agents.service.ts`
- `apps/backend/src/public-api/routes/v1/public.integrations.controller.ts`
- `libraries/nestjs-libraries/src/database/prisma/post-templates/post.templates.service.ts`

### 6. Public post API логировал payload

Severity before fix: Low/Medium.

Проблема: `console.log(JSON.stringify(body, null, 2))` мог вывести content/media/public API payload в logs.

Fix:

- Лог удалён.

File:

- `apps/backend/src/public-api/routes/v1/public.integrations.controller.ts`

### 7. `/api/monitor/ready` раскрывал dependency topology

Severity before fix: Low.

Проблема: readiness endpoint возвращал dependency names, host и port.

Fix:

- Endpoint продолжает делать internal checks, но наружу возвращает только minimal status.

File:

- `apps/backend/src/api/routes/monitor.controller.ts`

### 8. Temporal UI debug мог быть опубликован на все host interfaces

Severity before fix: Low.

Проблема: clean-VPS debug profile мог публиковать Temporal UI как `8080:8080`.

Fix:

- Default bind изменён на `127.0.0.1`.
- Добавлен `TEMPORAL_UI_BIND=127.0.0.1`.

Files:

- `docker-compose.demo.yaml`
- `.env.demo.example`

### 9. Shared-infra `ACADEPOST_DEMO_DB_PUSH` default был небезопасным

Severity before fix: Medium.

Проблема: shared-infra compose мог запускать `db push` по умолчанию, если env был неполным.

Fix:

- В shared-infra compose default изменён на `false`.
- Документация подчёркивает: включать `true` только для controlled bootstrap.

Files:

- `docker-compose.demo.shared-infra.yaml`
- `.env.demo.shared-infra.example`
- `docs/demo-shared-infra-deploy.md`

### 10. Docker update path не показывал previous digest

Severity before fix: Low.

Проблема: сервер обновлялся через mutable `:demo`, но rollback был только текстовой рекомендацией.

Fix:

- `deploy/demo/update.sh` предупреждает про mutable tag.
- Перед recreate печатает previous image/digest, если Docker может его определить.

File:

- `deploy/demo/update.sh`

## Env placeholders

В `.env.demo.example` и `.env.demo.shared-infra.example` добавлены placeholder-подсказки формата для:

- OpenAI
- Meta/Facebook/Threads
- Pinterest
- TikTok
- YouTube
- X
- LinkedIn
- Reddit
- GitHub
- Discord
- Slack
- Mastodon
- Stripe

Важно: это не реальные секреты. Это подсказки формата. Реальные credentials должны храниться только в runtime `.env` на сервере или в секрет-хранилище.

## Verification

Выполнено локально:

```bash
corepack pnpm run prisma-generate
$env:NODE_OPTIONS='--max-old-space-size=4096'; corepack pnpm --filter ./apps/backend run build
$env:NODE_OPTIONS='--max-old-space-size=4096'; corepack pnpm --filter ./apps/frontend run build
$env:NODE_OPTIONS='--max-old-space-size=4096'; corepack pnpm --filter ./apps/orchestrator run build
docker compose --env-file .env.demo.example -f docker-compose.demo.yaml config --quiet
docker compose --env-file .env.demo.shared-infra.example -f docker-compose.demo.shared-infra.yaml config --quiet
git diff --check
```

Также выполнена mojibake-проверка по правилу из `docs/codex-project-memory.md`.

Known local caveat:

- Локально используется Node `v24.13.0`, а проект ожидает `>=22.12.0 <23.0.0`.
- Builds прошли, но для CI/server лучше использовать Node 22.x.

## Residual risks

### Mutable GHCR tag

`ghcr.io/foogoolin/acadepost:demo` удобен как moving tag для последней MVP-сборки, но mutable. Для production или важного client demo лучше использовать versioned tag вроде `ghcr.io/foogoolin/acadepost:v1.1.0`, SHA tag или digest.

Recommendation:

- Для demo можно оставить `:demo`.
- Для стабильного показа использовать `ACADEPOST_IMAGE=ghcr.io/foogoolin/acadepost:<sha>`.

### Temporal в shared Docker network

Temporal доступен контейнерам в shared `backend` network. Это не internet exposure, но lateral movement risk.

Recommendation:

- По возможности держать Temporal в отдельной internal network.
- Для production изучить Temporal auth/mTLS.

### Project API key остаётся root credential

n8n пока всё ещё использует project API key как server-to-server credential. Agent headers добавляют control layer, но если project API key утечёт, риск высокий.

Recommendation:

- Следующий этап: отдельная auth path для agent-only credentials, чтобы n8n мог выполнять только agent-scoped API без project root key.

### Rate limits и audit logs

Public API имеет базовые лимиты, но agent-specific audit/rate policy пока минимальна.

Recommendation:

- Добавить per-agent rate limits.
- Логировать agent id, action, mode, post ids, status.
- Показывать историю agent runs в UI.

### Full Access

Full Access нужен по бизнес-требованию, но он опасен по определению.

Recommendation:

- Оставить Full Access только opt-in.
- Показывать warning в UI.
- Для `now` и `posts:publish` желательно добавить secondary confirmation или allowlist для production.

## Next security tasks

1. Сделать agent-only authentication без project API key для scoped n8n agents.
2. Добавить per-agent rate limit и audit log.
3. Добавить e2e tests:
   - agent without secret -> reject
   - human_in_the_loop + `now` -> reject
   - full_access without `posts:publish` -> reject
   - body secret is not persisted
   - SSRF IPv4-mapped IPv6 blocked
4. Добавить pinned-image deployment option в docs.
5. Разделить demo readiness `/health` и internal readiness details, если понадобится Caddy upstream check.
6. Перед production убрать `db push` из runtime startup и заменить на controlled migrations.
