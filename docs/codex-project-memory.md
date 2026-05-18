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

## BYAN Output

`_byan/` is the local BYAN framework source. `_byan-output/` is generated session state and must not be committed.

If `_byan-output/` or `reports/` appear in `git status` as tracked files, remove them from Git and keep them ignored.
