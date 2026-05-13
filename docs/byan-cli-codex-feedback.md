# BYAN CLI : retours Codex pour un fonctionnement correct des le premier lancement

Date : 2026-05-13
Contexte : installation de BYAN dans le projet `AcadePost` et adaptation pour Codex Desktop/CLI.

## Probleme principal

BYAN CLI installe beaucoup de fichiers utiles, mais apres installation le systeme n'est pas dans un etat coherent. Codex ne peut pas simplement lire un seul entrypoint et commencer a travailler sans reglages manuels : une partie des chemins est obsolete, les configs entrent en conflit, Hermes est declare comme installe mais absent de `_byan`, et l'integration Codex documente une commande qui n'existe pas dans le CLI actuel.

Le point le plus critique : meme quand on selectionne explicitement une langue de communication et une langue de documents au moment du `npx create-byan-agent`, le CLI ne propage pas ce choix de maniere coherente. Le changement de langue reste casse, peu importe la combinaison choisie.

## Ce qui ne va pas

### 1. Pas de source unique de verite pour les langues

Apres installation, les langues etaient eparpillees sur plusieurs fichiers de config :

- `_byan/config.yaml` etait en `Francais` ;
- `_byan/bmb/config.yaml` etait en `English` ;
- les configs modulaires `_byan/bmm`, `_byan/cis`, `_byan/core`, `_byan/tea`, `_byan/_memory` restaient en `Francais`.

Quel que soit le couple de langues choisi pendant l'installation (`communication_language` / `document_output_language`), le CLI ne synchronise pas ce choix dans tous les modules. Resultat : il faut reparer a la main module par module apres chaque `npx create-byan-agent`.

Comportement attendu :

- une seule config racine definit `communication_language` et `document_output_language` ;
- toutes les configs modulaires heritent de ces valeurs ;
- le CLI affiche un tableau recapitulatif des langues a la fin de l'installation ;
- aucun module ne conserve une langue differente de celle choisie pendant l'installation, sauf override explicite documente.

### 2. Conflit de nom utilisateur

Dans la config racine on avait `user_name: Yan`, et dans `_byan/bmb/config.yaml` on avait `user_name: Ilya`.

Cela casse l'impression d'un agent unifie : differents agents BYAN peuvent saluer differentes personnes. Le CLI doit soit faire heriter le nom depuis la config racine, soit expliquer explicitement pourquoi un module utilise un nom different.

### 3. L'integration Codex documente une commande obsolete

`_byan/bmb/agents/codex.md` decrit un workflow via `codex skill`, mais le `codex-cli 0.130.0` installe localement n'expose pas cette commande.

Verification reelle :

```text
codex-cli 0.130.0
Commands: exec, review, login, logout, mcp, plugin, ...
```

Comportement attendu :

- BYAN CLI doit detecter la version de Codex CLI ;
- si `codex skill` n'est pas disponible, la documentation et les prompts doivent parler de `.codex/prompts` comme d'un project prompt layer, pas comme d'un subcommand verifie ;
- l'installation doit inclure une vraie etape `validate-codex` qui interroge le CLI courant, et pas seulement creer des fichiers.

### 4. `.codex/prompts` generes avec un chemin `_bmad` incorrect

Tous les prompts Codex pointaient vers :

```text
{project-root}/_bmad/*/agents/{agent}.md
```

Mais le projet est installe dans :

```text
{project-root}/_byan/**/agents/{agent}.md
```

C'est critique : le prompt existe, mais a l'activation il pointe vers un repertoire inexistant.

Comportement attendu :

- le generateur doit utiliser le vrai install root (`_byan`, pas `_bmad`) ;
- apres generation, une validation doit verifier que chaque prompt pointe vers un fichier d'agent existant ;
- le wildcard `*` devrait etre remplace par un chemin exact, par exemple `_byan/bmm/agents/dev.md`.

### 5. Hermes declare installe mais absent en tant qu'agent BYAN

Dans `_byan/bmb/config.yaml`, Hermes figurait dans `installed_agents`, et `.codex/prompts/hermes.md` etait cree. Mais le fichier `_byan/**/agents/hermes.md` n'existait pas.

Hermes n'etait present que dans la couche Claude :

- `.claude/agents/bmad-hermes.md` ;
- `.claude/skills/byan-hermes-dispatch/SKILL.md` ;
- template npm global `create-byan-agent/install/templates/.github/agents/hermes.md`.

Pour un dispatcher obligatoire, c'est une mauvaise experience first-run : le routeur principal de l'ecosysteme devrait etre installe dans `_byan` par defaut.

Comportement attendu :

- si `installed_agents` contient `hermes`, le fichier `_byan/core/agents/hermes.md` doit exister ;
- le manifest doit contenir Hermes ;
- `.codex/prompts/hermes.md` doit pointer vers un vrai agent Hermes ;
- l'installer doit echouer avec un message clair si Hermes n'est pas installe.

### 6. Le template Hermes etait cable sur `.github/copilot`, pas sur `_byan`

Le template Hermes global pointait vers :

```text
.github/copilot/config.yaml
.github/copilot/_config/agent-manifest.csv
.github/copilot/_config/workflow-manifest.csv
```

Dans l'installation actuelle, les vrais fichiers sont :

```text
_byan/core/config.yaml
_byan/_config/agent-manifest.csv
_byan/_config/workflow-manifest.csv
```

Comportement attendu :

