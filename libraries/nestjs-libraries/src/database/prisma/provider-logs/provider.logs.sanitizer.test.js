const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const loadSanitizer = () => {
  const source = fs.readFileSync(
    path.join(__dirname, 'provider.logs.sanitizer.ts'),
    'utf8'
  );
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText;
  const testModule = { exports: {} };

  new Function('module', 'exports', 'require', 'Buffer', output)(
    testModule,
    testModule.exports,
    require,
    Buffer
  );

  return testModule.exports;
};

describe('provider log sanitizer', () => {
  const telegramToken =
    '123456789:AAAbbbCCCdddEEEfffGGGhhhIIIjjj_kkk';
  const apiKey = 'sk-live-secret-api-key';
  const accessToken = 'access-token-secret';

  it('redacts tokens, API keys, auth headers, and nested secrets', () => {
    const { sanitizeProviderLogValue, PROVIDER_LOG_REDACTION } =
      loadSanitizer();

    const sanitized = sanitizeProviderLogValue({
      provider: 'telegram',
      providerCredentialId: 'credential-reference',
      botToken: telegramToken,
      nested: {
        access_token: accessToken,
        apiKey,
        normal: 'kept',
        children: [
          {
            clientSecret: 'client-secret-value',
          },
        ],
      },
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'X-API-Key': apiKey,
      },
    });
    const serialized = JSON.stringify(sanitized);

    expect(serialized).not.toContain(telegramToken);
    expect(serialized).not.toContain(apiKey);
    expect(serialized).not.toContain(accessToken);
    expect(sanitized.providerCredentialId).toBe('credential-reference');
    expect(sanitized.nested.normal).toBe('kept');
    expect(sanitized.botToken).toBe(PROVIDER_LOG_REDACTION);
    expect(sanitized.headers.Authorization).toBe(PROVIDER_LOG_REDACTION);
    expect(sanitized.nested.children[0].clientSecret).toBe(
      PROVIDER_LOG_REDACTION
    );
  });

  it('redacts Telegram bot-token-like values embedded in strings and URLs', () => {
    const { sanitizeProviderLogValue, PROVIDER_LOG_REDACTION } =
      loadSanitizer();

    const sanitized = sanitizeProviderLogValue({
      message: `failed for bot ${telegramToken}`,
      url: `https://api.telegram.org/bot${telegramToken}/sendMessage?token=${telegramToken}&api_key=${apiKey}&ok=true`,
      chat_id: '-1001234567890',
    });
    const serialized = JSON.stringify(sanitized);

    expect(serialized).not.toContain(telegramToken);
    expect(serialized).not.toContain(apiKey);
    expect(serialized).not.toContain('-1001234567890');
    expect(sanitized.chat_id).toBe(PROVIDER_LOG_REDACTION);
    expect(sanitized.url).toContain(`token=${PROVIDER_LOG_REDACTION}`);
    expect(sanitized.url).toContain('ok=true');
  });

  it('sanitizes error summaries without storing stack traces', () => {
    const { sanitizeProviderLogError } = loadSanitizer();
    const error = new Error(`Credential test failed: ${telegramToken}`);
    error.code = 'ETELEGRAM';
    error.response = {
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
      data: {
        refreshToken: 'refresh-secret',
      },
    };

    const sanitized = sanitizeProviderLogError(error);
    const serialized = JSON.stringify(sanitized);

    expect(serialized).not.toContain(telegramToken);
    expect(serialized).not.toContain(accessToken);
    expect(serialized).not.toContain('refresh-secret');
    expect(sanitized.code).toBe('ETELEGRAM');
    expect(sanitized.stack).toBeUndefined();
  });

  it('handles circular values and binary payloads safely', () => {
    const { sanitizeProviderLogValue } = loadSanitizer();
    const payload = {
      buffer: Buffer.from('raw-secret-binary'),
    };
    payload.self = payload;

    const sanitized = sanitizeProviderLogValue(payload);

    expect(sanitized.self).toBe('[Circular]');
    expect(sanitized.buffer).toBe('[Binary 17 bytes]');
  });
});
