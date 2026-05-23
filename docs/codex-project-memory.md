# Codex Project Memory

This file records recurring project issues that future Codex/BYAN sessions must check before editing AcadéPost.

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

Normal update path:

- GitHub Actions builds and publishes `ghcr.io/foogoolin/acadepost:latest`.
- The server pulls the prebuilt image.
- The server must not run `docker build` for normal updates.

Domains, ports, database URLs, OAuth callbacks, and secrets belong in `.env` or reverse-proxy config, not inside the image.

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

## Provider Pipeline Delivery Pattern

For provider-pipeline work, use the flow that worked for the v1.1.8 rollout:

- Keep the branch isolated from `main`, push a named feature branch, and use a pinned GHCR SHA tag for server updates.
- Build from the supplied publishing pipeline diagram, not just from ad hoc UI ideas:
  `Editor -> Template -> Destination -> Operation -> Provider Options -> Publish/Schedule -> Result -> Provider Publish Attempt Log`, with `Provider Connection Log` as the credential/destination support lane.
- Treat `design.md` as the UI contract. Check both dark and light themes for contrast, button padding safe zones, shadows, and broken text.
- During UI validation/debugging, open the live or local service in Playwright, perform the real user flow, capture browser screenshots for the relevant viewport/theme states, and inspect computed styles/contrast instead of relying only on code review.
- Run targeted Jest tests, Prisma validate, backend build, frontend build, orchestrator build, GitHub Actions image smoke, then server health checks.
- Do a review pass before deployment. Findings first if this is a formal review; otherwise record the self-review result and remaining risks.
- Deploy by changing `.env.demo.shared-infra` to the pinned image, backing it up, running one controlled Prisma `db push`, then recreating runtime services through `deploy/demo/update.sh`.
- Verify the live domain with `/api/monitor/ready`, compose health, image IDs, route accessibility, and backend route registration logs.

### 2026-05-22 — BYAN MCP Refresh Gate Rule

During provider-pipeline work, refresh BYAN MCP at every phase gate (`BUILD -> REVIEW -> VALIDATE -> DOC/DEPLOY`), every ~20 tool actions, and after any resume/compaction before continuing. Refresh means reading the active BYAN workflow/standup state and then proceeding from the current phase. User explicitly validated this rule on 2026-05-22.
