const fs = require('node:fs');
const path = require('node:path');

describe('provider credential service', () => {
  const source = fs.readFileSync(
    path.join(__dirname, 'provider.credentials.service.ts'),
    'utf8'
  );

  it('uses a provider-specific connection test for Telegram credentials', () => {
    expect(source).toContain(
      "await import(\n            '@gitroom/nestjs-libraries/integrations/social/telegram.provider'"
    );
    expect(source).toContain("case 'telegram':");
    expect(source).toContain('return new TelegramProvider().getBotConfiguration(');
  });

  it('records credential test connection logs without passing raw fields', () => {
    expect(source).toContain('ProviderLogsService');
    expect(source).toContain('recordConnectionLog({');
    expect(source).toContain("action: 'credential.test'");
    expect(source).toContain("status: 'success'");
    expect(source).toContain("status: 'failed'");
    expect(source).toContain('credentialId: id');
    expect(source).not.toContain('requestSummary: fields');
  });

  it('supports real provider test posts with publish attempt logging', () => {
    expect(source).toContain('async testPost(');
    expect(source).toContain("action: 'test-post'");
    expect(source).toContain('createPublishAttempt({');
    expect(source).toContain('updatePublishAttempt(attemptId,');
    expect(source).toContain('resolveClientInformationByCredentialId(');
    expect(source).toContain('.post(');
    expect(source).toContain('imageUrl');
    expect(source).toContain('mediaUrls');
    expect(source).toContain('mediaCount: input.mediaCount');
  });

  const loadGetEncryptionKey = () => {
    const match = source.match(
      /  private getEncryptionKey\(\) \{[\s\S]*?\n  \}\n\n  private maskFields/
    );
    expect(match).toBeTruthy();

    const methodSource = match[0]
      .replace('  private getEncryptionKey() {', 'function getEncryptionKey() {')
      .replace(/\n  private maskFields$/, '');

    return new Function(
      'process',
      'crypto',
      `${methodSource}\nreturn getEncryptionKey;`
    )(process, require('node:crypto'));
  };

  describe('credentials encryption key guard', () => {
    const originalKey = process.env.ACADEPOST_CREDENTIALS_ENCRYPTION_KEY;

    afterEach(() => {
      if (originalKey === undefined) {
        delete process.env.ACADEPOST_CREDENTIALS_ENCRYPTION_KEY;
      } else {
        process.env.ACADEPOST_CREDENTIALS_ENCRYPTION_KEY = originalKey;
      }
    });

    it.each(['', 'change-me', 'change-this', 'CHANGE_ME_CREDENTIALS', 'plain passphrase'])(
      'rejects unsafe placeholder or passphrase key %p',
      (value) => {
        const getEncryptionKey = loadGetEncryptionKey();
        process.env.ACADEPOST_CREDENTIALS_ENCRYPTION_KEY = value;

        expect(getEncryptionKey()).toBeUndefined();
      }
    );

    it('accepts 64 hex character encryption keys', () => {
      const getEncryptionKey = loadGetEncryptionKey();
      process.env.ACADEPOST_CREDENTIALS_ENCRYPTION_KEY = 'a'.repeat(64);

      expect(getEncryptionKey()).toHaveLength(32);
    });

    it('accepts 32-byte base64 encryption keys', () => {
      const getEncryptionKey = loadGetEncryptionKey();
      process.env.ACADEPOST_CREDENTIALS_ENCRYPTION_KEY = Buffer.alloc(
        32,
        7
      ).toString('base64');

      expect(getEncryptionKey()).toHaveLength(32);
    });
  });
});
