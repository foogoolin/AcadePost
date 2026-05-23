import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import crypto from 'crypto';
import { ProviderCredential } from '@prisma/client';
import { ProviderCredentialsRepository } from '@gitroom/nestjs-libraries/database/prisma/provider-credentials/provider.credentials.repository';
import { ProviderLogsService } from '@gitroom/nestjs-libraries/database/prisma/provider-logs/provider.logs.service';
import {
  ProviderCredentialDto,
  ProviderCredentialIdentifier,
  ProviderCredentialTestPostDto,
} from '@gitroom/nestjs-libraries/dtos/provider-credentials/provider.credentials.dto';
import {
  PROVIDER_CREDENTIAL_DEFINITION_MAP,
  PROVIDER_CREDENTIAL_DEFINITIONS,
  PROVIDER_CREDENTIAL_LOOKUP,
} from '@gitroom/nestjs-libraries/database/prisma/provider-credentials/provider.credentials.registry';
import { IntegrationRepository } from '@gitroom/nestjs-libraries/database/prisma/integrations/integration.repository';
import { IntegrationManager } from '@gitroom/nestjs-libraries/integrations/integration.manager';
import { PostResponse } from '@gitroom/nestjs-libraries/integrations/social/social.integrations.interface';
import type { MediaContent } from '@gitroom/nestjs-libraries/integrations/social/social.integrations.interface';
import {
  fallbackProviderOperationId,
  getExplicitProviderOperationId,
} from '@gitroom/nestjs-libraries/integrations/provider.operations';
import { resolveTelegramOperation } from '@gitroom/nestjs-libraries/integrations/social/telegram.operations';

type EncryptedPayload = {
  v: 1;
  alg: 'aes-256-gcm';
  iv: string;
  tag: string;
  data: string;
};

export type ProviderRuntimeCredentials = {
  credentialId?: string;
  providerIdentifier: string;
  fields: Record<string, string>;
  source: 'database' | 'environment';
};

@Injectable()
export class ProviderCredentialsService {
  constructor(
    private _providerCredentialsRepository: ProviderCredentialsRepository,
    private _integrationRepository: IntegrationRepository,
    private _integrationManager: IntegrationManager,
    @Optional()
    private _providerLogsService?: ProviderLogsService
  ) {}

  list(orgId: string) {
    return this._providerCredentialsRepository
      .list(orgId)
      .then((items) => items.map((item) => this.toPublic(item)));
  }

  providers(publicUrl?: string) {
    return {
      credentialsEnabled: Boolean(this.getEncryptionKey()),
      publicUrl: this.publicUrl(publicUrl),
      providers: PROVIDER_CREDENTIAL_DEFINITIONS.map((definition) => ({
        ...definition,
        setup: this.createSetup(definition.identifier, publicUrl),
      })),
    };
  }

  async get(orgId: string, id: string) {
    const credential = await this._providerCredentialsRepository.get(orgId, id);
    if (!credential) {
      throw new NotFoundException('Credential not found');
    }
    return this.toPublic(credential);
  }

  async create(orgId: string, body: ProviderCredentialDto) {
    const normalized = this.normalizeFields(body);
    const encryptedData = this.encrypt(
      orgId,
      body.providerIdentifier,
      normalized
    );
    const credential = await this._providerCredentialsRepository.create(
      orgId,
      {
        ...body,
        name: body.name.trim(),
      },
      encryptedData,
      this.maskFields(body.providerIdentifier, normalized)
    );

    return this.toPublic(credential);
  }

  async update(orgId: string, id: string, body: ProviderCredentialDto) {
    const existing = await this._providerCredentialsRepository.get(orgId, id);
    if (!existing) {
      throw new NotFoundException('Credential not found');
    }

    const currentFields = this.decrypt(
      orgId,
      existing.providerIdentifier,
      existing.encryptedData
    );
    const normalized = this.normalizeFields(body, currentFields);
    const encryptedData = this.encrypt(
      orgId,
      body.providerIdentifier,
      normalized
    );
    const credential = await this._providerCredentialsRepository.update(
      orgId,
      id,
      {
        ...body,
        name: body.name.trim(),
      },
      encryptedData,
      this.maskFields(body.providerIdentifier, normalized)
    );

    return this.toPublic(credential);
  }

  async delete(orgId: string, id: string) {
    await this.get(orgId, id);
    return this._providerCredentialsRepository.delete(orgId, id);
  }

