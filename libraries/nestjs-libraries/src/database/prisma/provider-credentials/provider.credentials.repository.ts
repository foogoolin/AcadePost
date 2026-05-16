import { Injectable } from '@nestjs/common';
import { PrismaRepository } from '@gitroom/nestjs-libraries/database/prisma/prisma.service';
import { ProviderCredentialDto } from '@gitroom/nestjs-libraries/dtos/provider-credentials/provider.credentials.dto';

@Injectable()
export class ProviderCredentialsRepository {
  constructor(private _providerCredential: PrismaRepository<'providerCredential'>) {}

  list(orgId: string) {
    return this._providerCredential.model.providerCredential.findMany({
      where: {
        organizationId: orgId,
        deletedAt: null,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }

  get(orgId: string, id: string) {
    return this._providerCredential.model.providerCredential.findFirst({
      where: {
        id,
        organizationId: orgId,
        deletedAt: null,
      },
    });
  }

  getActiveForProvider(orgId: string, providerIdentifiers: string[]) {
    return this._providerCredential.model.providerCredential.findFirst({
      where: {
        organizationId: orgId,
        providerIdentifier: {
          in: providerIdentifiers,
        },
        enabled: true,
        deletedAt: null,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }

  create(
    orgId: string,
    body: ProviderCredentialDto,
    encryptedData: string,
    maskedData: Record<string, any>
  ) {
    return this._providerCredential.model.providerCredential.create({
      data: {
        organizationId: orgId,
        providerIdentifier: body.providerIdentifier,
        name: body.name,
        encryptedData,
        maskedData,
        enabled: body.enabled ?? true,
        status: 'active',
      },
    });
  }

  update(
    orgId: string,
    id: string,
    body: ProviderCredentialDto,
    encryptedData: string,
    maskedData: Record<string, any>
  ) {
    return this._providerCredential.model.providerCredential.update({
      where: {
        id,
        organizationId: orgId,
      },
      data: {
        providerIdentifier: body.providerIdentifier,
        name: body.name,
        encryptedData,
        maskedData,
        enabled: body.enabled ?? true,
        status: 'active',
      },
    });
  }

  markTested(orgId: string, id: string, status: string) {
    return this._providerCredential.model.providerCredential.update({
      where: {
        id,
        organizationId: orgId,
      },
      data: {
        status,
        lastTestedAt: new Date(),
      },
    });
  }

  markUsed(orgId: string, id: string) {
    return this._providerCredential.model.providerCredential.update({
      where: {
        id,
        organizationId: orgId,
      },
      data: {
        lastUsedAt: new Date(),
      },
    });
  }

  delete(orgId: string, id: string) {
    return this._providerCredential.model.providerCredential.update({
      where: {
        id,
        organizationId: orgId,
      },
      data: {
        deletedAt: new Date(),
        enabled: false,
      },
    });
  }
}
