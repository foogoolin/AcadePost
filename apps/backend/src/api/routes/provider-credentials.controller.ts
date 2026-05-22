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
import { ProviderCredentialsService } from '@gitroom/nestjs-libraries/database/prisma/provider-credentials/provider.credentials.service';
import {
  ProviderCredentialDto,
  ProviderCredentialTestPostDto,
  UpdateProviderCredentialDto,
} from '@gitroom/nestjs-libraries/dtos/provider-credentials/provider.credentials.dto';
import { CheckPolicies } from '@gitroom/backend/services/auth/permissions/permissions.ability';
import {
  AuthorizationActions,
  Sections,
} from '@gitroom/backend/services/auth/permissions/permission.exception.class';

@ApiTags('Provider Credentials')
@Controller('/provider-credentials')
export class ProviderCredentialsController {
  constructor(
    private _providerCredentialsService: ProviderCredentialsService
  ) {}

  @Get('/providers')
  @CheckPolicies([AuthorizationActions.Read, Sections.ADMIN])
  providers() {
    return this._providerCredentialsService.providers();
  }

  @Get('/')
  @CheckPolicies([AuthorizationActions.Read, Sections.ADMIN])
  list(@GetOrgFromRequest() org: Organization) {
    return this._providerCredentialsService.list(org.id);
  }

  @Get('/:id')
  @CheckPolicies([AuthorizationActions.Read, Sections.ADMIN])
  get(@GetOrgFromRequest() org: Organization, @Param('id') id: string) {
    return this._providerCredentialsService.get(org.id, id);
  }

  @Post('/')
  @CheckPolicies([AuthorizationActions.Create, Sections.ADMIN])
  create(
    @GetOrgFromRequest() org: Organization,
    @Body() body: ProviderCredentialDto
  ) {
    return this._providerCredentialsService.create(org.id, body);
  }

  @Put('/:id')
  @CheckPolicies([AuthorizationActions.Update, Sections.ADMIN])
  update(
    @GetOrgFromRequest() org: Organization,
    @Param('id') id: string,
    @Body() body: UpdateProviderCredentialDto
  ) {
    return this._providerCredentialsService.update(org.id, id, body);
  }

  @Post('/:id/test')
  @CheckPolicies([AuthorizationActions.Update, Sections.ADMIN])
  test(@GetOrgFromRequest() org: Organization, @Param('id') id: string) {
    return this._providerCredentialsService.test(org.id, id);
  }

  @Post('/:id/test-post')
  @CheckPolicies([AuthorizationActions.Update, Sections.ADMIN])
  testPost(
    @GetOrgFromRequest() org: Organization,
    @Param('id') id: string,
    @Body() body: ProviderCredentialTestPostDto
  ) {
    return this._providerCredentialsService.testPost(org.id, id, body);
  }

  @Delete('/:id')
  @CheckPolicies([AuthorizationActions.Delete, Sections.ADMIN])
  delete(@GetOrgFromRequest() org: Organization, @Param('id') id: string) {
    return this._providerCredentialsService.delete(org.id, id);
  }
}
