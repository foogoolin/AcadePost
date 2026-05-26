const fs = require('node:fs');
const path = require('node:path');

describe('telegram provider credential configuration', () => {
  const source = fs.readFileSync(
    path.join(__dirname, 'telegram.provider.ts'),
    'utf8'
  );

  it('trims the configured token before creating the Telegram client', () => {
    expect(source).toMatch(
      /clientInformation\?\.botToken[\s\S]*process\.env\.TELEGRAM_TOKEN[\s\S]*\.trim\(\)/
    );
  });

  it('uses the username returned by Telegram getMe before the manually configured bot name', () => {
    expect(source).toContain(
      'me.username ||\n        clientInformation?.botName ||'
    );
  });
});
