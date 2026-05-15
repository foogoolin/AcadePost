# AcadéPost Working Rules

## Project Identity

- The UI product name is AcadéPost.
- The repository/project slug is AcadePost.
- The codebase is being adapted into a demo-ready AcadéPost MVP.
- The immediate priority is working software for customer demonstration.
- The public `A` logo is the supplied raster asset at `apps/frontend/public/brand/acadepost-logo.png`; do not replace it with generated text, a new glyph, or an approximate recreation.

## Implementation Rules

- Keep the existing architecture stable unless a change is required for the MVP.
- Do not rename internal package aliases or workspace package names during MVP unless the build proves it is safe.
- Prefer small, customer-visible changes over broad refactors.
- Keep `PROJECT_PLAN.md` current after significant work.
- Add design rules from Claude Code skills only after reading and adapting them to the actual AcadéPost frontend stack.
- Use black as the primary brand color, `#4cccb8` as the main accent, and `#fda100` as the secondary accent.
- Preserve both existing visual themes, dark and light, during visual redesign work.

## Encoding Guardrails

- Keep project files in UTF-8, especially French UI text, docs, translations, BYAN prompts, and Codex memory files.
- Known mojibake examples and the exact verification command are documented in `docs/codex-project-memory.md`.
- Before committing text changes, run the documented mojibake search and repair visible strings back to UTF-8 French.
- Longer Codex memory for this issue lives in `docs/codex-project-memory.md`.

## Content Routing Defaults

- Video content routes to YouTube, TikTok, and Instagram Reels.
- Short text content routes to Threads and X.
- Carousel content routes to Meta and Pinterest.

## Legal Track

- Legal and licensing decisions are handled by the project owner.
- Do not block engineering work on legal interpretation unless the owner asks for it.
