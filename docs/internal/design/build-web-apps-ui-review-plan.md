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

### P0: Pages Created Or Heavily Changed In This AcadéPost Pass

Review these first. They are the surfaces most likely to contain our own UI regressions.

| Priority | Route / Surface | Main Files | What Build Web Apps Must Verify | Current Status |
| --- | --- | --- | --- | --- |
| P0 | `/auth/login` | `apps/frontend/src/app/(app)/auth/layout.tsx`, `apps/frontend/src/components/auth/login.tsx`, `apps/frontend/src/components/ui/logo-text.component.tsx` | Logo loads, first viewport is polished, form controls fit, links work, desktop/mobile screenshots | Partially verified: desktop/mobile auth work; logo fixed |
| P0 | `/auth` | `apps/frontend/src/components/auth/register.tsx` | Register form fits, terms/privacy links do not overflow, mobile view usable | Partially verified: navigation from login works |
| P0 | `/content-routing` | `apps/frontend/src/app/(app)/(site)/content-routing/page.tsx` | Demo screen renders, cards fit, CTA `Ouvrir l'editeur` goes to `/editor`, no broken text/layout | Blocked locally by auth redirect until authenticated session exists |
| P0 | `/editor` | `apps/frontend/src/app/(app)/(site)/editor/page.tsx`, `apps/frontend/src/components/editor/editor-presets.tsx` | 4 presets visible, preview area stable, upload/media buttons visible, right inspector does not overflow | Blocked locally by auth redirect until authenticated session exists |
| P0 | Sidebar / app shell | `apps/frontend/src/components/new-layout/layout.component.tsx`, `apps/frontend/src/components/layout/top.menu.tsx`, `apps/frontend/src/components/new-layout/logo.tsx` | `Editeur` visible, logo loads, active states clear, topbar does not crowd at desktop width | Blocked locally by auth redirect until authenticated session exists |
| P0 | n8n agent panel | `apps/frontend/src/components/agents/agent.tsx` | External agent form visible, scopes readable, Human in the loop vs Full Access controls clear, buttons fit | Blocked locally by auth redirect until authenticated session exists |
| P0 | Provider credentials manager | `apps/frontend/src/components/settings/provider-credentials.component.tsx`, `apps/frontend/src/components/layout/settings.component.tsx` | Telegram/Facebook/Instagram/Threads/YouTube/Pinterest cards are separate, fields readable, placeholders fit, no secret leakage | Blocked locally by auth redirect until authenticated session exists |
| P0 | Calendar/date picker | `apps/frontend/src/components/launches/calendar.tsx`, `apps/frontend/src/components/launches/helpers/date.picker.tsx` | Applies `DESIGN.md`: square cells, near-black selected state, no purple in grid, desktop/mobile usable | Blocked locally by auth redirect until authenticated session exists |

### P1: Existing Pages Restyled Or Rebranded

| Priority | Route / Surface | Main Files | What Build Web Apps Must Verify | Current Status |
| --- | --- | --- | --- | --- |
| P1 | `/media` and media picker | `apps/frontend/src/components/media/media.component.tsx` | Media grid/picker usable for Editor, upload controls visible, no old visual branding | Blocked locally by auth redirect until authenticated session exists |
| P1 | `/billing`, `/billing/lifetime` | `apps/frontend/src/components/billing/*` | No old purple-dominant visual language, public wording fits, no broken logo | Needs browser pass |
| P1 | Public API / developer settings | `apps/frontend/src/components/public-api/public.component.tsx`, `apps/frontend/src/components/developer/developer.component.tsx` | API key display masks correctly, examples fit, no old brand visible | Blocked locally by auth redirect until authenticated session exists |
| P1 | OAuth authorize | `apps/frontend/src/app/(app)/oauth/authorize/page.tsx` | Consent screen readable, actions clear, no clipped copy | Blocked locally by auth redirect until authenticated session exists |
| P1 | Public preview `/p/[id]` | `apps/frontend/src/app/(app)/(preview)/p/[id]/page.tsx` | AcadéPost logo loads, preview layout does not use old brand | Needs valid preview id |

### P2: Secondary Restyled Components