- les templates doivent etre parametres par plateforme et par install path ;
- le meme Hermes ne doit pas exiger un remplacement manuel de `.github/copilot` par `_byan` ;
- le CLI doit generer un Hermes platform-specific pour Claude, Codex et Copilot.

### 7. Les secrets sont crees a cote du projet sans `.gitignore` garanti

BYAN CLI a cree des tokens locaux dans :

- `.mcp.json` ;
- `.claude/settings.local.json`.

Ce sont des fichiers locaux de travail, mais ils ne doivent pas etre commitees par accident. Dans le projet, il a fallu les ajouter a la main dans `.gitignore`.

Comportement attendu :

- l'installer ajoute lui-meme `.mcp.json` et `.claude/settings.local.json` dans `.gitignore` ;
- il cree un `.mcp.example.json` sans token ;
- il evite d'ecrire des secrets dans des fichiers destines a etre commitees ;
- il lance un secret-scan sur staged/working tree apres installation.

### 8. `package.json` recoit un script inutilisable pour Codex

Le CLI a ajoute :

```json
"byan": "echo \"BYAN agent installed. Use: copilot and type /agent\""
```

Pour Codex c'est inutile et meme trompeur : on suggere a l'utilisateur une commande Copilot au lieu d'un workflow Codex.

Comportement attendu :

- le script doit etre platform-aware ;
- pour Codex, des scripts utiles seraient `byan:validate`, `byan:doctor`, `byan:list`, `byan:hermes` ;
- au minimum, `pnpm byan` doit lancer un diagnostic d'installation, pas un simple echo.

### 9. Pas de doctor post-install

Apres l'installation, il a fallu verifier a la main :

- si les fichiers prompt existent ;
- s'ils pointent vers de vrais agents ;
- si Hermes est present ;
- si les langues correspondent ;
- si les tokens ne sont pas trackes par Git ;
- si le Codex CLI courant supporte les commandes documentees.

Comportement attendu :

```text
byan doctor
```

doit verifier :

- config consistency ;
- language consistency ;
- user_name consistency ;
- agent manifest paths ;
- prompt activation paths ;
- platform CLI compatibility ;
- secret hygiene ;
- agents obligatoires manquants ;
- entrees dupliquees dans le manifest.

### 10. Le manifest contient des doublons

Dans `_byan/_config/agent-manifest.csv`, un doublon `drawio` a ete detecte.

Cela n'a pas casse l'execution courante, mais pour un dispatcher c'est un risque : le fuzzy routing peut recevoir plusieurs candidats identiques.

Comportement attendu :

- le manifest doit passer une validation d'unicite par `name` ;
- les doublons doivent etre soit interdits, soit explicitement namespaces.

### 11. L'installation est "tout-en-un" sans carte recapitulative

BYAN ajoute des centaines de fichiers d'un coup : `.claude`, `.codex`, `_byan`, serveur MCP, hooks, workflows, skills. C'est normal pour une full install, mais le CLI devrait produire a la fin une carte compacte :

- ce qui est installe ;
- quelles plateformes sont actives ;
- ou se trouve l'entrypoint Codex ;
- ou se trouve l'entrypoint Claude ;
- quels fichiers sont locaux et ne doivent pas etre commitees ;
- quelles verifications ont reussi ;
- quelles verifications ont echoue.

Pour l'instant, cette carte se reconstruit a la main.

## Ce qu'il faut ajouter a BYAN CLI

Minimum pour que BYAN fonctionne correctement du premier coup :

1. `byan doctor` pour une verification complete de l'installation.
2. `byan repair codex` pour corriger `.codex/prompts` selon la structure reelle.
3. `byan repair languages --communication <lang> --documents <lang>` qui propage le choix dans tous les modules.
4. Ajout automatique des fichiers de secrets locaux dans `.gitignore`.
5. Installation obligatoire de Hermes dans `_byan/core/agents/hermes.md`.
6. Verification de `installed_agents` contre les fichiers reels.
7. Verification des capacites du Codex CLI au lieu de supposer `codex skill`.
8. Generation d'un `.mcp.example.json` sans token.
9. Rapport `BYAN_INSTALL_REPORT.md` apres installation.
10. Modes d'installation separes : `minimal`, `codex-only`, `claude-only`, `full`.

## Scenario first-run ideal

Resultat ideal apres `npx create-byan-agent` :

```text
BYAN install complete.

Project: AcadePost
Communication language: <choisi>
Document language: <choisi>
Platforms: Codex, Claude

Mandatory agents:
- Hermes: OK
- BYAN: OK
- Codex integration: OK

Codex prompts:
- 32 prompts generated
- 32 activation paths valid
- codex-cli 0.130.0 detected
- codex skill command unavailable, using .codex/prompts mode

Languages:
- communication propagated to 6/6 module configs
- documents propagated to 6/6 module configs

Secrets:
- .mcp.json created and ignored
- .claude/settings.local.json created and ignored
- .mcp.example.json created

Run next:
- Open Hermes prompt
- Or run byan doctor
```

## Conclusion

BYAN comme idee est solide : Hermes, agent manifest, project context et la couche workflow sont vraiment utiles. Mais le CLI doit etre plus strict : moins d'hypotheses, plus de validation post-install, une seule source de verite pour les configs, et une verification obligatoire de la plateforme. Le bug le plus visible reste la propagation de la langue : tant que `npx create-byan-agent` ne synchronise pas `communication_language` et `document_output_language` dans toutes les configs modulaires, l'installation est cassee quelle que soit la combinaison de langues choisie. Une fois ces points regles, Codex pourra demarrer immediatement, sans reconstruction manuelle de l'installation.
