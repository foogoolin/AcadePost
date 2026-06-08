# Routage de contenu AcadéPost

Ce document remplace l'ancienne approche de routage visible dans l'interface.

AcadéPost ne doit pas exposer le routage de contenu comme un écran autonome pour les utilisateurs. Le routage doit rester derrière le flux de publication et d'intake : validations, avertissements, conséquences de destination et rendu spécifique aux plateformes.

## Direction actuelle

- Supprimer la surface UI autonome `/content-routing`.
- Garder AcadéPost comme source de vérité pour les brouillons, la planification, les publications immédiates, le rendu, les statuts et les erreurs.
- Utiliser l'intake Telegram comme surface de contrôle rapide : le contenu arrive via le bot, les destinations et modes sont stockés dans AcadéPost, puis les publications finales sont créées par AcadéPost.
- Afficher les résultats de routage uniquement lorsqu'ils affectent l'action utilisateur : publication Instagram bloquée sans média, avertissement de compatibilité média, identifiants manquants ou reçu de publication.

## Séparation des bots Telegram

AcadéPost distingue deux rôles Telegram :

- Le bot de publication Telegram est une destination de sortie. Il publie dans un canal, un groupe ou une conversation Telegram connectée par le client.
- Le bot de contrôle AcadéPost est une surface de contrôle. Il sert de mini-interface Telegram pour envoyer un contenu à AcadéPost, choisir les destinations, choisir le mode `Brouillon`, `Publier maintenant` ou `Programmer`, puis confirmer l'action.

Ces deux rôles ne doivent pas être mélangés. Un client peut avoir un bot de publication pour ses canaux Telegram et un bot de contrôle dédié à AcadéPost.

Le modèle complet est décrit dans `docs/product/telegram-bots-product-model.md`.

## Garde-fous d'implémentation

- Ne pas stocker les brouillons ou l'état de planification uniquement dans Telegram.
- Ne pas stocker les destinations sélectionnées dans les payloads de callback Telegram.
- Garder les payloads de callback courts et stocker l'état dans AcadéPost.
- Ne pas utiliser le bot de publication comme source de vérité pour contrôler AcadéPost.
- Ne pas considérer une configuration `.env` globale comme un onboarding client final.
- Conserver la logique backend/API de routage uniquement si elle sert la validation, la publication ou la planification.
