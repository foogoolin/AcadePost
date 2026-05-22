# AcadéPost Project Plan

## Current MVP Goal

AcadéPost is a fast demo-ready social publishing MVP adapted from an existing social publishing codebase. The first milestone is a working self-hosted product with AcadéPost branding, Docker startup, and a clear content routing workflow for video, short text, and carousel publishing.

## Product Decisions

- UI product name: AcadéPost.
- Repository/project slug: AcadePost.
- Public logo mark: keep the supplied `A` raster asset at `apps/frontend/public/brand/acadepost-logo.png`; do not replace it with a generated or approximate mark.
- Technical base: the existing upstream monorepo structure.
- Priority: customer-demo readiness before deep refactors.
- Architecture: keep the existing monorepo, Docker, Prisma, PostgreSQL, Redis, Temporal, NestJS, and Next.js structure for the first MVP.
- Internal package aliases such as `@gitroom/*` can remain during MVP if changing them risks build instability.
- Legal and licensing handling is owned separately by the project owner and does not block MVP work.
- Visual redesign guardrails: preserve dark and light themes, black primary UI, `#4cccb8` main accent, and `#fda100` secondary accent.

## Content Routing MVP

AcadéPost groups publishing targets by content type:

- `video`: YouTube, TikTok, Instagram Reels.
- `short_text`: Threads, X.
- `carousel`: Meta, Pinterest.

The first workflow should classify content into one of these groups, make the matching platforms obvious in the UI, and create/schedule posts through the existing publishing flow wherever possible.

## Work Phases

1. Bootstrap AcadePost repository from the upstream codebase.
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
- Public brand cleanup completed across auth, onboarding, billing, public API/developer surfaces, browser extension metadata, SDK/demo docs, locale fallback values, generated email subjects, Sentry/Swagger labels, MCP labels, and demo sample URLs.

## Audit Update - 2026-05-13

- Cleanup scope: Public UI Only with technical exceptions allowed.
- Public product wording should use `AcadéPost`; technical slugs and package examples should use `AcadePost`.
- Internal aliases such as `@gitroom/*`, translation key names, `POSTIZ_*` environment variables, and `@postiz/wallets` stay unchanged during the MVP unless a separate build-safe rename pass is planned.
- Direct old-brand search is clean for public code/docs after cleanup. The only remaining legacy attribution hit is in `LICENSE`, which is legal-track and should be handled by the project owner before any attribution rewrite.
- Dependency/build verification status: `corepack pnpm dlx prisma@6.5.0 generate`, frontend build, backend build, orchestrator build, and extension Vite build pass locally. Backend/orchestrator need `NODE_OPTIONS=--max-old-space-size=8192` in this shell.
- Current environment caveats: the shell is running Node `v24.13.0` while the repo requests `>=22.12.0 <23.0.0`; `corepack pnpm install --frozen-lockfile` reaches postinstall but fails because the lifecycle script calls bare `pnpm`, which is not in PATH on this Windows setup; the extension package build script uses Unix `rm/cp/zip`, so it needs a cross-platform packaging script.
- No-code continuation guidance: FlutterFlow or another no-code tool should be treated as a client shell over AcadéPost APIs, not a direct repository import. Keep the NestJS/Temporal/Postgres publishing engine in code, then expose stable API endpoints for a FlutterFlow/mobile/admin frontend if desired.
- Next demo-readiness phase: install/use Node 22.x, fix cross-platform scripts, run browser smoke checks for auth, sidebar, `/content-routing`, public API/developer, onboarding, and billing surfaces.

## BYAN Integration Update - 2026-05-13

- Communication language set to Russian in BYAN configs; project/document output remains French.
- Project context created at `_byan-output/project-context.md` for BYAN/Codex continuation.
- Read `_byan/agents/byan.md` as the main BYAN agent and `_byan/bmb/agents/codex.md` as the Codex integration specialist.
- Corrected `.codex/prompts` activation paths from stale `_bmad` references to real `_byan` agent files for the installed prompts.
- Hermes installed as `_byan/core/agents/hermes.md`, registered in `_byan/_config/agent-manifest.csv`, and re-enabled through `.codex/prompts/hermes.md`.
- Local validation found 32 prompt files pointing to existing BYAN agents.
- Current local `codex-cli 0.130.0` does not expose the older `codex skill` command described by the BYAN Codex agent, so `.codex/prompts` should be treated as project prompt scaffolding rather than a verified CLI skill registry.

## Build Script Update - 2026-05-13

- Replaced the extension package's Unix-only `rm/cp/zip` build command with Node-based cross-platform scripts.
- `apps/extension/scripts/build.mjs` now cleans `dist`, runs Vite, copies `manifest.json`, and creates `apps/extension/extension.zip` without relying on a system `zip` binary.
- `apps/extension/scripts/dev.mjs` replaces Unix inline env assignment for extension watch mode.
- Root `build:extension` no longer calls Unix `rm`.
- Verification: `corepack pnpm --filter ./apps/extension run build` passes locally. The generated ZIP contains `background.js`, `manifest.json`, `icon-32.png`, and `icon-128.png`.
- Remaining caveat: local shell still uses Node `v24.13.0`; repo target remains `>=22.12.0 <23.0.0`.
- Customer demo runbook added at `docs/customer-demo-runbook.md`.

## Mise a jour acces multi-projets - 2026-05-13

