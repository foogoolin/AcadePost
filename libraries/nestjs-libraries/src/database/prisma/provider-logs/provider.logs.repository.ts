import { Injectable } from '@nestjs/common';
import { PrismaRepository } from '@gitroom/nestjs-libraries/database/prisma/prisma.service';

export type ProviderConnectionLogCreateInput = {
  organizationId: string;
  providerIdentifier: string;
  providerCredentialId?: string;
  action: string;
  status: string;
  requestSummary?: unknown;
  responseSummary?: unknown;
  errorSummary?: unknown;
  durationMs?: number;
};

export type ProviderPublishAttemptCreateInput = {
  organizationId: string;
  integrationId?: string;
  postId?: string;
  providerCredentialId?: string;
  providerIdentifier: string;
  operationId: string;
  status?: string;
  providerStatus?: string;
  requestSummary?: unknown;
  responseSummary?: unknown;
  errorSummary?: unknown;
  releaseId?: string;
  releaseURL?: string;
  durationMs?: number;
  startedAt?: Date;
  completedAt?: Date;
};

export type ProviderPublishAttemptUpdateInput = Partial<
  Omit<
    ProviderPublishAttemptCreateInput,
    'organizationId' | 'integrationId' | 'postId' | 'providerCredentialId' | 'providerIdentifier' | 'operationId'
  >
>;

export type ProviderLogsListInput = {
  organizationId: string;
  page?: number;
  limit?: number;
  providerIdentifier?: string;
  status?: string;
};

export type ProviderConnectionLogsListInput = ProviderLogsListInput & {
  providerCredentialId?: string;
};

export type ProviderPublishAttemptsListInput = ProviderLogsListInput & {
  integrationId?: string;
  providerCredentialId?: string;
  postId?: string;
  operationId?: string;
};

@Injectable()
export class ProviderLogsRepository {
  constructor(
    private _providerLogs: PrismaRepository<
      'providerConnectionLog' | 'providerPublishAttempt'
    >
  ) {}

  createConnectionLog(data: ProviderConnectionLogCreateInput) {
    return this._providerLogs.model.providerConnectionLog.create({
      data: this.withoutUndefined({
        organizationId: data.organizationId,
        providerIdentifier: data.providerIdentifier,
        providerCredentialId: data.providerCredentialId,
        action: data.action,
        status: data.status,
        requestSummary: data.requestSummary,
        responseSummary: data.responseSummary,
        errorSummary: data.errorSummary,
        durationMs: data.durationMs,
      }) as any,
    });
  }

  createPublishAttempt(data: ProviderPublishAttemptCreateInput) {
    return this._providerLogs.model.providerPublishAttempt.create({
      data: this.withoutUndefined({
        organizationId: data.organizationId,
        integrationId: data.integrationId,
        postId: data.postId,
        providerCredentialId: data.providerCredentialId,
        providerIdentifier: data.providerIdentifier,
        operationId: data.operationId,
        status: data.status,
        providerStatus: data.providerStatus,
        requestSummary: data.requestSummary,
        responseSummary: data.responseSummary,
        errorSummary: data.errorSummary,
        releaseId: data.releaseId,
        releaseURL: data.releaseURL,
        durationMs: data.durationMs,
        startedAt: data.startedAt,
        completedAt: data.completedAt,
      }) as any,
    });
  }

  updatePublishAttempt(id: string, data: ProviderPublishAttemptUpdateInput) {
    return this._providerLogs.model.providerPublishAttempt.update({
      where: {
        id,
      },
      data: this.withoutUndefined({
        status: data.status,
        providerStatus: data.providerStatus,
        responseSummary: data.responseSummary,
        errorSummary: data.errorSummary,
        releaseId: data.releaseId,
        releaseURL: data.releaseURL,
        durationMs: data.durationMs,
        completedAt: data.completedAt,
      }) as any,
    });
  }

  async listConnectionLogs(input: ProviderConnectionLogsListInput) {
    const page = this.page(input.page);
    const limit = this.limit(input.limit);
    const skip = page * limit;
    const where = this.withoutUndefined({
      organizationId: input.organizationId,
      providerIdentifier: input.providerIdentifier,
      providerCredentialId: input.providerCredentialId,
      status: input.status,
    });

    const [items, total] = await Promise.all([
      this._providerLogs.model.providerConnectionLog.findMany({
        where: where as any,
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
        include: {
          providerCredential: {
            select: {
              id: true,
              name: true,
              providerIdentifier: true,
              status: true,
              enabled: true,
            },
          },
        },
      }),
      this._providerLogs.model.providerConnectionLog.count({
        where: where as any,
      }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      hasMore: skip + items.length < total,
    };
  }

  async listPublishAttempts(input: ProviderPublishAttemptsListInput) {
    const page = this.page(input.page);
    const limit = this.limit(input.limit);
    const skip = page * limit;
    const where = this.withoutUndefined({
      organizationId: input.organizationId,
      providerIdentifier: input.providerIdentifier,
      integrationId: input.integrationId,
      postId: input.postId,
      providerCredentialId: input.providerCredentialId,
      operationId: input.operationId,
      status: input.status,
    });

    const [items, total] = await Promise.all([
      this._providerLogs.model.providerPublishAttempt.findMany({
        where: where as any,
        orderBy: {
          startedAt: 'desc',
        },
        skip,
        take: limit,
        include: {
          integration: {
            select: {
              id: true,
              name: true,
              providerIdentifier: true,
              profile: true,
              disabled: true,
            },
          },
          providerCredential: {
            select: {
              id: true,
              name: true,
              providerIdentifier: true,
              status: true,
              enabled: true,
            },
          },
          post: {
            select: {
              id: true,
              state: true,
              publishDate: true,
              releaseURL: true,
              error: true,
            },
          },
        },
      }),
      this._providerLogs.model.providerPublishAttempt.count({
        where: where as any,
      }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      hasMore: skip + items.length < total,
    };
  }

  private withoutUndefined(values: Record<string, unknown>) {
    return Object.entries(values).reduce<Record<string, unknown>>(
      (all, [key, value]) => {
        if (value !== undefined) {
          all[key] = value;
        }
        return all;
      },
      {}
    );
  }

  private page(page?: number) {
    if (!Number.isFinite(page)) {
      return 0;
    }
    return Math.max(0, Math.floor(page || 0));
  }

  private limit(limit?: number) {
    if (!Number.isFinite(limit)) {
      return 20;
    }
    return Math.min(Math.max(1, Math.floor(limit || 20)), 100);
  }
}
