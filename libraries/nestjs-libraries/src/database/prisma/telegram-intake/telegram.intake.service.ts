import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { TelegramIntakeRepository } from '@gitroom/nestjs-libraries/database/prisma/telegram-intake/telegram.intake.repository';
import { IntegrationService } from '@gitroom/nestjs-libraries/database/prisma/integrations/integration.service';
import { TelegramIntakeSession } from '@prisma/client';
import { TelegramIntakeBotClient } from '@gitroom/nestjs-libraries/database/prisma/telegram-intake/telegram.intake.bot-client';
import { PostsService } from '@gitroom/nestjs-libraries/database/prisma/posts/posts.service';
import { MediaService } from '@gitroom/nestjs-libraries/database/prisma/media/media.service';
import { UploadFactory } from '@gitroom/nestjs-libraries/upload/upload.factory';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);

export type TelegramWebhookUpdate = {
  update_id: number;
  message?: TelegramWebhookMessage;
  callback_query?: {
    id: string;
    from?: TelegramWebhookUser;
    data?: string;
    message?: TelegramWebhookMessage;
  };
};

type TelegramWebhookUser = {
  id: number;
  username?: string;
};

type TelegramWebhookMessage = {
  message_id: number;
  text?: string;
  caption?: string;
  chat: {
    id: number;
  };
  from?: TelegramWebhookUser;
  photo?: Array<{ file_id: string; file_unique_id?: string }>;
  video?: { file_id: string; file_unique_id?: string };
  document?: { file_id: string; file_unique_id?: string };
};

export type TelegramInlineKeyboardButton = {
  text: string;
  callback_data: string;
};

export type TelegramInlineKeyboardMarkup = {
  inline_keyboard: TelegramInlineKeyboardButton[][];
};

const MODES = ['draft', 'now', 'schedule'] as const;

@Injectable()
export class TelegramIntakeService {
  private storage = UploadFactory.createStorage();

  constructor(
    private _telegramIntakeRepository: TelegramIntakeRepository,
    private _integrationService: IntegrationService,
    private _telegramIntakeBotClient: TelegramIntakeBotClient,
    private _postsService: PostsService,
    private _mediaService: MediaService
  ) {}

  verifyWebhookSecret(secretToken?: string) {
    this.ensureEnabled();
    const expected = process.env.TELEGRAM_INTAKE_WEBHOOK_SECRET;
    if (!expected || secretToken !== expected) {
      throw new UnauthorizedException('Secret webhook Telegram intake invalide');
    }
  }

  bindTelegramUser(input: {
    organizationId: string;
    userId: string;
    telegramUserId: string | number;
    telegramChatId?: string | number;
    telegramUsername?: string;
  }) {
    this.ensureEnabled();
    return this._telegramIntakeRepository.upsertBinding({
      organizationId: input.organizationId,
      userId: input.userId,
      telegramUserId: String(input.telegramUserId),
      telegramChatId:
        input.telegramChatId === undefined ? undefined : String(input.telegramChatId),
      telegramUsername: input.telegramUsername,
    });
  }

  listBindings(organizationId: string) {
    this.ensureEnabled();
    return this._telegramIntakeRepository.listBindings(organizationId);
  }

  private ensureEnabled() {
    if (process.env.TELEGRAM_INTAKE_ENABLED !== 'true') {
      throw new ServiceUnavailableException('Réception Telegram désactivée');
    }
  }

  async handleWebhook(update: TelegramWebhookUpdate) {
    if (!update?.update_id && update?.update_id !== 0) {
      throw new BadRequestException('update_id Telegram requis');
    }

    if (update.callback_query) {
      return this.handleCallback(update);
    }

    if (update.message) {
      return this.handleMessage(update);
    }

    return {
      ok: true,
      ignored: true,
      reason: 'unsupported_update_type',
    };
  }

  async buildKeyboard(session: TelegramIntakeSession) {
    const integrations = await this._integrationService.getIntegrationsList(
      session.organizationId
    );
    const selected = this.getSelectedIntegrationIds(session);
    const socialRows = integrations.map((integration) => {
      const active = selected.includes(integration.id);
      return [
        {
          text: `${active ? '✓ ' : ''}${integration.name}`,
          callback_data: `net:${integration.id}`,
        },
      ];
    });

    return {
      inline_keyboard: [
        ...socialRows,
        [
          {
            text: `Mode : ${this.formatModeLabel(session.mode)}`,
            callback_data: 'mode:next',
          },
        ],
        [
          { text: 'Confirmer', callback_data: 'confirm' },
          { text: 'Annuler', callback_data: 'cancel' },
        ],
      ],
    } satisfies TelegramInlineKeyboardMarkup;
  }

