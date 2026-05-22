# Provider Pipeline Rework Implementation Plan

Status: `[FD:DOC]`
Date: 2026-05-22
Owner: BYAN/Codex
Working fork: `/opt/AcadePost-provider-rework`
Branch: `byan/provider-pipeline-rework`
BYAN FD: `20260522-100231-provider-pipeline-rework`

## Purpose

Rework the AcadéPost publishing service around a clear provider pipeline:

`Composer -> optional Template -> Destination -> Operation -> Provider Options -> Publish/Schedule -> Logs`

The target is to make credentials, channels, publishing intent, provider-specific operations, scheduling, and audit logs separate and explicit. This avoids the current ambiguity where the backend often infers a provider action from media shape, and where user-facing concepts such as Telegram `chat_id` can drift into environment/configuration concerns.

## Activated Tooling

- BYAN MCP: active FD session created for `provider-pipeline-rework`; current phase is `DOC`.
- Build Web Apps frontend workflow: use for information architecture, UI states, responsive layout, and browser-grade UX checks.
- Build Web Apps React workflow: apply existing Next/React patterns, keep state boundaries clear, avoid unnecessary client waterfalls and broad rerenders.
- Frontend testing workflow: Browser plugin is not exposed in the current tool list; use Playwright as the fallback for desktop/mobile smoke checks when implementation starts.
- Mermaid Chart plugin: available for pipeline diagrams and future UI/data-flow sketches.

## Non-Negotiables

- No implementation starts before Ilya validates this plan with `ok doc`.
- `Identifiants` owns API access only: tokens, OAuth secrets, API keys, encrypted provider credentials.
- `Canaux/Destinations` owns publish targets: Telegram chat/channel, pages, profiles, groups, webhook targets, and equivalent destination IDs.
- `.env` is not the normal place for user destination IDs such as Telegram `chat_id`.
- Composer owns publishing intent: selected destination, operation, text, media, template, provider options, and publish/schedule mode.
- Calendar owns schedule/status visibility, not credentials or destination setup.
- Logs must never store tokens, OAuth secrets, API keys, refresh tokens, raw authorization headers, or exposed chat secrets.
- Do not claim a provider works until a real app/credential/connect/publish/status path has been verified.
- Preserve AcadéPost branding, black primary color, `#4cccb8` main accent, `#fda100` secondary accent, dark and light themes.

## Current System Anchors

- Composer state starts in `apps/frontend/src/components/new-launch/store.ts`.
- Publish DTO currently flows through `libraries/nestjs-libraries/src/dtos/posts/create.post.dto.ts`.
- Telegram currently selects Bot API calls implicitly in `libraries/nestjs-libraries/src/integrations/social/telegram.provider.ts`.
- Prisma already has `ProviderCredential`, `Integration`, `Post`, and `PostTemplate` in `libraries/nestjs-libraries/src/database/prisma/schema.prisma`.
- `Integration.providerCredentialId` already links destinations to saved credentials.
- Missing durable concepts: explicit publish operation, provider operation metadata, connection log, publish attempt log, and central secret sanitization contract.

## Target Domain Model

### Credential

Represents encrypted provider access.

- Existing anchor: `ProviderCredential`.
- UI owner: `Paramètres -> Identifiants`.
- Stores encrypted fields and masked public metadata only.
- Test action writes sanitized connection log entries.

### Destination

Represents a concrete publish target.

- Existing anchor: `Integration`.
- UI owner: `Canaux` / add-channel flow.
- Stores provider, target identity, display name, linked `providerCredentialId`, and provider target metadata.
- Must not duplicate raw secrets.

### Draft

Represents the composer payload before publishing.

- Existing anchors: `CreatePostDto`, `new-launch` store.
- Must carry selected destination IDs, operation IDs, content blocks, media, template references, provider options, and publish intent.

### Template

Reusable content structure.

- Existing anchors: `PostTemplate`, `PostTemplatesService.render()`.
- Used before publish operation selection is executed.
- Template rendering should not hide the final operation or destination choices.

### Operation

Explicit provider action selected by composer or derived with a visible default.

- New field target: operation identifier persisted on draft/post payload.
- Telegram first operations:
  - `telegram.message.send`
  - `telegram.photo.send`
  - `telegram.mediaGroup.send`
  - `telegram.document.send`
- Provider services may still validate compatibility from text/media shape, but the operation must be visible and recorded.

### Publish Attempt

Durable record of a provider call.

- New model target: `ProviderPublishAttempt`.
- Links to organization, integration/destination, optional post, provider, credential ID reference, operation ID, request summary, response summary, status, timings, and sanitized error.
- Stores no raw secrets.

### Connection Log

Durable record of credential test/connect events.

- New model target: `ProviderConnectionLog`.
- Links to organization, provider, credential ID reference, action, status, sanitized request/response summaries, and error.
- Stores no raw secrets.

