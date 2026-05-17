# AcadéPost

AcadéPost is a self-hostable social publishing workspace for planning, preparing, scheduling and publishing content across multiple social platforms.

Current version: `v1.1.2`

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

`.env` is still used for infrastructure and legacy/demo fallback values such as database, Redis, public URL, JWT, encryption key, SMTP and optional provider fallback credentials.

## Deployment

AcadéPost publishes Docker images to GitHub Container Registry.

Recommended install image:

```text
ghcr.io/foogoolin/acadepost:latest
```

A moving image tag is also available for the latest MVP build from `main`:

```text
ghcr.io/foogoolin/acadepost:demo
```

For normal installs, use `:latest`. For a locked rollback target, use a versioned or SHA image.

Versioned images are published for releases, for example:

```text
ghcr.io/foogoolin/acadepost:v1.1.2
```

Two Compose modes are provided:

- `docker-compose.demo.yaml` for a clean VPS stack.
- `docker-compose.demo.shared-infra.yaml` for servers that already provide reverse proxy, PostgreSQL and Docker networks.

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

Deployment docs:

- `docs/demo-server-deploy.md`
- `docs/demo-shared-infra-deploy.md`
- `docs/demo-docker-update.md`

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

Telegram uses a bot token rather than OAuth. Create the bot in BotFather, add the bot to the group/channel, then connect it from the AcadéPost UI.

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
- `docs/security/acadepost-security-review-2026-05-16.md` - latest security review.
- `docs/codex-project-memory.md` - encoding and mojibake guardrails.