  async handleCallback(update: TelegramWebhookUpdate) {
    const callback = update.callback_query!;
    await this._telegramIntakeBotClient.answerCallbackQuery(callback.id);
    const message = callback.message;
    if (!message?.chat?.id || !message.message_id) {
      return { ok: false, code: 'callback_message_missing' };
    }

    const session =
      await this._telegramIntakeRepository.findSessionByReplyMessage(
        String(message.chat.id),
        String(message.message_id)
      );
    if (!session) {
      return { ok: false, code: 'session_not_found' };
    }

    const action = this.parseCallbackData(callback.data || '');
    if (action.type === 'network') {
      const selected = this.toggleSelection(
        this.getSelectedIntegrationIds(session),
        action.integrationId
      );
      const updated = await this._telegramIntakeRepository.updateSessionState(
        session.id,
        {
          selectedIntegrationIds: selected,
          status: 'selecting',
        }
      );
      await this.refreshTelegramKeyboard(updated);
      return { ok: true, type: 'callback', action, session: updated };
    }

    if (action.type === 'mode-next') {
      const updated = await this._telegramIntakeRepository.updateSessionState(
        session.id,
        {
          mode: this.nextMode(session.mode),
          status: 'selecting',
        }
      );
      await this.refreshTelegramKeyboard(updated);
      return { ok: true, type: 'callback', action, session: updated };
    }

    if (action.type === 'cancel') {
      const updated = await this._telegramIntakeRepository.updateSessionState(
        session.id,
        { status: 'canceled' }
      );
      return { ok: true, type: 'callback', action, session: updated };
    }

    if (action.type === 'confirm') {
      return this.confirmSession(session, action);
    }

    return { ok: false, type: 'callback', action };
  }

  private async handleMessage(update: TelegramWebhookUpdate) {
    const message = update.message!;
    const chatId = String(message.chat.id);
    const telegramUserId =
      message.from?.id === undefined ? undefined : String(message.from.id);
    const binding =
      await this._telegramIntakeRepository.findActiveBinding(
        telegramUserId,
        chatId
      );

    if (!binding) {
      return {
        ok: false,
        code: 'telegram_user_not_mapped',
      };
    }

    if (message.text) {
      const awaitingDateSession =
        await this._telegramIntakeRepository.findLatestAwaitingDateSession(
          chatId,
          telegramUserId
        );
      if (awaitingDateSession) {
        return this.handleScheduleDateReply(awaitingDateSession, message.text);
      }
    }

    const result = await this._telegramIntakeRepository.createSession({
      organizationId: binding.organizationId,
      userId: binding.userId,
      bindingId: binding.id,
      telegramUpdateId: String(update.update_id),
      telegramChatId: chatId,
      telegramUserId,
      telegramMessageId: String(message.message_id),
      originalText: message.text,
      originalCaption: message.caption,
      mediaReferences: this.extractMediaReferences(message),
      selectedIntegrationIds: [],
    });
    const keyboard = await this.buildKeyboard(result.session);
    let session = result.session;
    if (result.created) {
      const reply = await this._telegramIntakeBotClient.sendMessage({
        chatId,
        text: this.buildIntakePrompt(session),
        replyMarkup: keyboard,
      });
      if (reply?.ok && reply?.result?.message_id) {
        session = await this._telegramIntakeRepository.updateSessionState(
          session.id,
          {
            telegramReplyMessageId: String(reply.result.message_id),
          }
        );
      }
    }

    return {
      ok: true,
      type: 'message',
      created: result.created,
      session,
      keyboard,
    };
  }

  private buildIntakePrompt(session: TelegramIntakeSession) {
    const content = this.getSessionContent(session);
    const preview =
      content.length > 240 ? `${content.slice(0, 237)}...` : content;
    return [
      'Réception AcadéPost',
      preview ? `Contenu : ${preview}` : 'Contenu : média uniquement',
      `Mode : ${this.formatModeLabel(session.mode)}`,
      'Choisissez les destinations, puis confirmez.',
    ].join('\n');
  }

