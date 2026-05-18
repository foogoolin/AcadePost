# Provider Credentials Guide

This guide covers the AcadéPost project credential screen in `Paramètres > Identifiants`.

## Model

AcadéPost follows the same broad pattern as n8n credentials:

- A provider definition describes non-secret metadata: provider name, fields, labels, required flags and setup URLs.
- A saved credential instance stores the project-specific secret values.
- Secret values are encrypted at rest and returned to the UI only as masked metadata.
- The runtime resolves the active project credential first, then falls back to `.env` values for legacy/demo deployments.
- A credential can be tested before a channel is connected.

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

For the demo Docker stack, this value belongs in `.env.demo` or `.env.demo.shared-infra`. Do not bake it into a Docker image.

After changing the key, recreate the app containers:

```bash
docker compose --env-file .env.demo.shared-infra \
  -f docker-compose.demo.shared-infra.yaml \
  up -d --no-build --force-recreate --no-deps \
  acadepost-migrate acadepost-backend acadepost-frontend acadepost-orchestrator acadepost
```

## Telegram Example

1. Create a Telegram bot in BotFather.
2. Copy the bot token.
3. Open `Paramètres > Identifiants`.
4. Search for `Telegram`.
5. Save `Bot Token` and optional `Bot Name`.
6. Click `Tester la connexion`.
7. Add the bot to the Telegram group or channel.
8. Connect Telegram from the AcadéPost integration flow.

The Telegram test calls the provider runtime and validates the bot token with Telegram Bot API configuration lookup. A successful test means the token is valid. It does not prove the bot has been added to the final group/channel or has the channel permissions needed for publishing.

## Edge Cases

- If `ACADEPOST_CREDENTIALS_ENCRYPTION_KEY` is missing, the UI disables saving and shows a warning.
- If a password field is left empty while editing an existing credential, the previous encrypted value is preserved.
- If multiple credentials exist for the same provider, the current MVP uses the active project credential unless a connected channel already has a credential binding.
- OAuth providers still require the callback URL shown in the setup panel to be registered in the external developer app.
- `.env` fallback remains for demo/legacy operation, but new customer demos should use project credentials where supported.
- Do not claim a provider is production-ready until the real developer app, callback URL, credential test, connect flow, publish or schedule test and platform approval/status have all been verified.
