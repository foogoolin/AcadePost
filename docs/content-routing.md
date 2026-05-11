# AcadéPost Content Routing

The first AcadéPost MVP adds a content-first planning layer on top of the existing publishing engine.

## Default Groups

| Content type | Platforms |
| --- | --- |
| `video` | YouTube, TikTok, Instagram Reels |
| `short_text` | Threads, X |
| `carousel` | Meta, Pinterest |

## MVP Behavior

- The UI should make the three content groups visible before deep platform configuration.
- Scheduling should reuse the existing post/calendar flow wherever possible.
- Real publishing still depends on platform credentials and OAuth setup.
- The first version can use guidance and defaults before adding database-backed routing rules.

## Later Enhancements

- Store routing rules per organization.
- Auto-detect content type from media and text length.
- Add platform-specific validation before scheduling.
- Add analytics grouped by content type.
