# Mémoire Codex du projet

Ce fichier garde les problèmes récurrents que les prochaines sessions Codex/BYAN doivent connaître avant de modifier le projet.

## Encodage UTF-8 et mojibake

Le projet utilise des textes visibles en français, donc les accents doivent rester en UTF-8. Une erreur déjà observée transforme les caractères UTF-8 en mojibake de type Windows code page, par exemple :

- `AcadГ©Post` au lieu de `AcadéPost`.
- `DГ©mo` au lieu de `Démo`.
- `Г‰diteur` au lieu de `Éditeur`.
- `BГЄta` au lieu de `Bêta`.
- `franГ§ais` au lieu de `français`.

Avant chaque commit qui touche les documents, traductions, labels UI ou prompts BYAN/Codex, lancer :

```bash
rg -n --glob '!docs/codex-project-memory.md' "AcadГ|AcadÃ|Г©|Г‰|ГÊ|ГЁ|Г§|Гґ|Г |ГЄ" AGENTS.md PROJECT_PLAN.md _byan-output docs README.md deploy apps libraries
```

Si des résultats apparaissent, corriger les chaînes visibles et relancer la recherche jusqu'à obtenir zéro résultat.

Corrections fréquentes :

- `AcadГ©Post` -> `AcadéPost`
- `Г©` -> `é`
- `Г‰` -> `É`
- `ГЁ` -> `è`
- `ГÊ` / `ГЄ` -> `ê`
- `Г§` -> `ç`
- `Гґ` -> `ô`
- `Г ` -> `à`

Les fichiers du projet doivent rester enregistrés en UTF-8. `.editorconfig` fixe `charset = utf-8` pour aider les éditeurs, mais la vérification `rg` reste obligatoire.