- BYAN workflow: `@byan` doit piloter le travail. Les agents BYAN utilises pour ce passage sont Architect/Winston pour la validation de modele et Tea/Murat pour la matrice de verification.
- Decision MVP: garder `Organization` comme limite technique interne de tenant, billing, API key, posts, media et integrations; presenter cette limite a l'utilisateur comme un `Projet`.
- Roles visibles: `SUPERADMIN` devient `Propriétaire`, `ADMIN` reste `Admin`, `USER` devient `Éditeur`. Aucun rename Prisma/enum n'est fait pour le MVP.
- Creation projet ajoutee via `POST /user/organizations` et le selecteur projet frontend. Le projet cree devient le projet actif via le cookie `showorg`.
- Changement projet renforce: `POST /user/change-org` verifie maintenant que l'utilisateur est membre actif du projet avant de poser `showorg`.
- UI demo labels ajoutes en francais: `Projet actuel`, `Nom du projet`, `Creer un projet`, `Membres du projet`, `Éditeur`, `Propriétaire`.
- RBAC demo renforce: en environnement sans Stripe key, les limites de subscription restent ouvertes pour le demo, mais les checks `ADMIN` continuent de bloquer les `Éditeur`.
- Isolation renforcee sur les surfaces a risque: update de posts par `id`, remplacement d'un `group`, edition de tags, creation de commentaires et resolution de media par `id` verifient maintenant la frontiere `organizationId`.
- Orchestrator mis a jour pour passer `organizationId` a la resolution media pendant la publication.
- Verification locale: frontend build passe, backend build passe, orchestrator build passe. Les builds ont ete executes avec `corepack pnpm`; backend/orchestrator gardent `NODE_OPTIONS=--max-old-space-size=8192`. La machine locale signale toujours Node `v24.13.0` alors que le repo cible Node 22.x.
- Verification restante avant demo navigateur: creer deux projets, inviter Admin/Éditeur, verifier le switch projet, verifier que posts/media/integrations/tags/commentaires d'un projet ne sont pas visibles ni modifiables depuis un autre.

## Deploiement demo serveur - 2026-05-13

- Scope confirme: deploiement brut demo/staging, pas production.
- Agents BYAN utilises: Architect/Winston pour l'architecture single-server, Dev/Amelia pour les fichiers Docker/runtime, Tea/Murat pour les gates de verification.
- Ajout de `Dockerfile.demo` pour construire une image demo Node 22 avec nginx, PM2 et build monorepo.
- Ajout de `docker-compose.demo.yaml` pour lancer AcadéPost, PostgreSQL, Redis et Temporal sur un serveur Linux avec un seul port public par defaut: `4007`.
- Ajout de `.env.demo.example` pour sortir les secrets et URL publiques du compose.
- Ajout de `ecosystem.demo.config.cjs` et `deploy/demo/entrypoint.sh` pour demarrer backend, frontend et orchestrator via `pm2-runtime`; l'entrypoint attend Temporal avant de lancer les services applicatifs.
- Ajout de `deploy/demo/server-up.sh` pour un lancement assiste sur VPS Linux/Contabo: creation de `.env.demo`, generation de secrets demo, validation Compose, build et `up -d`.
- Le bootstrap Prisma est explicite via `ACADEPOST_DEMO_DB_PUSH=true`; il doit rester reserve au demo/staging.
- `var/docker/docker-build.sh` et `var/docker/docker-create.sh` pointent maintenant vers le workflow demo AcadéPost au lieu des anciennes commandes upstream.
- `.dockerignore` evite d'envoyer les secrets locaux, BYAN, Codex, Claude et artefacts locaux dans le contexte Docker.
- `var/docker/nginx.conf` ajoute les headers proxy et timeouts necessaires pour un serveur demo.
- Documentation de deploiement ajoutee: `docs/demo-server-deploy.md`.
- Validation locale: `docker compose --env-file .env.demo.example -f docker-compose.demo.yaml config --quiet` passe; les builds frontend/backend/orchestrator/extension passent hors Docker.
- Limite locale: Docker Desktop Windows a interrompu le build image pendant `next build` avec une erreur engine `EOF`, puis a continue a produire des timeouts. La verification runtime doit donc etre faite sur le serveur Linux cible.

## Encoding Memory Update - 2026-05-14

- Problème récurrent enregistré pour Codex/BYAN: certains fichiers texte peuvent contenir du mojibake UTF-8 dans les accents français et dans le nom produit visible.
- Correction appliquée dans `AGENTS.md`, `PROJECT_PLAN.md` et `_byan-output/project-context.md`.
- Mémoire dédiée ajoutée dans `docs/codex-project-memory.md`.
- `.editorconfig` ajouté pour demander `charset = utf-8` et `end_of_line = lf`.
- Nouvelle règle: avant chaque commit qui touche docs, prompts, traductions ou labels UI, lancer la recherche mojibake documentée dans `docs/codex-project-memory.md`.

## Shared Infra Deployment Update - 2026-05-14

- Ajout d'un chemin de deploiement shared-infra separe du compose clean-VPS.
- Nouveau compose: `docker-compose.demo.shared-infra.yaml`.
- Nouveau template env: `.env.demo.shared-infra.example`.
- Nouveau launcher: `deploy/demo/server-up-shared-infra.sh`.
- Nouveau runbook: `docs/demo-shared-infra-deploy.md`.
- Prompt agent serveur ajoute: `docs/server-agent-shared-infra-prompt.md`.
- Le build Docker n'embarque plus de domaine public; la valeur build-time de `NEXT_PUBLIC_BACKEND_URL` est relative: `/api`.
- Le domaine public reste une configuration runtime via `ACADEPOST_PUBLIC_URL`, afin que la meme image puisse etre lancee derriere n'importe quel domaine.
- Le runtime `.env` doit fournir un `NEXT_PUBLIC_BACKEND_URL` absolu, par exemple `https://domain.example/api`, car le backend l'utilise pour MCP/OAuth et les callbacks externes.
- Les launchers demo recalculent `NEXT_PUBLIC_BACKEND_URL` depuis `ACADEPOST_PUBLIC_URL` si la valeur exemple est encore presente.
- Le shared-infra compose utilise un PostgreSQL externe via `DATABASE_URL`, les reseaux externes `proxy` et `backend`, Redis local au stack, Temporal local au stack avec PostgreSQL externe, et aucun port public expose.
- Health endpoints ajoutes: `/api/monitor/health` et `/api/monitor/ready`.
- `TRUST_PROXY=true` est supporte cote backend et active dans le shared-infra compose.

## GHCR Image Deployment Update - 2026-05-14

- Ajout du workflow GitHub Actions `.github/workflows/build-demo-image.yml`.
- Le workflow publie l'image demo vers `ghcr.io/foogoolin/acadepost:demo` et vers un tag SHA.
- Les compose demo utilisent maintenant l'image preconstruite par defaut au lieu de construire sur le serveur.
- Les scripts `deploy/demo/server-up.sh` et `deploy/demo/server-up-shared-infra.sh` font `docker compose pull acadepost` puis `up -d`, sans `--build`.
- La construction locale reste possible via `var/docker/docker-build.sh`, mais elle n'est plus le chemin normal de deploiement serveur.
- Corrections serveur integrees apres le premier deploiement: `BIND_ON_IP=0.0.0.0` pour Temporal multi-reseaux, droits bind-mount Elasticsearch pour uid `1000`, et chemins PM2 vers `apps/*/dist/...`.

