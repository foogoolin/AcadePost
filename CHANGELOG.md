# Changelog

## v1.1.1 - 2026-05-17

- Fixed the visible `Editeur` navigation entry and added a direct Editor action from `/content-routing`.
- Updated Docker deployment defaults to use `ghcr.io/foogoolin/acadepost:v1.1.1`.
- Made the GHCR workflow read the Docker version tag from `package.json` instead of hard-coding the release tag.

## v1.1.0 - 2026-05-16

- Updated product package metadata to `1.1.0`.
- Added the MVP Provider Credentials Gate for Telegram, Facebook Pages, Instagram Business, Threads, YouTube and Pinterest.
- Kept Facebook, Instagram and Threads as separate AcadéPost credentials; removed automatic Facebook/Instagram credential fallback.
- Moved Telegram connect and publish paths to project credentials, with `.env` as legacy/demo fallback only.
- Preserved credential binding through scheduled publishing and refresh when a channel has `providerCredentialId`.
- Added Telegram config/update endpoints for state-bound project credentials.
- Added CORS support for AcadéPost agent headers.
- Updated social provider readiness and Postiz feature comparison docs.
- Updated README with server update commands and GHCR image usage.

## v1.0.0 - 2026-05-16

- Demo-ready AcadéPost MVP baseline after rebrand, Docker/GHCR setup, n8n agents, Editor presets, project access model and security hardening passes.
