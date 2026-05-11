# AcadéPost Design Adaptation

The imported design reference is a monochrome utility system inspired by Cal.com. AcadéPost adapts the structure while replacing the brand palette.

## Brand Palette

- Primary: black, `#050505` / `#101010`.
- Main accent: mint, `#4cccb8`.
- Secondary accent: amber, `#fda100`.
- Neutral surfaces: `#f4f4f4`, `#ffffff`, and near-black panels.

## Implementation Notes

- Source design files are archived in `docs/design/source-*`.
- Runtime styling is integrated through `apps/frontend/src/app/colors.scss`.
- Tailwind aliases are available as `acadeBlack`, `acadeInk`, `acadeMint`, `acadeAmber`, and `acadePaper`.
- UI product name is **AcadéPost**.
- Keep internal package aliases like `@gitroom/*` unchanged during MVP.

## Component Direction

- Use pill shapes for primary routing/status actions.
- Use 12px cards with subtle shadows or quiet borders.
- Keep most UI monochrome; use mint for active states and amber for secondary emphasis.
- Avoid purple as a brand color in new AcadéPost UI.