## Contabo Demo Deployment Result - 2026-05-14

- Deploiement shared-infra verifie par l'agent serveur sur `https://post.fgln.pro`.
- TLS Let's Encrypt actif via Caddy.
- `/api/monitor/ready` retourne `200`.
- Conteneurs actifs: `acadepost`, `acadepost-redis`, `temporal`, `temporal-elasticsearch`.
- Infrastructure utilisee: PostgreSQL partage, Caddy reverse proxy, reseaux Docker `proxy` et `backend`.
- Fixes serveur reportes et integres dans le repo: droits Elasticsearch bind-mount, `BIND_ON_IP=0.0.0.0`, chemins PM2 backend/orchestrator et `cwd` frontend.
- Action urgente hors code: revoquer les tokens GitHub exposes pendant le deploiement et supprimer `/root/.github-token` sur le serveur apres revocation.

## Logo Cleanup - 2026-05-14

- Le logo public utilise maintenant l'asset fourni `apps/frontend/public/brand/acadepost-logo.png` dans la sidebar, les ecrans OAuth, billing et auth via les composants partages.
- Les favicons Next des surfaces app/provider/extension pointent vers l'asset AcadéPost au lieu de l'ancien `favicon.ico`.
- Les fichiers `favicon.png`, `favicon.ico`, `apps/extension/public/icon-32.png` et `apps/extension/public/icon-128.png` ont ete regeneres depuis l'asset AcadéPost.
- Les endpoints statiques `/logo.svg` et `/logo-text.svg` servent une variante AcadéPost.
- La preview publique remplace le vieux wordmark inline par le nom `AcadéPost`.

## Nettoyage references marque - 2026-05-15

- Passe BYAN/Codex: les derniers noms directs de l'ancienne marque ont ete retires du runbook demo, du contexte BYAN et de la ligne d'audit du plan.
- Verification: recherche directe des noms legacy dans les app/docs publics sans resultat; recherche mojibake hors memoire dediee sans resultat; `git diff --check` passe.
- Exceptions techniques inchangees: aliases internes, variables d'environnement historiques, cles techniques et piste legale `LICENSE`.

## Visual Redesign Guardrails - 2026-05-15

- Le travail visuel doit se faire sur une branche separee avant merge vers `main`.
- Le logo public `A` est l'image fournie `apps/frontend/public/brand/acadepost-logo.png`; ne pas le remplacer par une lettre dessinee, un nouveau pictogramme ou un logo genere.
- Les deux themes existants, sombre et clair, doivent etre conserves.
- Les couleurs de marque restent: noir comme base, `#4cccb8` comme accent principal, `#fda100` comme accent secondaire.
- Le fichier `C:\Users\my\Documents\byan-test\DESIGN.md` est une specification de calendrier/date-picker Cal.com-like, pas un redesign complet de tout le produit.

## Visual Redesign Safe Pass - 2026-05-15

- Branche de travail: `codex/visual-redesign-safe-pass`.
- BYAN/Codex applique un premier passage frontend-only sans changement backend, Prisma, auth, billing engine, posting engine ou Docker.
- Le shell applicatif a maintenant des classes scindées `acadepost-*` pour la sidebar, le topbar, les états actifs, le sélecteur projet et les panneaux demo.
- Les écrans auth prioritaires (`login`, `register`, `forgot`, `activate`, reset password) utilisent le logo raster `A`, les textes fallback français et la palette noir/mint/amber.
- La langue par défaut de l'application est maintenant `fr`; le sélecteur de langue continue de fonctionner via le cookie `i18next`.
- `/content-routing` est passé en écran de démonstration français avec groupes `Vidéo`, `Texte court`, `Carrousel`, plateformes associées et accès vers calendrier/média.
- Le date-picker/calendrier garde le style Cal.com-like issu de `DESIGN.md`: cellules carrées, sélection near-black, Inter/system typography, aucun purple actif.
- Les surfaces visibles billing, public API/developer et OAuth authorization ont perdu les principaux CTA purple et mojibake détectés.
- Vérification locale: `corepack pnpm --filter ./apps/frontend run build` passe avec l'avertissement connu Node `v24.13.0` vs cible repo `>=22.12.0 <23.0.0`.

## BYAN Codex Agent Bridge - 2026-05-15

- Ajout d'un pont explicite entre les agents markdown BYAN et les prompts Codex.
- Les agents sources restent dans `_byan/agents/*.md`; ils ne sont pas dupliqués ni réécrits.
- Les stubs Codex sont maintenant disponibles sous `.codex/prompts/byan-*.md`: `byan-byan`, `byan-skeptic`, `byan-rachid`, `byan-marc`, `byan-jimmy`, `byan-mike`, `byan-tao`, `byan-turbo-whisper`, `byan-yanstaller`.
- Le fichier `.codex/prompts/byan-agent-bridge.md` définit le contrat d'exécution: charger `_byan/config.yaml`, charger l'agent BYAN complet, charger les fichiers `*-soul.md` et `*-tao.md` si présents, puis reporter le rôle BYAN plutôt que le nickname technique du subagent Codex.
- Le skill `.claude/skills/byan-codex/SKILL.md` a été mis à jour pour imposer ce mode de délégation.
- Limite connue: Codex Desktop génère toujours ses propres nicknames de subagents; le pont garantit le rôle et la source BYAN, pas le renommage interne du runtime Codex.

## Editor, n8n Agents et Docker Update - 2026-05-15

