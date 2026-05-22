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
}
