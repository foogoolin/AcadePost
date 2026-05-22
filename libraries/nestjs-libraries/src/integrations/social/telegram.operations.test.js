const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

function loadTelegramOperations() {
  const loadTranspiledModule = (sourcePath) => {
    const source = fs.readFileSync(sourcePath, 'utf8');
    const { outputText } = ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2019,
      },
    });
    const module = { exports: {} };

    new Function('require', 'module', 'exports', outputText)(
      requireFromTranspiledModule,
      module,
      module.exports
    );

    return module.exports;
  };

  const requireFromTranspiledModule = (request) => {
    if (
      request === '@gitroom/nestjs-libraries/integrations/provider.operations'
    ) {
      return loadTranspiledModule(
        path.join(__dirname, '..', 'provider.operations.ts')
      );
    }

    throw new Error(
      `Unexpected runtime import in telegram.operations.ts: ${request}`
    );
  };

  const source = fs.readFileSync(
    path.join(__dirname, 'telegram.operations.ts'),
    'utf8'
  );
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2019,
    },
  });
  const module = { exports: {} };

  new Function('require', 'module', 'exports', outputText)(
    requireFromTranspiledModule,
    module,
    module.exports
  );

  return module.exports;
}

describe('Telegram provider operations', () => {
  const operations = loadTelegramOperations();

  it('exposes the first explicit Telegram operation ids', () => {
    expect(operations.TELEGRAM_OPERATIONS.map(({ id }) => id)).toEqual([
      'telegram.message.send',
      'telegram.photo.send',
      'telegram.mediaGroup.send',
      'telegram.document.send',
    ]);
  });

  it.each([
    [
      'text only',
      { message: '<p>Hello</p>', media: [] },
      'telegram.message.send',
    ],
    [
      'single photo',
      { message: 'Caption', media: [{ type: 'photo', media: 'photo.jpg' }] },
      'telegram.photo.send',
    ],
    [
      'single frontend image',
      { message: 'Caption', media: [{ type: 'image', path: 'photo.jpg' }] },
      'telegram.photo.send',
    ],
    [
      'single video',
      { message: 'Caption', media: [{ type: 'video', media: 'video.mp4' }] },
      'telegram.photo.send',
    ],
    [
      'single document',
      { message: 'Caption', media: [{ type: 'document', media: 'doc.pdf' }] },
      'telegram.document.send',
    ],
    [
      'media group',
      {
        message: 'Caption',
        media: [
          { type: 'photo', media: 'one.jpg' },
          { type: 'video', media: 'two.mp4' },
        ],
      },
      'telegram.mediaGroup.send',
    ],
  ])('defaults %s payloads to %s', (_label, input, expectedOperation) => {
    expect(operations.resolveTelegramOperation(input)).toMatchObject({
      id: expectedOperation,
      defaulted: true,
    });
  });

  it.each(['operation', 'operationId', 'providerOperation', 'providerOperationId'])(
    'accepts explicit operation from settings.%s',
    (settingsKey) => {
      expect(
        operations.resolveTelegramOperation({
          message: 'Caption',
          media: [{ type: 'photo', media: 'photo.jpg' }],
          settings: {
            [settingsKey]: 'telegram.document.send',
          },
        })
      ).toMatchObject({
        id: 'telegram.document.send',
        defaulted: false,
      });
    }
  );

  it('accepts the composer canonical providerOperation.operationId contract', () => {
    expect(
      operations.resolveTelegramOperation({
        message: 'Caption',
        media: [{ type: 'photo', media: 'photo.jpg' }],
        settings: {
          providerOperation: {
            destinationId: 'integration-id',
            providerIdentifier: 'telegram',
            operationId: 'telegram.document.send',
            source: 'manual',
          },
        },
      })
    ).toMatchObject({
      id: 'telegram.document.send',
      defaulted: false,
    });
  });

  it.each([
    [
      'unknown operation',
      {
        operation: 'telegram.unknown.send',
        message: 'Hello',
        media: [],
      },
      /Unsupported Telegram operation/,
    ],
    [
      'message with media',
      {
        operation: 'telegram.message.send',
        message: 'Hello',
        media: [{ type: 'photo', media: 'photo.jpg' }],
      },
      /does not support media/,
    ],
    [
      'empty message',
      {
        operation: 'telegram.message.send',
        message: '<p></p>',
        media: [],
      },
      /requires message text/,
    ],
    [
      'photo with document',
      {
        operation: 'telegram.photo.send',
        message: 'Caption',
        media: [{ type: 'document', media: 'doc.pdf' }],
      },
      /only supports photo or video/,
    ],
    [
      'document group',
      {
        operation: 'telegram.document.send',
        message: 'Caption',
        media: [
          { type: 'document', media: 'one.pdf' },
          { type: 'document', media: 'two.pdf' },
        ],
      },
      /requires exactly one media item/,
    ],
    [
      'single media group item',
      {
        operation: 'telegram.mediaGroup.send',
        message: 'Caption',
        media: [{ type: 'photo', media: 'photo.jpg' }],
      },
      /requires at least two media items/,
    ],
  ])(
    'rejects invalid %s payloads before the Bot API call',
    (_label, input, error) => {
      expect(() => operations.resolveTelegramOperation(input)).toThrow(error);
    }
  );
});