- BYAN workflow utilise pour ce passage: Rachid a audite le chemin Docker/GHCR/update, Marc a audite le contrat API n8n, Skeptic a bloque le Full Access non scope.
- Decision architecture: n8n reste une couche externe d'automatisation au-dessus du Public REST API; `/copilot/agent` reste reserve au chat UI.
- Ajout des modeles Prisma `PostTemplate`, `ExternalAgent` et `AgentRun`.
- Les posts peuvent maintenant porter les metadonnees demo `agentRunId`, `requiresApproval`, `agentStatus` et `source` pour afficher les propositions agent dans le calendrier.
- Nouvelle page `/editor` avec label `Éditeur`: creation de modeles `Post 1:1`, `Post 3:4`, `Carrousel 1:1`, `Carrousel 3:4`, choix image, position overlay, label site, texte, couleur HEX, opacite, preview live et rendu PNG vers la Media Library.
- Style `/editor` applique selon `C:\Users\my\Documents\byan-test\DESIGN.md`: densite SaaS, cellules/controles carres 6-8px, Inter/system, base near-black/white, pas de purple actif.
- Nouvelle gestion n8n dans `/agents`: creation de webhook-agent, mode `Human in the loop` par defaut, mode `Full Access` explicite, scopes visibles et test webhook.
- Securite MVP: les agents `human_in_the_loop` ne peuvent pas creer `schedule` ou `now`; `Full Access` exige les scopes demandes par le mode, et les secrets agent sont verifies separement.
- Nouveaux endpoints app: `/agent-webhooks`, `/agent-webhooks/:id/test`, `/post-templates`, `/post-templates/:id/render-preview`.
- Nouveaux endpoints public/n8n: `/public/v1/post-templates`, `/public/v1/post-templates/:id/render`, `/public/v1/agent-runs`, `/public/v1/agent-runs/:id`, et `PUT /public/v1/posts/:id` pour status/date/releaseId.
- Public auth accepte maintenant aussi le format `Authorization: Bearer <token>` en plus du format historique direct.
- Le calendrier affiche les posts agent avec labels `Généré par agent`, `À valider` ou `Planifié` selon `agentStatus`.
- Docker update normalise: `deploy/demo/update.sh` valide Compose, fait `docker compose pull acadepost`, recrée le service avec `--no-build --force-recreate`, attend `/api/monitor/ready` et affiche l'image active.
- Documentation ajoutee: `docs/demo-docker-update.md`; les runbooks clean-VPS et shared-infra pointent vers le nouveau script.
- Verification locale: `prisma generate`, backend build, frontend build, orchestrator build, `docker compose config --quiet` pour clean-VPS et shared-infra, `git diff --check`, recherche mojibake hors `docs/codex-project-memory.md`.
- Caveat local inchangé: Node local `v24.13.0` est hors plage cible repo `>=22.12.0 <23.0.0`; les builds passent quand même avec l'avertissement.

## Security Pass n8n/Docker - 2026-05-16

- BYAN workflow utilise: Skeptic a audite le modele agent/scopes et Rachid a audite Docker/GHCR/update path.
- Public API durci: les tokens OAuth `pos_` ne sont plus acceptes par defaut (`PUBLIC_API_ALLOW_OAUTH=false`); l'API key projet reste le credential server-to-server.

- `/public/v1/agent-runs` exige maintenant un agent explicite via `x-acadepost-agent-id` ou `externalAgentId` et le secret via `x-acadepost-agent-secret`; le bypass sans agent est ferme.
- Les secrets agent ne sont plus acceptes dans le body de `PublicAgentRunDto` et ne sont plus persistables dans `AgentRun.input`.
- SSRF hardening: les IPv4-mapped IPv6 en forme hex (`::ffff:7f00:1`) sont traites comme IPv4, les fetch publics gardent le dispatcher SSRF-safe et ont un timeout de 15s.
- Upload/render hardening: les remote uploads et rendus template ont des limites de taille et ne loggent plus les payloads de posts publics.
- Docker hardening: Temporal UI debug bind sur `127.0.0.1` par defaut, shared-infra garde `ACADEPOST_DEMO_DB_PUSH=false` par defaut, `update.sh` avertit sur le tag mutable `:demo` et affiche le digest precedent si disponible.
- `/api/monitor/ready` retourne un statut minimal sans exposer hosts/ports internes des dependances.
- Rapport dedie ajoute: `docs/security/acadepost-security-review-2026-05-16.md`.

## Social Provider Readiness - 2026-05-16

- BYAN Marc a inventorie les providers reels dans `libraries/nestjs-libraries/src/integrations/integration.manager.ts` et le flow OAuth `FRONTEND_URL/integrations/social/{provider}`.
- Verification Context7 effectuee pour les plateformes a risque: TikTok Content Posting API, Meta Facebook/Instagram/Threads publishing et LinkedIn Community Management.
- Rapport ajoute: `docs/integrations/social-provider-readiness-2026-05-16.md`.
- Conclusion: AcadéPost garde les providers Postiz-style, mais self-host ne herite pas des credentials/app approvals Postiz Cloud; chaque plateforme doit etre configuree via `.env` et son portail developpeur.
- Docker demo corrige pour transmettre les credentials manquants: Instagram standalone, Google My Business, Telegram, Twitch, Kick, VK, Neynar/Farcaster, MeWe, Whop, X analytics et Facebook Pixel.
- Corrections integration: parsing callback MeWe unifie et suppression du log Telegram contenant l'objet chat.
- Risques suivis: `wrapcast` ne correspond pas au nom public `warpcast` de la doc Postiz, Dribbble contient encore un `refreshToken()` avec endpoints Pinterest, Skool depend d'une extension non disponible dans le build demo.

## Provider Credentials Manager - 2026-05-16

- Decision confirmee: les pages legal/security/policies sont reportees; ce passage implemente uniquement la configuration technique des credentials et URLs de callback.
- BYAN Marc a valide l'architecture `Credentials` type n8n: secrets chiffres en base par projet, definitions de champs non secretes, fallback `.env` preserve pour demo/deploiement.
- BYAN Skeptic a impose les garde-fous MVP: cle de chiffrement serveur separee, pas de retour plaintext API, admin-only, pas de log des secrets, et scopes/tenant boundary conserves.
- Nouveau modele Prisma `ProviderCredential` rattache a `Organization` pour stocker les credentials OAuth/API par projet.
- Nouveaux endpoints authentifies admin: `GET /provider-credentials/providers`, `GET /provider-credentials`, `GET /provider-credentials/:id`, `POST /provider-credentials`, `PUT /provider-credentials/:id`, `POST /provider-credentials/:id/test`, `DELETE /provider-credentials/:id`.
- Nouvel ecran Settings `Identifiants`: selection fournisseur, champs dynamiques, valeurs masquees, test de champs requis, URLs techniques a declarer dans les portails developpeurs.
- Les URLs techniques affichees incluent domaine app, site web, redirect URI, API base, deauthorize callback et data deletion callback; les pages policy/legal correspondantes restent a traiter plus tard.
- Le flow connect OAuth cherche maintenant d'abord les credentials du projet, puis retombe sur `.env`.
- Runtime credentials connectes pour les principaux providers demo: X, Meta/Facebook, Instagram Business, Instagram Standalone, Threads, YouTube, Google Business Profile, TikTok, Pinterest, LinkedIn, LinkedIn Page et Reddit.
- L'orchestrator et le refresh workflow resolvent aussi les credentials projet pour les providers qui en ont besoin pendant publication ou refresh token.
- Docker demo expose et genere `ACADEPOST_CREDENTIALS_ENCRYPTION_KEY`; le domaine reste configurable par `.env`, jamais encode dans l'image.

