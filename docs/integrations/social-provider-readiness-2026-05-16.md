# Social provider readiness - AcadéPost demo

Date: 2026-05-16

## Executive summary

Social providers are the core value of AcadéPost. The current codebase keeps the Postiz-style provider architecture and contains a broad provider list, but real operability depends on three things:

- The provider exists in the AcadéPost code and UI.
- The project has a UI credential or, for legacy/demo fallback only, Docker runtime receives the provider credentials from `.env`.
- The external platform app is correctly created, approved when needed, and configured with the exact callback URL.

Important answer about "Postiz partnership": self-hosted Postiz docs say providers are not configured by default and must be configured through `.env` or environment variables. That means this fork does not inherit Postiz Cloud credentials, partner apps, or app-review approvals. If Postiz Cloud has its own approved platform applications, that is cloud-specific and not automatically transferred to AcadéPost.

AcadéPost's target direction is different from the Postiz self-host model: for the MVP providers below, social credentials are configured per project from Settings > Identifiants. `.env` remains a legacy/demo fallback and a place for system settings such as database, Redis, JWT, public domain and encryption key.

## Sources used

- Postiz Providers Overview: https://docs.postiz.com/providers/overview
- Postiz Public API Integrations list: https://docs.postiz.com/public-api/integrations/list
- Postiz Public API Overview and supported platform settings: https://docs.postiz.com/public-api/introduction
- Context7, TikTok for Developers: Content Posting API docs, including `video.upload`, `video.publish`, direct post, and audited-client restrictions.
- Context7, Meta Developer Documentation: Facebook Pages, Instagram publishing, Threads publishing, required permissions and publishing limits.
- Context7, LinkedIn API docs: `w_member_social`, `w_organization_social`, Community Management access review.
- X API Manage Posts docs: https://docs.x.com/x-api/posts/manage-tweets/integrate
- YouTube Data API `videos.insert`: https://developers.google.com/youtube/v3/docs/videos/insert
- Google OAuth sensitive scope verification: https://developers.google.com/identity/protocols/oauth2/scopes
- Pinterest organic content and OAuth docs: https://developer.pinterest.com/docs/work-with-organic-content-and-users/create-boards-and-pins/ and https://developers.pinterest.com/docs/getting-started/set-up-authentication-and-authorization/

## MVP provider credentials gate

This gate covers the channels requested for the first customer-facing verification pass: Telegram, Facebook Pages, Instagram Business, Threads, YouTube and Pinterest.

BYAN review note: the current Add Channel flow automatically chooses the active credential for a provider. This is enough for one credential per provider in a project, but it is not yet a user-facing credential picker. If one project stores multiple YouTube/Pinterest/Facebook credentials, the next iteration should let the user choose which credential is used for the channel connection.

| Provider | UI credential | Required fields | Redirect URI / setup | Review or tester caveat | Current smoke status |
|---|---|---|---|---|---|
| Telegram | `telegram` | BotFather bot token, optional bot username | No OAuth redirect; add bot to the target group/channel and run `/connect xxxx` | Bot must have enough chat/channel permissions; admin rights let AcadéPost clean up connection messages | Code path ready for the state-bound UI credential; real bot smoke still required |
| Facebook Pages | `facebook` | Facebook App ID, App Secret | `/integrations/social/facebook` | Pages permissions and public-app review may be required outside app roles/testers | OAuth URL/code path ready; real page smoke still required |
| Instagram Business | `instagram` | Instagram/Facebook Business App ID, App Secret stored as a separate AcadéPost credential | `/integrations/social/instagram` | Professional IG account linked to a Facebook Page; advanced permissions/app review may be required | OAuth/page selection/code path ready; real IG smoke still required |
| Threads | `threads` | Threads App ID, Threads App Secret | `/integrations/social/threads` | `threads_basic` and `threads_content_publish`; app setup must be completed in Meta dashboard | OAuth/code path ready; real Threads smoke still required |
| YouTube | `youtube` | Google OAuth Client ID, Client Secret | `/integrations/social/youtube` | YouTube Data API v3 must be enabled; test users/verification may be required for sensitive scopes | OAuth/upload code path ready; real channel smoke still required |
| Pinterest | `pinterest` | Pinterest App ID, App Secret | `/integrations/social/pinterest` | Pinterest company account and app approval may be required | OAuth/pin code path ready; real board smoke still required |

Facebook, Instagram and Threads are intentionally separate AcadéPost credentials. Even if the owner uses the same Meta app values manually, AcadéPost does not automatically substitute Facebook credentials for Instagram or Threads.

## Status legend

