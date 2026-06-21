import { Controller, Post, Body, Res, Get, UseGuards, Req, BadRequestException } from '@nestjs/common';
import { Response, Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { CaptchaService } from './captcha.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/password-reset.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RequestUser } from './strategies/jwt.strategy';
import { AuthResult } from './interfaces/auth.types';
import { parseTtlSeconds } from '../common/parse-ttl';

export const REFRESH_COOKIE = 'neonix_refresh';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly captcha: CaptchaService,
    private readonly config: ConfigService,
  ) {}

  @Get('captcha')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  getCaptcha() {
    return this.captcha.generate();
  }

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 300000 } })
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    if (!dto.captchaId || dto.captchaAnswer === undefined) {
      throw new BadRequestException('Капча обязательна');
    }
    const valid = this.captcha.verify(dto.captchaId, dto.captchaAnswer);
    if (!valid) {
      throw new BadRequestException('Неверная капча. Попробуйте ещё раз.');
    }
    const result = await this.auth.register(dto);
    this.setRefreshCookie(res, result);
    return this.stripRefresh(result);
  }

  @Post('login')
  @Throttle({ default: { limit: 10, ttl: 300000 } })
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.auth.login(dto);
    this.setRefreshCookie(res, result);
    return this.stripRefresh(result);
  }

  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = req.cookies?.[REFRESH_COOKIE];
    await this.auth.logout(token);
    res.clearCookie(REFRESH_COOKIE, { path: '/api/auth' });
    return { success: true };
  }

  @Post('refresh')
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = req.cookies?.[REFRESH_COOKIE];
    if (!token) {
      return { accessToken: null, user: null };
    }
    const result = await this.auth.refresh(token);
    this.setRefreshCookie(res, result);
    return this.stripRefresh(result);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Req() req: Request & { user: RequestUser }) {
    return this.auth.getMe(req.user.id);
  }

  @Post('forgot-password')
  @Throttle({ default: { limit: 3, ttl: 300000 } })
  async forgotPassword(@Req() req: any) {
    const email = req.body?.email;
    if (!email) throw new BadRequestException('Email is required');
    return this.auth.forgotPassword(email);
  }

  @Post('reset-password')
  @Throttle({ default: { limit: 5, ttl: 300000 } })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.auth.resetPassword(dto.token, dto.newPassword);
  }

  private setRefreshCookie(res: Response, result: AuthResult) {
    const refreshTtl = parseTtlSeconds(this.config.get<string>('REFRESH_TTL') ?? '30d', 2592000);
    const isProd = this.config.get<string>('NODE_ENV') === 'production';
    res.cookie(REFRESH_COOKIE, result.refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'strict',
      maxAge: refreshTtl * 1000,
      path: '/api/auth',
    });
  }

  private stripRefresh(result: AuthResult) {
    const { refreshToken, ...rest } = result;
    void refreshToken;
    return rest;
  }
}
