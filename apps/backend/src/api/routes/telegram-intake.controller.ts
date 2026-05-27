import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Organization, User } from '@prisma/client';
import { TelegramIntakeService } from '@gitroom/nestjs-libraries/database/prisma/telegram-intake/telegram.intake.service';
import { GetOrgFromRequest } from '@gitroom/nestjs-libraries/user/org.from.request';
import { GetUserFromRequest } from '@gitroom/nestjs-libraries/user/user.from.request';
import { CheckPolicies } from '@gitroom/backend/services/auth/permissions/permissions.ability';
import {
  AuthorizationActions,
  Sections,
} from '@gitroom/backend/services/auth/permissions/permission.exception.class';

@ApiTags('Telegram Intake')
@Controller('/telegram-intake')
export class TelegramIntakeController {
  constructor(private _telegramIntakeService: TelegramIntakeService) {}

  @Get('/bindings')
  bindings(@GetOrgFromRequest() org: Organization) {
    return this._telegramIntakeService.listBindings(org.id);
  }

  @Post('/bindings')
  @CheckPolicies([AuthorizationActions.Create, Sections.ADMIN])
  bind(
    @GetOrgFromRequest() org: Organization,
    @GetUserFromRequest() user: User,
    @Body()
    body: {
      telegramUserId: string;
      telegramChatId?: string;
      telegramUsername?: string;
    }
  ) {
    return this._telegramIntakeService.bindTelegramUser({
      organizationId: org.id,
      userId: user.id,
      telegramUserId: body.telegramUserId,
      telegramChatId: body.telegramChatId,
      telegramUsername: body.telegramUsername,
    });
  }
}
