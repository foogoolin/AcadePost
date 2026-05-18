const fs = require('node:fs');
const path = require('node:path');

describe('provider credential registry', () => {
  const source = fs.readFileSync(
    path.join(__dirname, 'provider.credentials.registry.ts'),
    'utf8'
  );

  const identifiers = Array.from(
    source.matchAll(/identifier: '([^']+)'/g),
    (match) => match[1]
  );

  it('keeps Telegram visible with the first credential providers', () => {
    const telegramIndex = identifiers.indexOf('telegram');

    expect(telegramIndex).toBeGreaterThanOrEqual(0);
    expect(telegramIndex).toBeLessThan(7);
  });

  it('groups Telegram with the core social credential providers', () => {
    const telegramDefinition = source.match(
      /\{\s*identifier: 'telegram'[\s\S]*?\n  \}/
    )?.[0];

    expect(telegramDefinition).toContain("group: 'Core social'");
  });
});