## Vibe-coding / Open-source Rework Guardrails - 2026-05-16

- Ajout de `docs/vibecoder-open-source-rework-guardrails.md` comme checklist owner-facing pour travailler avec des LLM sur un fork open-source.
- Les regles projet `AGENTS.md` incluent maintenant des garde-fous explicites: verifier avant de declarer une feature fonctionnelle, ne pas exposer de secrets, garder Docker domain-agnostic, controler les agents Full Access et ne pas pretendre qu'un provider social fonctionne sans smoke test reel.
- Decisions appliquees a AcadéPost: le rebrand ne doit pas masquer les contraintes de licence/attribution, le fork n'herite pas des approvals/credentials SaaS du produit upstream, et les integrations sociales restent le risque produit prioritaire.
- Nouveau gate de travail: toute demande LLM substantielle doit finir par un artefact verifiable, par exemple source, reference de fichier, build/test, smoke flow ou risque ouvert dans `PROJECT_PLAN.md`.
- Sources de reference ajoutees dans le document: GitHub licensing, ChooseALicense, OWASP LLM Top 10, OpenSSF Scorecard et OpenSSF Best Practices.

## Security/Posting Reliability Pass - 2026-05-16

- Decision owner: les membres d'un projet peuvent utiliser/tester les agents webhook du projet, mais la creation, modification, suppression, URL webhook, secret et scopes `Full Access` sont reserves aux roles `ADMIN`/`SUPERADMIN`.
- Les endpoints app `/agent-webhooks` gardent `list`, `test` et `run` accessibles aux membres authentifies du projet; `POST`, `PUT` et `DELETE` exigent maintenant `Sections.ADMIN`.
- Les secrets des nouveaux agents externes sont stockes en HMAC `hmac-sha256` avec comparaison timing-safe; le format chiffre historique reste accepte en fallback pour ne pas casser les agents demo existants.
- Nouveau lien de fiabilite publication: `Integration` peut maintenant stocker `providerCredentialId`, afin qu'un canal social reste attache au credential utilise pendant son OAuth connect.
- Le flow OAuth stocke le `credentialId` dans Redis avec le `state`; le callback sauvegarde cette valeur dans l'integration creee.
- Les workflows `refresh` et `orchestrator post/comment` resolvent d'abord le credential rattache au canal, puis retombent sur le credential actif ou `.env` seulement si aucun credential n'est lie.
- L'endpoint public `/public/v1/social/:integration` utilise aussi les credentials projet et transporte le `credentialId` dans le state OAuth.
- Les providers encore non relies au runtime credentials UI sont marques dans les notes de configuration: Discord, Slack, Mastodon, Dribbble, Kick, Twitch, VK, Farcaster/Warpcast, Telegram, MeWe et Whop restent dependants des variables serveur `.env` pour le MVP.
- Verification locale: `prisma generate`, backend build, orchestrator build, frontend build, `docker compose config --quiet` pour clean-VPS et shared-infra, recherche mojibake hors memoire dediee et `git diff --check` passent. Avertissement connu: Node local `v24.13.0` au lieu de la plage cible Node 22.x.

## Postiz Feature Benchmark - 2026-05-16

- Audit officiel Postiz effectue depuis le site produit, pricing, documentation, Public API, MCP tools, providers overview, docs index et repository GitHub.
- Rapport ajoute: `docs/product/postiz-feature-comparison-2026-05-16.md`.
- Conclusion produit: Postiz couvre scheduling multi-canal, calendrier, 30+ canaux, Public API/OAuth2/MCP/CLI/n8n, webhooks, media upload, AI image/video, analytics, teams, customer groups, plugs, repeated posts, RSS auto-post, posting sets et signatures.
- Conclusion AcadéPost: le fork contient une grande partie du moteur, mais une fonctionnalite ne doit etre declaree "prete client" qu'apres OAuth, credentials, callback domain et smoke test reel par provider.
- Difference strategique AcadéPost: credentials par projet dans l'UI, projets/roles adaptes a AcadéNice, templates Editor pour agents, n8n agents `Human in the loop` / `Full Access`, et Docker update par GHCR.
- Prochain gate prioritaire: matrice provider `ready / blocked / needs app review`, puis smoke test reel de publication sur YouTube, TikTok, Instagram, Facebook Page, Threads, X, LinkedIn et Pinterest.

## MVP Provider Credentials Gate - 2026-05-16

