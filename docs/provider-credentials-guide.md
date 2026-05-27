# Provider Credentials Guide

This guide covers the AcadéPost project credential screen in `Paramètres > Identifiants`.

## Model

AcadéPost follows the same broad pattern as n8n credentials:

- A provider definition describes non-secret metadata: provider name, fields, labels, required flags and setup URLs.
- A saved credential instance stores the project-specific secret values.
- Secret values are encrypted at rest and returned to the UI only as masked metadata.
- The runtime resolves the active project credential first, then falls back to `.env` values for legacy/demo deployments.
- A credential can be tested before a channel is connected.
- When a provider has enabled saved credentials, the Add Channel flow asks which credential to use and passes that choice as `credentialId` for the temporary connect state.
- The provider list shows platform icons from the local `public/icons/platforms` asset set.

n8n's official reference describes credentials as typed definitions that control the credentials modal, define auth fields, encrypt saved values and can include a test request: <https://docs.n8n.io/integrations/creating-nodes/build/reference/credentials-files/>.

AcadéPost is not a full n8n clone. It does not expose node-level credential injection, display options, or workflow node selectors. The scope is social provider credentials for the AcadéPost publishing runtime.

## Required Server Setup

Set a stable encryption key before saving secrets:

```bash
openssl rand -hex 32
```

Add the generated value to the server `.env`:

```env
ACADEPOST_CREDENTIALS_ENCRYPTION_KEY=<64-hex-character-value>
```

The value must be either 64 hexadecimal characters or a base64 string that decodes to exactly 32 bytes. Placeholder values such as `change-me`, `change-this`, `CHANGE_ME...`, empty values and arbitrary passphrases intentionally keep credential saving disabled.

For the demo Docker stack, this value belongs in `.env.demo` or `.env.demo.shared-infra`. Do not bake it into a Docker image.

Set the public version shown in the lower-left UI:

```env
NEXT_PUBLIC_VERSION=v1.1.7
```

After changing the key, recreate the app containers:

```bash
bash deploy/demo/update.sh \
  --env .env.demo.shared-infra \
  --compose docker-compose.demo.shared-infra.yaml \
  --no-deps
```

## Exemple Telegram

Ce flux configure un bot de publication Telegram. Il ne configure pas le bot de contrôle AcadéPost décrit dans `docs/telegram-bots-product-model.md`.

1. Créer un bot Telegram dans BotFather.
2. Copier le token du bot.
3. Ouvrir `Paramètres > Identifiants`.
4. Chercher `Telegram`.
5. Enregistrer `Bot Token` et, si besoin, `Bot Name`.
6. Cliquer sur `Tester la connexion`.
7. Ajouter le bot au groupe ou canal Telegram cible.
8. Connecter Telegram depuis le flux d'intégration AcadéPost.
9. Si plusieurs identifiants Telegram actifs existent, choisir l'instance d'identifiant dans le sélecteur `Add Channel` avant l'ouverture de l'URL de connexion.

Le test Telegram appelle le runtime provider et valide le token via Telegram Bot API. Un test réussi signifie que le token est valide. Il ne prouve pas que le bot a été ajouté au groupe ou canal final, ni qu'il dispose des permissions nécessaires pour publier.

## Credential Selection During Connect

The Add Channel flow keeps n8n-like explicit credential selection without changing the public OAuth callback contract:

- the frontend loads saved project credentials from `/provider-credentials`;
- if the selected provider has enabled credentials, a modal asks which saved credential to use;
- the connect URL includes `credentialId=<uuid>` on `/integrations/social/{provider}`;
- the backend validates that the credential belongs to the current organization and matches the provider lookup set;
- the validated credential id is stored in Redis as `credential:{state}` and reused by the callback;
- if no credential is selected, the runtime keeps the legacy fallback order: active project credential, then `.env`.

## Edge Cases

- If `ACADEPOST_CREDENTIALS_ENCRYPTION_KEY` is missing or malformed, the UI disables saving and shows a warning.
- If a password field is left empty while editing an existing credential, the previous encrypted value is preserved.
- If multiple enabled credentials exist for the same provider, the Add Channel selector controls the credential used for that new connection.
- If the selected `credentialId` belongs to another organization or to an incompatible provider, the backend rejects the connect request.
- OAuth providers still require the callback URL shown in the setup panel to be registered in the external developer app.
- `.env` fallback remains for demo/legacy operation, but new customer demos should use project credentials where supported.
- Do not claim a provider is production-ready until the real developer app, callback URL, credential test, connect flow, publish or schedule test and platform approval/status have all been verified.
