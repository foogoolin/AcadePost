# Vibe-coder guardrails for AcadéPost

Date: 2026-05-16

This document is written for the project owner, not for end users. The goal is to make LLM-assisted work safer when adapting an open-source product into the AcadéPost demo.

## Core principle

Treat an LLM as a fast junior-to-mid implementation engine with strong pattern recognition, not as a source of truth. Every important claim must become one of these artifacts:

- a source link;
- a local file reference;
- a passing build/test/smoke check;
- an explicit open risk in `PROJECT_PLAN.md`.

## What a vibe-coder can easily miss

### 1. Open-source license is not the same as ownership

An open-source license can allow use, modification, and distribution, but it does not automatically transfer trademarks, partnership status, platform approvals, private credentials, support promises, or SaaS infrastructure.

For AcadéPost:

- keep legal/licensing as a separate owner track;
- do not remove `LICENSE` or copyright notices casually;
- do not claim partnership, official approval, or transferred platform credentials unless the owner has written proof;
- keep `docs/legal-notes.md` as the place for owner-level legal decisions.

Sources:

- GitHub Docs: https://docs.github.com/articles/open-source-licensing
- ChooseALicense MIT overview: https://choosealicense.com/licenses/mit/
- ChooseALicense no-license note: https://choosealicense.com/no-permission/

### 2. Rebrand can hide old product assumptions without removing them

Changing logos and names is not the same as changing the product model. Old assumptions may remain in:

- package aliases;
- environment variables;
- OAuth callback routes;
- docs and email templates;
- public API examples;
- browser extension metadata;
- error messages;
- database names and worker queues.

For AcadéPost:

- public UI should say `AcadéPost`;
- repo slug and technical examples may use `AcadePost`;
- internal `@gitroom/*` aliases remain allowed until a separate build-safe rename pass;
- every public brand pass must end with an `rg` check and a mojibake check.

### 3. A fork does not inherit SaaS integrations

A self-hosted fork does not automatically inherit cloud provider apps, platform partner status, API review approvals, rate limits, or working OAuth credentials from the original hosted product.

For AcadéPost this is now a top-level product risk. The value of the app depends on social providers actually connecting and publishing.

Required gate before saying a platform works:

- developer app exists;
- callback URL is configured;
- required scopes are approved;
- credentials are saved in `Identifiants` or `.env`;
- test account/page/channel exists;
- connect channel smoke passes;
- create draft, schedule, publish, and verify release URL/status.

Reference docs already in project:

- `docs/integrations/social-provider-readiness-2026-05-16.md`

### 4. LLMs can produce code that looks correct but skips the hard edge

Common examples:

- UI exists but backend route is missing;
- backend saves data but no migration exists;
- Docker works locally but not behind reverse proxy;
- build passes but runtime crashes in PM2;
- API token works but leaks through logs;
- one tenant can access another tenant's data;
- platform credentials connect but refresh token later fails;
- demo happy path works but rollback/update path is missing.

For AcadéPost, every feature should carry a small acceptance checklist:

- frontend route or UI surface;
- backend API;
- Prisma schema or persistence if needed;
- Docker/env impact;
- auth/RBAC/tenant boundary;
- build commands;
- browser smoke flow;
- update to `PROJECT_PLAN.md`.

### 5. Secrets in chats are not safe operational practice

Treat any token pasted into an LLM/chat/terminal transcript as compromised. Rotate it. Do not rely on "it was temporary".

For AcadéPost:

- GitHub tokens pasted during deployment must be revoked;
- platform API credentials should go through `Identifiants` or server `.env`, not chat;
- logs must not print OAuth responses, webhook secrets, access tokens, or refresh tokens;
- placeholder prefixes such as `sk-proj-...`, `pk_test_...`, and platform-specific examples are useful and may stay, but they must remain placeholders.

### 6. Docker image is not configuration

The image should be reusable. Domain, DB URL, credentials, secrets, ports, and OAuth callback domain belong in `.env` and reverse-proxy config, not inside the image.