## Backend Workstreams

### 1. Prisma Schema And Repositories

- Add `ProviderConnectionLog` and `ProviderPublishAttempt`.
- Add indexes by organization, provider, integration, credential, status, and created date.
- Add operation fields to persisted publish records where needed.
- Generate Prisma client and add repository/service methods.
- Keep migrations focused; no unrelated schema churn.

### 2. Sanitization Contract

- Add a central sanitizer for logs and provider summaries.
- Redact common secret keys and authorization patterns.
- Cover nested objects, arrays, headers, URLs, Telegram bot tokens, OAuth tokens, and unknown provider fields.
- Add unit tests before wiring logs into provider flows.

### 3. Credential Connection Logging

- Wrap credential test flows in connection logging.
- Record success/failure with provider, credential reference, timing, and sanitized response.
- Ensure failed validation never stores raw submitted fields.
- Keep the existing disabled state when `ACADEPOST_CREDENTIALS_ENCRYPTION_KEY` is invalid.

### 4. Publish Attempt Logging

- Wrap publish orchestration/provider calls.
- Write attempt start/end records with operation ID, destination, post ID when available, release ID/URL when returned, provider status, timing, and sanitized errors.
- Make retries and partial failures visible enough for Calendar and Logs views.

### 5. Telegram Operation Layer

- Introduce explicit Telegram operation metadata.
- Map selected operation to current provider methods:
  - text-only to Bot API `sendMessage`
  - single photo/video/document to the matching media call
  - multiple media to `sendMediaGroup`
- Validate unsupported combinations before provider call.
- Keep compatibility defaults for older payloads during migration.

## Frontend Workstreams

### 1. UI Vocabulary Pass

- Use `Identifiants` only for provider access.
- Use `Canaux` / `Destinations` only for publish targets.
- Avoid suggesting Telegram destination IDs belong in `.env`.
- Keep French UI copy consistent with existing settings and launch screens.

### 2. Add Channel Flow

- Show saved credentials for the selected provider.
- Bind destination to a credential through `providerCredentialId`.
- Capture destination-specific fields such as Telegram chat/channel ID in the channel setup flow.
- Show connection/test state without exposing secrets.

### 3. Composer Contract

- Extend composer state to include:
  - selected destination IDs
  - selected operation ID per destination/provider
  - provider options
  - template reference/rendered content
  - publish/schedule intent
- Keep the default path fast: select destination, compose, publish.
- Avoid making provider setup part of the composer.

### 4. Operation Selector

- Show operation choices only when useful.
- Pick sensible defaults from current text/media shape.
- Surface incompatibilities inline before publish.
- Keep controls compact and consistent with existing Mantine/Tailwind patterns.

### 5. Calendar And Logs

- Calendar shows schedule/status, provider status, release URL, and last error summary.
- Add or expose a logs surface for connection logs and publish attempts.
- Logs are searchable/filterable by provider, destination, status, operation, and date.

### 6. UI Quality Gates

- Maintain light/dark theme parity.
- Check mobile and desktop layouts.
- Avoid nested cards and marketing-style pages; this is an operational SaaS UI.
- Use existing component patterns first; do not introduce shadcn unless the repo explicitly adopts it.

## Implementation Sequence

1. Finalize this plan and wait for `ok doc`.
2. Add schema models and repositories for connection logs and publish attempts.
3. Add sanitizer service and unit tests.
4. Wire credential test logging.
5. Wire publish attempt logging around the current publish flow.
6. Add provider operation metadata and Telegram explicit operations.
7. Extend DTOs and composer store with operation/provider options while keeping backward compatibility.
8. Update add-channel and composer UI vocabulary/flows.
9. Add Calendar/Logs visibility for statuses and attempts.
10. Run verification: targeted unit tests, Prisma generation, frontend build, mojibake scan, Playwright desktop/mobile smoke, then real server/provider proof when credentials are available.

## Acceptance Criteria

- A Telegram bot token is saved and tested through `Identifiants`; the connection log records the result without leaking the token.
- A Telegram channel/chat destination is created through `Canaux` and linked to a saved credential.
- Composer can publish/schedule text, media, media group, document, and template-derived content to a selected destination.
- The selected or defaulted operation is visible in the UI and persisted in publish records.
- Calendar shows status, release URL when available, and sanitized error summaries.
- Logs show connection tests and publish attempts without raw secrets.
- Existing demo paths still build and run.
- Docker/server verification is performed before any production/provider-working claim.

## Risks

- Existing publish payloads may depend on implicit Telegram behavior; compatibility defaults are required.
- Logging can accidentally capture sensitive provider payloads unless sanitizer tests are strict.
- UI scope can expand quickly; first pass must stay on operational flows, not a full app redesign.
- Real provider proof depends on valid bot/channel credentials and deployed runtime configuration.

## Next Gate

Implementation starts only after Ilya confirms:

`ok doc`
