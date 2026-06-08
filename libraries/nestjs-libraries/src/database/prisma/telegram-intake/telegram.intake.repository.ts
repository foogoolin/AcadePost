import { Injectable } from '@nestjs/common';
import { PrismaRepository } from '@gitroom/nestjs-libraries/database/prisma/prisma.service';
import { Prisma } from '@prisma/client';

export type CreateTelegramIntakeBindingInput = {
  organizationId: string;
  userId: string;
  telegramUserId: string;
  telegramChatId?: string;
  telegramUsername?: string;
};

export type CreateTelegramIntakeSessionInput = {
  organizationId: string;
  userId?: string;
  bindingId?: string;
  telegramUpdateId: string;
  telegramChatId: string;
  telegramUserId?: string;
  telegramMessageId?: string;
  originalText?: string;
  originalCaption?: string;
  mediaReferences?: Prisma.InputJsonValue;
  selectedIntegrationIds?: Prisma.InputJsonValue;
  warnings?: Prisma.InputJsonValue;
  errors?: Prisma.InputJsonValue;
};

@Injectable()
export class TelegramIntakeRepository {
  constructor(
    private _binding: PrismaRepository<'telegramIntakeBinding'>,
    private _session: PrismaRepository<'telegramIntakeSession'>
  ) {}

  upsertBinding(input: CreateTelegramIntakeBindingInput) {
    return this._binding.model.telegramIntakeBinding.upsert({
      where: {
        organizationId_telegramUserId: {
          organizationId: input.organizationId,
          telegramUserId: input.telegramUserId,
        },
      },
      create: {
        organizationId: input.organizationId,
        userId: input.userId,
        telegramUserId: input.telegramUserId,
        telegramChatId: input.telegramChatId,
        telegramUsername: input.telegramUsername,
      },
      update: {
        userId: input.userId,
        telegramChatId: input.telegramChatId,
        telegramUsername: input.telegramUsername,
        enabled: true,
        deletedAt: null,
      },
    });
  }

  listBindings(organizationId: string) {
    return this._binding.model.telegramIntakeBinding.findMany({
      where: {
        organizationId,
        deletedAt: null,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }

  async findActiveBinding(telegramUserId?: string, telegramChatId?: string) {
    if (!telegramUserId) {
      return null;
    }

    const bindings = await this._binding.model.telegramIntakeBinding.findMany({
      where: {
        telegramUserId,
        enabled: true,
        deletedAt: null,
        OR: [
          { telegramChatId: telegramChatId || undefined },
          { telegramChatId: null },
        ],
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: 2,
    });

    if (bindings.length !== 1) {
      return null;
    }

    return bindings[0];
  }

  findSessionByUpdateId(telegramUpdateId: string) {
    return this._session.model.telegramIntakeSession.findUnique({
      where: {
        telegramUpdateId,
      },
    });
  }

  findSessionByReplyMessage(chatId: string, replyMessageId: string) {
    return this._session.model.telegramIntakeSession.findFirst({
      where: {
        telegramChatId: chatId,
        telegramReplyMessageId: replyMessageId,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }

  findLatestAwaitingDateSession(chatId: string, telegramUserId?: string) {
    return this._session.model.telegramIntakeSession.findFirst({
      where: {
        telegramChatId: chatId,
        telegramUserId,
        status: 'awaiting_date',
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }

  findSessionById(id: string) {
    return this._session.model.telegramIntakeSession.findUnique({
      where: {
        id,
      },
    });
  }

  async createSession(input: CreateTelegramIntakeSessionInput) {
    const existing = await this.findSessionByUpdateId(input.telegramUpdateId);
    if (existing) {
      return { session: existing, created: false };
    }

    const session = await this._session.model.telegramIntakeSession.create({
      data: {
        organizationId: input.organizationId,
        userId: input.userId,
        bindingId: input.bindingId,
        telegramUpdateId: input.telegramUpdateId,
        telegramChatId: input.telegramChatId,
        telegramUserId: input.telegramUserId,
        telegramMessageId: input.telegramMessageId,
        originalText: input.originalText,
        originalCaption: input.originalCaption,
        mediaReferences: input.mediaReferences,
        selectedIntegrationIds: input.selectedIntegrationIds || [],
        warnings: input.warnings,
        errors: input.errors,
      },
    });

    return { session, created: true };
  }

  updateSessionState(
    id: string,
    data: {
      selectedIntegrationIds?: Prisma.InputJsonValue;
      mode?: string;
      status?: string;
      telegramReplyMessageId?: string;
      publishDate?: Date | null;
      warnings?: Prisma.InputJsonValue;
      errors?: Prisma.InputJsonValue;
      resultPostIds?: Prisma.InputJsonValue;
    }
  ) {
    return this._session.model.telegramIntakeSession.update({
      where: {
        id,
      },
      data,
    });
  }
}
