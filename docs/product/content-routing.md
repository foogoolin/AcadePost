# AcadéPost Content Routing Product Brief

Date: 2026-05-26
Target implementation: next product version after `v1.1.9`
Current implementation status: `UI_ONLY`

## Product Intent

Content Routing is the layer that decides where a piece of content should go before AcadePost schedules or publishes it.

The product must support both flows:

- delayed publishing through the calendar;
- direct publishing immediately after content intake.

The routing decision should be content-first. The user should not have to manually remember that a short text is wrong for Instagram, or that a vertical video should go to TikTok, YouTube Shorts and Reels instead of Threads.

## Core Problem

Different social networks accept and reward different formats:

- short text works for fast conversational channels;
- image plus caption works for Instagram and visual feeds;
- vertical video works for short-form video channels;
- long-form text works for channels where readers accept longer posts.

AcadePost should classify the incoming content, recommend the correct channels, allow manual override, then either publish now or create scheduled posts.

## Content Classes

| Routing class | Detection input | Default recommended channels | Conditional channels | Excluded by default |
|---|---|---|---|---|
| `short_text` | Text only, roughly up to 1000 characters, no required media | X, Threads, Telegram | Facebook if enabled by the user | Instagram, TikTok, YouTube Shorts, Reels |
| `long_text` | Text above the short-text threshold | Telegram, Facebook | Instagram if an image is attached; LinkedIn can be considered later | TikTok, Reels, YouTube Shorts unless video exists |
| `image_caption` | One or more images plus caption | Instagram, Facebook, Telegram | Pinterest if image is suitable; X/Threads if caption is short enough | TikTok, YouTube Shorts |
| `carousel` | Multiple images/slides or editor carousel output | Instagram, Facebook, Pinterest | Telegram as album repost | X/Threads unless converted to thread/summary |
| `vertical_video` | Video with vertical aspect ratio plus optional caption | TikTok, YouTube Shorts, Instagram Reels | Facebook Reels, Telegram repost with link/media | Threads by default |
| `video` | Non-vertical or unknown-ratio video plus optional caption | YouTube, Telegram | Facebook with link/repost; LinkedIn later for business content | X/Threads unless short teaser text is generated |
| `mixed` | Text plus media that could fit several classes | Ask user or show ranked recommendations | User-selected overrides | No automatic direct publish until validated |

## Routing Principles

1. Instagram needs media. Text-only content must not route to Instagram by default.
2. Threads/X are text-first. Video-only routing should not include them unless AcadePost creates a separate teaser text or link post.
3. Vertical video is a special class, not just generic video.
4. Telegram is flexible and can accept short text, long text, image posts and video reposts.
5. Facebook is optional/configurable because the right behavior depends on client strategy.
6. Routing must recommend, not silently lock the user out. The user needs manual channel override with warnings.
7. Direct publishing needs stricter validation than scheduling because there is no later review window.

## User Flow

### Intake

The user or an external agent submits:

- text;
- optional media;
- optional publish mode: `draft`, `schedule`, `now`;
- optional desired channels;
- optional routing override.

### Classification

AcadePost computes:

- content class;
- confidence;
- media facts: image/video, count, aspect ratio, duration if available;
- text facts: length, links, hashtags, mentions;
- recommended channels;
- blocked channels with reasons.

### Review

The UI shows:

- detected content class;
- recommended channels selected by default;
- optional channels available to add;
- blocked channels with explanation;
- publish action: save draft, schedule, publish now.

### Execution

AcadePost creates posts for selected channels using the existing post engine:

- one post group per routing decision;
- per-channel settings still apply;
- missing provider settings block publish now and can block schedule if required;
- routing metadata is persisted for later analytics and debugging.

## API and Agent Behavior

The Public API and external agents should be able to use the same routing engine.

Suggested API additions:

```json
{
  "routing": {
    "mode": "auto",
    "contentClass": "short_text",
    "selectedIntegrationIds": [],
    "allowOptionalChannels": ["facebook"],
    "publishMode": "now"
  }
}
```

Suggested endpoints:

- `POST /public/v1/content-routing/preview`: classify content and return recommendations without creating posts.
- `POST /public/v1/content-routing/posts`: classify content and create draft/scheduled/now posts.
- `GET /public/v1/content-routing/rules`: return default and organization-specific routing rules.

Agent rules:

- `human_in_the_loop` agents can create proposals/drafts with routing metadata.
- `full_access` agents may schedule/publish only when their scopes allow it and the routing result has no hard blockers.
- Agent-created posts must store `source: external_agent`, `agentRunId`, `requiresApproval` when needed, and routing metadata.

## Persistence Requirements

Minimum fields or equivalent JSON metadata:

- content class: `short_text`, `long_text`, `image_caption`, `carousel`, `vertical_video`, `video`, `mixed`;
- routing confidence;
- selected integrations;
- recommended integrations;
- blocked integrations with reasons;
- manual override flag;
- publish mode requested;
- routing source: `ui`, `public_api`, `external_agent`;
- original media facts used for classification.

The metadata can start as JSON on the post group/domain model if that fits the current architecture better than a full normalized routing table.

## MVP Scope

MVP must include:

1. Classification by text length and attached media.
2. Detection of text-only content so Instagram is excluded by default.
3. Detection of vertical video if media metadata is available.
4. Default recommendation groups for short text, long text, image/caption, carousel and vertical video.
5. Manual override with warning.
6. Draft, schedule and publish-now integration with existing post creation.
7. Public API preview endpoint.
8. Routing metadata persisted and visible in calendar/post detail.

MVP can defer:

- AI rewriting per channel;
- automatic teaser generation for X/Threads from video;
- analytics by routing class;
- per-client advanced routing rule builder;
- automatic cross-post link generation after primary platform publish.

## Default Rules Draft

Short text:

- default: X, Threads, Telegram;
- optional: Facebook;
- blocked: Instagram unless image is added.

Long text:

- default: Telegram, Facebook;
- optional: Instagram only with image, LinkedIn later if supported;
- blocked: short-video platforms unless video is attached.

Image plus caption:

- default: Instagram, Facebook, Telegram;
- optional: Pinterest, X, Threads depending on caption length.

Carousel:

- default: Instagram, Facebook, Pinterest;
- optional: Telegram album.

Vertical video:

- default: TikTok, YouTube Shorts, Instagram Reels;
- optional: Facebook Reels, Telegram repost;
- blocked: Threads by default.

Generic video:

- default: YouTube, Telegram;
- optional: Facebook link/repost.

## Acceptance Criteria

Content Routing can move from `UI_ONLY` only when:

1. A UI user can submit text/media and see detected class plus recommended channels.
2. The user can override channel selection with warnings.
3. A routing preview can be called from Public API.
4. A routed draft/scheduled/now post can be created.
5. Routing metadata is persisted and visible later.
6. Text-only content does not route to Instagram by default.
7. Vertical video routes to TikTok, YouTube Shorts and Reels by default.
8. Human-in-the-loop agents cannot bypass review to publish directly.
9. Full-access agents need explicit scopes and valid secrets.
10. Browser/API tests prove the above.
