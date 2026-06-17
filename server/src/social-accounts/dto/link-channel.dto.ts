import { IsString, IsOptional, MaxLength, IsEnum } from 'class-validator';

export class LinkChannelDto {
  @IsString()
  @MaxLength(64)
  linkCode: string;
}

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
