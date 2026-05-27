# Telegram Intake and Routing Rework Plan

Date: 2026-05-27
Status: branche GitHub poussee; image GHCR publiee; conteneurs serveur recrees depuis l'image publiee
BYAN session: `acadepost-telegram-intake`

## Goal

Replace the visible standalone content-routing UI with a backend-owned Telegram intake flow.

AcadéPost remains the source of truth for content, drafts, scheduling, destination selection, rendering, publishing, status, and errors. Telegram is only an input/control surface.

All user-facing Telegram bot copy for this flow must be in French. Internal callback payloads and persistence states may remain technical English identifiers.

Product model update:

- AcadéPost is a sellable client product. Telegram setup must become repeatable by a client admin, not only by an operator editing server environment variables.
- The Telegram publishing bot and the AcadéPost control bot are separate roles. The publishing bot sends posts to Telegram destinations; the control bot is a Telegram mini-UI for controlling AcadéPost posts.
- The current deployed control bot proves the server path, but it is not the final B2C onboarding flow.

## Source Artifacts

- Project memory: `/root/_byan-output/project-memory.md`
- BYAN kanban: `/root/_byan-output/party-mode-sessions/acadepost-telegram-intake/kanban.json`
- BYAN peer review: `/root/_byan-output/reviews/acadepost-telegram-intake-memory-review.json`
- Superseded UI note: `docs/content-routing.md`

## Release Rule

The final delivery must not remain on a local Docker image. Build and publish a GHCR image, then recreate the server containers from that published image.

Use only the product version in public runtime display:

- `NEXT_PUBLIC_VERSION=1.11.1`
- no feature suffix;
- no local label;
- no commit hash in the user-visible version.

Preuve release :

- Image GHCR : `ghcr.io/foogoolin/acadepost:1.11.1`.
- Digest GHCR index : `sha256:f94dd8aa5c2e4cf80c007171d64891878c128b4856129e6b1c09827f5a4492f5`.
- GitHub Actions `Build demo image` run `26517785041` : succes, avec smoke Compose et push GHCR.
- Serveur `post.fgln.pro` : backend/frontend/orchestrator tournent depuis `ghcr.io/foogoolin/acadepost:1.11.1`; health Docker et `/api/monitor/ready` sont sains.

## BYAN MCP Operating Rule

BYAN MCP is the workflow driver for this plan. The implementer must checkpoint through local BYAN MCP artifacts:

- before starting or resuming work;
- after each stage/card transition;
- after each validation gate;
- at least every 20 minutes or every 5 meaningful tool cycles during long implementation;
- before final response, pause, or likely context compaction.

Each checkpoint must include current stage/card, files or artifacts changed, validation result or blocker, and next action.

## Non-Goals

- Do not build a new standalone routing screen.
- Do not store drafts, scheduling state, or selected destinations only in Telegram.
- Do not put full state inside Telegram callback payloads.
- Do not refactor unrelated provider publishing code during Stage 0.
- Do not deploy or release without explicit release validation.
- Do not treat a single global `TELEGRAM_INTAKE_BOT_TOKEN` as the final client-facing model.
- Do not require customers to discover Telegram user IDs or chat IDs manually.

## Delivery Order

### Stage 0 - Remove standalone routing UI

Priority: P0
Status: done

Tasks:

- Remove the `Routage` sidebar entry.
- Remove the `/content-routing` page.
- Remove dead routing-specific frontend styles.
- Update demo and working-rule docs so they no longer require a visible routing screen.
- Verify no active frontend route or navigation link points to `/content-routing`.
- Run frontend build or record the exact blocker.

Acceptance:

- Normal users cannot access routing as a first-class UI screen from the app shell.
- Product docs say routing appears only as validation, warnings, consequences, or backend intake behavior.
- Existing publishing/calendar/editor surfaces stay intact.

### Stage 1 - Define Telegram intake persistence

Priority: P0
Status: done

Tasks:

- Add a persistent `TelegramIntakeSession` or equivalent model.
- Store workspace/organization, actor/user, Telegram chat ID, message ID, update ID, original content, media references, selected integration IDs, mode, schedule date, state, errors/warnings, resulting post IDs, and timestamps.
- Add idempotency constraints for Telegram update processing.