  async test(orgId: string, id: string) {
    const credential = await this._providerCredentialsRepository.get(orgId, id);
    if (!credential) {
      throw new NotFoundException('Credential not found');
    }

    const startedAt = Date.now();
    const providerIdentifier =
      credential.providerIdentifier as ProviderCredentialIdentifier;

    try {
      const fields = this.decrypt(
        orgId,
        credential.providerIdentifier,
        credential.encryptedData
      );
      this.validateRequired(providerIdentifier, fields);
      const providerResponse = await this.testCredentialConnection(
        providerIdentifier,
        fields
      );
      const updated = await this._providerCredentialsRepository.markTested(
        orgId,
        id,
        'configured'
      );

      await this.writeConnectionLog({
        orgId,
        providerIdentifier,
        providerCredentialId: id,
        action: 'credential.test',
        status: 'success',
        startedAt,
        requestSummary: {
          credentialId: id,
          providerIdentifier,
        },
        responseSummary: {
          status: 'configured',
          providerResponse,
        },
      });

      return {
        ok: true,
        status: 'configured',
        credential: this.toPublic(updated),
      };
    } catch (error: any) {
      await this.writeConnectionLog({
        orgId,
        providerIdentifier,
        providerCredentialId: id,
        action: 'credential.test',
        status: 'failed',
        startedAt,
        requestSummary: {
          credentialId: id,
          providerIdentifier,
        },
        errorSummary: error,
      });
      throw error;
    }
  }

  async testPost(
    orgId: string,
    id: string,
    body?: ProviderCredentialTestPostDto
  ) {
    if (!body?.integrationId) {
      throw new BadRequestException('Destination is required');
    }

    const credential = await this._providerCredentialsRepository.get(orgId, id);
    if (!credential || !credential.enabled) {
      throw new NotFoundException('Credential not found');
    }

    const integration = await this._integrationRepository.getIntegrationById(
      orgId,
      body.integrationId
    );
    if (!integration || integration.deletedAt) {
      throw new NotFoundException('Destination not found');
    }
    if (integration.disabled || integration.refreshNeeded) {
      throw new BadRequestException('Destination is not ready');
    }

    const lookup = this.lookupFor(integration.providerIdentifier);
    if (!lookup.includes(credential.providerIdentifier as any)) {
      throw new BadRequestException(
        'Credential does not match destination provider'
      );
    }

    const provider = this._integrationManager.getSocialIntegration(
      integration.providerIdentifier
    );
    const message =
      typeof body?.message === 'string' && body.message.trim()
        ? body.message.trim()
        : `AcadéPost test post ${new Date().toISOString()}`;
    const mediaUrls = [
      ...(Array.isArray(body?.mediaUrls) ? body.mediaUrls : []),
      ...(typeof body?.imageUrl === 'string' ? [body.imageUrl] : []),
    ]
      .map((url) => (typeof url === 'string' ? url.trim() : ''))
      .filter(Boolean);
    const media: MediaContent[] = mediaUrls.map((path) => ({
      type: 'image',
      path,
    }));
    const postDetails = [
      {
        id: `provider-test-${Date.now()}`,
        message,
        settings: {
          providerOperation: body?.operationId
            ? {
                operationId: body.operationId,
                source: 'test-post',
              }
            : undefined,
        },
        media,
      },
    ];
    const operationId = this.resolveTestPostOperationId(
      integration.providerIdentifier,
      postDetails[0]
    );
    const startedAt = Date.now();
    const attempt = await this.createTestPostAttempt({
      orgId,
      providerIdentifier: integration.providerIdentifier,
      providerCredentialId: id,
      integrationId: integration.id,
      operationId,
      message,
      mediaCount: media.length,
      startedAt,
    });

    try {
      const clientInformation = await this.resolveClientInformationByCredentialId(
        orgId,
        integration.providerIdentifier,
        id
      );
      const response = (await (provider as any).post(
        integration.internalId,
        integration.token,
        postDetails,
        integration,
        clientInformation
      )) as PostResponse[];

      await this.completeTestPostAttempt(attempt?.id, {
        status: 'completed',
        response,
        startedAt,
      });
      await this._providerCredentialsRepository.markUsed(orgId, id);

      const firstResponse = response?.[0];
      return {
        ok: true,
        status: firstResponse?.status || 'completed',
        releaseId: firstResponse?.postId,
        releaseURL: firstResponse?.releaseURL,
        response,
      };
    } catch (error) {
      await this.completeTestPostAttempt(attempt?.id, {
        status: 'failed',
        error,
        startedAt,
      });
      throw error;
    }
  }