  private formatModeLabel(mode: string) {
    if (mode === 'now') {
      return 'Publier maintenant';
    }
    if (mode === 'schedule') {
      return 'Programmer';
    }
    return 'Brouillon';
  }

  private extractMediaReferences(message: TelegramWebhookMessage) {
    const references: Array<{
      type: string;
      fileId: string;
      fileUniqueId?: string;
    }> = [];

    const largestPhoto = message.photo?.[message.photo.length - 1];
    if (largestPhoto) {
      references.push({
        type: 'photo',
        fileId: largestPhoto.file_id,
        fileUniqueId: largestPhoto.file_unique_id,
      });
    }

    if (message.video) {
      references.push({
        type: 'video',
        fileId: message.video.file_id,
        fileUniqueId: message.video.file_unique_id,
      });
    }

    if (message.document) {
      references.push({
        type: 'document',
        fileId: message.document.file_id,
        fileUniqueId: message.document.file_unique_id,
      });
    }

    return references;
  }

  private parseCallbackData(data: string) {
    if (data.startsWith('net:')) {
      return { type: 'network' as const, integrationId: data.slice(4) };
    }
    if (data === 'mode:next') {
      return { type: 'mode-next' as const };
    }
    if (data === 'confirm') {
      return { type: 'confirm' as const };
    }
    if (data === 'cancel') {
      return { type: 'cancel' as const };
    }
    return { type: 'unknown' as const, data };
  }

  private getSelectedIntegrationIds(session: TelegramIntakeSession) {
    return Array.isArray(session.selectedIntegrationIds)
      ? session.selectedIntegrationIds.filter(
          (id): id is string => typeof id === 'string'
        )
      : [];
  }

  private toggleSelection(selected: string[], integrationId: string) {
    return selected.includes(integrationId)
      ? selected.filter((id) => id !== integrationId)
      : [...selected, integrationId];
  }

  private nextMode(mode: string) {
    const index = MODES.indexOf(mode as (typeof MODES)[number]);
    return MODES[(index + 1) % MODES.length];
  }

  private async confirmSession(
    session: TelegramIntakeSession,
    action: { type: 'confirm' }
  ) {
    const selected = this.getSelectedIntegrationIds(session);
    if (!selected.length) {
      const updated = await this._telegramIntakeRepository.updateSessionState(
        session.id,
        {
          status: 'error',
          errors: [{ code: 'no_destinations_selected' }],
        }
      );
      await this.sendReceipt(updated, 'Sélectionnez au moins une destination.');
      return { ok: false, type: 'callback', action, session: updated };
    }

    if (session.mode === 'schedule') {
      const updated = await this._telegramIntakeRepository.updateSessionState(
        session.id,
        { status: 'awaiting_date' }
      );
      await this.sendReceipt(
        updated,
        "Envoyez la date de publication, par exemple : aujourd'hui 18:00, demain 09:30 ou 28.05 14:00."
      );
      return { ok: true, type: 'callback', action, session: updated };
    }

    return this.createPostsFromSession(session, action);
  }

  private async handleScheduleDateReply(
    session: TelegramIntakeSession,
    text: string
  ) {
    const parsed = this.parseScheduleDate(text);
    if (!parsed) {
      const updated = await this._telegramIntakeRepository.updateSessionState(
        session.id,
        {
          status: 'awaiting_date',
          errors: [{ code: 'invalid_schedule_date' }],
        }
      );
      await this.sendReceipt(
        updated,
        "Date invalide. Utilisez aujourd'hui 18:00, demain 09:30 ou 28.05 14:00."
      );
      return { ok: false, type: 'schedule-date', session: updated };
    }

    return this.createPostsFromSession(
      {
        ...session,
        mode: 'schedule',
        publishDate: parsed,
      },
      { type: 'schedule-date' as const }
    );
  }

