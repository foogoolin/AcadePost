const fs = require('node:fs');
const path = require('node:path');

describe('telegram intake bot client', () => {
  const source = fs.readFileSync(
    path.join(__dirname, 'telegram.intake.bot-client.ts'),
    'utf8'
  );

  it('uses deployment-level Telegram intake token without requiring tests to provide it', () => {
    expect(source).toContain('TELEGRAM_INTAKE_BOT_TOKEN');
    expect(source).toContain('telegram_intake_bot_token_missing');
    expect(source).toContain('answerCallbackQuery');
    expect(source).toContain('editMessageReplyMarkup');
    expect(source).toContain('sendMessage');
    expect(source).toContain('getFileDownloadUrl');
    expect(source).toContain('getFile');
    expect(source).toContain('https://api.telegram.org/file/bot');
  });
});