Acceptance:

- AcadéPost can recover an intake session from database state alone.
- Replayed Telegram updates do not duplicate drafts or publish attempts.

### Stage 2 - Configure bot auth and webhook contract

Priority: P0
Status: done

Tasks:

- Define secure bot token storage.
- Define webhook URL configuration.
- Map Telegram users/chats to an AcadéPost user/workspace.
- Reject unmapped or unauthorized users.

Acceptance:

- Publishing actions cannot be triggered by unknown Telegram users.
- Secrets are not logged or returned.

### Stage 3 - Build Telegram webhook controller

Priority: P0
Status: done

Tasks:

- Receive Telegram updates.
- Separate new content messages, callback queries, and date/time replies.
- Deduplicate updates.
- Always answer callback queries quickly.

Acceptance:

- Callback state transitions are test-covered.
- Duplicate updates are safe.

### Stage 4 - Render inline keyboard controls

Priority: P0
Status: done

Tasks:

- Render connected social network toggle buttons.
- Render `Mode`, `Confirm`, and `Cancel`.
- Keep callback payloads short, for example `net:<id>`, `mode:next`, `confirm`, `cancel`.
- Store selection state in AcadéPost.

Acceptance:

- The Telegram UI reflects state stored in AcadéPost, not state encoded in callback payloads.

### Stage 5 - Live Telegram message updates

Priority: P1
Status: done

Tasks:

- Update the same Telegram message after toggles and mode changes.
- Use message text/caption/reply-markup edits as appropriate.

Acceptance:

- The flow does not spam the chat with a new message for every toggle.

### Stage 6 - Confirm behavior

Priority: P0
Status: done

Tasks:

- `draft`: create a draft in AcadéPost.
- `now`: create and publish through the existing pipeline.
- `schedule`: ask for date/time, then create scheduled posts.

Acceptance:

- Drafts and scheduled posts are visible/editable inside AcadéPost.
- Publish-now uses existing provider safety checks and logs.

### Stage 7 - Schedule parser

Priority: P1
Status: done

Tasks:

- Parse simple date/time input such as `today 18:00`, `tomorrow 09:30`, and `28.05 14:00`.
- Normalize to workspace/user timezone.
- Reject past or ambiguous dates with actionable errors.

Acceptance:

- Timezone behavior is deterministic and test-covered.

### Stage 8 - Platform-specific rendering

Priority: P0
Status: done

Tasks:

- Render final per-network post bodies.
- Add link blocks according to platform needs.
- Block invalid targets such as Instagram text-only posts unless media is present.

Acceptance:

- The same Telegram intake content can produce different final post text per destination.
- Invalid destination/content combinations are blocked before publish.

### Stage 9 - Media intake

Priority: P1
Status: done

Tasks:

- Import Telegram media into AcadéPost storage/media records.
- Support images, videos, and albums as MVP scope allows.
- Validate media/platform compatibility.

Acceptance:

- Media-backed drafts/publishes use AcadéPost media state, not Telegram-only references.

### Stage 10 - Receipts and errors

Priority: P1
Status: done

Tasks:

- Return concise Telegram receipts for draft, schedule, and publish-now.
- Include selected destinations, mode, schedule date when relevant, and optional app links.
- Return actionable errors for no destinations, invalid date, permission denied, missing media, or provider failure.

Acceptance:

- A user can understand the result from Telegram and still inspect/edit state in AcadéPost.

### Stage 11 - Tests and safety checks

Priority: P0
Status: done

Tasks:

- Cover callback state transitions.
- Cover deduplication and idempotency.
- Cover unauthorized Telegram users.
- Cover invalid integration IDs.
- Cover mode cycling.
- Cover schedule parsing.
- Cover no selected networks.
- Cover text-only Instagram exclusion and media validation.
- Cover publish-now permission checks.

Acceptance:

- P0 behavior is test-covered before release.

### Stage 12 - Feature flag and release validation

Priority: P1
Status: done

Tasks:

