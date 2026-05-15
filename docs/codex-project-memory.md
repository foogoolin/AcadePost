# Mémoire Codex du projet

Ce fichier garde les problèmes récurrents que les prochaines sessions Codex/BYAN doivent connaître avant de modifier le projet.

## Encodage UTF-8 et mojibake

Le projet utilise des textes visibles en français, donc les accents doivent rester en UTF-8. Une erreur déjà observée transforme les caractères UTF-8 en mojibake de type Windows code page, par exemple :

- `AcadéPost` ou `AcadéPost` au lieu de `AcadéPost`.
- `DГ©mo` ou `DÃ©mo` au lieu de `Démo`.
- `Г‰diteur` ou `Ã‰diteur` au lieu de `Éditeur`.
- `BГЄta` ou `BÃªta` au lieu de `Bêta`.
- `franГ§ais` ou `franÃ§ais` au lieu de `français`.

Avant chaque commit qui touche les documents, traductions, labels UI ou prompts BYAN/Codex, lancer :

```bash
rg -n --glob '!docs/codex-project-memory.md' "AcadГ|AcadÃ|Г©|Г‰|ГÊ|ГÈ|ГЁ|Г§|Гґ|Г |ГЄ|Ã©|Ã¨|Ã§|Ã´|Ãª|Ã‰" AGENTS.md PROJECT_PLAN.md _byan-output docs README.md deploy apps libraries
```

Si des résultats apparaissent, corriger les chaînes visibles et relancer la recherche jusqu'à obtenir zéro résultat.

Corrections fréquentes :

- `AcadéPost` / `AcadéPost` -> `AcadéPost`
- `Г©` / `Ã©` -> `é`
- `Г‰` / `Ã‰` -> `É`
- `ГЁ` / `Ã¨` -> `è`
- `ГÊ` / `ГЄ` / `Ãª` -> `ê`
- `Г§` / `Ã§` -> `ç`
- `Гґ` / `Ã´` -> `ô`
- `Г ` / `Ã ` -> `à`

Les fichiers du projet doivent rester enregistrés en UTF-8. `.editorconfig` fixe `charset = utf-8` pour aider les éditeurs, mais la vérification `rg` reste obligatoire.
