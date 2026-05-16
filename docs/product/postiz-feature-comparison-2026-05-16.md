# Comparatif fonctionnel Postiz -> AcadéPost

Date d'audit: 2026-05-16

## Sources consultees

- Site produit Postiz: https://postiz.com/
- Pricing / matrice de fonctionnalites Postiz: https://postiz.com/pricing
- Documentation Postiz: https://docs.postiz.com/introduction
- Index documentation Postiz: https://docs.postiz.com/llms.txt
- Public API Postiz: https://docs.postiz.com/public-api/introduction
- Liste integrations Public API: https://docs.postiz.com/public-api/integrations/list
- MCP Postiz: https://docs.postiz.com/mcp/introduction
- MCP tools Postiz: https://docs.postiz.com/mcp/tools
- Providers Postiz: https://docs.postiz.com/providers/overview
- Repository officiel: https://github.com/gitroomhq/postiz-app

## Lecture rapide

Postiz est aujourd'hui presente comme une plateforme de social media scheduling agentique:

- calendrier visuel pour brouillons, posts planifies et publications immediates;
- publication multi-canal avec reglages par plateforme;
- 30+ reseaux sociaux / canaux de contenu;
- Public API, OAuth2, CLI, MCP, node n8n, Make/Zapier;
- webhooks, uploads media, video generation, image generation;
- analytics par canal et par post;
- equipes, roles, customer groups;
- plugs / auto-actions, repeated posts, RSS auto-post;
- self-host Docker avec PostgreSQL, Redis, Temporal, stockage local ou R2.

AcadéPost reprend une grande partie du moteur Postiz par le fork, mais le statut commercial doit rester prudent: un provider present dans le code ne veut pas dire "valide en production" tant que OAuth, credentials, callback domain et smoke test de publication n'ont pas ete verifies avec un vrai compte developpeur.

## Fonctionnalites Postiz par domaine

| Domaine | Fonctionnalite Postiz | Statut AcadéPost |
| --- | --- | --- |
| Scheduling | Brouillon, planification, publication immediate | Herite du moteur posts/orchestrator; build OK; smoke reel par reseau requis |
| Scheduling | Calendrier day/week/month | Herite; UI visuelle retravaillee partiellement |
| Scheduling | Cross-post vers plusieurs canaux | Herite; important pour le demo |
| Scheduling | Reglages differents par plateforme | Herite via DTO/settings provider |
| Scheduling | Threads / commentaires selon plateforme | Herite; code `comment()` dans plusieurs providers |
| Scheduling | Repeated posts / evergreen recycle | Semble herite par modele posts/repeats, a verifier en UI smoke |
| Scheduling | Post delays | Present dans la promesse Postiz; verification AcadéPost requise |
| Media | Upload fichier | Present `/public/v1/upload` et UI media |
| Media | Upload from URL | Present `/public/v1/upload-from-url`, SSRF hardening ajoute |
| Media | Advanced picture editor / Canva-like | Herite media editor; nouvel Editor templates ajoute, mais pas un Canva complet |
| Media | AI images | Present dans code OpenAI/media; credentials et quotas a verifier |
| Media | AI videos | Present via video manager (`image-text-slides`, `veo3`); credentials a verifier |
| AI | Smart Agent / chat agent | Herite `/copilot/agent` et MCP; n8n agents ajoutes separement |
| AI | Text generation / AI autocomplete | Herite OpenAI service; UI exacte a verifier |
| Automation | Public REST API | Present et etendu pour n8n/templates/agent-runs |
| Automation | OAuth2 developer apps | Herite, mais besoin de smoke test |
| Automation | MCP server | Present dans code (`start.mcp.ts`) et docs UI; a verifier runtime |
| Automation | CLI | Postiz officiel a CLI; AcadéPost ne doit pas le promettre sans package/branding verifie |
| Automation | n8n node | Postiz officiel en a un; AcadéPost a choisi webhook/API n8n, node dedie non cree |
| Automation | Make/Zapier | Postiz les promet; AcadéPost doit passer par Public API/webhooks pour l'instant |
| Automation | Webhooks sur publication | Present, avec SSRF hardening; UI Settings webhooks existe |
| Engagement | Internal plugs | Present dans code pour certains providers |
| Engagement | Global plugs / seuils analytics | Present dans architecture plugs; smoke requis |
| Engagement | Post comments | Present pour plusieurs providers |
| Analytics | Analytics canal | Present pour certains providers seulement |
| Analytics | Analytics post | Present pour certains providers seulement |
| Analytics | Short links / click analytics | Present dans code/settings; a verifier en UI et domain config |
| Collaboration | Team members | Present; roles retraduits Propriétaire/Admin/Éditeur |
| Collaboration | Customer groups | Present dans schema; AcadéPost les traite comme projets pour MVP |
| Collaboration | Role Admin/Member | Present; AcadéPost renforce Admin/Éditeur |
| Credentials | Providers config via `.env` | Herite |
| Credentials | Credentials par projet type n8n | Ajoute dans AcadéPost pour providers principaux |
| Deployment | Docker self-host | Present; AcadéPost a ajoute GHCR image + update script |
| Deployment | Reverse proxy Caddy/Nginx/Traefik | Postiz documente; AcadéPost shared-infra Caddy ajoute |
| Deployment | Temporal, Redis, SQL DB, storage | Present |