  private async createPostsFromSession(
    session: TelegramIntakeSession,
    action: { type: 'confirm' } | { type: 'schedule-date' }
  ) {
    const content = this.getSessionContent(session);
    if (!content) {
      const updated = await this._telegramIntakeRepository.updateSessionState(
        session.id,
        {
          status: 'error',
          errors: [{ code: 'empty_content' }],
        }
      );
      await this.sendReceipt(
        updated,
        'Impossible de créer une publication sans contenu.'
      );
      return { ok: false, type: 'callback', action, session: updated };
    }

    const selected = this.getSelectedIntegrationIds(session);
    if (!selected.length) {
      const updated = await this._telegramIntakeRepository.updateSessionState(
        session.id,
        {
          status: 'error',
          errors: [{ code: 'no_destinations_selected' }],
        }
      );
      await this.sendReceipt(updated, 'Sélectionnez au moins une destination.');
      return { ok: false, type: 'callback', action, session: updated };
    }

    const type =
      session.mode === 'schedule'
        ? 'schedule'
        : session.mode === 'now'
        ? 'now'
        : 'draft';
    const providerPosts = await this.buildProviderPosts(session, selected, content);
    if ('error' in providerPosts) {
      const updated = await this._telegramIntakeRepository.updateSessionState(
        session.id,
        {
          status: 'error',
          errors: [providerPosts.error],
        }
      );
      await this.sendReceipt(updated, this.formatErrorReceipt(providerPosts.error));
      return { ok: false, type: 'callback', action, session: updated };
    }

    const rawPostBody = {
      type,
      shortLink: false,
      date: (session.publishDate || new Date()).toISOString(),
      tags: [],
      posts: providerPosts.posts,
    };

    try {
      const mapped = await this._postsService.mapTypeToPost(
        rawPostBody as any,
        session.organizationId
      );
      const posts = await this._postsService.createPost(
        session.organizationId,
        mapped
      );
      const updated = await this._telegramIntakeRepository.updateSessionState(
        session.id,
        {
          status: 'confirmed',
          publishDate: session.publishDate,
          resultPostIds: posts.map((post) => post.postId),
        }
      );
      await this.sendReceipt(
        updated,
        this.formatSuccessReceipt(type, posts.length, session.publishDate)
      );
      return { ok: true, type: 'callback', action, session: updated, posts };
    } catch (error: any) {
      const updated = await this._telegramIntakeRepository.updateSessionState(
        session.id,
        {
          status: 'error',
          errors: [
            {
              code: 'post_creation_failed',
              message: error?.message || 'Échec de la création de publication',
            },
          ],
        }
      );
      await this.sendReceipt(
        updated,
        'Échec de la création. Ouvrez AcadéPost pour les détails.'
      );
      return { ok: false, type: 'callback', action, session: updated };
    }
  }

  private async sendReceipt(session: TelegramIntakeSession, text: string) {
    await this._telegramIntakeBotClient.sendMessage({
      chatId: session.telegramChatId,
      text,
    });
  }

  private formatSuccessReceipt(
    type: string,
    count: number,
    publishDate?: Date | null
  ) {
    if (type === 'schedule') {
      return `Publication programmée : ${count} publication(s) pour ${publishDate?.toISOString()}.`;
    }
    if (type === 'now') {
      return `Publication immédiate en cours : ${count} publication(s).`;
    }
    return `Brouillon créé avec ${count} destination(s).`;
  }

  private formatErrorReceipt(error: { code: string; provider?: string }) {
    if (error.code === 'target_requires_media') {
      return `${error.provider || 'Cette destination'} nécessite un média pour ce contenu.`;
    }
    if (error.code === 'telegram_media_import_failed') {
      return "Impossible d'importer le média Telegram. Vérifiez le token du bot et l'accès au média.";
    }
    if (error.code === 'invalid_integration') {
      return "Une destination sélectionnée n'est plus disponible.";
    }
    return 'Échec de la réception Telegram. Ouvrez AcadéPost pour les détails.';
  }

  private getSessionContent(session: TelegramIntakeSession) {
    return (session.originalText || session.originalCaption || '').trim();
  }

  private async buildProviderPosts(
    session: TelegramIntakeSession,
    selected: string[],
    content: string
  ) {
    const mediaReferences = this.getMediaReferences(session);
    const importedMedia = await this.importTelegramMedia(
      session.organizationId,
      mediaReferences
    );
    if ('error' in importedMedia) {
      return { error: importedMedia.error };
    }

    const posts = [];

    for (const integrationId of selected) {
      const integration = await this._integrationService.getIntegrationById(
        session.organizationId,
        integrationId
      );
      if (!integration) {
        return {
          error: {
            code: 'invalid_integration',
            integrationId,
          },
        };
      }

      if (
        this.providerRequiresMedia(integration.providerIdentifier) &&
        !mediaReferences.length
      ) {
        return {
          error: {
            code: 'target_requires_media',
            integrationId,
            provider: integration.providerIdentifier,
          },
        };
      }

      posts.push({
        integration: { id: integrationId },
        value: [
          {
            content: this.renderContentForProvider(
              content,
              integration.providerIdentifier
            ),
            image: importedMedia.media,
          },
        ],
        group: `telegram-intake-${session.id}`,
      });
    }

    return { posts };
  }

