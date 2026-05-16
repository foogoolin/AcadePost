import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ExternalAgent } from '@prisma/client';
import { AuthService } from '@gitroom/helpers/auth/auth.service';
import { makeId } from '@gitroom/nestjs-libraries/services/make.is';
import { ssrfSafeDispatcher } from '@gitroom/nestjs-libraries/dtos/webhooks/ssrf.safe.dispatcher';
import {
  EXTERNAL_AGENT_SCOPES,
  ExternalAgentDto,
} from '@gitroom/nestjs-libraries/dtos/external-agents/external.agents.dto';
import { ExternalAgentsRepository } from '@gitroom/nestjs-libraries/database/prisma/external-agents/external.agents.repository';
import { AgentRunsService } from '@gitroom/nestjs-libraries/database/prisma/agent-runs/agent.runs.service';

type ExternalAgentScope = (typeof EXTERNAL_AGENT_SCOPES)[number];

@Injectable()
export class ExternalAgentsService {
  constructor(
    private _externalAgentsRepository: ExternalAgentsRepository,
    private _agentRunsService: AgentRunsService
  ) {}

  async list(orgId: string) {
    return (await this._externalAgentsRepository.list(orgId)).map((agent) =>
      this.toPublicAgent(agent)
    );
  }

  async get(orgId: string, id: string) {
    const agent = await this._externalAgentsRepository.get(orgId, id);
    if (!agent) {
      throw new NotFoundException('Agent not found');
    }
    return agent;
  }

  async create(orgId: string, body: ExternalAgentDto) {
    const secret = body.secret || makeId(36);
    const agent = await this._externalAgentsRepository.create(
      orgId,
      this.normalizeBody(body),
      AuthService.fixedEncryption(secret)
    );

    return {
      ...this.toPublicAgent(agent),
      secret,
    };
  }

  async update(orgId: string, id: string, body: ExternalAgentDto) {
    await this.get(orgId, id);
    const encryptedSecret = body.secret
      ? AuthService.fixedEncryption(body.secret)
      : undefined;
    const agent = await this._externalAgentsRepository.update(
      orgId,
      id,
      this.normalizeBody(body),
      encryptedSecret
    );

    return {
      ...this.toPublicAgent(agent),
      ...(body.secret ? { secret: body.secret } : {}),
    };
  }

  delete(orgId: string, id: string) {
    return this._externalAgentsRepository.delete(orgId, id);
  }

  async test(orgId: string, id: string, payload?: Record<string, any>) {
    const agent = await this.get(orgId, id);
    const run = await this._agentRunsService.create(orgId, {
      externalAgentId: id,
      mode: 'test',
      status: 'running',
      input: payload || {},
    });

    try {
      const result = await this.callWebhook(agent, {
        event: 'acadepost.agent.test',
        runId: run.id,
        payload: payload || {},
      });
      await this._agentRunsService.update(orgId, run.id, {
        status: 'success',
        output: result,
      });
      return { ok: true, runId: run.id, output: result };
    } catch (error: any) {
      await this._agentRunsService.update(orgId, run.id, {
        status: 'error',
        error: error?.message || 'Webhook test failed',
      });
      throw new BadRequestException(error?.message || 'Webhook test failed');
    }
  }

  async verify(
    orgId: string,
    id: string,
    secret: string | undefined,
    requiredScopes: ExternalAgentScope[] = []
  ) {
    if (!id || !secret) {
      throw new BadRequestException('externalAgentId and secret are required');
    }

    const agent = await this.get(orgId, id);
    if (!agent.enabled) {
      throw new BadRequestException('Agent is disabled');
    }

    if (AuthService.fixedEncryption(secret) !== agent.secret) {
      throw new BadRequestException('Invalid agent secret');
    }

    const scopes = this.getScopes(agent);
    const missing = requiredScopes.filter((scope) => !scopes.includes(scope));
    if (missing.length) {
      throw new BadRequestException(`Missing agent scope: ${missing.join(', ')}`);
    }

    return agent;
  }

  scopesForMode(mode: 'draft' | 'proposal' | 'schedule' | 'now') {
    if (mode === 'now') {
      return ['posts:write', 'posts:publish'] as ExternalAgentScope[];
    }
    if (mode === 'schedule') {
      return ['posts:write', 'posts:schedule'] as ExternalAgentScope[];
    }
    return ['posts:write'] as ExternalAgentScope[];
  }

  private async callWebhook(agent: ExternalAgent, payload: Record<string, any>) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    let response: Response;
    try {
      response = await fetch(agent.webhookUrl, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-acadepost-agent-id': agent.id,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
        // @ts-ignore undici dispatcher is not part of lib.dom fetch types.
        dispatcher: ssrfSafeDispatcher,
      });
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        throw new Error('Webhook request timed out');
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }

    const text = await response.text();
    let body: any = text;
    try {
      body = text ? JSON.parse(text) : {};
    } catch {}

    if (!response.ok) {
      throw new Error(
        typeof body === 'string'
          ? body
          : body?.message || `Webhook returned ${response.status}`
      );
    }

    return body;
  }

  private normalizeBody(body: ExternalAgentDto) {
    const accessMode = body.accessMode || 'human_in_the_loop';
    const requestedScopes = body.scopes?.length
      ? body.scopes
      : (['posts:write', 'templates:read'] as ExternalAgentScope[]);
    const scopes =
      accessMode === 'human_in_the_loop'
        ? requestedScopes.filter(
            (scope) => scope !== 'posts:schedule' && scope !== 'posts:publish'
          )
        : requestedScopes;

    return {
      ...body,
      accessMode,
      scopes,
    };
  }

  private getScopes(agent: ExternalAgent) {
    return Array.isArray(agent.scopes)
      ? (agent.scopes as ExternalAgentScope[])
      : [];
  }

  private toPublicAgent(agent: ExternalAgent) {
    const { secret, ...rest } = agent;
    return {
      ...rest,
      scopes: this.getScopes(agent),
      hasSecret: Boolean(secret),
    };
  }
}
