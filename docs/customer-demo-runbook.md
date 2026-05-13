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
2. Sidebar : absence de traces publiques Postiz/Gitroom.
3. `/content-routing` : les trois familles de routage doivent être visibles.
4. Écrans onboarding : textes en français et branding AcadéPost.
5. Billing/FAQ : pas de CTA ou lien public vers Postiz.
6. Public API/developer : wording AcadéPost ou `AcadePost` pour les slugs techniques.
7. Extension : `apps/extension/extension.zip` doit contenir `manifest.json`, `background.js`, `icon-32.png`, `icon-128.png`.

## 5. Script de démonstration

1. Présenter AcadéPost comme un MVP de publication sociale orienté routage de contenu.
2. Montrer la logique de routage :
   - vidéo vers YouTube, TikTok, Instagram Reels ;
   - texte court vers Threads et X ;
   - carrousel vers Meta et Pinterest.
3. Montrer que le produit conserve la structure robuste existante : frontend Next.js, backend NestJS, Prisma, PostgreSQL, Redis, Temporal.
4. Expliquer que le rebrand public est nettoyé, mais que les alias techniques internes restent stables pendant le MVP.
5. Finir sur le prochain incrément : connecter en priorité une première API sociale réelle et améliorer l'UX du routage.

## 6. Risques connus

- L'environnement local observé utilise Node `v24.13.0`, alors que le projet cible Node 22.
- Les scripts backend/orchestrator peuvent nécessiter `NODE_OPTIONS=--max-old-space-size=8192`.
- Les décisions légales/licence restent une piste propriétaire séparée.
- FlutterFlow ou un outil no-code doit être considéré comme une couche cliente au-dessus des APIs, pas comme un import direct du monorepo.

## 7. Critère de réussite

La démo est prête si un utilisateur peut comprendre en moins de cinq minutes :

- ce qu'est AcadéPost ;
- comment le routage de contenu fonctionne ;
- quelles plateformes sont ciblées ;
- pourquoi l'architecture actuelle permet d'aller vers une démo client sans refactor profond.