- Gate Telegram intake behind a feature flag if needed.
- Verify no standalone routing UI remains.
- Run build/test checks.
- Prepare release notes and deployment decision separately.

Acceptance:

- The feature can be enabled deliberately without reintroducing the routing screen.

## Current Local Work Started Before This Plan

Stage 0 was already started before this plan was written:

- Removed the sidebar `Routage` item from `apps/frontend/src/components/layout/top.menu.tsx`.

## Implementation Result

All stages 0-12 are implemented locally and closed in BYAN MCP kanban as of 2026-05-27.

- Standalone routing UI removed from the frontend shell and route table.
- Telegram intake backend added behind `TELEGRAM_INTAKE_ENABLED=true`.
- Webhook requests require `TELEGRAM_INTAKE_WEBHOOK_SECRET`.
- Live Telegram Bot API operations require `TELEGRAM_INTAKE_BOT_TOKEN`.
- Admin binding endpoints map Telegram users/chats to AcadéPost users/workspaces.
- Intake sessions, callback state, selected destinations, schedule mode/date, media references, receipts, warnings, errors, and created post IDs are persisted in AcadéPost.

Final local validation:

- `corepack pnpm exec jest --runTestsByPath ... --runInBand`: 5 suites passed, 16 tests passed.
- `NODE_OPTIONS=--max-old-space-size=6144 corepack pnpm --filter ./apps/backend run build`: passed.
- `corepack pnpm --filter ./apps/frontend run build`: passed; route table does not include `/content-routing`.
- `DATABASE_URL='postgresql://user:pass@localhost:5432/acadepost' corepack pnpm dlx prisma@6.5.0 validate --schema ./libraries/nestjs-libraries/src/database/prisma/schema.prisma`: passed.
- `git diff --check`: passed.
- Deleted `apps/frontend/src/app/(app)/(site)/content-routing/page.tsx`.
- Removed `acadepost-routing-*` styles from `apps/frontend/src/app/global.scss`.
- Updated `AGENTS.md`, `docs/content-routing.md`, and `docs/customer-demo-runbook.md`.
- Installed local dependencies with `corepack pnpm install --frozen-lockfile` because the first frontend build attempt failed with missing `node_modules`.

Release validation required after GitHub/GHCR publication:

- branch pushed to GitHub;
- Docker image pushed to GHCR;
- server `ACADEPOST_IMAGE` points to the GHCR image, not `acadepost:telegram-intake-local`;
- backend, frontend, and orchestrator containers are recreated from the GHCR image;
- `/api/monitor/ready` returns `ok`;
- runtime `NEXT_PUBLIC_VERSION` is exactly `1.11.1`.

## Local Implementation Result

Implemented locally:

- `TelegramIntakeBinding` and `TelegramIntakeSession` persistence.
- Authenticated/admin binding API.
- Public webhook API protected by `x-telegram-bot-api-secret-token`.
- Feature flag guard with `TELEGRAM_INTAKE_ENABLED=true`.
- Deployment bot token usage via `TELEGRAM_INTAKE_BOT_TOKEN`.
- Message intake, callback handling, destination toggle, mode cycling, confirm/cancel.
- Draft/now/schedule creation through existing `PostsService`.
- Simple date parser for `HH:mm`, `today HH:mm`, `tomorrow HH:mm`, and `DD.MM HH:mm`.
- Platform validation for media-required Instagram targets and X text trimming.
- Telegram media import through Bot API `getFile`, existing upload storage, and media records.
- Telegram receipts/errors when bot token is configured.

Validation passed:

- Prisma validate.
- Targeted Telegram intake Jest suites.
- Backend production build.
- Frontend production build.
- Active grep confirms no `/content-routing` route/nav usage remains outside historical/superseded docs.

Runtime configuration required before live smoke:

- `TELEGRAM_INTAKE_ENABLED=true`
- `TELEGRAM_INTAKE_WEBHOOK_SECRET=<shared secret configured in Telegram webhook>`
- `TELEGRAM_INTAKE_BOT_TOKEN=<bot token>`
- A Telegram binding from user/chat to an AcadéPost organization/user.