  async resolveRuntimeCredentials(
    orgId: string | undefined,
    providerIdentifier: string
  ): Promise<ProviderRuntimeCredentials | undefined> {
    const lookup = this.lookupFor(providerIdentifier);

    if (orgId && this.getEncryptionKey()) {
      const credential =
        await this._providerCredentialsRepository.getActiveForProvider(
          orgId,
          lookup
        );
      if (credential) {
        const fields = this.decrypt(
          orgId,
          credential.providerIdentifier,
          credential.encryptedData
        );
        await this._providerCredentialsRepository.markUsed(
          orgId,
          credential.id
        );
        return {
          credentialId: credential.id,
          providerIdentifier: credential.providerIdentifier,
          fields,
          source: 'database',
        };
      }
    }

    const envFields = this.resolveEnvironmentFields(lookup);
    if (envFields) {
      return {
        providerIdentifier,
        fields: envFields,
        source: 'environment',
      };
    }

    return undefined;
  }

  async resolveClientInformation(
    orgId: string | undefined,
    providerIdentifier: string
  ) {
    const credentials = await this.resolveRuntimeCredentials(
      orgId,
      providerIdentifier
    );

    return credentials
      ? this.clientInformationFromRuntimeCredentials(credentials)
      : undefined;
  }

  async resolveClientInformationByCredentialId(
    orgId: string,
    providerIdentifier: string,
    credentialId: string
  ) {
    const credential = await this._providerCredentialsRepository.get(
      orgId,
      credentialId
    );
    if (!credential || !credential.enabled) {
      throw new NotFoundException('Credential not found');
    }

    const lookup = this.lookupFor(providerIdentifier);
    if (!lookup.includes(credential.providerIdentifier as any)) {
      throw new BadRequestException('Credential does not match provider');
    }

    const fields = this.decrypt(
      orgId,
      credential.providerIdentifier,
      credential.encryptedData
    );

    return this.clientInformationFromRuntimeCredentials({
      credentialId: credential.id,
      providerIdentifier: credential.providerIdentifier,
      fields,
      source: 'database',
    });
  }

  private clientInformationFromRuntimeCredentials(
    credentials: ProviderRuntimeCredentials
  ) {
    return {
      credentialId: credentials.credentialId || '',
      credentialSource: credentials.source,
      client_id:
        credentials.fields.clientId ||
        credentials.fields.appId ||
        credentials.fields.apiKey ||
        '',
      client_secret:
        credentials.fields.clientSecret ||
        credentials.fields.appSecret ||
        credentials.fields.apiSecret ||
        credentials.fields.apiKey ||
        '',
      instanceUrl: credentials.fields.instanceUrl || '',
      ...credentials.fields,
    };
  }

  private normalizeFields(
    body: ProviderCredentialDto,
    existingFields: Record<string, string> = {}
  ) {
    const definition = PROVIDER_CREDENTIAL_DEFINITION_MAP.get(
      body.providerIdentifier
    );
    if (!definition) {
      throw new BadRequestException('Provider is not supported');
    }

    const fields = definition.fields.reduce<Record<string, string>>(
      (all, field) => {
        const incoming = body.fields?.[field.key];
        const value =
          typeof incoming === 'string' && incoming.trim()
            ? incoming.trim()
            : existingFields[field.key] || '';
        return {
          ...all,
          [field.key]: value,
        };
      },
      {}
    );

    this.validateRequired(body.providerIdentifier, fields);
    return fields;
  }

  private validateRequired(
    providerIdentifier: ProviderCredentialIdentifier,
    fields: Record<string, string>
  ) {
    const definition =
      PROVIDER_CREDENTIAL_DEFINITION_MAP.get(providerIdentifier);
    if (!definition) {
      throw new BadRequestException('Provider is not supported');
    }

    const missing = definition.fields
      .filter((field) => field.required && !fields[field.key])
      .map((field) => field.label);

    if (missing.length) {
      throw new BadRequestException(
        `Missing credential fields: ${missing.join(', ')}`
      );
    }
  }

