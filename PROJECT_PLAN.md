# AcadéPost Project Plan

## Current MVP Goal

AcadéPost is a fast demo-ready social publishing MVP adapted from an existing social publishing codebase. The first milestone is a working self-hosted product with AcadéPost branding, Docker startup, and a clear content routing workflow for video, short text, and carousel publishing.

## Product Decisions

- UI product name: AcadéPost.
- Repository/project slug: AcadePost.
- Technical base: the existing upstream monorepo structure.
- Priority: customer-demo readiness before deep refactors.
- Architecture: keep the existing monorepo, Docker, Prisma, PostgreSQL, Redis, Temporal, NestJS, and Next.js structure for the first MVP.
- Internal package aliases such as `@gitroom/*` can remain during MVP if changing them risks build instability.
- Legal and licensing handling is owned separately by the project owner and does not block MVP work.

## Content Routing MVP

AcadéPost groups publishing targets by content type:

- `video`: YouTube, TikTok, Instagram Reels.
- `short_text`: Threads, X.
- `carousel`: Meta, Pinterest.

The first workflow should classify content into one of these groups, make the matching platforms obvious in the UI, and create/schedule posts through the existing publishing flow wherever possible.

## Work Phases

1. Bootstrap AcadePost repository from the upstream codebase.
2. Add project memory and working rules.
3. Apply safe customer-facing rebrand.
4. Add Content Routing documentation and MVP defaults.
5. Install dependencies and verify local startup path.
6. Accept and adapt Claude Code design rules into the current styling system.
7. Build the first demo flow for creating and scheduling routed content.

## Completed

- Project plan created.
- Working rules added.
- Upstream remote removed from the local repository during bootstrap.
- GitHub repository created: `foogoolin/AcadePost`.
- Imported design references archived under `docs/design/source-*`.
- AcadéPost brand layer added with black, `#4cccb8`, and `#fda100`.
- AcadéPost logo added to `apps/frontend/public/brand/acadepost-logo.png`.
- Public brand cleanup completed across auth, onboarding, billing, public API/developer surfaces, browser extension metadata, SDK/demo docs, locale fallback values, generated email subjects, Sentry/Swagger labels, MCP labels, and demo sample URLs.

## Audit Update - 2026-05-13

- Cleanup scope: Public UI Only with technical exceptions allowed.
- Public product wording should use `AcadéPost`; technical slugs and package examples should use `AcadePost`.
- Internal aliases such as `@gitroom/*`, translation key names, `POSTIZ_*` environment variables, and `@postiz/wallets` stay unchanged during the MVP unless a separate build-safe rename pass is planned.
- Direct brand search is clean for public code/docs after cleanup. The only remaining direct `Postiz` hit is in `LICENSE`, which is legal-track and should be handled by the project owner before any attribution rewrite.
- Dependency/build verification status: `corepack pnpm dlx prisma@6.5.0 generate`, frontend build, backend build, orchestrator build, and extension Vite build pass locally. Backend/orchestrator need `NODE_OPTIONS=--max-old-space-size=8192` in this shell.
- Current environment caveats: the shell is running Node `v24.13.0` while the repo requests `>=22.12.0 <23.0.0`; `corepack pnpm install --frozen-lockfile` reaches postinstall but fails because the lifecycle script calls bare `pnpm`, which is not in PATH on this Windows setup; the extension package build script uses Unix `rm/cp/zip`, so it needs a cross-platform packaging script.
- No-code continuation guidance: FlutterFlow or another no-code tool should be treated as a client shell over AcadéPost APIs, not a direct repository import. Keep the NestJS/Temporal/Postgres publishing engine in code, then expose stable API endpoints for a FlutterFlow/mobile/admin frontend if desired.
- Next demo-readiness phase: install/use Node 22.x, fix cross-platform scripts, run browser smoke checks for auth, sidebar, `/content-routing`, public API/developer, onboarding, and billing surfaces.

## BYAN Integration Update - 2026-05-13

- Communication language set to Russian in BYAN configs; project/document output remains French.
- Project context created at `_byan-output/project-context.md` for BYAN/Codex continuation.
- Read `_byan/agents/byan.md` as the main BYAN agent and `_byan/bmb/agents/codex.md` as the Codex integration specialist.
- Corrected `.codex/prompts` activation paths from stale `_bmad` references to real `_byan` agent files for the installed prompts.
- Hermes installed as `_byan/core/agents/hermes.md`, registered in `_byan/_config/agent-manifest.csv`, and re-enabled through `.codex/prompts/hermes.md`.
- Local validation found 32 prompt files pointing to existing BYAN agents.
- Current local `codex-cli 0.130.0` does not expose the older `codex skill` command described by the BYAN Codex agent, so `.codex/prompts` should be treated as project prompt scaffolding rather than a verified CLI skill registry.

## Open Questions

- Which real platform API should be connected first after the MVP demo path is stable?
- Which real social platform API should be connected first for the customer demo?

## Next Steps

- Switch the local development runtime to Node 22.x and make `pnpm` available in PATH or change lifecycle scripts to use Corepack-safe commands.
- Make backend/orchestrator builds set a larger Node heap consistently.
- Replace extension `rm/cp/zip` packaging with a cross-platform script.
- Add a short customer demo runbook.
- Add the first content routing UI affordance without rewriting the publishing engine.

## Update Rule

Update this file after every meaningful project change: bootstrap, rebrand, Docker verification, design intake, workflow changes, integrations, and customer-demo preparation.
