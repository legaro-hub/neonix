import { IsEmail, IsOptional, IsString, MinLength, MaxLength, IsNumber } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  promoCode?: string;

  @IsString()
  captchaId: string;

  @IsNumber()
  captchaAnswer: number;
}
