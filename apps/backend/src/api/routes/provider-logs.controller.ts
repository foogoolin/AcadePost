import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Organization } from '@prisma/client';
import { GetOrgFromRequest } from '@gitroom/nestjs-libraries/user/org.from.request';
import { ProviderLogsService } from '@gitroom/nestjs-libraries/database/prisma/provider-logs/provider.logs.service';
import { CheckPolicies } from '@gitroom/backend/services/auth/permissions/permissions.ability';
import {
  AuthorizationActions,
  Sections,
} from '@gitroom/backend/services/auth/permissions/permission.exception.class';

@ApiTags('Provider Logs')
@Controller('/provider-logs')
export class ProviderLogsController {
  constructor(private _providerLogsService: ProviderLogsService) {}

  @Get('/connection')
  @CheckPolicies([AuthorizationActions.Read, Sections.ADMIN])
  listConnectionLogs(
    @GetOrgFromRequest() org: Organization,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('provider') providerIdentifier?: string,
    @Query('status') status?: string,
    @Query('credentialId') providerCredentialId?: string
  ) {
    return this._providerLogsService.listConnectionLogs({
      organizationId: org.id,
      page: this.number(page),
      limit: this.number(limit),
      providerIdentifier: providerIdentifier || undefined,
      status: status || undefined,
      providerCredentialId: providerCredentialId || undefined,
    });
  }

  @Get('/publish-attempts')
  @CheckPolicies([AuthorizationActions.Read, Sections.ADMIN])
  listPublishAttempts(
    @GetOrgFromRequest() org: Organization,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('provider') providerIdentifier?: string,
    @Query('status') status?: string,
    @Query('integrationId') integrationId?: string,
    @Query('credentialId') providerCredentialId?: string,
    @Query('postId') postId?: string,
    @Query('operationId') operationId?: string
  ) {
    return this._providerLogsService.listPublishAttempts({
      organizationId: org.id,
      page: this.number(page),
      limit: this.number(limit),
      providerIdentifier: providerIdentifier || undefined,
      status: status || undefined,
      integrationId: integrationId || undefined,
      providerCredentialId: providerCredentialId || undefined,
      postId: postId || undefined,
      operationId: operationId || undefined,
    });
  }

  private number(value?: string) {
    if (!value) {
      return undefined;
    }
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return undefined;
    }
    return parsed;
  }
}
