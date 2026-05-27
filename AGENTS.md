# AcadéPost Working Rules

## Project Identity

- The UI product name is AcadéPost.
- The repository/project slug is AcadePost.
- The codebase is being adapted into a demo-ready AcadéPost MVP.
- The immediate priority is working software for customer demonstration.
- AcadéPost must be treated as a product that will be sold to customers, not as an internal-only demo. Prefer client-repeatable onboarding, setup, and support flows over operator-only shortcuts.
- The public `A` logo is the supplied raster asset at `apps/frontend/public/brand/acadepost-logo.png`; do not replace it with generated text, a new glyph, or an approximate recreation.

## Implementation Rules

- Keep the existing architecture stable unless a change is required for the MVP.
- Do not rename internal package aliases or workspace package names during MVP unless the build proves it is safe.
- Prefer small, customer-visible changes over broad refactors.
- Keep `PROJECT_PLAN.md` current after significant work.
- Add design rules from Claude Code skills only after reading and adapting them to the actual AcadéPost frontend stack.
- Use black as the primary brand color, `#4cccb8` as the main accent, and `#fda100` as the secondary accent.
- Preserve both existing visual themes, dark and light, during visual redesign work.

## Product Language Rules

- All AcadéPost user-facing product work must be in French by default.
- This includes UI labels, bot messages, receipts, validation errors, demo flows, runbooks, public-facing docs, and release notes.
- Technical identifiers, code symbols, environment variables, database fields, callback payloads, and third-party API names may stay in English when changing them would create implementation risk.
- If an existing feature is found with English user-facing copy, treat it as a bug and convert it to French before claiming the feature is ready.

## Release Version Rules

- User-visible versions must contain only the product version, for example `1.11.1`.
- Do not append feature names, smoke-test labels, local labels, branch names, or commit hashes to `NEXT_PUBLIC_VERSION`.
- A real Docker release means publishing a GHCR image and recreating server containers from it. A local image such as `acadepost:telegram-intake-local` is only a temporary smoke-test artifact.
- Before release, check `package.json`, `.env*.example`, the server env file, and runtime container env for version drift.

## BYAN MCP Checkpoint Requirement

- BYAN MCP is mandatory for substantial AcadéPost work. Do not rely on chat memory alone.
- At the start of a resumed or long-running task, read the relevant `_byan-output` kanban/review/memory artifacts before editing.
- Post a BYAN MCP checkpoint after every stage transition, after every validation gate, before the final response, and before pausing.
- During long work, post a checkpoint at least every 20 minutes or every 5 meaningful tool cycles, whichever comes first.
- A checkpoint must record current stage/card, files or artifacts changed, validation run or blocker, and the next intended action.
- If context compaction or confusion is likely, stop and write a BYAN MCP standup/checkpoint before continuing.

## Encoding Guardrails

- Keep project files in UTF-8, especially French UI text, docs, translations, BYAN prompts, and Codex memory files.
- Known mojibake examples and the exact verification command are documented in `docs/codex-project-memory.md`.
- Before committing text changes, run the documented mojibake search and repair visible strings back to UTF-8 French.
- Longer Codex memory for this issue lives in `docs/codex-project-memory.md`.

## Telegram Intake / Routing Rules

- Do not present content routing as a standalone AcadéPost UI screen for normal users.
- Routing decisions should appear only as destination consequences, warnings, validation errors, or backend-owned intake behavior.
- Telegram intake is the planned control surface for fast post intake; AcadéPost remains the source of truth for drafts, schedule state, publishing state, rendering, and errors.
- Keep the Telegram publishing bot and the AcadéPost control bot separate. The publishing bot sends posts to Telegram destinations; the control bot is a mini-UI for creating, selecting, scheduling, and confirming posts from Telegram.
- Client-facing Telegram setup must not require manual database edits, hard-coded chat IDs, or operator-only `.env` changes. Those are acceptable only for temporary demos and must be documented as such.
- Existing backend/API routing logic can be kept only when it supports validation, planning, or publishing.

## Legal Track

- Legal and licensing decisions are handled by the project owner.
- Do not block engineering work on legal interpretation unless the owner asks for it.

## LLM / Vibe-coding Guardrails

- Treat LLM output as a draft until it is backed by source links, code references, passing checks, or an explicit risk note.
- Before claiming a feature works, verify the full path: UI, API, persistence, auth/RBAC, Docker/env impact, build, and smoke flow.
- Do not claim any social provider works until a real developer app, callback URL, credential, connect flow, publish/schedule test, and release/status verification have passed.
- Do not paste or preserve real secrets in prompts, docs, logs, screenshots, or reports. Any exposed token should be considered compromised and rotated.
- Keep Docker images domain-agnostic. Domains, ports, credentials, database URLs, and OAuth callback hosts belong in `.env` or reverse-proxy config.
- For agent automation, keep Human in the loop as the default. Full Access must be explicit, scoped, revocable, and separate from the project API key.
- Use `docs/vibecoder-open-source-rework-guardrails.md` as the owner-facing checklist when adapting upstream open-source behavior into AcadéPost.