- `Can test with credentials`: code path exists; after real credentials and callbacks it should be testable.
- `Needs platform review`: code path exists, but public/client demo use likely needs approval, verification, app review, or paid/API access.
- `Easy first test`: usually custom token/bot/self-hosted credentials, no large platform app review expected.
- `Risk / needs fix`: provider exists but has an identified code or identifier risk.
- `Blocked for demo`: not reliable in the current demo path.

## Postiz vs AcadéPost provider list

Postiz docs list 32 public provider identifiers in the Public API reference. AcadéPost currently registers 33 providers in code because it also includes `mewe`. Postiz Provider Overview mentions MeWe, while the Public API enum page does not list `mewe`, so MeWe should be treated as supported-by-code but requiring extra verification.

| Provider | Postiz docs | AcadéPost code | Runtime env in demo Docker | Current readiness | Notes |
|---|---:|---:|---:|---|---|
| X / Twitter `x` | Yes | Yes | Yes | Needs platform review | Uses `X_API_KEY`, `X_API_SECRET`, optional `X_URL`. X docs require developer app credentials and user-context OAuth for posting. |
| LinkedIn profile `linkedin` | Yes | Yes | Yes | Needs platform review | Code requests member and organization social scopes. LinkedIn Community Management/API access review is the main blocker. |
| LinkedIn Page `linkedin-page` | Yes | Yes | Yes | Needs platform review | Two-step page selection. Requires page role and `w_organization_social`. |
| Facebook Page `facebook` | Yes | Yes | UI credential + env fallback | Needs platform review | Separate credential. Requires Meta app, Pages permissions, page task rights, and likely app review for public use. |
| Instagram FB-linked `instagram` | Yes | Yes | UI credential + env fallback | Needs platform review | Separate credential. Requires Instagram professional account linked to a Facebook Page and `instagram_content_publish`. |
| Instagram standalone `instagram-standalone` | Yes | Yes | Yes, added in this pass | Needs platform review | Uses `INSTAGRAM_APP_ID` and `INSTAGRAM_APP_SECRET`; demo env/compose now pass them. |
| Threads `threads` | Yes | Yes | UI credential + env fallback | Needs platform review | Separate credential. Requires `threads_basic` and `threads_content_publish`. HTTPS callback is strongly preferred. |
| Bluesky `bluesky` | Yes | Yes | No global env needed | Easy first test | Custom-field connection. Good candidate for early proof of publishing. |
| Mastodon `mastodon` | Yes | Yes | Yes | Can test with credentials | Needs `MASTODON_URL`, client id, client secret. Instance-specific. |
| Farcaster / Warpcast | Postiz ID `warpcast` | AcadéPost ID `wrapcast` | Yes, added in this pass | Risk / needs fix | Identifier mismatch with Postiz docs. Uses Neynar. Keep on risk list until normalized or documented. |
| Nostr `nostr` | Yes | Yes | No global env needed | Easy first test | Custom-field/Web3-like connection. Lower app-review friction. |
| VK `vk` | Yes | Yes | Yes, added in this pass | Can test with credentials | Needs `VK_ID`. Requires VK developer app and callback configuration. |
| YouTube `youtube` | Yes | Yes | UI credential + env fallback | Needs platform review | Uses YouTube Data API upload scope. Google public apps using sensitive user-data scopes may need verification. |
| TikTok `tiktok` | Yes | Yes | Yes | Needs platform review | Content Posting API requires app product setup and `video.upload`/`video.publish`; unaudited/direct-post behavior is restricted. |
| Reddit `reddit` | Yes | Yes | Yes | Can test with credentials | Needs Reddit app credentials and callback. Usually easier than Meta/TikTok/LinkedIn. |
| Lemmy `lemmy` | Yes | Yes | No global env needed | Easy first test | Custom-field federated instance flow. Good low-friction test. |
| Discord `discord` | Yes | Yes | Yes | Can test with credentials | Needs Discord app/bot credentials and bot permissions in target server. |
| Slack `slack` | Yes | Yes | Yes | Can test with credentials | Needs Slack app OAuth credentials and channel permissions. |
| Telegram `telegram` | Yes | Yes | UI credential + env fallback | Easy first test | Runtime now uses the project bot token/bot name for connect and scheduled publish. Needs real bot smoke. |
| Kick `kick` | Yes | Yes | Yes, added in this pass | Can test with credentials | Chat/notification style provider, not a classic social feed. Needs Kick app credentials. |
| Twitch `twitch` | Yes | Yes | Yes, added in this pass | Can test with credentials | Provider posts chat messages/announcements, not timeline posts. Needs Twitch app credentials. |
| Pinterest `pinterest` | Yes | Yes | UI credential + env fallback | Needs platform review | Needs OAuth app and `boards:*` / `pins:*` scopes. Pinterest docs require access token scopes for board/pin management. |
| Dribbble `dribbble` | Yes | Yes | Yes | Risk / needs fix | Initial OAuth/post code exists, but `refreshToken()` contains Pinterest sandbox endpoints/env. It probably rarely runs, but it is a real code smell. |
| Medium `medium` | Yes | Yes | No global env needed | Easy first test | Custom-field/API-token style connection. |
| Dev.to `devto` | Yes | Yes | No global env needed | Easy first test | Custom-field/API-key style connection. |
| Hashnode `hashnode` | Yes | Yes | Uses existing upload URL env | Easy first test | Custom-field token/publication flow. |
| WordPress `wordpress` | Yes | Yes | No global env needed | Easy first test | Custom-field site/auth flow. |
| Google My Business `gmb` | Yes | Yes | Yes, added in this pass | Needs platform review | Uses Google OAuth and can fallback to YouTube credentials, but separate GMB credentials are now supported in Docker env. |
| Listmonk `listmonk` | Yes | Yes | No global env needed | Easy first test | Self-hosted newsletter tool. Good internal automation candidate. |
| Moltbook `moltbook` | Yes | Yes | No global env needed | Can test only if service is available | Niche/proprietary service; not important for core customer demo. |
| Skool `skool` | Yes | Yes | No global env needed | Blocked for demo | Chrome-extension/cookie flow. Current demo build says browser extension is not available. |
| Whop `whop` | Yes | Yes | Yes, added in this pass | Can test with credentials | Needs Whop client id and correct OAuth callback. |
| MeWe `mewe` | Provider overview says yes; Public API enum omits it | Yes | Yes, added in this pass | Can test with credentials, but verify manually | MeWe callback parsing had a duplicate/unreachable branch; this pass merged hash and query handling. |

