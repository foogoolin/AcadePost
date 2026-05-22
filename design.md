# AcadéPost Design Contract

This file is the canonical quick contract for new AcadéPost UI work. The longer adaptation note remains in `docs/design/acadepost-design-adaptation.md`.

## Palette

- Primary black: `#050505` / `#101010`.
- Main accent: mint `#4cccb8`.
- Secondary accent: amber `#fda100`.
- Neutral surfaces: `#f4f4f4`, `#ffffff`, and near-black panels.
- Avoid purple in new AcadéPost surfaces unless rendering legacy/provider-owned content.

## Components

- Primary routing/status actions use pill shapes.
- Primary buttons must feel deliberate: subtle gradient, quiet shadow, clear hover/focus, no flat low-effort blocks.
- Cards use 12px radius with subtle shadows or quiet borders.
- Keep most UI monochrome; use mint for active states and amber for secondary emphasis.
- Preserve dark and light theme parity.

## Runtime Hooks

- Runtime styling starts in `apps/frontend/src/app/colors.scss`.
- Tailwind aliases are available as `acadeBlack`, `acadeInk`, `acadeMint`, `acadeAmber`, and `acadePaper`.
- Shared polished utility classes:
  - `acadepost-button-primary`
  - `acadepost-button-secondary`
  - `acadepost-surface-card`