- Version produit fixee: `v1.1.0`.
- README public remplace l'ancien brouillon interne: presentation produit, providers MVP, deploiement, configuration, developpement local et documentation.
- `CHANGELOG.md` ajoute avec les notes `v1.1.0` et le baseline `v1.0.0`.
- GitHub Actions demo image publie maintenant `ghcr.io/foogoolin/acadepost:demo`, `ghcr.io/foogoolin/acadepost:v1.1.0` et le tag SHA.
- Scope implemente directement dans `main`: Telegram, Facebook Pages, Instagram Business, Threads, YouTube et Pinterest.
- Source de checklist: documentation Postiz providers pour champs requis, redirect URIs, permissions/scopes et caveats tester/app-review; l'architecture `.env` Postiz n'est pas reprise comme modele principal.
- BYAN workflow: Rachid a valide que Docker/GHCR/update path reste `pull` + `up --no-build`; Marc a audite le contrat credentials/API; Skeptic a audite les risques security et a bloque toute promesse de fonctionnement sans smoke test reel.
- Facebook, Instagram et Threads restent des credentials separes cote AcadéPost. Le fallback automatique Instagram vers Facebook et Facebook vers Instagram a ete retire.
- Telegram utilise maintenant le `botToken` et le `botName` du credential projet pour `/integrations/telegram/config`, `/integrations/telegram/updates`, connect et publication; pendant le connect, ces endpoints resolvent aussi le credential lie au `state` Redis; `.env` reste seulement fallback legacy/demo.
- Le provider Telegram ne cree plus de bot global au demarrage backend et ne logge plus le contenu texte des posts.
- La publication planifiee et les commentaires passent le `clientInformation` resolu depuis `Integration.providerCredentialId` au provider social.
- Le refresh batch historique passe par `RefreshIntegrationService`, afin de conserver le credential lie au canal au lieu de rafraichir avec les seules variables serveur.
- CORS autorise maintenant `x-acadepost-agent-id` et `x-acadepost-agent-secret` pour les clients Public API/agent dans un navigateur; n8n server-to-server n'etait pas bloque par CORS.
- Documentation mise a jour: `docs/integrations/social-provider-readiness-2026-05-16.md` et `docs/product/postiz-feature-comparison-2026-05-16.md`.
- Gaps explicites avant promesse client: vrais smoke tests provider avec credentials reels, choix manuel du credential dans Add Channel quand plusieurs credentials du meme provider existent, reduction du pouvoir de la project API key si elle est donnee a un agent, et masquage/controle plus fin des webhook URLs n8n pour les non-admins.

## Docker Image Tag Clarification - 2026-05-17

- README public clarifie que l'installation stable doit utiliser une image versionnee comme `ghcr.io/foogoolin/acadepost:v1.1.1`.
- Le tag `ghcr.io/foogoolin/acadepost:demo` reste disponible uniquement comme tag mobile pour le dernier build MVP de `main`; il ne doit pas etre presente comme un "Docker demo" separe.
- Les exemples `.env.demo*` et les valeurs fallback des compose demo pointent maintenant vers `v1.1.1` par defaut.
- Les runbooks serveur, le prompt agent shared-infra, le rapport security et les guardrails owner-facing ont ete alignes sur la preference tag versionne.
- Verification locale: `docker compose --env-file .env.demo.example -f docker-compose.demo.yaml config --quiet`, `docker compose --env-file .env.demo.shared-infra.example -f docker-compose.demo.shared-infra.yaml config --quiet`, recherche mojibake et `git diff --check` passent.
- Limite BYAN tooling observee avant correction: le MCP BYAN cherchait `bin/byan-v2-cli.js`, absent du depot; la validation BYAN interactive via MCP etait donc bloquee tant que ce wrapper n'etait pas restaure ou pointe vers le bon CLI.

## BYAN MCP CLI Repair - 2026-05-17

- Cause racine: `_byan/mcp/byan-mcp-server/lib/cli.js` appelait `node bin/byan-v2-cli.js`, mais le fichier `bin/byan-v2-cli.js` n'etait pas installe dans le depot.
- Ajout d'un entrypoint compatible `bin/byan-v2-cli.js` pour les commandes attendues par BYAN MCP et les agents: `elo summary`, `elo context`, `elo dashboard`, `elo record`, `elo declare`, `fc check`, `fc parse`, `fc verify`, `fc graph` et `fc sheet`.
- Le CLI lit et met a jour les memoires locales BYAN: `_byan/_memory/elo-profile.json` et `_byan/_memory/fact-graph.json`.
- Verification locale: `node bin/byan-v2-cli.js elo summary`, `node bin/byan-v2-cli.js elo context security`, `node bin/byan-v2-cli.js fc parse ...` et `node bin/byan-v2-cli.js fc check ...` passent.
- Verification MCP: les tools `byan_fc_parse`, `byan_elo_summary` et `byan_elo_context` repondent a nouveau via MCP sans erreur `MODULE_NOT_FOUND`.

## Editor Navigation Fix - 2026-05-17

- Version produit preparee: `v1.1.1`.
- Le point d'entree sidebar de l'Editor utilise maintenant le label stable ASCII `Editeur`, sans dependre d'une traduction accentuee.
- `/content-routing` ajoute un CTA direct `Ouvrir l'editeur` vers `/editor`, afin que le workflow demo ait un second chemin visible vers les presets.
- Le workflow GHCR lit maintenant la version depuis `package.json` pour publier automatiquement le tag versionne correspondant, au lieu de garder un tag hard-code.
- Les defaults Docker et la documentation deploiement pointent vers `ghcr.io/foogoolin/acadepost:v1.1.1`.

## Build Web Apps UI Pass And Latest Image - 2026-05-17

- Version produit preparee: `v1.1.2`.
- Source design chargee: `C:\Users\my\Documents\byan-test\DESIGN.md`; elle s'applique strictement aux calendriers/date-pickers, pas comme redesign complet de tout le produit.
- Plan de review ajoute: `docs/build-web-apps-ui-review-plan.md`.
- Browser UI pass a trouve que `/brand/acadepost-logo.png` etait intercepte par le proxy frontend et renvoyait du HTML; le logo raster `A` etait donc casse sur l'auth/app shell.
- Fix applique dans `apps/frontend/src/proxy.ts`: les chemins `/brand/*` bypassent maintenant la logique auth/proxy comme les assets publics.
- Workflow GHCR publie maintenant `ghcr.io/foogoolin/acadepost:latest` en plus de `:demo`, du tag versionne et du SHA.
- Les defaults Docker et `.env.demo*` utilisent maintenant `ghcr.io/foogoolin/acadepost:latest` pour une installation normale sans changer le numero d'image a chaque update.

## Docker Recovery And Repo Hygiene - 2026-05-17

