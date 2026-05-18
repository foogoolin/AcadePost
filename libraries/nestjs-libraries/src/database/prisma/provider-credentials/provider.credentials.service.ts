import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import crypto from 'crypto';
import { ProviderCredential } from '@prisma/client';
import { ProviderCredentialsRepository } from '@gitroom/nestjs-libraries/database/prisma/provider-credentials/provider.credentials.repository';
import {
  ProviderCredentialDto,
  ProviderCredentialIdentifier,
} from '@gitroom/nestjs-libraries/dtos/provider-credentials/provider.credentials.dto';
import {
  PROVIDER_CREDENTIAL_DEFINITION_MAP,
  PROVIDER_CREDENTIAL_DEFINITIONS,
  PROVIDER_CREDENTIAL_LOOKUP,
} from '@gitroom/nestjs-libraries/database/prisma/provider-credentials/provider.credentials.registry';

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
    private _providerCredentialsRepository: ProviderCredentialsRepository
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

    const fields = this.decrypt(
      orgId,
      credential.providerIdentifier,
      credential.encryptedData
    );
    this.validateRequired(credential.providerIdentifier as any, fields);
    await this.testCredentialConnection(
      credential.providerIdentifier as ProviderCredentialIdentifier,
      fields
    );
    const updated = await this._providerCredentialsRepository.markTested(
      orgId,
      id,
      'configured'
    );

    return {
      ok: true,
      status: 'configured',
      credential: this.toPublic(updated),
    };
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
  ) {
    try {
      switch (providerIdentifier) {
        case 'telegram':
          const { TelegramProvider } = await import(
            '@gitroom/nestjs-libraries/integrations/social/telegram.provider'
          );
          await new TelegramProvider().getBotConfiguration(
            this.clientInformationFromRuntimeCredentials({
              providerIdentifier,
              fields,
              source: 'database',
            })
          );
          break;
        default:
          break;
      }
    } catch (error: any) {
      throw new BadRequestException(
        error?.message
          ? `Credential test failed: ${error.message}`
          : 'Credential test failed'
      );
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
    const value = process.env.ACADEPOST_CREDENTIALS_ENCRYPTION_KEY || '';
    if (
      !value ||
      value.includes('change-this') ||
      value.includes('CHANGE_ME')
    ) {
      return undefined;
    }

    if (/^[0-9a-f]{64}$/i.test(value)) {
      return Buffer.from(value, 'hex');
    }

    const base64 = Buffer.from(value, 'base64');
    if (base64.length === 32) {
      return base64;
    }

    return crypto.createHash('sha256').update(value).digest();
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
