# Codex Project Memory

This file records recurring project issues that future Codex/BYAN sessions must check before editing AcadéPost.

## French Product Language

User rule added on 2026-05-27: all AcadéPost user-facing product work must be in French by default.

This applies to UI labels, Telegram bot copy, receipts, validation errors, demo flows, public-facing documentation, runbooks, and release notes. Technical identifiers such as code symbols, environment variables, database fields, callback payloads, and third-party API names may remain in English when changing them would create implementation or integration risk.

When live testing reveals English product copy, treat it as a bug and fix it before saying the feature is ready.

## Encoding And Mojibake

Project files must stay UTF-8. A recurring failure mode is terminal or editor mojibake, where UTF-8 text is displayed or saved through the wrong Windows code page.

Known symptoms:

- The product name displays as broken text instead of `AcadéPost`.
- French labels show mixed Cyrillic/Latin garbage.
- PowerShell output may look broken even when the file is still valid UTF-8.

Before commits that touch docs, UI labels, translations, prompts, or deploy scripts, run:

```bash
rg -n --glob '!docs/codex-project-memory.md' "AcadР|AcadГ|AcadÃ|DР|DГ|DÃ©|franР|franГ|franÃ|Р“|Гѓ" AGENTS.md PROJECT_PLAN.md docs README.md deploy apps libraries
```

If this returns results:

1. Open the file as UTF-8.
2. Replace broken visible strings with correct UTF-8 text.
3. Prefer ASCII labels while the project is unstable, except for the official product name `AcadéPost`.
4. Re-run the search until only intentional technical examples remain.

## Docker And Deploy Guardrail

Do not touch the production server during Docker image work unless the owner explicitly asks for it in that turn.

Every AcadePost deployment must include a version bump before the deploy. Update both:

- `package.json` `version`
- `version.txt`

For server runtime deployments, also update the production env version marker. Do not append feature names, local labels, hashes, or smoke-test suffixes to `NEXT_PUBLIC_VERSION`; the user-facing version must be the product version only, for example `1.11.1`.

Normal update path:

- GitHub Actions builds and publishes `ghcr.io/foogoolin/acadepost:latest`.
- The server pulls the prebuilt image.
- The server must not run `docker build` for normal updates.

Domains, ports, database URLs, OAuth callbacks, and secrets belong in `.env` or reverse-proxy config, not inside the image.

Security-sensitive debug surfaces are disabled by default:

- Swagger docs require `ENABLE_SWAGGER=true`.
- Monitor queue debug requires `ENABLE_MONITOR_QUEUE=true`.

Do not enable these on client-facing public domains unless the owner explicitly accepts that exposure.

### 2026-05-27 — Version And Image Discipline

For AcadéPost releases, distinguish these terms:

- Docker image: the built artifact published to GHCR.
- Docker container: the running instance recreated from that image.

Do not leave a public server on a local image tag such as `acadepost:telegram-intake-local` when the user asks for a real release. The final state must use a published GHCR image.

Do not put feature names, local labels, hashes, or smoke-test suffixes in `NEXT_PUBLIC_VERSION`. The user-facing version must be the product version only, for example `1.11.1`.

The previous mistake was caused by mixing stale local `package.json` version `1.1.7`, temporary Docker tags, and public runtime version. Before a release, check `package.json`, `.env*.example`, the server env file, and the container runtime env for version drift.

### 2026-05-23 — Release Proof Discipline

Do not describe a feature as ready for the owner when it only exists in the local checkout or docs. For user-facing runtime changes, "done" means:

- code is committed and pushed;
- GitHub Build passes;
- demo GHCR image build/push passes for the exact commit;
- server `.env.demo.shared-infra` is pinned to that exact SHA tag;
- runtime containers are recreated from the correct server checkout/project (`/opt/AcadePost`, compose project `acadepost`);
- live `/api/monitor/ready` and container image IDs confirm the new image is running;
- the actual live user flow is verified, including provider-side proof for Telegram test posts when requested.

Avoid deploy attempts from alternate local checkouts such as `/opt/AcadePost-provider-rework` when the running Compose project was created from `/opt/AcadePost`; this creates container-name conflicts and does not update the live stack. If the wrong-project deploy starts creating stray networks, stop, inspect `com.docker.compose.project`, and resume from the server checkout.

Do not treat documentation updates as delivery. Docs can record state, but they are not a substitute for image publication, server deploy, and live provider verification.

## BYAN Output

`_byan/` is the local BYAN framework source. `_byan-output/` is generated session state and must not be committed.

If `_byan-output/` or `reports/` appear in `git status` as tracked files, remove them from Git and keep them ignored.

## BYAN MCP Checkpoint Discipline

User requirement added on 2026-05-27: substantial AcadéPost work must be periodically synchronized through local BYAN MCP artifacts because long Codex sessions can lose context or resume from stale assumptions.

Mandatory cadence:

- On resume/start: read the relevant BYAN kanban/review/memory artifacts before editing.
- After each stage transition: move/update the BYAN kanban card.
- After each validation gate: write a BYAN MCP standup with command/result/blocker.
- During long work: checkpoint at least every 20 minutes or every 5 meaningful tool cycles.
- Before final response or pause: checkpoint current state, changed files/artifacts, validation status, and next action.
- If context compaction, confusion, or drift is likely: stop and checkpoint before continuing.

For the current Telegram intake/routing work, the active BYAN session is `acadepost-telegram-intake` under `/root/_byan-output/party-mode-sessions/acadepost-telegram-intake/`.
