# AcadéPost Project Plan

## Current MVP Goal

AcadéPost is a fast demo-ready social publishing MVP built from the Postiz codebase. The first milestone is a working self-hosted product with AcadéPost branding, Docker startup, and a clear content routing workflow for video, short text, and carousel publishing.

## Product Decisions

- UI product name: AcadéPost.
- Repository/project slug: AcadePost.
- Technical base: the full `gitroomhq/postiz-app` codebase.
- Priority: customer-demo readiness before deep refactors.
- Architecture: keep the existing monorepo, Docker, Prisma, PostgreSQL, Redis, Temporal, NestJS, and Next.js structure for the first MVP.
- Internal package aliases such as `@gitroom/*` can remain during MVP if changing them risks build instability.
- Legal and licensing handling is owned separately by the project owner and does not block MVP work.

## Content Routing MVP

AcadéPost groups publishing targets by content type:

- `video`: YouTube, TikTok, Instagram Reels.
- `short_text`: Threads, X.
- `carousel`: Meta, Pinterest.

The first workflow should classify content into one of these groups, make the matching platforms obvious in the UI, and create/schedule posts through the existing publishing flow wherever possible.

## Work Phases

1. Bootstrap AcadePost repository from Postiz.
2. Add project memory and working rules.
3. Apply safe customer-facing rebrand.
4. Add Content Routing documentation and MVP defaults.
5. Install dependencies and verify local startup path.
6. Accept and adapt Claude Code design rules into the current styling system.
7. Build the first demo flow for creating and scheduling routed content.

## Completed

- Project plan created.
- Working rules added.
- Upstream remote removed from the local repository during bootstrap.
- GitHub repository created: `foogoolin/AcadePost`.
- Imported design references archived under `docs/design/source-*`.
- AcadéPost brand layer added with black, `#4cccb8`, and `#fda100`.
- AcadéPost logo added to `apps/frontend/public/brand/acadepost-logo.png`.

## Open Questions

- Which real platform API should be connected first after the MVP demo path is stable?
- Which real social platform API should be connected first for the customer demo?

## Next Steps

- Complete bootstrap and dependency verification.
- Replace remaining visible customer-facing Postiz/Gitroom branding with AcadéPost where safe.
- Add a short customer demo runbook.
- Add the first content routing UI affordance without rewriting the publishing engine.

## Update Rule

Update this file after every meaningful project change: bootstrap, rebrand, Docker verification, design intake, workflow changes, integrations, and customer-demo preparation.
