# Routage de contenu AcadéPost

Ce document remplace l'ancienne approche de routage visible dans l'interface.

AcadéPost ne doit pas exposer le routage de contenu comme un écran autonome pour les utilisateurs. Le routage doit rester derrière le flux de publication et d'intake : validations, avertissements, conséquences de destination et rendu spécifique aux plateformes.

## Direction actuelle

- Supprimer la surface UI autonome `/content-routing`.
- Garder AcadéPost comme source de vérité pour les brouillons, la planification, les publications immédiates, le rendu, les statuts et les erreurs.
- Utiliser l'intake Telegram comme surface de contrôle rapide : le contenu arrive via le bot, les destinations et modes sont stockés dans AcadéPost, puis les publications finales sont créées par AcadéPost.
- Afficher les résultats de routage uniquement lorsqu'ils affectent l'action utilisateur : publication Instagram bloquée sans média, avertissement de compatibilité média, identifiants manquants ou reçu de publication.

## Garde-fous d'implémentation

- Ne pas stocker les brouillons ou l'état de planification uniquement dans Telegram.
- Ne pas stocker les destinations sélectionnées dans les payloads de callback Telegram.
- Garder les payloads de callback courts et stocker l'état dans AcadéPost.
- Conserver la logique backend/API de routage uniquement si elle sert la validation, la publication ou la planification.
