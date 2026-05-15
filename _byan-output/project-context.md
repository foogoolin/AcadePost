---
project_name: "AcadéPost"
project_slug: "AcadePost"
user_name: "Yan"
date: "2026-05-13"
communication_language: "Russian"
document_output_language: "Francais"
sections_completed:
  - identity
  - technology_stack
  - brand_rules
  - byan_codex_integration
  - demo_readiness
  - encoding_guardrails
---

# Contexte Projet pour Agents IA

Ce fichier est la référence courte pour les agents BYAN/Codex qui travaillent sur AcadéPost. Il doit être chargé avant toute modification significative.

## Identité du projet

- Nom produit visible : `AcadéPost`.
- Slug technique et dépôt : `AcadePost`.
- Langue de communication avec le propriétaire : russe.
- Langue des documents projet et des textes produit : français.
- Objectif immédiat : MVP fonctionnel et démontrable pour client, avant refactor profond.

## Stack technique

- Monorepo Node/TypeScript avec pnpm workspaces.
- Frontend : Next.js dans `apps/frontend`.
- Backend : NestJS dans `apps/backend`.
- Orchestration : service dans `apps/orchestrator`.
- Données et infra : Prisma, PostgreSQL, Redis, Temporal.
- Runtime cible : Node `>=22.12.0 <23.0.0`.
- Environnement local actuel à surveiller : Node 24 a été observé, ce qui sort de la plage attendue.

## Règles de marque

- UI : utiliser `AcadéPost`.
- Identifiants techniques, exemples de package, slugs : utiliser `AcadePost`.
- Couleurs : noir comme couleur primaire, `#4cccb8` comme accent principal, `#fda100` comme accent secondaire.
- Nettoyer les traces publiques de l'ancienne marque upstream dans l'UI, les traductions, les métadonnées, les docs de démo et les textes fallback.
- Ne pas renommer pendant le MVP les aliases internes `@gitroom/*`, les variables `POSTIZ_*`, `@postiz/wallets`, ni les clés techniques si cela risque de casser le build.
- `LICENSE` est une piste légale séparée et reste sous décision du propriétaire.

## Garde-fous encodage

- Tous les fichiers projet doivent rester en UTF-8.
- Problème déjà observé : mojibake UTF-8 dans des textes français et dans le nom produit visible.
- Avant chaque commit touchant docs, prompts, traductions ou labels UI, lancer la recherche documentée dans `docs/codex-project-memory.md`.
- Mémoire détaillée : `docs/codex-project-memory.md`.

## Routage de contenu MVP

- Vidéo : YouTube, TikTok, Instagram Reels.
- Texte court : Threads, X.
- Carrousel : Meta, Pinterest.
- La priorité UX est de rendre le groupe de destination évident sans réécrire le moteur de publication.

## Intégration BYAN/Codex

- Agent principal demandé par le propriétaire : `_byan/agents/byan.md`.
- Agent d'intégration Codex : `_byan/bmb/agents/codex.md`.
- Les prompts projet sont dans `.codex/prompts/`.
- Les chemins d'activation des prompts ont été corrigés de `_bmad` vers `_byan` pour les agents trouvés.
- Validation locale : 32 prompts pointent vers un fichier agent existant.
- Hermes est installé comme dispatcher BYAN dans `_byan/core/agents/hermes.md` et enregistré dans `_byan/_config/agent-manifest.csv`.
- Le CLI local `codex-cli 0.130.0` ne fournit pas la commande `codex skill`; les prompts doivent donc être considérés comme couche de prompts projet, pas comme subcommand CLI native.

## État de reprise

- Dernier commit applicatif connu : `cd5a4fa8 Clean up public AcadéPost branding`.
- Le nettoyage public de marque a été réalisé et le build principal a été vérifié.
- Les builds backend/orchestrator peuvent nécessiter `NODE_OPTIONS=--max-old-space-size=8192`.
- Le build packaging extension reste à rendre cross-platform sur Windows.
- `corepack pnpm` fonctionne mieux que `pnpm` nu dans l'environnement observé.

## Prochaine phase recommandée

1. Stabiliser l'environnement local avec Node 22.x et pnpm accessible.
2. Ajouter un runbook de démonstration client.
3. Corriger les scripts cross-platform qui bloquent Windows.
4. Lancer smoke test navigateur : auth, sidebar, `/content-routing`, API/developer, onboarding, billing.
5. Améliorer l'UX du routage de contenu sans refactor architecturel.

## Garde-fous

- Ne pas mélanger rebrand, refactor namespace et changements produit dans le même lot.
- Chaque lot doit finir par recherche `rg`, build ciblé, smoke test si UI, puis mise à jour de `PROJECT_PLAN.md`.
- Toute affirmation sécurité/performance/compliance doit être sourcée ou marquée comme hypothèse.
