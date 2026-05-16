import { Injectable } from '@nestjs/common';
import { PrismaRepository } from '@gitroom/nestjs-libraries/database/prisma/prisma.service';
import { ExternalAgentDto } from '@gitroom/nestjs-libraries/dtos/external-agents/external.agents.dto';

@Injectable()
export class ExternalAgentsRepository {
  constructor(private _externalAgent: PrismaRepository<'externalAgent'>) {}

  list(orgId: string) {
    return this._externalAgent.model.externalAgent.findMany({
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
    return this._externalAgent.model.externalAgent.findFirst({
      where: {
        id,
        organizationId: orgId,
        deletedAt: null,
      },
    });
  }

  create(orgId: string, body: ExternalAgentDto, encryptedSecret: string) {
    return this._externalAgent.model.externalAgent.create({
      data: {
        organizationId: orgId,
        name: body.name,
        webhookUrl: body.webhookUrl,
        secret: encryptedSecret,
        accessMode: body.accessMode || 'human_in_the_loop',
        scopes: body.scopes || ['posts:write', 'templates:read'],
        enabled: body.enabled ?? true,
      },
    });
  }

  update(
    orgId: string,
    id: string,
    body: ExternalAgentDto,
    encryptedSecret?: string
  ) {
    return this._externalAgent.model.externalAgent.update({
      where: {
        id,
        organizationId: orgId,
      },
      data: {
        name: body.name,
        webhookUrl: body.webhookUrl,
        ...(encryptedSecret ? { secret: encryptedSecret } : {}),
        accessMode: body.accessMode || 'human_in_the_loop',
        scopes: body.scopes || ['posts:write', 'templates:read'],
        enabled: body.enabled ?? true,
      },
    });
  }

  delete(orgId: string, id: string) {
    return this._externalAgent.model.externalAgent.update({
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
