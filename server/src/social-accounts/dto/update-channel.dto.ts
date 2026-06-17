import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateChannelDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  username?: string;
}
