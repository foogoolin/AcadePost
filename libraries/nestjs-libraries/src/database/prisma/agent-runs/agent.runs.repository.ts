import { Injectable } from '@nestjs/common';
import { PrismaRepository } from '@gitroom/nestjs-libraries/database/prisma/prisma.service';

@Injectable()
export class AgentRunsRepository {
  constructor(private _agentRun: PrismaRepository<'agentRun'>) {}

  create(orgId: string, data: {
    externalAgentId?: string;
    mode: string;
    status?: string;
    input?: Record<string, any>;
    output?: Record<string, any>;
    error?: string;
  }) {
    return this._agentRun.model.agentRun.create({
      data: {
        organizationId: orgId,
        externalAgentId: data.externalAgentId || null,
        mode: data.mode,
        status: data.status || 'created',
        input: data.input || {},
        output: data.output || {},
        error: data.error || null,
      },
    });
  }

  get(orgId: string, id: string) {
    return this._agentRun.model.agentRun.findFirst({
      where: {
        id,
        organizationId: orgId,
      },
      include: {
        externalAgent: {
          select: {
            id: true,
            name: true,
            accessMode: true,
          },
        },
        posts: {
          select: {
            id: true,
            state: true,
            publishDate: true,
            integrationId: true,
            requiresApproval: true,
            agentStatus: true,
          },
        },
      },
    });
  }

  update(orgId: string, id: string, data: {
    status?: string;
    output?: Record<string, any>;
    error?: string;
  }) {
    return this._agentRun.model.agentRun.update({
      where: {
        id,
        organizationId: orgId,
      },
      data: {
        ...(data.status ? { status: data.status } : {}),
        ...(data.output ? { output: data.output } : {}),
        ...(data.error ? { error: data.error } : {}),
      },
    });
  }
}
