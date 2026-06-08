import { Injectable } from '@nestjs/common';

@Injectable()
export class TelegramIntakeBotClient {
  get configured() {
    return !!process.env.TELEGRAM_INTAKE_BOT_TOKEN;
  }

  async answerCallbackQuery(callbackQueryId: string) {
    return this.callTelegram('answerCallbackQuery', {
      callback_query_id: callbackQueryId,
    });
  }

  async editMessageReplyMarkup(input: {
    chatId: string;
    messageId: string;
    replyMarkup: Record<string, any>;
  }) {
    return this.callTelegram('editMessageReplyMarkup', {
      chat_id: input.chatId,
      message_id: input.messageId,
      reply_markup: input.replyMarkup,
    });
  }

  async sendMessage(input: {
    chatId: string;
    text: string;
    replyMarkup?: Record<string, any>;
  }) {
    return this.callTelegram('sendMessage', {
      chat_id: input.chatId,
      text: input.text,
      ...(input.replyMarkup ? { reply_markup: input.replyMarkup } : {}),
    });
  }

  async getFileDownloadUrl(fileId: string) {
    const token = process.env.TELEGRAM_INTAKE_BOT_TOKEN;
    if (!token) {
      return {
        ok: false as const,
        skipped: true,
        reason: 'telegram_intake_bot_token_missing',
      };
    }

    const response = await this.callTelegram('getFile', {
      file_id: fileId,
    });
    if (!response?.ok || !response?.result?.file_path) {
      return {
        ok: false as const,
        body: response,
      };
    }

    return {
      ok: true as const,
      url: `https://api.telegram.org/file/bot${token}/${response.result.file_path}`,
    };
  }

  private async callTelegram(method: string, payload: Record<string, any>) {
    const token = process.env.TELEGRAM_INTAKE_BOT_TOKEN;
    if (!token) {
      return {
        ok: false,
        skipped: true,
        reason: 'telegram_intake_bot_token_missing',
      };
    }

    const response = await fetch(
      `https://api.telegram.org/bot${token}/${method}`,
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        body,
      };
    }

    return body;
  }
}