For AcadéPost:

- normal server update is `docker compose pull acadepost && docker compose up -d`, wrapped by `deploy/demo/update.sh`;
- GHCR release image uses a versioned tag such as `ghcr.io/foogoolin/acadepost:v1.1.0`; `:demo` remains only as a moving latest-MVP tag;
- domain stays in `ACADEPOST_PUBLIC_URL`;
- credentials encryption key stays in `ACADEPOST_CREDENTIALS_ENCRYPTION_KEY`;
- the server should not build from source during normal demo updates.

### 7. LLM agent features need strict blast-radius control

Agent automation is where "it works" can become dangerous. Full Access is allowed, but it must be explicit, scoped, auditable, and revocable.

For AcadéPost:

- Human in the loop remains default;
- Full Access requires agent id plus agent secret;
- project API key and agent secret are separate;
- n8n is an automation layer, not the source of truth;
- AcadéPost remains source of truth for projects, calendar, media, templates, integrations, and publishing state.

Source:

- OWASP Top 10 for LLM Applications: https://owasp.org/www-project-top-10-for-large-language-model-applications/

### 8. Security is not one task

Security is a recurring gate. LLM-assisted changes often miss "boring" checks: SSRF, logs, RBAC, tenant scoping, update scripts, default ports, backup implications, and secret rotation.

For AcadéPost:

- use `docs/security/acadepost-security-review-2026-05-16.md` as the current baseline;
- run a focused security review whenever adding public API, agent access, upload-from-url, webhooks, OAuth, Docker, or credentials code;
- keep `PUBLIC_API_ALLOW_OAUTH=false` unless there is a deliberate product decision.

Sources:

- OpenSSF Scorecard: https://openssf.org/scorecard/
- OpenSSF Best Practices: https://best.openssf.org/

### 9. Encoding and language can quietly damage trust

French UI with broken accents looks amateur and can hide actual data corruption.

For AcadéPost:

- UI language is French;
- work communication may be Russian;
- run the mojibake search documented in `docs/codex-project-memory.md` before committing docs, prompts, translations, or UI text;
- keep files UTF-8.

### 10. Demo readiness is not production readiness

It is fine to ship a raw demo, but the project must label it honestly.

Demo-ready means:

- client can open the app;
- login and project switching work;
- core UI does not expose old branding;
- at least one or two provider smoke tests are real;
- Docker update path works;
- rollback path is known;
- critical secrets are not exposed.

Production-ready later means:

- migrations instead of demo `db push`;
- pinned image digest strategy;
- complete provider approval status;
- full backup and restore plan;
- rate limits and audit logs;
- complete legal/privacy/security pages;
- e2e tests for multi-project isolation and publishing.

## How to prompt LLM agents on this project

Use prompts with this shape:

```text
Work in branch codex/<name>. Follow AGENTS.md and BYAN config.
Scope: <exact feature>.
Do not rename internal @gitroom/* aliases.
UI text must be French.
Preserve dark and light themes, logo asset, #4cccb8 and #fda100.
Before editing, inspect existing patterns.
After editing, run:
- prisma generate if schema changed
- backend/frontend/orchestrator build as relevant
- docker compose config if Docker/env changed
- rg for old public brand if UI/docs changed
- mojibake search if text changed
- git diff --check
Update PROJECT_PLAN.md.
Report remaining risks honestly.
```

## Project-specific non-negotiables

- Do not claim provider operability without a real connect/publish smoke test.
- Do not store new secrets without encryption and masked API responses.
- Do not expose new public endpoints without auth, tenant scoping, and abuse review.
- Do not hardcode a domain into Docker image or source code.
- Do not merge visual redesign into `main` without browser smoke in dark and light themes.
- Do not let agents publish automatically unless Full Access and scopes are explicit.
- Do not silently import `.env` secrets into DB.
- Do not remove legal attribution unless the project owner explicitly approves that legal track.
