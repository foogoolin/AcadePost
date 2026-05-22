import {
  IsBoolean,
  IsDefined,
  IsIn,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export const PROVIDER_CREDENTIAL_IDENTIFIERS = [
  'x',
  'linkedin',
  'linkedin-page',
  'facebook',
  'instagram',
  'instagram-standalone',
  'threads',
  'youtube',
  'tiktok',
  'pinterest',
  'reddit',
  'discord',
  'slack',
  'mastodon',
  'gmb',
  'dribbble',
  'kick',
  'twitch',
  'vk',
  'wrapcast',
  'telegram',
  'mewe',
  'whop',
] as const;

export type ProviderCredentialIdentifier =
  (typeof PROVIDER_CREDENTIAL_IDENTIFIERS)[number];

export class ProviderCredentialDto {
  @IsDefined()
  @IsString()
  @IsIn(PROVIDER_CREDENTIAL_IDENTIFIERS)
  providerIdentifier: ProviderCredentialIdentifier;

  @IsDefined()
  @IsString()
  name: string;

  @IsDefined()
  @IsObject()
  fields: Record<string, string>;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

export class UpdateProviderCredentialDto extends ProviderCredentialDto {}

export class ProviderCredentialTestPostDto {
  @IsDefined()
  @IsString()
  integrationId: string;

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsString()
  operationId?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}