| Priority | Surface | Main Files | What Build Web Apps Must Verify | Current Status |
| --- | --- | --- | --- | --- |
| P2 | Project selector / teams access | `apps/frontend/src/components/layout/organization.selector.tsx`, `apps/frontend/src/components/settings/teams.component.tsx` | Project menu readable, role labels fit, no cross-project confusion in UI | Authenticated session required |
| P2 | Add provider / integration continuation | `apps/frontend/src/components/launches/add.provider.component.tsx`, `apps/frontend/src/components/launches/continue.integration.tsx` | Provider cards and connection states readable, mobile not clipped | Authenticated session required |
| P2 | New launch editor fragments | `apps/frontend/src/components/new-launch/*` | Composer controls readable, scheduling controls connect visually to calendar style | Authenticated session required |

## Review Scope By Area

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
- Fix committed in `apps/frontend/src/proxy.ts`: `/brand/` paths bypass auth/proxy handling.

This must stay in the UI review checklist until verified again after the next server update.

## Review Execution Log - 2026-05-17

Build Web Apps browser path used:

- Browser plugin: available and used.
- Local app URL: `http://127.0.0.1:4200`.
- Flow under test: app loads -> first meaningful screen renders -> primary visible controls respond without runtime errors.
- Desktop viewport: `1280 x 720`.
- Mobile viewport: `390 x 844`.
- Screenshot folder, outside the repo: `C:\Users\my\AppData\Local\Temp\acadepost-build-web-apps-review-2026-05-17`.
- Raw result JSON, outside the repo: `C:\Users\my\AppData\Local\Temp\acadepost-build-web-apps-review-2026-05-17\review-results.json`.

Completed checks:

| Surface | Result | Evidence |
| --- | --- | --- |
| `/auth/login` desktop | PASS | Title `AcadéPost Login`, not blank, no framework overlay, 0 console issues, no horizontal overflow. Logo `/brand/acadepost-logo.png` loaded with natural size `243 x 276`. |
| `/auth/login` interaction | PASS | E-mail field accepted test input, `S'inscrire` link navigated to `/auth`. |
| `/auth` desktop | PASS | Title `AcadéPost Register`, not blank, no framework overlay, 0 console issues, no horizontal overflow. Logo loaded with natural size `243 x 276`. |
| `/auth/forgot` desktop | PASS | Title `AcadéPost Forgot Password`, not blank, no framework overlay, 0 console issues, no horizontal overflow. Logo loaded with natural size `243 x 276`. |
| `/auth/activate` desktop | PASS | Title `AcadéPost - Activate your account`, not blank, no framework overlay, 0 console issues, no horizontal overflow. Logo loaded with natural size `243 x 276`. |
| `/auth/login` mobile | PASS | Title `AcadéPost Login`, not blank, no framework overlay, 0 console issues, no horizontal overflow. |
| `/auth` mobile | PASS | Title `AcadéPost Register`, not blank, no framework overlay, 0 console issues, no horizontal overflow. |

Authenticated route checks:

| Requested Surface | Browser Result | Interpretation |
| --- | --- | --- |
| `/content-routing` | Redirected to `/auth` | Route protection works locally, but content routing UI is not visually verified without a test session. |
| `/editor` | Redirected to `/auth` | Route protection works locally, but Editor UI is not visually verified without a test session. |
| `/agents` | Redirected to `/auth` | Route protection works locally, but n8n agent UI is not visually verified without a test session. |
| `/settings` | Redirected to `/auth?provider=GITHUB` | Route protection works locally, but provider credentials UI is not visually verified without a test session. |
| `/launches` | Redirected to `/auth` | Route protection works locally, but calendar/date-picker UI is not visually verified without a test session. |
| `/media` | Redirected to `/auth` | Route protection works locally, but media UI is not visually verified without a test session. |

Current blocker for the next UI review pass:

- Full visual QA for `/editor`, `/content-routing`, `/agents`, `/settings`, `/launches`, and `/media` requires an authenticated browser session against a working backend.
- Do not mark those protected screens as visually accepted until a test account/session is available or a dedicated local UI fixture exists.

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
