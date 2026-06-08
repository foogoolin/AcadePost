const fs = require('node:fs');
const path = require('node:path');

describe('telegram intake service', () => {
  const source = fs.readFileSync(
    path.join(__dirname, 'telegram.intake.service.ts'),
    'utf8'
  );

  it('keeps Telegram callback payloads short and stores state server-side', () => {
    expect(source).toContain("callback_data: `net:${integration.id}`");
    expect(source).toContain("callback_data: 'mode:next'");
    expect(source).toContain("callback_data: 'confirm'");
    expect(source).toContain("callback_data: 'cancel'");
    expect(source).toContain("'Confirmer'");
    expect(source).toContain("'Annuler'");
    expect(source).toContain('selectedIntegrationIds: selected');
  });

  it('keeps Telegram intake behind an explicit feature flag', () => {
    expect(source).toContain('TELEGRAM_INTAKE_ENABLED');
    expect(source).toContain("!== 'true'");
    expect(source).toContain('Réception Telegram désactivée');
    expect(source).toContain('this.ensureEnabled();');
  });

  it('blocks unmapped Telegram users before creating intake sessions', () => {
    expect(source).toContain('telegram_user_not_mapped');
    expect(source).toContain('findActiveBinding(');
    expect(source).toContain('createSession({');
  });

  it('answers callback queries before mutating callback state', () => {
    expect(source).toContain('answerCallbackQuery(callback.id)');
    expect(source.indexOf('answerCallbackQuery(callback.id)')).toBeLessThan(
      source.indexOf('findSessionByReplyMessage')
    );
    expect(source).toContain('editMessageReplyMarkup');
  });

  it('creates draft and now posts through the existing PostsService on confirm', () => {
    expect(source).toContain('private async confirmSession');
    expect(source).toContain("session.mode === 'schedule'");
    expect(source).toContain('mapTypeToPost(');
    expect(source).toContain('createPost(');
    expect(source).toContain("status: 'awaiting_date'");
  });

  it('parses simple Telegram schedule replies before creating scheduled posts', () => {
    expect(source).toContain('private parseScheduleDate');
    expect(source).toContain("TELEGRAM_INTAKE_DEFAULT_TIMEZONE || 'Europe/Paris'");
    expect(source).toContain("today|tomorrow|aujourd'hui|aujourdhui|demain");
    expect(source).toContain('findLatestAwaitingDateSession');
    expect(source).toContain("type =\n      session.mode === 'schedule'");
  });

  it('validates platform-specific text/media constraints before post creation', () => {
    expect(source).toContain('private async buildProviderPosts');
    expect(source).toContain('providerRequiresMedia');
    expect(source).toContain("providerIdentifier.startsWith('instagram')");
    expect(source).toContain('target_requires_media');
    expect(source).toContain("providerIdentifier === 'x'");
    expect(source).toContain('content.slice(0, 277)');
  });

  it('imports Telegram media through getFile before attaching media to created posts', () => {
    expect(source).toContain('private async importTelegramMedia');
    expect(source).toContain('getFileDownloadUrl');
    expect(source).toContain('telegram_media_import_failed');
    expect(source).toContain('uploadSimple(file.url)');
    expect(source).toContain('saveFile(');
    expect(source).toContain('const largestPhoto');
  });

  it('returns Telegram receipts for success and actionable errors', () => {
    expect(source).toContain('private async sendReceipt');
    expect(source).toContain('formatSuccessReceipt');
    expect(source).toContain('formatErrorReceipt');
    expect(source).toContain('Sélectionnez au moins une destination.');
    expect(source).toContain('Date invalide.');
    expect(source).toContain('Brouillon créé avec');
  });

  it('sends the initial Telegram intake keyboard and stores the reply message id', () => {
    expect(source).toContain('private buildIntakePrompt');
    expect(source).toContain('Réception AcadéPost');
    expect(source).toContain('Choisissez les destinations, puis confirmez.');
    expect(source).toContain('replyMarkup: keyboard');
    expect(source).toContain('reply?.result?.message_id');
    expect(source).toContain('telegramReplyMessageId: String(reply.result.message_id)');
  });

  it('keeps Telegram bot user-facing copy in French', () => {
    expect(source).toContain('private formatModeLabel');
    expect(source).toContain('Publier maintenant');
    expect(source).toContain('Programmer');
    expect(source).toContain('Impossible de créer une publication sans contenu.');
    expect(source).toContain('Échec de la réception Telegram.');
  });
});