  private resolveEnvironmentFields(providerIdentifiers: string[]) {
    for (const providerIdentifier of providerIdentifiers) {
      const definition = PROVIDER_CREDENTIAL_DEFINITION_MAP.get(
        providerIdentifier as ProviderCredentialIdentifier
      );
      if (!definition) {
        continue;
      }

      const fields = definition.fields.reduce<Record<string, string>>(
        (all, field) => ({
          ...all,
          [field.key]: field.env ? process.env[field.env] || '' : '',
        }),
        {}
      );

      const hasRequired = definition.fields
        .filter((field) => field.required)
        .every((field) => Boolean(fields[field.key]));
      if (hasRequired) {
        return fields;
      }
    }

    return undefined;
  }

  private async testCredentialConnection(
    providerIdentifier: ProviderCredentialIdentifier,
    fields: Record<string, string>
  ): Promise<unknown | undefined> {
    try {
      switch (providerIdentifier) {
        case 'telegram':
          const { TelegramProvider } = await import(
            '@gitroom/nestjs-libraries/integrations/social/telegram.provider'
          );
          return new TelegramProvider().getBotConfiguration(
            this.clientInformationFromRuntimeCredentials({
              providerIdentifier,
              fields,
              source: 'database',
            })
          );
        default:
          return undefined;
      }
    } catch (error: any) {
      throw new BadRequestException(
        error?.message
          ? `Credential test failed: ${error.message}`
          : 'Credential test failed'
      );
    }
  }

  private resolveTestPostOperationId(
    providerIdentifier: string,
    postDetails: {
      message?: string;
      settings?: any;
      media?: any[];
      operation?: unknown;
    }
  ) {
    if (providerIdentifier === 'telegram') {
      try {
        return resolveTelegramOperation(postDetails).id;
      } catch {
        return (
          getExplicitProviderOperationId(postDetails) ||
          fallbackProviderOperationId(providerIdentifier)
        );
      }
    }

    return (
      getExplicitProviderOperationId(postDetails) ||
      fallbackProviderOperationId(providerIdentifier)
    );
  }

  private async createTestPostAttempt(input: {
    orgId: string;
    providerIdentifier: string;
    providerCredentialId: string;
    integrationId: string;
    operationId: string;
    message: string;
    mediaCount: number;
    startedAt: number;
  }) {
    if (!this._providerLogsService) {
      return undefined;
    }

    try {
      return await this._providerLogsService.createPublishAttempt({
        organizationId: input.orgId,
        integrationId: input.integrationId,
        providerCredentialId: input.providerCredentialId,
        providerIdentifier: input.providerIdentifier,
        operationId: input.operationId,
        status: 'started',
        startedAt: new Date(input.startedAt),
        requestSummary: {
          action: 'test-post',
          messageLength: input.message.length,
          mediaCount: input.mediaCount,
        },
      });
    } catch {
      return undefined;
    }
  }

  private async completeTestPostAttempt(
    attemptId: string | undefined,
    input: {
      status: 'completed' | 'failed';
      response?: Array<{
        postId?: string;
        releaseURL?: string;
        status?: string;
      }>;
      error?: unknown;
      startedAt: number;
    }
  ) {
    if (!this._providerLogsService || !attemptId) {
      return;
    }

    try {
      const firstResponse = input.response?.[0];
      await this._providerLogsService.updatePublishAttempt(attemptId, {
        status: input.status,
        providerStatus: firstResponse?.status || input.status,
        responseSummary: input.response?.map((response) => ({
          postId: response.postId,
          releaseURL: response.releaseURL,
          status: response.status,
        })),
        error: input.error,
        releaseId: firstResponse?.postId,
        releaseURL: firstResponse?.releaseURL,
        durationMs: Date.now() - input.startedAt,
        completedAt: new Date(),
      });
    } catch {
      return;
    }
  }

  private async writeConnectionLog(input: {
    orgId: string;
    providerIdentifier: string;
    providerCredentialId: string;
    action: string;
    status: string;
    startedAt: number;
    requestSummary?: unknown;
    responseSummary?: unknown;
    errorSummary?: unknown;
  }) {
    if (!this._providerLogsService) {
      return;
    }

    try {
      await this._providerLogsService.recordConnectionLog({
        organizationId: input.orgId,
        providerIdentifier: input.providerIdentifier,
        providerCredentialId: input.providerCredentialId,
        action: input.action,
        status: input.status,
        requestSummary: input.requestSummary,
        responseSummary: input.responseSummary,
        error: input.errorSummary,
        durationMs: Date.now() - input.startedAt,
      });
    } catch {
      // Connection log writes must never block credential validation.
    }
  }

