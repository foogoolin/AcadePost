# Changelog

## v1.1.6 - 2026-05-18

- Description: Fixed Telegram credential visibility in the Settings > Identifiants provider list so demo users can configure Telegram from the first credential group.
- Added an n8n-like credential workflow in Settings > Identifiants: searchable provider types, editable saved credential instances, masked secrets, and a direct connection test action.
- Added visible social platform icons to the provider credential list.
- Added visible `NEXT_PUBLIC_VERSION` output in the lower-left app/settings UI so a server build can be identified from the browser.
- Moved Telegram into the first `Core social` credential group with the existing `Bot Token` and optional `Bot Name` fields.
- Changed Telegram credential tests from required-field validation to a real Telegram Bot API configuration check.
- Changed the Telegram credential tester to lazy-load the Telegram provider so backend startup does not load Telegram Bot API unless the test action is used.
- Added a registry regression test that keeps Telegram among the first visible credential providers.
- Added a provider credential usage guide with setup commands, Telegram example, runtime behavior and edge cases.

## v1.1.5 - 2026-05-18

- Description: Completed the Docker image optimization documentation for the validated GHCR and Contabo update path, including Temporal runtime hotfixes, service health gates and shared-infra app-only update caveats.
- Optimized the self-hosted Docker runtime so normal server updates use the prebuilt `ghcr.io/foogoolin/acadepost:latest` image instead of building the monorepo on the VPS.
- Split the Compose runtime into a public nginx proxy plus internal backend, frontend, orchestrator and migrate services while preserving the existing public HTTP entrypoint.
- Added GitHub Actions gates for Compose validation, Docker context hygiene, image size, container smoke and GHCR publishing before `latest` is updated.
- Fixed runtime tracing for Prisma engines and Google API modules so the optimized image still starts from the traced production payload.
- Fixed Temporal worker runtime packaging by keeping the dynamic workflow dependencies required by the orchestrator image.
- Tightened update and CI smoke checks so service container health, including `acadepost-orchestrator`, is checked before the image is treated as demo-ready.
- Fixed the root Jest config so `npm test` exits successfully in repositories without the old Nx Jest preset.
- Verified the first optimized `latest` image in workflow run `26031408303`: OCI archive size `317 MB`, Compose smoke passed, digest `sha256:7d7e53976e366d80ce9ed81cbf34efd99f7ed387e3be97a59ef5db30874cd686`.
- Verified the hotfixed `latest` image in workflow run `26035055443` after the Temporal runtime fix; the Contabo shared-infra stack then pulled the image and reached public readiness with backend, frontend, orchestrator and proxy containers healthy.

## v1.1.4 - 2026-05-17

- Fixed the mobile app shell and launches calendar so the sidebar, topbar, channel list and calendar grid no longer overlap on narrow screens.
- Added mobile-safe calendar grid widths with horizontal scrolling inside the calendar area instead of page-level overflow.
- Kept the desktop launches layout intact while improving mobile spacing and filter controls.

## v1.1.3 - 2026-05-17

- Reworked `Dockerfile.demo` into a multi-stage build so normal server updates pull a prebuilt runtime image instead of shipping the full build workspace.
- Removed tracked BYAN/session outputs from Git and expanded ignore rules for local agent, report, cache and design scratch files.
- Removed the old upstream container workflow that pushed `ghcr.io/gitroomhq/postiz-app`.
- Removed upstream scheduled stale workflow and cleaned GitHub issue/PR/extension workflow templates.
- Added a GHCR compressed image size gate for the AcadéPost self-hosted image.
- Removed the local BYAN API token from `.mcp.json`; future sessions must provide `BYAN_API_TOKEN` from the environment.

## v1.1.2 - 2026-05-17

- Added `ghcr.io/foogoolin/acadepost:latest` to the GHCR publishing workflow.
- Switched Docker compose and env defaults to the `latest` image for normal installs.
- Fixed static `/brand/*` assets being routed through the frontend proxy, which broke the AcadéPost raster logo in auth and app shell UI.
- Added `docs/build-web-apps-ui-review-plan.md` with the Build Web Apps review scope and imported `DESIGN.md` calendar rules.

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
