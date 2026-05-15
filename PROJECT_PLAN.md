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