  private encrypt(
    orgId: string,
    providerIdentifier: string,
    fields: Record<string, string>
  ) {
    const key = this.getEncryptionKey();
    if (!key) {
      throw new BadRequestException(
        'Credentials encryption key is not configured'
      );
    }

    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    cipher.setAAD(Buffer.from(`${orgId}:${providerIdentifier}`));
    const encrypted = Buffer.concat([
      cipher.update(JSON.stringify(fields), 'utf8'),
      cipher.final(),
    ]);
    const payload: EncryptedPayload = {
      v: 1,
      alg: 'aes-256-gcm',
      iv: iv.toString('base64'),
      tag: cipher.getAuthTag().toString('base64'),
      data: encrypted.toString('base64'),
    };
    return JSON.stringify(payload);
  }

  private decrypt(
    orgId: string,
    providerIdentifier: string,
    encryptedData: string
  ): Record<string, string> {
    const key = this.getEncryptionKey();
    if (!key) {
      throw new BadRequestException(
        'Credentials encryption key is not configured'
      );
    }

    const payload = JSON.parse(encryptedData) as EncryptedPayload;
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      key,
      Buffer.from(payload.iv, 'base64')
    );
    decipher.setAAD(Buffer.from(`${orgId}:${providerIdentifier}`));
    decipher.setAuthTag(Buffer.from(payload.tag, 'base64'));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(payload.data, 'base64')),
      decipher.final(),
    ]);
    return JSON.parse(decrypted.toString('utf8'));
  }

  private getEncryptionKey() {
    const value = (
      process.env.ACADEPOST_CREDENTIALS_ENCRYPTION_KEY || ''
    ).trim();
    if (
      !value ||
      value.includes('change-me') ||
      value.includes('change-this') ||
      value.includes('CHANGE_ME')
    ) {
      return undefined;
    }

    if (/^[0-9a-f]{64}$/i.test(value)) {
      return Buffer.from(value, 'hex');
    }

    const base64 = Buffer.from(value, 'base64');
    if (base64.length === 32 && base64.toString('base64') === value) {
      return base64;
    }

    return undefined;
  }

  private maskFields(
    providerIdentifier: ProviderCredentialIdentifier,
    fields: Record<string, string>
  ) {
    const definition =
      PROVIDER_CREDENTIAL_DEFINITION_MAP.get(providerIdentifier);
    return (definition?.fields || []).reduce<Record<string, any>>(
      (all, field) => {
        const value = fields[field.key] || '';
        return {
          ...all,
          [field.key]: {
            label: field.label,
            type: field.type,
            hasValue: Boolean(value),
            masked: value ? `********${value.slice(-4)}` : '',
          },
        };
      },
      {}
    );
  }

  private toPublic(credential: ProviderCredential) {
    const { encryptedData, ...rest } = credential;
    return {
      ...rest,
      hasEncryptedData: Boolean(encryptedData),
    };
  }

  private lookupFor(providerIdentifier: string) {
    return (
      PROVIDER_CREDENTIAL_LOOKUP[
        providerIdentifier as ProviderCredentialIdentifier
      ] || [providerIdentifier as ProviderCredentialIdentifier]
    );
  }

  private publicUrl(publicUrl?: string) {
    const value = (
      publicUrl ||
      process.env.FRONTEND_URL ||
      process.env.MAIN_URL ||
      'https://your-domain.example'
    ).replace(/\/+$/, '');
    return /^https?:\/\//i.test(value) ? value : `https://${value}`;
  }

  private createSetup(
    providerIdentifier: ProviderCredentialIdentifier,
    publicUrl?: string
  ) {
    const base = this.publicUrl(publicUrl);
    const redirectUri = `${base}/integrations/social/${providerIdentifier}`;
    const apiBaseUrl = `${base}/api`;

    return {
      appDomain: new URL(base).hostname,
      websiteUrl: base,
      apiBaseUrl,
      redirectUri,
      oauthRedirectUris: [redirectUri],
      deauthorizeCallbackUrl: `${apiBaseUrl}/oauth/deauthorize`,
      dataDeletionRequestUrl: `${apiBaseUrl}/oauth/data-deletion`,
      policyStatus: 'later',
    };
  }
}
