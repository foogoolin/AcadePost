# AcadéPost

AcadéPost is a self-hostable social publishing workspace for planning, preparing, scheduling and publishing content across multiple social platforms.

Current version: `1.11.1`

## Overview

AcadéPost provides a team workspace for social publishing:

- Multi-project publishing workspaces.
- Calendar-based scheduled posts.
- Media library.
- Social channel connections.
- Project-level provider credentials.
- n8n/webhook agent integration.
- Human-in-the-loop and full-access agent workflows.
- Editor presets for reusable post and carousel visuals.
- Docker-based self-hosted deployment.

The product is currently an MVP. Provider code can exist before a platform is fully verified with real developer credentials, app review and live publishing smoke tests.

## MVP Provider Credentials

The first provider credentials gate focuses on:

- Telegram.
- Facebook Pages.
- Instagram Business.
- Threads.
- YouTube.
- Pinterest.

Credentials are configured per project from the AcadéPost UI. Facebook, Instagram and Threads are treated as separate credentials, even when a user manually reuses the same Meta app values.

The credential screen follows the n8n-style split between provider definitions and saved credential instances: choose a provider type, save one or more project credentials, keep secrets masked after save, and use `Tester la connexion` before connecting a channel.

The running web UI displays `NEXT_PUBLIC_VERSION` in the lower-left navigation/settings area so the server build can be identified from the browser.

`.env` is still used for infrastructure and legacy/demo fallback values such as database, Redis, public URL, JWT, encryption key, SMTP and optional provider fallback credentials.

## Deployment

AcadéPost publishes Docker images to GitHub Container Registry.

Recommended install image:

```text
ghcr.io/foogoolin/acadepost:latest
```

For normal installs, use `:latest`. For rollback, pin a version tag, SHA tag, or digest.

Versioned images are published for releases, for example:

```text
ghcr.io/foogoolin/acadepost:1.11.1
```

Two Compose modes are provided:

- `docker-compose.demo.yaml` for a clean VPS stack.
- `docker-compose.demo.shared-infra.yaml` for servers that already provide reverse proxy, PostgreSQL and Docker networks.

The install path uses prebuilt images only. The public service is an nginx proxy named `acadepost`; backend, frontend and orchestrator run as separate internal containers from the same optimized app image. The server must not run `docker build` for normal installs or updates.

Before `:latest` is published, GitHub Actions builds the image, checks the archive size, starts the Compose stack, waits for `/api/monitor/ready` and checks the backend, frontend, orchestrator and proxy service health. This validation can take several minutes in CI, but it happens before the normal update path.

Release history is tracked in `CHANGELOG.md`. Internal deployment evidence and old server notes are kept under `docs/internal/`.

Example first-time setup:

```bash
cp .env.demo.example .env.demo
bash deploy/demo/server-up.sh
```

Shared-infra setup:

```bash
cp .env.demo.shared-infra.example .env.demo.shared-infra
bash deploy/demo/server-up-shared-infra.sh
```

Update an existing install by pulling the prebuilt image. The server should not build the app for normal updates:

```bash
bash deploy/demo/update.sh --env .env.demo --compose docker-compose.demo.yaml
```

On an existing shared-infra host where Redis, Temporal or Elasticsearch should not be restarted, use the app-only update mode:

```bash
bash deploy/demo/update.sh \
  --env .env.demo.shared-infra \
  --compose docker-compose.demo.shared-infra.yaml \
  --no-deps
```

Deployment docs:

- `docs/README.md`
- `docs/installation/demo-server-deploy.md`
- `docs/installation/demo-shared-infra-deploy.md`
- `docs/operations/docker-update.md`
- `docs/product/provider-credentials-guide.md`

## Configuration

Important runtime values are supplied through `.env`:

```env
ACADEPOST_PUBLIC_URL=https://your-domain.example
ACADEPOST_IMAGE=ghcr.io/foogoolin/acadepost:latest
DATABASE_URL=postgresql://user:password@postgres:5432/acadepost
JWT_SECRET=change-me
ACADEPOST_CREDENTIALS_ENCRYPTION_KEY=<64-hex-character-value>
TRUST_PROXY=true
```

Generate the credentials encryption key with `openssl rand -hex 32`. Placeholder values such as `change-me`, `change-this`, `CHANGE_ME...`, empty values and arbitrary passphrases intentionally keep credential saving disabled.

External platform apps must use callback URLs in this form:

```text
https://your-domain.example/integrations/social/{provider}
```

Examples:

```text
https://your-domain.example/integrations/social/facebook
https://your-domain.example/integrations/social/instagram
https://your-domain.example/integrations/social/threads
https://your-domain.example/integrations/social/youtube
https://your-domain.example/integrations/social/pinterest
```

Telegram uses a bot token rather than OAuth. In the AcadéPost UI, open `Paramètres > Identifiants`, select `Telegram` in the first provider group, then save `Bot Token` and optional `Bot Name`. Use `Tester la connexion` to validate the bot token against Telegram Bot API, add the bot to the group/channel, then connect it from the AcadéPost UI.

## Local Development

Required Node version:

```text
>=22.12.0 <23.0.0
```

Install dependencies:

```bash
corepack enable
corepack pnpm install --frozen-lockfile
```

Generate Prisma client:

```bash
corepack pnpm run prisma-generate
```

Start local infrastructure:

```bash
corepack pnpm run dev:docker
```

Run the app:

```bash
corepack pnpm run dev
```

## Verification

```bash
corepack pnpm run prisma-generate
corepack pnpm --filter ./apps/backend run build
corepack pnpm --filter ./apps/orchestrator run build
corepack pnpm --filter ./apps/frontend run build
git diff --check
```

Backend and orchestrator builds may need a larger Node heap locally:

```bash
export NODE_OPTIONS=--max-old-space-size=8192
```

PowerShell:

```powershell
$env:NODE_OPTIONS='--max-old-space-size=8192'
```

## Documentation

Start with `docs/README.md`.

- `docs/installation/` - self-host install guides.
- `docs/operations/` - update and runtime operations.
- `docs/product/` - product behavior and provider setup.
- `docs/integrations/` - external integration notes.
- `docs/development/` - developer and API readiness notes.
- `docs/security/` - security reviews and remaining risks.
- `docs/legal/` - legal and ownership notes.
- `docs/internal/` - BYAN/Codex, server, migration, audit and historical material.
