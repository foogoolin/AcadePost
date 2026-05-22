import { Injectable } from '@nestjs/common';
import {
  ProviderConnectionLogCreateInput,
  ProviderLogsRepository,
  ProviderPublishAttemptCreateInput,
  ProviderPublishAttemptUpdateInput,
} from '@gitroom/nestjs-libraries/database/prisma/provider-logs/provider.logs.repository';
import {
  sanitizeProviderLogError,
  sanitizeProviderLogValue,
} from '@gitroom/nestjs-libraries/database/prisma/provider-logs/provider.logs.sanitizer';

export type ProviderConnectionLogInput = ProviderConnectionLogCreateInput & {
  error?: unknown;
};

export type ProviderPublishAttemptInput = ProviderPublishAttemptCreateInput & {
  error?: unknown;
};

export type ProviderPublishAttemptCompletionInput =
  ProviderPublishAttemptUpdateInput & {
    error?: unknown;
  };

@Injectable()
export class ProviderLogsService {
  constructor(private _providerLogsRepository: ProviderLogsRepository) {}

  recordConnectionLog(input: ProviderConnectionLogInput) {
    return this._providerLogsRepository.createConnectionLog({
      organizationId: input.organizationId,
      providerIdentifier: input.providerIdentifier,
      providerCredentialId: input.providerCredentialId,
      action: input.action,
      status: input.status,
      requestSummary: sanitizeProviderLogValue(input.requestSummary),
      responseSummary: sanitizeProviderLogValue(input.responseSummary),
      errorSummary: this.sanitizeErrorSummary(input.error, input.errorSummary),
      durationMs: this.duration(input.durationMs),
    });
  }

  createPublishAttempt(input: ProviderPublishAttemptInput) {
    return this._providerLogsRepository.createPublishAttempt({
      organizationId: input.organizationId,
      integrationId: input.integrationId,
      postId: input.postId,
      providerCredentialId: input.providerCredentialId,
      providerIdentifier: input.providerIdentifier,
      operationId: input.operationId,
      status: input.status || 'started',
      providerStatus: input.providerStatus,
      requestSummary: sanitizeProviderLogValue(input.requestSummary),
      responseSummary: sanitizeProviderLogValue(input.responseSummary),
      errorSummary: this.sanitizeErrorSummary(input.error, input.errorSummary),
      releaseId: input.releaseId,
      releaseURL: input.releaseURL,
      durationMs: this.duration(input.durationMs),
      startedAt: input.startedAt,
      completedAt: input.completedAt,
    });
  }

  updatePublishAttempt(id: string, input: ProviderPublishAttemptCompletionInput) {
    return this._providerLogsRepository.updatePublishAttempt(id, {
      status: input.status,
      providerStatus: input.providerStatus,
      responseSummary: sanitizeProviderLogValue(input.responseSummary),
      errorSummary: this.sanitizeErrorSummary(input.error, input.errorSummary),
      releaseId: input.releaseId,
      releaseURL: input.releaseURL,
      durationMs: this.duration(input.durationMs),
      completedAt: input.completedAt,
    });
  }

  private sanitizeErrorSummary(error?: unknown, fallback?: unknown) {
    if (error !== undefined) {
      return sanitizeProviderLogError(error);
    }
    return sanitizeProviderLogValue(fallback);
  }

  private duration(durationMs?: number) {
    if (durationMs === undefined) {
      return undefined;
    }
    if (!Number.isFinite(durationMs)) {
      return undefined;
    }
    return Math.max(0, Math.round(durationMs));
  }
}
