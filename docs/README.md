# Documentation AcadéPost

Cette page est le point d'entree de la documentation du depot. Elle separe les guides utiles aux utilisateurs externes des notes internes de travail.

## Commencer

- Installer AcadéPost sur un serveur simple: [installation/demo-server-deploy.md](installation/demo-server-deploy.md)
- Installer AcadéPost sur une infra partagee: [installation/demo-shared-infra-deploy.md](installation/demo-shared-infra-deploy.md)
- Mettre a jour ou rollback l'image Docker: [operations/docker-update.md](operations/docker-update.md)
- Configurer les identifiants de providers: [product/provider-credentials-guide.md](product/provider-credentials-guide.md)
- Lire l'audit de readiness open source: [internal/audits/open-source-install-readiness-audit.md](internal/audits/open-source-install-readiness-audit.md)

## Structure

| Dossier | Public cible | Contenu |
|---|---|---|
| [installation/](installation/README.md) | Admin self-host | Installation Docker, clean VPS, shared infra. |
| [operations/](operations/README.md) | Admin self-host | Update, rollback, checks runtime. |
| [product/](product/README.md) | Utilisateur/admin produit | Credentials, routage, Telegram, comparaison produit. |
| [integrations/](integrations/README.md) | Admin produit / dev | Readiness providers et integrations externes. |
| [development/](development/README.md) | Developpeur | API, readiness technique, chemins de validation. |
| [design/](design/README.md) | Developpeur UI | Direction visuelle et sources design. |
| [security/](security/README.md) | Admin / mainteneur | Reviews securite et risques restants. |
| [legal/](legal/README.md) | Owner / mainteneur | Notes legales et ownership. |
| [internal/](internal/README.md) | Ilya / BYAN / Codex | Audits, plans, migration, serveur, historique. |

## Regle de classement

- Documentation publique: tout ce qu'un utilisateur GitHub peut suivre pour installer, configurer, administrer ou comprendre AcadéPost.
- Documentation interne: notes de session, audits serveur, plans BYAN/Codex, migration depuis anciens dossiers, historique Contabo, rapports de travail.
- Les informations serveur personnelles et les secrets ne doivent pas etre copies dans les guides publics.

## Etat actuel

Le depot a une base Docker installable, mais l'audit open source marque encore le statut `PARTIALLY_READY`. Les priorites restantes sont la strategie de migrations de base de donnees, backup/restore, coherence de version, et preuve d'installation vierge.