- Version produit preparee: `v1.1.3`.
- BYAN MCP route la tache comme travail complexe dans le thread principal; roles de controle: Rachid pour Docker/deploy, Skeptic pour secrets/risques, Tea/Quinn pour gates.
- Le serveur Contabo reste hors scope jusqu'a publication et verification d'un nouveau `ghcr.io/foogoolin/acadepost:latest`.
- `Dockerfile.demo` passe en multi-stage: `deps`, `builder`, puis `runner` avec runtime assets seulement.
- Le runtime image ne copie plus tout le monorepo: seuls `node_modules` production, builds backend/frontend/orchestrator, Prisma schema, nginx config, PM2 config et entrypoint demo sont inclus.
- `.dockerignore` exclut maintenant BYAN output, agents locaux, Codex config locale, reports, design scratch docs, caches et logs du build context.
- `_byan-output/*` et `reports/junit.xml` sont retires du suivi Git; `_byan/` reste le framework BYAN local.
- `.mcp.json` local ne contient plus de BYAN API token; `BYAN_API_TOKEN` doit venir de l'environnement et le token expose doit etre remplace.
- L'ancien workflow upstream `build-containers.yml`, qui poussait encore vers `ghcr.io/gitroomhq/postiz-app`, est supprime.
- Le workflow scheduled `stale.yml` upstream est supprime; les templates GitHub issue/PR et les workflows extension ne pointent plus vers les URLs Postiz.
- Le workflow `Build demo image` publie toujours `latest`, `demo`, `vX.Y.Z` et SHA, puis verifie la taille compressee linux/amd64 contre une limite CI.

## Mobile Launches Layout Fix - 2026-05-17

- Version produit preparee: `v1.1.4`.
- Scope: frontend-only mobile fix for the app shell and `/launches` calendar. No backend, Prisma, Docker or server changes.
- The main app frame now prevents page-level horizontal overflow while keeping the sidebar fixed-width and the main panel shrink-safe.
- The protected layout switches its content area to a vertical stack on narrow screens, so secondary panels sit above the main view instead of squeezing side-by-side.
- The launches channel panel gets a stable mobile height, while the calendar panel owns its internal horizontal scroll.
- Week and month calendar grids use `acadepost-week-grid` and `acadepost-month-grid` CSS classes with mobile minimum column widths to prevent day-cell overlap.
- Filter controls now shrink/truncate safely on narrow screens instead of forcing the viewport wider.
- Verification locale: frontend build passes; browser smoke on mobile `390x667` and desktop `1280x720` shows no body overflow and no relevant console errors.

## Docker Image Optimization - 2026-05-18

- BYAN FD actif: `docker-image-optimization`.
- BYAN agents utilises: Rachid pour Docker/GHCR/update path, Architect pour process/proxy architecture, Quinn/Tea pour gates, Compliance/Security pour secrets/ports/rollback.
- Decision: ne pas retenter le pull Contabo du vieux `latest` sans nouveau digest valide.
- Le chemin demo utilise maintenant un proxy public `acadepost` sur `5000` et des services internes separes: `acadepost-backend`, `acadepost-frontend`, `acadepost-orchestrator`, `acadepost-migrate`.
- `Dockerfile.demo` n'embarque plus nginx/PM2 et utilise Next standalone + trace runtime backend/orchestrator au lieu de copier tout le root `node_modules`.
- `acadepost-migrate` est le seul service qui peut lancer `prisma db push --accept-data-loss`, controle par `ACADEPOST_DEMO_DB_PUSH`.
- Les secrets backend ne sont plus passes au conteneur frontend dans les compose demo.
- CI demo valide les compose, interdit `build:` dans le chemin install, teste l'echec de `deploy/demo/update.sh` quand `pull` echoue, applique le gate de taille image, lance la stack Compose et verifie la sante backend/frontend/orchestrator/proxy avant publication GHCR.
- Hotfix runtime: les dependances dynamiques requises par Temporal workflow bundling sont conservees dans l'image optimisee, notamment `@temporalio`, `dayjs`, `lodash` et `tslib`.
- Version produit fixee pour ce passage: `v1.1.5`.
- Verification: `npm test` passe apres correction Jest, `git diff --check` passe, le workflow GitHub Actions `Build demo image` run `26035055443` passe et publie `ghcr.io/foogoolin/acadepost:latest`.
- Resultat serveur: la mise a jour Contabo shared-infra du 2026-05-18 a tire l'image publiee sans `docker build`; `acadepost`, `acadepost-backend`, `acadepost-frontend` et `acadepost-orchestrator` sont sains, et `/api/monitor/ready` retourne `200`.
- Digest runtime observe: `sha256:0aa076af6444ee1b4e83b32882a859167625292d53322c944c151d226815852c`; taille image rapportee serveur: `1.02GB`.
- Follow-up P2: prebundler les workflows Temporal pour reduire le cold start orchestrator et ajouter un mode update app-only `--no-deps` dans `deploy/demo/update.sh`, ou separer explicitement first-install et update.

## Telegram Credentials Visibility Fix - 2026-05-18

- Version produit preparee: `v1.1.6`.
- Bug visible: Telegram etait bien supporte par le runtime credentials, mais il apparaissait trop bas dans la liste `Parametres > Identifiants`, sous le groupe `Community`; sur le premier ecran demo, l'utilisateur ne voyait donc pas ou donner le bot token.
- Correction: Telegram est maintenant dans le premier groupe `Core social`, juste apres X, avec les champs `Bot Token` et `Bot Name`.
- Correction UX n8n-like: la page `Identifiants` separe mieux les provider definitions et les saved credential instances avec recherche de provider, liste des credentials du provider courant, edition masquee et bouton `Tester la connexion`.
- Correction UI demo: les cards de providers credentials affichent maintenant les icones sociales locales, et la version `NEXT_PUBLIC_VERSION` est visible en bas a gauche dans le rail applicatif et le menu Settings.
- Correction backend: le test d'un credential Telegram appelle maintenant la configuration Bot API via le provider Telegram, au lieu de seulement valider les champs requis.
- Correction runtime: le provider Telegram est charge en lazy import pendant le test credential, afin que le backend ne charge pas Telegram Bot API pendant le bootstrap.
- Documentation ajoutee: `docs/provider-credentials-guide.md` avec commande de generation de la cle de chiffrement, exemple Telegram, differences avec n8n et edge cases.
- Verification: tests rouge/vert ajoutes sur la registry credentials et le test provider Telegram pour garder Telegram visible et verifier que le bouton de test declenche une vraie verification provider.
- Deploiement serveur: GitHub Actions run `26040847349` a publie `ghcr.io/foogoolin/acadepost:v1.1.6`; le serveur Contabo shared-infra a ete epingle sur ce tag avec `NEXT_PUBLIC_VERSION=v1.1.6` et une cle `ACADEPOST_CREDENTIALS_ENCRYPTION_KEY` generee cote serveur.
- Verification serveur: `/api/monitor/ready` public retourne `ok`, l'image runtime expose `NEXT_PUBLIC_VERSION=v1.1.6`, et la registry credentials embarquee contient Telegram dans `Core social` avec `Bot Token` / `Bot Name`.

