# Runbook Démo Client AcadéPost

Date : 2026-05-13  
Objectif : préparer une démonstration reproductible du MVP AcadéPost sans modifier l'architecture existante.

## 1. Préparation locale

1. Utiliser Node `>=22.12.0 <23.0.0`.
2. Vérifier que `corepack` est disponible.
3. Depuis la racine du projet, installer les dépendances avec :

```powershell
corepack pnpm install --frozen-lockfile
```

Note actuelle : sur Windows, si le postinstall échoue parce que `pnpm` nu n'est pas dans le `PATH`, utiliser `corepack pnpm` pour les commandes de vérification et corriger l'environnement avant la démo.

## 2. Vérifications build avant démo

Exécuter les commandes suivantes depuis la racine :

```powershell
corepack pnpm dlx prisma@6.5.0 generate --schema ./libraries/nestjs-libraries/src/database/prisma/schema.prisma
corepack pnpm --filter ./apps/frontend run build
$env:NODE_OPTIONS='--max-old-space-size=8192'; corepack pnpm --filter ./apps/backend run build
$env:NODE_OPTIONS='--max-old-space-size=8192'; corepack pnpm --filter ./apps/orchestrator run build
corepack pnpm --filter ./apps/extension run build
```

Résultat attendu :

- Prisma generate passe.
- Frontend build passe.
- Backend et orchestrator passent avec heap Node augmenté.
- Extension build génère `apps/extension/extension.zip`.

## 3. Lancement des services

1. Démarrer les services d'infrastructure si nécessaire :

```powershell
docker compose -f ./docker-compose.dev.yaml up -d
```

2. Démarrer le backend et le frontend :

```powershell
corepack pnpm run dev-backend
```

Si le workflow complet est requis :

```powershell
corepack pnpm run dev
```

## 4. Parcours smoke test

Vérifier ces écrans dans le navigateur :

1. Page d'authentification : le branding visible doit être `AcadéPost`.
2. Sidebar : absence de traces publiques de l'ancienne marque upstream.
3. Publications/Calendrier : les brouillons, publications planifiées et statuts doivent rester visibles sans écran de routage dédié.
4. Écrans onboarding : textes en français et branding AcadéPost.
5. Billing/FAQ : pas de CTA ou lien public vers l'ancienne marque upstream.
6. Public API/developer : wording AcadéPost ou `AcadePost` pour les slugs techniques.
7. Extension : `apps/extension/extension.zip` doit contenir `manifest.json`, `background.js`, `icon-32.png`, `icon-128.png`.

## 5. Script de démonstration

1. Présenter AcadéPost comme un MVP de publication sociale centré sur la préparation, la planification et la publication.
2. Montrer le flux utilisateur principal :
   - préparer le contenu dans l'éditeur ou le composer ;
   - choisir les destinations connectées ;
   - créer un brouillon, planifier ou publier maintenant ;
   - vérifier le statut et les erreurs dans AcadéPost.
3. Montrer que le produit conserve la structure robuste existante : frontend Next.js, backend NestJS, Prisma, PostgreSQL, Redis, Temporal.
4. Expliquer que le rebrand public est nettoyé, mais que les alias techniques internes restent stables pendant le MVP.
5. Finir sur le flux Telegram : bot de contrôle AcadéPost, sélection de destinations, modes `Brouillon` / `Publier maintenant` / `Programmer`, validations et reçus en français.

## 6. Modèle Telegram pour client

AcadéPost doit présenter deux usages Telegram distincts :

- Bot de publication Telegram : le client l'utilise comme destination de sortie pour publier vers un canal, groupe ou chat Telegram.
- Bot de contrôle AcadéPost : le client l'utilise comme mini-interface Telegram pour créer un contenu, choisir les destinations AcadéPost, choisir le mode et confirmer l'action.

Document de référence : `docs/product/telegram-bots-product-model.md`.

État actuel 2026-05-27 :

- Le bot de contrôle de démonstration est connecté au webhook public `https://post.fgln.pro/api/telegram-intake/webhook`.
- Le webhook Telegram est sain : pas d'erreur de livraison et aucun update en attente lors de la vérification.
- Les bindings utilisateur Telegram vers organisation AcadéPost existent en base pour la démonstration.
- Ce chemin reste configuré côté opérateur avec variables runtime et binding manuel. Ce n'est pas encore un onboarding autonome pour un client final.

Parcours cible vendable :

1. Le client crée un bot de contrôle dédié dans BotFather.
2. Il colle le token dans AcadéPost, dans une page de configuration dédiée.
3. AcadéPost valide le bot, stocke le secret chiffré, configure le webhook et affiche un lien de connexion.
4. L'utilisateur ouvre le bot via ce lien ; AcadéPost crée le binding automatiquement.
5. Le client connecte séparément ses destinations de publication, dont Telegram si nécessaire.

## 7. Risques connus

- L'environnement local observé utilise Node `v24.13.0`, alors que le projet cible Node 22.
- Les scripts backend/orchestrator peuvent nécessiter `NODE_OPTIONS=--max-old-space-size=8192`.
- Les décisions légales/licence restent une piste propriétaire séparée.
- FlutterFlow ou un outil no-code doit être considéré comme une couche cliente au-dessus des APIs, pas comme un import direct du monorepo.
- L'onboarding autonome du bot de contrôle AcadéPost n'est pas encore implémenté ; la configuration actuelle est suffisante pour démonstration contrôlée, pas pour un client B2C sans assistance.

## 8. Critère de réussite

La démo est prête si un utilisateur peut comprendre en moins de cinq minutes :

- ce qu'est AcadéPost ;
- comment préparer, planifier et publier un contenu ;
- quelles destinations connectées sont disponibles ;
- pourquoi l'architecture actuelle permet d'ajouter l'intake Telegram sans refactor profond.

## 9. Publication Docker

Terminologie :

- Une image Docker est l'artefact buildé et publié dans GHCR.
- Un conteneur est une instance lancée à partir de cette image.
- Pour une release normale, reconstruire l'image, la pousser dans GHCR, puis recréer les conteneurs serveur depuis cette image publiée.

Règles de release :

- Ne pas utiliser une image locale `acadepost:*local*` comme état final.
- Ne pas publier une version avec suffixe fonctionnel, hash ou libellé de test dans `NEXT_PUBLIC_VERSION`.
- Utiliser uniquement la version produit, actuellement `1.11.1`.
- Mettre `ACADEPOST_IMAGE` sur une image GHCR publiée avant de considérer le déploiement terminé.
- Vérifier après déploiement : `/api/monitor/ready`, health Docker, image réellement utilisée par `acadepost-backend`, `acadepost-frontend` et `acadepost-orchestrator`.

Preuve release 2026-05-27 :

- Image publiée : `ghcr.io/foogoolin/acadepost:1.11.1`.
- Digest GHCR index : `sha256:f94dd8aa5c2e4cf80c007171d64891878c128b4856129e6b1c09827f5a4492f5`.
- GitHub Actions `Build demo image` run `26517785041` : succès, avec smoke Compose et push GHCR.
- Serveur `post.fgln.pro` : `acadepost-backend`, `acadepost-frontend` et `acadepost-orchestrator` recréés depuis cette image GHCR, tous `healthy`.
