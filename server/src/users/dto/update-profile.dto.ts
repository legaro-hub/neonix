import { IsOptional, IsString, MaxLength, IsEmail, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  timezone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  language?: string;
}

export class ChangePasswordDto {
  @IsString()
  @MaxLength(72)
  currentPassword: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  newPassword: string;
}

export class UpdateNotificationsDto {
  @IsOptional()
  emailOnPublish?: boolean;

  @IsOptional()
  emailOnFailure?: boolean;

  @IsOptional()
  emailOnBilling?: boolean;

  @IsOptional()
  inAppOnPublish?: boolean;

  @IsOptional()
  inAppOnFailure?: boolean;

  @IsOptional()
  digestEnabled?: boolean;

  @IsOptional()
  @IsString()
  digestDay?: string;

  @IsOptional()
  digestHour?: number;
}
