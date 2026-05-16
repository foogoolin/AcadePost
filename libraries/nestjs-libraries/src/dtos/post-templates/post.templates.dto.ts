import {
  IsDefined,
  IsIn,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export const POST_TEMPLATE_TYPES = [
  'post_1_1',
  'post_3_4',
  'carousel_1_1',
  'carousel_3_4',
] as const;

export class PostTemplateDto {
  @IsDefined()
  @IsString()
  name: string;

  @IsDefined()
  @IsString()
  @IsIn(POST_TEMPLATE_TYPES)
  type: (typeof POST_TEMPLATE_TYPES)[number];

  @IsDefined()
  @IsObject()
  config: Record<string, any>;

  @IsOptional()
  @IsString()
  previewMediaId?: string;
}

export class UpdatePostTemplateDto extends PostTemplateDto {}

export class RenderPostTemplateDto {
  @IsOptional()
  @IsString()
  mediaId?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  mainText?: string;

  @IsOptional()
  @IsString()
  websiteLabel?: string;
}