## Liste officielle des canaux Postiz et comparaison AcadéPost

Statuts:

- `Code`: provider existe dans `libraries/nestjs-libraries/src/integrations/social`.
- `Credentials UI`: l'ecran AcadéPost `Identifiants` peut configurer ce provider pour le runtime MVP.
- `Analytics`: le provider code expose `analytics()` ou `postAnalytics()`.
- `Risque`: ce qui doit etre smoke-teste avant de promettre au client.

| Canal Postiz | Identifiant docs | Code AcadéPost | Credentials UI MVP | Analytics code | Risque / note |
| --- | --- | --- | --- | --- | --- |
| X / Twitter | `x` | Oui | Oui | Oui | App X, callback, limites API et plan X a verifier |
| LinkedIn | `linkedin` | Oui | Oui | Non direct | OAuth + publication texte/media/commentaires a tester |
| LinkedIn Page | `linkedin-page` | Oui | Oui | Oui | Pages/company permissions a tester |
| Facebook | `facebook` | Oui | Oui | Oui | Meta app review, Pages permissions, policy URLs |
| Instagram Business | `instagram` | Oui | Oui | Oui | Meta app review, compte FB-linked, post/reel/carousel |
| Instagram Standalone | `instagram-standalone` | Oui | Oui | Oui via provider IG | Necessite flow specifique Instagram standalone |
| Threads | `threads` | Oui | Oui | Oui | Meta/Threads scopes + media status polling |
| Bluesky | `bluesky` | Oui | Fallback/env/custom fields | Non | App password / custom fields; smoke simple prioritaire |
| Mastodon | `mastodon` | Oui | Non runtime UI | Non | Provider principal present; custom instance desactive |
| Warpcast / Farcaster | `warpcast` | Partiel: code `wrapcast` | Non runtime UI | Non | Bug de nom: docs `warpcast`, code `wrapcast` |
| Nostr | `nostr` | Oui | Fallback/custom fields | Non | Cle privee / flow a auditer securite |
| VK | `vk` | Oui | Non runtime UI | Non | Credentials serveur `.env`; smoke requis |
| YouTube | `youtube` | Oui | Oui | Oui | Quotas upload, madeForKids, thumbnails/tags |
| TikTok | `tiktok` | Oui | Oui | Oui + missing | Content Posting API, privacy settings, quota TikTok |
| Reddit | `reddit` | Oui | Oui | Non | Subreddit/flair/title flow a tester |
| Lemmy | `lemmy` | Oui | Fallback/custom fields | Non | Instance URL/login; federation differences |
| Discord | `discord` | Oui | Non runtime UI | Non | Uses server/env; channel tool present |
| Slack | `slack` | Oui | Non runtime UI | Non | Uses server/env; channel tool present |
| Telegram | `telegram` | Oui | Non runtime UI | Non | Bot token/chat auth; code nettoye d'un log sensible |
| Kick | `kick` | Oui | Non runtime UI | Non | Credentials serveur `.env`; chat/post semantics |
| Twitch | `twitch` | Oui | Non runtime UI | Non | Chat/announcement semantics; OAuth smoke |
| Pinterest | `pinterest` | Oui | Oui | Oui | Boards, images, links; smoke prioritaire pour carrousels |
| Dribbble | `dribbble` | Oui | Non runtime UI | Oui | Risque code: refreshToken suspect mentionne dans plan |
| Medium | `medium` | Oui | Fallback/custom fields | Non | Markdown editor; publications/tags |
| Dev.to | `devto` | Oui | Fallback/custom fields | Non | API key/custom fields; org/tag tools |
| Hashnode | `hashnode` | Oui | Fallback/custom fields | Non | GraphQL token/publications/tags |
| WordPress | `wordpress` | Oui | Fallback/custom fields | Non | Domain/user/app password, HTML editor |
| Google My Business | `gmb` | Oui | Oui | Oui | Google Business Profile scopes, offers/events |
| Listmonk | `listmonk` | Oui | Fallback/custom fields | Non | Email campaign, server URL/API key |
| Moltbook | `moltbook` | Oui | Fallback/env | Non | Web3/agent network, not core customer priority |
| Skool | `skool` | Oui | Fallback/env | Non | Chrome extension / cookie based risk |
| Whop | `whop` | Oui | Non runtime UI | Non | Companies/experiences tools, server env |
| MeWe | `mewe` | Oui | Non runtime UI | Non | Present sur site/pricing et code, absent de certains tableaux Public API |