  private providerRequiresMedia(providerIdentifier: string) {
    return providerIdentifier.startsWith('instagram');
  }

  private renderContentForProvider(content: string, providerIdentifier: string) {
    if (providerIdentifier === 'x' && content.length > 280) {
      return `${content.slice(0, 277)}...`;
    }

    return content;
  }

  private async importTelegramMedia(
    organizationId: string,
    mediaReferences: Array<{
      type: string;
      fileId: string;
      fileUniqueId?: string;
    }>
  ) {
    const media = [];

    for (const reference of mediaReferences) {
      const file = await this._telegramIntakeBotClient.getFileDownloadUrl(
        reference.fileId
      );
      if (!file.ok) {
        return {
          error: {
            code: 'telegram_media_import_failed',
            reason: file.reason || 'get_file_failed',
          },
        };
      }

      const uploadedPath = await this.storage.uploadSimple(file.url);
      const saved = await this._mediaService.saveFile(
        organizationId,
        uploadedPath.split('/').pop() || `${reference.type}.bin`,
        uploadedPath,
        `${reference.type}-${reference.fileUniqueId || reference.fileId}`
      );
      media.push({
        id: saved.id,
        path: saved.path,
        alt: saved.alt || undefined,
        thumbnail: saved.thumbnail || undefined,
      });
    }

    return { media };
  }

  private getMediaReferences(session: TelegramIntakeSession) {
    return Array.isArray(session.mediaReferences)
      ? session.mediaReferences.filter(
          (
            reference
          ): reference is {
            type: string;
            fileId: string;
            fileUniqueId?: string;
          } =>
            !!reference &&
            typeof reference === 'object' &&
            !Array.isArray(reference) &&
            typeof reference.type === 'string' &&
            typeof reference.fileId === 'string'
        )
      : [];
  }

  private parseScheduleDate(input: string, now = new Date()) {
    const timezoneName =
      process.env.TELEGRAM_INTAKE_DEFAULT_TIMEZONE || 'Europe/Paris';
    const text = input.trim().toLowerCase();
    const base = dayjs(now).tz(timezoneName);

    const timeMatch = text.match(/^(\d{1,2}):(\d{2})$/);
    if (timeMatch) {
      const candidate = base
        .hour(Number(timeMatch[1]))
        .minute(Number(timeMatch[2]))
        .second(0)
        .millisecond(0);
      return candidate.isAfter(base) ? candidate.toDate() : null;
    }

    const relativeMatch = text.match(
      /^(today|tomorrow|aujourd'hui|aujourdhui|demain)\s+(\d{1,2}):(\d{2})$/
    );
    if (relativeMatch) {
      const isTomorrow =
        relativeMatch[1] === 'tomorrow' || relativeMatch[1] === 'demain';
      const candidate = base
        .add(isTomorrow ? 1 : 0, 'day')
        .hour(Number(relativeMatch[2]))
        .minute(Number(relativeMatch[3]))
        .second(0)
        .millisecond(0);
      return candidate.isAfter(base) ? candidate.toDate() : null;
    }

    const dateMatch = text.match(
      /^(\d{1,2})\.(\d{1,2})(?:\.(\d{2}|\d{4}))?\s+(\d{1,2}):(\d{2})$/
    );
    if (dateMatch) {
      const year = dateMatch[3]
        ? Number(dateMatch[3].length === 2 ? `20${dateMatch[3]}` : dateMatch[3])
        : base.year();
      const candidate = dayjs.tz(
        `${year}-${dateMatch[2]}-${dateMatch[1]} ${dateMatch[4]}:${dateMatch[5]}`,
        'YYYY-M-D H:mm',
        timezoneName
      );
      return candidate.isValid() && candidate.isAfter(base)
        ? candidate.toDate()
        : null;
    }

    return null;
  }

  private async refreshTelegramKeyboard(session: TelegramIntakeSession) {
    if (!session.telegramReplyMessageId) {
      return;
    }

    await this._telegramIntakeBotClient.editMessageReplyMarkup({
      chatId: session.telegramChatId,
      messageId: session.telegramReplyMessageId,
      replyMarkup: await this.buildKeyboard(session),
    });
  }
}