## Credentials Hotfix v1.1.7 - 2026-05-20

- Version produit preparee: `v1.1.7`.
- Correction Settings: `ProviderCredentialsComponent` est sorti du formulaire global de profil dans `settings.component.tsx`; les boutons d'action credentials ont maintenant un `type="button"` explicite pour eviter les submits accidentels vers `/user/personal`.
- Correction n8n-like connect: le flow Add Channel charge les credentials projet enregistres, affiche un selector quand le provider a des credentials actifs, transmet `credentialId` a `/integrations/social/{provider}`, puis le backend valide le credential par org/provider avant de le lier au `state` Redis.
- Correction securite: `ACADEPOST_CREDENTIALS_ENCRYPTION_KEY` active les credentials seulement si la valeur est un `64 hex` ou un base64 de 32 bytes; les placeholders `change-me`, `change-this`, `CHANGE_ME...`, les valeurs vides et les passphrases arbitraires gardent l'UI en mode disabled.
- Correction deploy: `deploy/demo/update.sh --no-deps` propage maintenant `--no-deps` a `docker compose up`, et `ACADEPOST_SERVICE_HEALTH_ATTEMPTS` vaut `180` par defaut pour reduire les faux echecs pendant le cold start orchestrator.
- Documentation mise a jour: `README.md`, `CHANGELOG.md`, `docs/provider-credentials-guide.md`, `docs/demo-docker-update.md` et ce plan.
- Caveat release: le chemin UI/API est couvert par tests, mais le smoke publish Telegram reel reste conditionne a des credentials bot/channel reels et au deploiement de l'image pinnee `ghcr.io/foogoolin/acadepost:v1.1.7`.

## Editor Media Preview Fix - 2026-05-20

- Bug visible: dans `/content-routing`, le CTA primaire `Ouvrir l'editeur` pouvait afficher du texte noir sur bouton noir en theme clair.
- Bug visible: dans `/editor`, la modale `Choisir une image` etait ouverte sans hauteur explicite; le composant MediaBox pouvait donc sembler vide dans le flow demo.
- Bug visible: les uploads locaux etaient bien sauves via `POST /media/upload-simple`, mais le preview utilisait `media.path` brut. Quand la DB contenait une URL `/uploads/...` avec un autre host public, l'image ne s'affichait pas dans le navigateur courant.
- Correction: `useMediaDirectory` normalise les medias locaux vers le chemin courant `/uploads/...` tout en gardant les URLs CDN/externes inchangees.
- Correction: la selection depuis la bibliotheque media renseigne maintenant aussi `previewMediaId`, afin que `Enregistrer le modele` conserve le lien Media dans `PostTemplate.previewMediaId`.
- Verification: test Jest cible `libraries/react-shared-libraries/src/helpers/use.media.directory.test.ts`, `git diff --check`, et `corepack pnpm --filter ./apps/frontend run build` passent. La machine locale reste en Node `v24.13.0`, hors plage cible Node 22.x.
- Constat storage: AcadéPost ne stocke pas les binaires image en PostgreSQL; la table `Media` garde les metadonnees et `path`, tandis que le fichier vit dans le provider choisi par `STORAGE_PROVIDER`.
- Constat demo: le provider cible reste `local`, avec `UPLOAD_DIRECTORY=/uploads` et `NEXT_PUBLIC_UPLOAD_STATIC_DIRECTORY=/uploads`; les compose demo montent ce dossier comme volume persistant.
- Constat template: `PostTemplate.previewMediaId` garde le lien vers l'image de preview; sauver un modele sans ce champ donne l'impression que l'image n'est pas conservee.

## Provider Pipeline Rework Fork - 2026-05-22

- Version produit preparee: `v1.1.8`.
- Worktree/fork local cree pour isoler la refonte: `/opt/AcadePost-provider-rework`.
- Branche de travail: `byan/provider-pipeline-rework`.
- BYAN MCP FD demarre: `20260522-100231-provider-pipeline-rework`, phase `DOC`.
- Plan d'implementation ajoute: `docs/superpowers/plans/2026-05-22-provider-pipeline-rework-implementation.md`.
- Plugins/workflows UI actives pour la suite: Build Web Apps frontend planning, React best practices, frontend testing avec fallback Playwright; Mermaid Chart disponible pour les schemas.
- Gate `ok doc` valide par Ilya; implementation demarree sous BYAN FD `20260522-101949-provider-pipeline-rework-build`.
- Backend: ajout des modeles `ProviderConnectionLog` et `ProviderPublishAttempt`, repository/service logs, sanitizer central, logs de test credential et publish attempt logging dans l'orchestrator.
- Provider: Telegram expose les operations explicites `telegram.message.send`, `telegram.photo.send`, `telegram.mediaGroup.send`, `telegram.document.send`, avec defaults legacy.
- Frontend: le composer garde un contrat `settings.providerOperation.operationId`, ajoute un selecteur d'operation Telegram, et le flow Add Channel est renomme autour des destinations.
- Observability: ajout des endpoints `/provider-logs/publish-attempts` et `/provider-logs/connection`, plus la page UI `Pipeline` pour consulter `Provider Publish Attempt Log` et `Provider Connection Log`.
- Design gate: `design.md` ajoute le contrat court; les boutons/cartes touches utilisent les utilities `acadepost-button-primary`, `acadepost-button-secondary`, `acadepost-surface-card` avec gradients discrets, ombres et palette AcadéPost.

## Open Questions

- Which real platform API should be connected first after the MVP demo path is stable?
- Which real social platform API should be connected first for the customer demo?
- Should public preview endpoints expose full post payloads by id, or should the demo use a narrower public DTO?

## Next Steps

- Switch the local development runtime to Node 22.x and make `pnpm` available in PATH or change lifecycle scripts to use Corepack-safe commands.
- Make backend/orchestrator builds set a larger Node heap consistently.
- Add the first content routing UI affordance without rewriting the publishing engine.
- Run browser smoke checks for multi-project access: owner project creation, Admin/Éditeur invites, role-based settings, and cross-project negative access attempts.

## Update Rule

Update this file after every meaningful project change: bootstrap, rebrand, Docker verification, design intake, workflow changes, integrations, and customer-demo preparation.
