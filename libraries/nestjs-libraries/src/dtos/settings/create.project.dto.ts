import { IsDefined, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateProjectDto {
  @IsDefined()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name: string;
}
