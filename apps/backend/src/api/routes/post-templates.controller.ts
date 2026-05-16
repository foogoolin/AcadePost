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
import { PostTemplatesService } from '@gitroom/nestjs-libraries/database/prisma/post-templates/post.templates.service';
import {
  PostTemplateDto,
  RenderPostTemplateDto,
  UpdatePostTemplateDto,
} from '@gitroom/nestjs-libraries/dtos/post-templates/post.templates.dto';

@ApiTags('Post Templates')
@Controller('/post-templates')
export class PostTemplatesController {
  constructor(private _postTemplatesService: PostTemplatesService) {}

  @Get('/')
  list(@GetOrgFromRequest() org: Organization) {
    return this._postTemplatesService.list(org.id);
  }

  @Post('/')
  create(
    @GetOrgFromRequest() org: Organization,
    @Body() body: PostTemplateDto
  ) {
    return this._postTemplatesService.create(org.id, body);
  }

  @Put('/:id')
  update(
    @GetOrgFromRequest() org: Organization,
    @Param('id') id: string,
    @Body() body: UpdatePostTemplateDto
  ) {
    return this._postTemplatesService.update(org.id, id, body);
  }

  @Delete('/:id')
  delete(@GetOrgFromRequest() org: Organization, @Param('id') id: string) {
    return this._postTemplatesService.delete(org.id, id);
  }

  @Post('/:id/render-preview')
  render(
    @GetOrgFromRequest() org: Organization,
    @Param('id') id: string,
    @Body() body: RenderPostTemplateDto
  ) {
    return this._postTemplatesService.render(org.id, id, body);
  }
}
