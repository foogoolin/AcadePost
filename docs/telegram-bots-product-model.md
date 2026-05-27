# Modèle produit des bots Telegram AcadéPost

Date : 2026-05-27

AcadéPost est construit comme un produit vendable à des clients finaux. Les parcours Telegram doivent donc être pensés comme des parcours client reproductibles, pas comme une configuration opérateur réservée au serveur de démonstration.

## Deux rôles séparés

### Bot de publication Telegram

Le bot de publication est une destination de sortie. Il sert à publier des posts AcadéPost vers un canal, groupe ou chat Telegram choisi par le client.

Responsabilités :

- publier le contenu final vers Telegram ;
- appartenir au client ou à son organisation ;
- être configuré comme identifiant de provider Telegram dans AcadéPost ;
- respecter les permissions du canal ou groupe cible.

Ce bot ne doit pas piloter AcadéPost.

### Bot de contrôle AcadéPost

Le bot de contrôle est une mini-interface Telegram pour AcadéPost. Il permet à un utilisateur d'envoyer un contenu dans Telegram, puis de choisir les destinations AcadéPost, le mode et la confirmation.

Responsabilités :

- recevoir texte, légende et médias depuis Telegram ;
- créer une session d'intake dans AcadéPost ;
- afficher les boutons de destinations et de mode ;
- créer un brouillon, publier maintenant ou programmer depuis AcadéPost ;
- renvoyer des reçus et erreurs en français.

Ce bot ne doit pas être confondu avec une destination de publication Telegram.

## État actuel vérifié

Le 2026-05-27, le serveur de démonstration utilise un bot de contrôle global :

- feature flag : `TELEGRAM_INTAKE_ENABLED=true` ;
- webhook : `https://post.fgln.pro/api/telegram-intake/webhook` ;
- updates autorisés : `message` et `callback_query` ;
- état Telegram vérifié : bot joignable, webhook configuré, aucun update en attente, aucune erreur de livraison ;
- base de données : bindings Telegram actifs et sessions d'intake créées pour la démonstration.

Ce chemin prouve le fonctionnement serveur, mais il reste un chemin opérateur. Le token du bot de contrôle et le secret de webhook sont configurés en runtime, et le binding utilisateur/chat est encore créé par API ou script administrateur.

## Fonctionnement actuel dans le code

1. Telegram envoie les updates au endpoint `POST /api/telegram-intake/webhook`.
2. AcadéPost vérifie `x-telegram-bot-api-secret-token` avec `TELEGRAM_INTAKE_WEBHOOK_SECRET`.
3. Le service cherche un `TelegramIntakeBinding` actif à partir du `telegramUserId` et du `telegramChatId`.
4. Si le binding existe, AcadéPost crée ou retrouve une `TelegramIntakeSession`.
5. Le bot de contrôle renvoie un clavier inline avec les destinations, le mode et les boutons de confirmation.
6. Les callbacks mettent à jour l'état stocké dans AcadéPost, pas dans le payload Telegram.
7. À la confirmation, AcadéPost crée les posts dans son moteur de publication.

## Parcours client cible

Le parcours vendable doit être self-service :

1. Le client ouvre une page `Assistant Telegram` dans AcadéPost.
2. Le client crée un bot dédié dans BotFather.
3. Le client colle le token du bot de contrôle dans AcadéPost.
4. AcadéPost valide le bot via Telegram Bot API, chiffre le token et configure le webhook.
5. AcadéPost affiche un lien de connexion Telegram contenant un code signé.
6. L'utilisateur ouvre ce lien et envoie `/start`.
7. AcadéPost crée automatiquement le binding utilisateur/chat vers l'organisation.
8. L'utilisateur peut piloter ses posts depuis Telegram.

Le client configure séparément ses destinations de publication, y compris Telegram, dans les identifiants et intégrations de publication.

## Prochain chantier nécessaire

Pour passer du mode démonstration au mode B2C :

- remplacer le token global `TELEGRAM_INTAKE_BOT_TOKEN` par une configuration chiffrée par organisation ;
- ajouter une page de configuration du bot de contrôle ;
- ajouter validation, rotation, désactivation et statut du webhook ;
- ajouter un endpoint webhook multi-tenant, par exemple avec un identifiant public de bot de contrôle dans l'URL ;
- ajouter le flow `/start <code signé>` pour créer le binding sans demander d'ID Telegram au client ;
- documenter le rollback et la rotation de token sans exposer le secret.