## Callback model to configure in external apps

The general OAuth callback shape is:

```text
https://YOUR_DOMAIN/integrations/social/{provider}
```

Examples:

```text
https://post.fgln.pro/integrations/social/facebook
https://post.fgln.pro/integrations/social/instagram
https://post.fgln.pro/integrations/social/youtube
https://post.fgln.pro/integrations/social/tiktok
https://post.fgln.pro/integrations/social/linkedin
https://post.fgln.pro/integrations/social/pinterest
```

For a generic deploy, do not hardcode the domain into the image. Set:

```env
ACADEPOST_PUBLIC_URL=https://your-domain.example
NEXT_PUBLIC_BACKEND_URL=https://your-domain.example/api
```

Then configure each platform app with callbacks based on `ACADEPOST_PUBLIC_URL`.

## What changed in this pass

- Added the MVP credentials gate for Telegram, Facebook, Instagram, Threads, YouTube and Pinterest.
- Removed automatic Facebook/Instagram credential fallback so Meta products stay separate at the AcadéPost credential layer.
- Telegram connect and publish now resolve the state-bound/project credential bot token/bot name before using the legacy `.env` fallback.
- Scheduled publishing and refresh paths use the credential bound to the connected channel when `providerCredentialId` is present.
- Added missing integration env passthrough to `docker-compose.demo.yaml`.
- Added missing integration env passthrough to `docker-compose.demo.shared-infra.yaml`.
- Added missing placeholders to `.env.demo.example`.
- Added missing placeholders to `.env.demo.shared-infra.example`.
- Fixed MeWe callback parsing so hash-based and query-based `loginRequestToken` are both reachable.
- Removed Telegram chat object logging from the provider authentication path.

## Practical priority for demo validation

Recommended order:

1. Easy proof: Bluesky, Telegram, Mastodon, WordPress, Dev.to, Hashnode, Reddit.
2. Core business proof: Facebook Page, Instagram, Threads, YouTube, TikTok, LinkedIn Page, Pinterest, X.
3. Secondary/community: Discord, Slack, Twitch, Kick, VK, Whop, Listmonk.
4. Risk/low priority: Dribbble until refresh code is fixed; Farcaster until `wrapcast` vs `warpcast` is decided; Skool until extension flow is available.

## What cannot be truthfully verified without credentials

I can verify code paths, Docker env passthrough, build, and callback shape locally. I cannot honestly say "Facebook/TikTok/LinkedIn/YouTube works" until real developer apps exist and the app review/approval state is known.

For real verification, each provider needs:

- Live platform developer credentials.
- Exact callback URL configured in the platform console.
- Test account/page/channel with permission to publish.
- A smoke test: connect channel, create draft, schedule, publish now, verify release URL/status.
