# Audit de readiness open source — AcadéPost

Date: 2026-05-28
Portee: installabilité depuis GitHub pour un utilisateur externe, sur serveur ou poste local, sans dependance implicite au serveur actuel.

## Verdict

[REASONING] AcadéPost est deja proche d'un modele open source installable: le depot contient des Compose d'installation, des exemples d'environnement, des scripts de demarrage/update, une image GHCR et des checks CI pour le chemin Docker demo.

[REASONING] Le projet n'est pas encore "proprement installable par un tiers" au niveau attendu pour un open source public. Les zones a fermer sont surtout la strategie de base de donnees, la coherence de version, la separation demo/production, et la preuve d'installation sur environnement vierge.

Statut global: `PARTIALLY_READY`.

## Sources locales inspectees

[CLAIM L1] Fichiers inspectes pendant l'audit:

- `README.md`
- `.env.example`
- `.env.demo.example`
- `.env.demo.shared-infra.example`
- `docker-compose.yaml`
- `docker-compose.demo.yaml`
- `docker-compose.demo.shared-infra.yaml`
- `deploy/demo/server-up.sh`
- `deploy/demo/server-up-shared-infra.sh`
- `deploy/demo/update.sh`
- `deploy/demo/app-entrypoint.sh`
- `.github/workflows/build-demo-image.yml`
- `package.json`
- `libraries/nestjs-libraries/src/database/prisma/schema.prisma`
- `_byan-output/project-memory.md`

## Ce qui est deja solide

[CLAIM L1] Le depot fournit un chemin Docker prebuilt pour l'installation demo via `docker-compose.demo.yaml` et `docker-compose.demo.shared-infra.yaml`.

[CLAIM L1] `README.md` decrit deux modes Compose: un VPS propre avec `docker-compose.demo.yaml`, et une installation sur infra partagee avec `docker-compose.demo.shared-infra.yaml`.

[CLAIM L1] Les scripts `deploy/demo/server-up.sh` et `deploy/demo/server-up-shared-infra.sh` creent l'env local depuis les `.example`, valident Docker Compose avec `docker compose config --quiet`, puis lancent la stack sans build local.

[CLAIM L1] `.github/workflows/build-demo-image.yml` valide les Compose d'installation, interdit `build:` dans les Compose demo, construit une image, lance une smoke stack Compose et publie l'image GHCR.

[CLAIM L1] `deploy/demo/update.sh` contient une gate de sante: validation Compose, pull image, recreation des services, verification de health container, puis verification HTTP de readiness.

[CLAIM L1] Le runtime est separe en services lisibles: proxy nginx `acadepost`, `acadepost-backend`, `acadepost-frontend`, `acadepost-orchestrator`, `acadepost-redis`, PostgreSQL applicatif en mode demo, Temporal, PostgreSQL Temporal et Elasticsearch Temporal.

## Gaps bloquants avant open source public

### 1. Strategie base de donnees

[CLAIM L1] Prisma utilise PostgreSQL via `DATABASE_URL` dans `libraries/nestjs-libraries/src/database/prisma/schema.prisma`.

[CLAIM L1] Aucun dossier de migrations Prisma n'a ete trouve sous `libraries/nestjs-libraries/src/database/prisma` pendant l'audit; le chemin actuel repose principalement sur `prisma db push`.

[ATTENTION] `deploy/demo/app-entrypoint.sh` peut lancer `prisma db push --accept-data-loss` quand `ACADEPOST_DEMO_DB_PUSH=true`. Ce comportement peut etre acceptable pour un bootstrap demo controle, mais il ne doit pas devenir la strategie normale pour des donnees utilisateur persistantes.

[REASONING] Pour un projet open source installable, il faut formaliser:

- bootstrap initial d'une base vide;
- migrations versionnees;
- procedure d'upgrade;
- rollback;
- backup avant migration;
- restore testable;
- distinction explicite `demo` vs `production`.

Priorite: `P0`.

### 2. Coherence de version

[CLAIM L1] `package.json` indique `version: 1.11.1`.

[CLAIM L1] `README.md` indique `Current version: v1.1.7`.

[CLAIM L1] `.env.demo.example` et `.env.demo.shared-infra.example` indiquent `NEXT_PUBLIC_VERSION=1.11.1`.

[REASONING] La documentation publique doit afficher une seule version canonique. Sinon, un installateur externe ne saura pas quelle image, quel tag et quelle doc correspondent.

Priorite: `P0`.

### 3. Installation vierge non prouvee localement dans ce workspace

[CLAIM L1] Le CI smoke test existe dans `.github/workflows/build-demo-image.yml`.

[REASONING] Le depot a une logique de smoke CI, mais l'audit local n'a pas encore execute une installation complete depuis zero dans un environnement client-like separe. Pour declarer l'install open source prete, il faut une preuve reproductible hors serveur actuel.

Priorite: `P0`.

### 4. Env examples trop proches de demo interne

[CLAIM L1] `.env.demo.example` contient beaucoup de placeholders d'integrations externes et active `ACADEPOST_DEMO_DB_PUSH=true`.

[CLAIM L1] `.env.demo.shared-infra.example` garde `ACADEPOST_DEMO_DB_PUSH=false`, mais demande une base PostgreSQL applicative et des bases Temporal deja creees.

[REASONING] Il faut separer clairement:

