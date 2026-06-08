import { Body, Controller, Headers, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  TelegramIntakeService,
  TelegramWebhookUpdate,
} from '@gitroom/nestjs-libraries/database/prisma/telegram-intake/telegram.intake.service';

@ApiTags('Telegram Intake Webhook')
@Controller('/telegram-intake')
export class TelegramIntakeWebhookController {
  constructor(private _telegramIntakeService: TelegramIntakeService) {}

  @Post('/webhook')
  webhook(
    @Headers('x-telegram-bot-api-secret-token') secretToken: string | undefined,
    @Body() body: TelegramWebhookUpdate
  ) {
    this._telegramIntakeService.verifyWebhookSecret(secretToken);
    return this._telegramIntakeService.handleWebhook(body);
  }
}
