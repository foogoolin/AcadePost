import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Organization } from '@prisma/client';
import { GetOrgFromRequest } from '@gitroom/nestjs-libraries/user/org.from.request';
import { ExternalAgentsService } from '@gitroom/nestjs-libraries/database/prisma/external-agents/external.agents.service';
import {
  ExternalAgentDto,
  RunExternalAgentDto,
  UpdateExternalAgentDto,
} from '@gitroom/nestjs-libraries/dtos/external-agents/external.agents.dto';
import { CheckPolicies } from '@gitroom/backend/services/auth/permissions/permissions.ability';
import {
  AuthorizationActions,
  Sections,
} from '@gitroom/backend/services/auth/permissions/permission.exception.class';

@ApiTags('Agent Webhooks')
@Controller('/agent-webhooks')
export class AgentWebhooksController {
  constructor(private _externalAgentsService: ExternalAgentsService) {}

  @Get('/')
  list(@GetOrgFromRequest() org: Organization) {
    return this._externalAgentsService.list(org.id);
  }

  @Post('/')
  @CheckPolicies([AuthorizationActions.Create, Sections.ADMIN])
  create(
    @GetOrgFromRequest() org: Organization,
    @Body() body: ExternalAgentDto
  ) {
    return this._externalAgentsService.create(org.id, body);
  }

  @Put('/:id')
  @CheckPolicies([AuthorizationActions.Update, Sections.ADMIN])
  update(
    @GetOrgFromRequest() org: Organization,
    @Param('id') id: string,
    @Body() body: UpdateExternalAgentDto
  ) {
    return this._externalAgentsService.update(org.id, id, body);
  }

  @Delete('/:id')
  @CheckPolicies([AuthorizationActions.Delete, Sections.ADMIN])
  delete(@GetOrgFromRequest() org: Organization, @Param('id') id: string) {
    return this._externalAgentsService.delete(org.id, id);
  }

  @Post('/:id/test')
  test(
    @GetOrgFromRequest() org: Organization,
    @Param('id') id: string,
    @Body() body: RunExternalAgentDto
  ) {
    return this._externalAgentsService.test(org.id, id, body?.payload || {});
  }

  @Post('/:id/run')
  run(
    @GetOrgFromRequest() org: Organization,
    @Param('id') id: string,
    @Body() body: RunExternalAgentDto
  ) {
    return this._externalAgentsService.test(org.id, id, body?.payload || {});
  }
}
