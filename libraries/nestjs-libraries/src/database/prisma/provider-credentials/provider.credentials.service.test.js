const fs = require('node:fs');
const path = require('node:path');

describe('provider credential service', () => {
  const source = fs.readFileSync(
    path.join(__dirname, 'provider.credentials.service.ts'),
    'utf8'
  );

  it('uses a provider-specific connection test for Telegram credentials', () => {
    expect(source).toContain(
      "import { TelegramProvider } from '@gitroom/nestjs-libraries/integrations/social/telegram.provider';"
    );
    expect(source).toContain("case 'telegram':");
    expect(source).toContain('getBotConfiguration(');
  });
});
