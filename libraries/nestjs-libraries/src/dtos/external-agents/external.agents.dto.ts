import {
  IsArray,
  IsBoolean,
  IsDefined,
  IsIn,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';
import { IsSafeWebhookUrl } from '@gitroom/nestjs-libraries/dtos/webhooks/webhook.url.validator';

export const EXTERNAL_AGENT_SCOPES = [
  'media:write',
  'templates:read',
  'templates:render',
  'posts:write',
  'posts:schedule',
  'posts:publish',
  'calendar:read',
  'calendar:write',
] as const;

export const EXTERNAL_AGENT_ACCESS_MODES = [
  'human_in_the_loop',
  'full_access',
] as const;

export class ExternalAgentDto {
  @IsDefined()
  @IsString()
  name: string;

  @IsDefined()
  @IsString()
  @IsUrl()
  @IsSafeWebhookUrl({
    message:
      'Agent webhook URL must be a public HTTPS URL and cannot point to internal network addresses',
  })
  webhookUrl: string;

  @IsOptional()
  @IsString()
  secret?: string;

  @IsOptional()
  @IsString()
  @IsIn(EXTERNAL_AGENT_ACCESS_MODES)
  accessMode?: (typeof EXTERNAL_AGENT_ACCESS_MODES)[number];

  @IsOptional()
  @IsArray()
  @IsIn(EXTERNAL_AGENT_SCOPES, { each: true })
  scopes?: (typeof EXTERNAL_AGENT_SCOPES)[number][];

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

export class UpdateExternalAgentDto extends ExternalAgentDto {}

export class RunExternalAgentDto {
  @IsOptional()
  payload?: Record<string, any>;
}

export class PublicAgentRunDto {
  @IsOptional()
  @IsString()
  externalAgentId?: string;

  @IsOptional()
  @IsString()
  secret?: string;

  @IsOptional()
  @IsString()
  @IsIn(['draft', 'proposal', 'schedule', 'now'])
  mode?: 'draft' | 'proposal' | 'schedule' | 'now';

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  integrationIds?: string[];

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  media?: { id?: string; path?: string }[];

  @IsOptional()
  @IsString()
  templateId?: string;

  @IsOptional()
  @IsString()
  publishDate?: string;

  @IsOptional()
  @IsBoolean()
  requiresApproval?: boolean;
}