- `.env.example` pour developpement local;
- `.env.demo.example` pour test rapide;
- `.env.production.example` ou section production pour utilisateurs reels;
- guide secrets: valeurs obligatoires, generation, rotation, interdits Git.

Priorite: `P1`.

### 5. Documentation d'installation incomplete pour un novice externe

[CLAIM L1] `README.md` donne les commandes principales et pointe vers `docs/installation/demo-server-deploy.md`, `docs/installation/demo-shared-infra-deploy.md` et `docs/operations/docker-update.md`.

[REASONING] Il manque encore un chemin public unique du type: "je pars d'un serveur vierge, j'installe Docker, je clone, je configure, je lance, je verifie, je sauvegarde, j'update".

Priorite: `P1`.

### 6. Runtime production vs demo

[CLAIM L1] Les fichiers principaux portent le vocabulaire `demo`: `docker-compose.demo.yaml`, `.env.demo.example`, scripts `deploy/demo/*`.

[REASONING] Le chemin demo peut rester, mais un projet open source mature doit nommer explicitement le chemin recommande pour usage reel: soit `demo` assume comme self-host MVP, soit creation d'un profil `production`.

Priorite: `P1`.

### 7. Secrets et donnees persistantes

[CLAIM L1] Les secrets attendus sont fournis via env: `JWT_SECRET`, `ACADEPOST_CREDENTIALS_ENCRYPTION_KEY`, `DATABASE_URL`, tokens Telegram, provider OAuth, Stripe, OpenAI et autres integrations.

[ATTENTION] Domaine strict security — les secrets ne doivent jamais etre commit. L'audit local n'a pas execute un scan complet de secrets; il faut une verification dediee avant publication.

[REASONING] Pour open source, il faut documenter:

- generation de `JWT_SECRET`;
- generation de `ACADEPOST_CREDENTIALS_ENCRYPTION_KEY`;
- rotation des secrets;
- effet d'une rotation sur credentials stockes;
- localisation des volumes et donnees persistantes;
- sauvegarde de PostgreSQL, uploads, Redis si necessaire, Temporal si necessaire.

Priorite: `P0/P1`.

## Matrice readiness

| Domaine | Statut | Commentaire |
|---|---:|---|
| Repo GitHub | `READY_BASE` | Remote GitHub present et structure monorepo lisible. |
| Docker prebuilt install | `MOSTLY_READY` | Compose demo + shared-infra + GHCR + CI smoke existent. |
| Local development | `MOSTLY_READY` | Node/pnpm/build documentes; dev Docker existe. |
| Database bootstrap | `RISK` | `db push --accept-data-loss` reste central pour demo. |
| Migrations versionnees | `GAP` | Pas de migrations Prisma detectees dans le chemin inspecte. |
| Backup/restore | `GAP` | Des notes existent, mais pas un runbook complet et teste pour utilisateurs externes. |
| Env/secrets | `PARTIAL` | Examples presents, separation production/secrets encore a clarifier. |
| Release/versioning | `RISK` | Incoherence `1.11.1` vs `v1.1.7`. |
| CI release smoke | `GOOD_BASE` | Workflow demo image contient build, size gate, Compose smoke et push GHCR. |
| Third-party install proof | `GAP` | Pas encore de preuve locale d'installation vierge externe pendant cet audit. |

## Plan d'action recommande

### P0 — Avant de presenter AcadéPost comme installable open source

1. Aligner la version partout: `package.json`, README, env examples, tags GHCR, changelog.
2. Definir la strategie DB: migrations Prisma versionnees ou procedure equivalente, plus bootstrap initial.
3. Retirer `--accept-data-loss` du chemin production; le garder seulement pour demo explicite si necessaire.
4. Ecrire et tester un runbook backup/restore PostgreSQL + uploads.
5. Faire une installation depuis zero dans un environnement client-like et enregistrer la preuve: commandes, logs, healthchecks.
6. Ajouter une section "Quick install" claire dans README, sans dependance a `/opt/AcadePost` ni a l'infra personnelle.

### P1 — Stabilisation open source

1. Creer un guide `docs/self-host-install.md` ou renforcer les docs demo existantes.
2. Creer une politique `.env`: variables required, optional, demo-only, production-only.
3. Ajouter un script de smoke local post-install: readiness API, services healthy, frontend reachable.
4. Documenter le modele de donnees persistantes: PostgreSQL, uploads, Redis, Temporal/Elasticsearch.
5. Ajouter un guide update/rollback oriente utilisateur externe, pas seulement serveur actuel.

### P2 — Qualite projet public

1. Nettoyer le vocabulaire historique upstream si necessaire: Postiz/Gitroom/AcadéPost.
2. Ajouter contribution guide, issue templates specifiques AcadéPost, security policy.
3. Ajouter une page "Known limitations" pour providers non verifies live.
4. Ajouter une matrice supportee: OS, Docker version, RAM minimum, ports, reverse proxy.

## Decision de travail

[REASONING] Pour notre workflow, ce document devient le point d'entree de toutes les futures taches "open source install", "installation GitHub", "Docker public", "DB migration", "backup/restore" et "self-host".

[REASONING] Quand une future session demande "ou est l'audit open source / install GitHub", repondre avec ce chemin:

`docs/internal/audits/open-source-install-readiness-audit.md`
