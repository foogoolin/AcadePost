# Build Web Apps UI Review Plan

## Purpose

Use the Build Web Apps plugin as the UI review and visual QA layer for AcadéPost. BYAN stays the project workflow owner. Build Web Apps is responsible for rendered UI quality, responsive behavior, browser evidence, and design fidelity.

## Loaded Design Source

Primary design input read for this review:

```text
C:\Users\my\Documents\byan-test\DESIGN.md
```

That file is a calendar/date-picker style source, not a complete product redesign. Apply it most strictly to calendar, date picker, scheduling, and compact picker-like controls.

## Design Rules From DESIGN.md

- Typography: Inter or compatible UI sans, no negative letter spacing.
- Calendar style: typography-first, near-monochrome, no decorative elements.
- Selected day: `#292929` background with `#ffffff` text.
- Available day: `#F5F5F5` background with `#292929` text.
- Range middle: `#E1E1E1` background with `#292929` text.
- Disabled day: `#ACACAC` text, no filled background, faded.
- Container: white, `#E1E1E1` border, 8px radius, 12px padding.
- Day cells: square, 6px radius, 4px gap, no circular cells.
- Today indicator: 5px dot only.
- Navigation: icon-only chevrons, no filled button background.
- No purple, blue, green, or orange in the calendar grid.

## AcadéPost Product Constraints

- Keep product name as `AcadéPost`.
- Use repo slug `AcadePost` only for technical identifiers.
- Use the supplied raster `A` logo at `apps/frontend/public/brand/acadepost-logo.png`.
- Do not generate or substitute a new logo.
- Main brand accent: `#4cccb8`.
- Secondary accent: `#fda100`.
- Preserve dark and light themes.
- Do not introduce new accented UI strings except `AcadéPost`.
- Keep frontend class additions scoped as `acadepost-*`.
- Do not rename internal `@gitroom/*` aliases during UI work.

## Review Scope

1. Auth surfaces:
   - `/auth/login`
   - `/auth`
   - `/auth/forgot`
   - `/auth/activate`
   - Logo, first viewport, forms, links, mobile layout.

2. App shell:
   - Sidebar logo.
   - `Editeur` menu entry.
   - Active, hover, focus, spacing, topbar density.
   - Dark and light theme behavior.

3. Demo-first screens:
   - `/content-routing`
   - `/editor`
   - `/agents`
   - `/settings`
   - Provider credentials surfaces.

4. Calendar and scheduling:
   - `/launches`
   - Date picker.
   - Calendar cells and selected states.
   - Must follow `DESIGN.md` most strictly here.

5. Media and publishing support:
   - `/media`
   - upload and media picker states used by Editor.

## Browser QA Method

Use Browser first through the Build Web Apps frontend testing workflow.

For every reviewed surface:

- Open the route.
- Check page identity: URL and title.
- Check not blank.
- Check no framework error overlay.
- Check console errors and warnings.
- Capture desktop screenshot.
- Capture mobile screenshot when practical.
- Exercise one interaction.
- Record whether auth/backend blocks deeper testing.

Minimum viewports:

- Desktop: default browser viewport or 1280 x 720.
- Mobile: 390 x 844.

## Interaction Checks

- Auth:
  - Login page loads.
  - Logo image has non-zero natural size.
  - Sign-up link navigates to register.
  - Mobile layout keeps controls readable.

- Sidebar:
  - `Editeur` is visible.
  - `/editor` navigation works after authenticated access.

- Content routing:
  - CTA `Ouvrir l'editeur` is visible.
  - CTA points to `/editor`.
  - Calendar CTA points to `/launches`.

- Editor:
  - Preset selector is visible.
  - 4 preset types are available.
  - Overlay controls are visible.
  - Render/save controls do not overflow.

- Calendar:
  - Date cells are square.
  - Selected state uses near-black.
  - No purple appears in calendar/date picker.

## Current UI Finding From First Pass

Build Web Apps browser pass found a real logo delivery issue:

- `apps/frontend/public/brand/acadepost-logo.png` exists and is a valid PNG.
- `http://localhost:4200/brand/acadepost-logo.png` returned HTML instead of image content.
- Result: broken logo in auth UI and likely sidebar/favicon references.
- Fix started in `apps/frontend/src/proxy.ts`: allow `/brand/` paths to bypass auth/proxy handling.

This must be kept in the UI review checklist until committed and verified in production image.

## Auth Limitation

Local direct access to protected routes currently redirects to `/auth` without an authenticated session. That is correct protection behavior, but it means full app shell review requires one of these:

- working local backend and test user;
- deployed test server with test credentials;
- dedicated UI fixture or Storybook-like harness later.

Do not claim `/editor`, `/launches`, or provider screens are fully browser-verified until one of those paths is available.

## Acceptance Gates

Before claiming the UI pass is complete:

- Frontend build passes.
- Browser screenshots exist for auth desktop and mobile.
- Protected app screenshots exist with an authenticated session.
- Logo loads as image/png from `/brand/acadepost-logo.png`.
- `rg` finds no mojibake in touched files.
- New changed UI strings contain no non-ASCII accents except `AcadéPost`.
- `git diff --check` passes.
- `PROJECT_PLAN.md` is updated after meaningful changes.

## Out Of Scope For This UI Review

- Social provider runtime publishing.
- n8n backend execution.
- Prisma schema changes.
- Docker image tag policy.
- Legal and platform policy pages.

## Docker Note

Normal install/update should use `ghcr.io/foogoolin/acadepost:latest`. Versioned and SHA tags remain useful for rollback, but the owner-facing path should not require changing the image version after every update.
