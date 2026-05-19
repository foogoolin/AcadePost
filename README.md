# AcadéPost

AcadéPost is a self-hostable social publishing workspace for planning, preparing, scheduling and publishing content across multiple social platforms.

Current version: `v1.1.6`

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
ghcr.io/foogoolin/acadepost:v1.1.6
```

Two Compose modes are provided:

- `docker-compose.demo.yaml` for a clean VPS stack.
- `docker-compose.demo.shared-infra.yaml` for servers that already provide reverse proxy, PostgreSQL and Docker networks.

The install path uses prebuilt images only. The public service is an nginx proxy named `acadepost`; backend, frontend and orchestrator run as separate internal containers from the same optimized app image. The server must not run `docker build` for normal installs or updates.

Before `:latest` is published, GitHub Actions builds the image, checks the archive size, starts the Compose stack, waits for `/api/monitor/ready` and checks the backend, frontend, orchestrator and proxy service health. This validation can take several minutes in CI, but it happens before the VPS update path.

Release evidence for `v1.1.5`: the hotfixed Docker workflow for commit `b4aad511` passed the Compose smoke gate in run `26035055443` and published `ghcr.io/foogoolin/acadepost:latest`. The follow-up Contabo shared-infra update pulled that image successfully and reached public readiness.

Release evidence for `v1.1.6`: commit `34045ef7` passed `Build`, `Code Quality Analysis` and `Build demo image`; Docker run `26040847349` published the image after Compose smoke. The Contabo shared-infra stack was then pinned to `ghcr.io/foogoolin/acadepost:v1.1.6`, public readiness returned `ok`, and the frontend runtime reported `NEXT_PUBLIC_VERSION=v1.1.6`.

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

On an existing shared-infra host where Redis, Temporal or Elasticsearch should not be restarted, use the app-only `--no-deps` Compose flow documented in `docs/demo-docker-update.md` until the update script has a dedicated app-only mode.

Deployment docs:

- `docs/demo-server-deploy.md`
- `docs/demo-shared-infra-deploy.md`
- `docs/demo-docker-update.md`
- `docs/provider-credentials-guide.md`

## Configuration

Important runtime values are supplied through `.env`:

```env
ACADEPOST_PUBLIC_URL=https://your-domain.example
ACADEPOST_IMAGE=ghcr.io/foogoolin/acadepost:latest
DATABASE_URL=postgresql://user:password@postgres:5432/acadepost
JWT_SECRET=change-me
ACADEPOST_CREDENTIALS_ENCRYPTION_KEY=change-me
TRUST_PROXY=true
```

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

- `PROJECT_PLAN.md` - current implementation plan and decisions.
- `CHANGELOG.md` - version history.
- `AGENTS.md` - working rules for coding agents.
- `docs/integrations/social-provider-readiness-2026-05-16.md` - provider readiness matrix.
- `docs/product/postiz-feature-comparison-2026-05-16.md` - feature comparison and product gaps.
- `docs/provider-credentials-guide.md` - n8n-like provider credentials setup, examples and edge cases.
- `docs/security/acadepost-security-review-2026-05-16.md` - latest security review.
- `docs/codex-project-memory.md` - encoding and Docker guardrails.
