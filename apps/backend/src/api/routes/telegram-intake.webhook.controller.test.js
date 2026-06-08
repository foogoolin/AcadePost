const fs = require('node:fs');
const path = require('node:path');

describe('telegram intake webhook controller', () => {
  const source = fs.readFileSync(
    path.join(__dirname, 'telegram-intake.webhook.controller.ts'),
    'utf8'
  );
  const apiModule = fs.readFileSync(
    path.join(__dirname, '..', 'api.module.ts'),
    'utf8'
  );

  it('uses the Telegram webhook secret header instead of user auth middleware', () => {
    expect(source).toContain("x-telegram-bot-api-secret-token");
    expect(source).toContain('verifyWebhookSecret(secretToken)');
  });

  it('keeps webhook public while authenticated bindings stay in authenticated controllers', () => {
    expect(apiModule).toContain('TelegramIntakeWebhookController');
    expect(apiModule).toContain('TelegramIntakeController');
    expect(apiModule.indexOf('ProviderCredentialsController')).toBeLessThan(
      apiModule.indexOf('TelegramIntakeController')
    );
  });
});
