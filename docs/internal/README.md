# Documentation interne

Ce dossier contient les documents utiles a Ilya, BYAN et Codex, mais qui ne doivent pas etre le premier chemin d'un utilisateur GitHub externe.

## Sections

- [audits/](audits/README.md): audits de readiness, open source, architecture.
- [validation/](validation/README.md): matrices, inventaires API, plans de validation.
- [codex-byan/](codex-byan/README.md): memoire Codex/BYAN, handoff terminal, feedback outils.
- [server/](server/README.md): notes Contabo, prompts serveur, infra personnelle.
- [runbooks/](runbooks/README.md): runbooks demo internes.
- [workflow/](workflow/README.md): guardrails de travail avec LLM.
- [design/](design/README.md): plans internes de review UI.
- [plans/](plans/README.md): plans de feature et artefacts Superpowers/BYAN.
- [references/](references/README.md): emplacement local pour prompts et documents de reference importes.
- [reports/](reports/README.md): emplacement local pour assets de rapports et captures conservees.
- [daily-reports/](daily-reports/README.md): rapports journaliers.
- [migration/](migration/README.md): traces de migration depuis les anciens dossiers.

## Regle

Un document doit rester ici s'il depend du serveur actuel, d'une session BYAN/Codex, d'un historique de migration, ou d'une preuve non encore transformee en guide utilisateur.

Les archives serveur personnelles, references importees et captures de rapport peuvent exister localement dans ce dossier sur le serveur. Elles sont ignorees par Git sauf les fichiers `README.md`, afin de ne pas publier accidentellement des details d'infrastructure personnelle dans le depot open source.
