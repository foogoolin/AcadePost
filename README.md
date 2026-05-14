# AcadéPost

AcadéPost is a demo-ready social publishing MVP for planning, routing, scheduling, and publishing social content.

The product goal is to help teams prepare, route, schedule, and publish content across social channels with a workflow organized around content type:

- Video: YouTube, TikTok, Instagram Reels.
- Short text: Threads, X.
- Carousel: Meta, Pinterest.

## Current MVP

This repository keeps the existing upstream architecture for speed:

- pnpm monorepo.
- Next.js frontend.
- NestJS backend.
- Prisma with PostgreSQL.
- Redis.
- Temporal.
- Docker Compose for local/self-hosted runtime.

Some legacy internal aliases and package names may remain during the first MVP when changing them would risk build stability. Customer-facing product language should use AcadéPost.

## Project Memory

The project plan lives in `PROJECT_PLAN.md` and must be updated after meaningful changes.

Working rules for future coding agents live in `AGENTS.md`.

## Local Development

Install dependencies:

```bash
pnpm install
```

Start local infrastructure:

```bash
pnpm run dev:docker
```

Generate Prisma client and push the schema:

```bash
pnpm run prisma-generate
pnpm run prisma-db-push
```

Run the app:

```bash
pnpm run dev
```

## Docker Demo

The main `docker-compose.yaml` is configured as an AcadéPost self-hosted demo stack. It builds the local code with `Dockerfile.dev` and runs the app with PostgreSQL, Redis, and Temporal.

```bash
docker compose up --build
```

For a raw single-server demo deployment, use the dedicated demo compose:

```bash
cp .env.demo.example .env.demo
docker compose --env-file .env.demo -f docker-compose.demo.yaml up -d --build
```

On a Linux VPS, the assisted demo launcher can create `.env.demo`, generate demo secrets, validate Compose, and start the stack:

```bash
ACADEPOST_PUBLIC_URL=http://SERVER_IP:4007 bash deploy/demo/server-up.sh
```

See `docs/demo-server-deploy.md`.

For a server that already has Caddy, shared PostgreSQL, and Docker networks named `proxy` and `backend`, use the shared-infra demo compose instead:

```bash
cp .env.demo.shared-infra.example .env.demo.shared-infra
bash deploy/demo/server-up-shared-infra.sh
```

See `docs/demo-shared-infra-deploy.md`.

## Design Intake

Claude Code design rules, markdown instructions, CSS tokens, or component references should be added under `docs/design/` and then adapted to the actual frontend stack.

Do not paste design rules directly into implementation files until they are reviewed and mapped to existing AcadéPost components/styles.