## API et automation Postiz

Postiz documente ces surfaces:

- `GET /public/v1/integrations`
- `GET /public/v1/is-connected`
- `GET /public/v1/find-slot/:id`
- `POST /public/v1/posts`
- `GET /public/v1/posts`
- `PUT /public/v1/posts/:id`
- `DELETE /public/v1/posts/:id`
- `DELETE /public/v1/posts/group/:group`
- `PUT /public/v1/posts/:id/status`
- `PUT /public/v1/posts/:id/release-id`
- `GET /public/v1/posts/:id/missing`
- `POST /public/v1/upload`
- `POST /public/v1/upload-from-url`
- `GET /public/v1/notifications`
- `GET /public/v1/analytics/:integration`
- `GET /public/v1/analytics/post/:postId`
- `POST /public/v1/video/function`
- `POST /public/v1/generate-video`
- `GET /public/v1/social/:integration`
- `POST /public/v1/integration-trigger/:id`

AcadéPost conserve ces endpoints principaux et ajoute pour la strategie n8n:

- `GET /public/v1/post-templates`
- `POST /public/v1/post-templates/:id/render`
- `POST /public/v1/agent-runs`
- `GET /public/v1/agent-runs/:id`

## MCP Postiz et equivalent AcadéPost

Postiz MCP expose 8 outils:

- `integrationList`
- `integrationSchema`
- `triggerTool`
- `schedulePostTool`
- `generateImageTool`
- `generateVideoOptions`
- `videoFunctionTool`
- `generateVideoTool`

AcadéPost contient le code MCP herite et doit le verifier en runtime apres rebrand/credentials. Pour notre produit, la voie prioritaire reste n8n via Public API + webhooks, car elle correspond mieux au besoin: documents strategie -> agents n8n -> propositions calendrier -> validation humaine ou full access.

## Points ou AcadéPost peut etre meilleur que Postiz pour le client

1. Credentials par projet dans l'UI, au lieu de forcer uniquement `.env`.
2. Projet comme frontiere d'acces visible pour ecole/agence: chaque client/etudiant/equipe travaille dans son espace.
3. `Éditeur` templates pour creer des presets visuels reutilisables par agents n8n.
4. Agents n8n avec modes `Human in the loop` et `Full Access` scopes.
5. Docker/GHCR update path: serveur tire une image preconstruite, ne build pas le projet.
6. Positionnement AcadéNice/formation: workflow pedagogique + validation marketing, pas seulement scheduler SaaS generaliste.

## Gaps prioritaires avant promesse client

1. Smoke-test reel de publication pour les providers de demo: YouTube, TikTok, Instagram, Facebook Page, Threads, X, LinkedIn, Pinterest.
2. Verifier OAuth callback domain pour Meta/Google/TikTok/LinkedIn/Pinterest sur le domaine client.
3. Corriger/decider `wrapcast` vs `warpcast`.
4. Clarifier providers qui restent `.env` seulement dans l'UI credentials.
5. Verifier MCP runtime ou retirer les promesses MCP visibles si non prioritaire.
6. Tester Public API avec un agent n8n reel: upload -> template render -> proposal -> calendrier -> validation -> publication.
7. Tester analytics post-publication sur au moins 3 reseaux majeurs.
8. Verifier short links et click analytics avec domaine public.
9. Verifier repeated posts/RSS/posting sets/signatures en UI.
10. Produire une matrice "Provider ready / blocked / needs app review" pour demo client.

