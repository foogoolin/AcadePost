import { Injectable } from '@nestjs/common';
import { AgentRunsRepository } from '@gitroom/nestjs-libraries/database/prisma/agent-runs/agent.runs.repository';

@Injectable()
export class AgentRunsService {
  constructor(private _agentRunsRepository: AgentRunsRepository) {}

  create(orgId: string, data: {
    externalAgentId?: string;
    mode: string;
    status?: string;
    input?: Record<string, any>;
    output?: Record<string, any>;
    error?: string;
  }) {
    return this._agentRunsRepository.create(orgId, data);
  }

  get(orgId: string, id: string) {
    return this._agentRunsRepository.get(orgId, id);
  }

  update(orgId: string, id: string, data: {
    status?: string;
    output?: Record<string, any>;
    error?: string;
  }) {
    return this._agentRunsRepository.update(orgId, id, data);
  }
}
