import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResult, JwtPayload } from './interfaces/auth.types';
import { parseTtlSeconds } from '../common/parse-ttl';
import { EmailService } from '../email/email.service';
import { PromoService } from '../common/promo.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly email: EmailService,
    private readonly promoService: PromoService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResult> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (existing) {
      throw new ConflictException('Пользователь с таким email уже существует');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        name: dto.name ?? null,
      },
    });

    this.logger.log(`Registered user ${user.email}`);

    if (dto.promoCode) {
      try {
        await this.promoService.applyPromoCode(user.id, dto.promoCode);
        this.logger.log(`Promo code ${dto.promoCode} applied for new user ${user.email}`);
      } catch (err: any) {
        this.logger.warn(`Failed to apply promo code ${dto.promoCode}: ${err.message}`);
      }
    }

    const verifyToken = randomBytes(32).toString('hex');
    const verifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await this.prisma.emailVerificationToken.create({
      data: { token: verifyToken, userId: user.id, expiresAt: verifyExpires },
    });

    const appUrl = this.config.get<string>('APP_URL') ?? 'https://neonix.online';
    const verifyUrl = `${appUrl}/verify-email?token=${verifyToken}`;
    this.email.sendVerificationEmail(user.email, user.name ?? '', verifyUrl).catch(() => {});

    return this.issueTokens(user.id, user.email, user.name, user.timezone);
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (!user) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    return this.issueTokens(user.id, user.email, user.name, user.timezone);
  }

  async refresh(token: string): Promise<AuthResult> {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!stored || stored.revoked || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Недействительный refresh-токен');
    }

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revoked: true },
    });

    return this.issueTokens(
      stored.user.id,
      stored.user.email,
      stored.user.name,
      stored.user.timezone,
    );
  }

  async logout(token: string | undefined): Promise<void> {
    if (!token) return;
    await this.prisma.refreshToken.updateMany({
      where: { token, revoked: false },
      data: { revoked: true },
    });
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { socialAccounts: { where: { status: 'active' } } },
    });
    if (!user) throw new UnauthorizedException('Пользователь не найден');
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      timezone: user.timezone,
      language: user.language,
      createdAt: user.createdAt,
      channelsCount: user.socialAccounts.length,
    };
  }

  async verifyEmail(token: string): Promise<{ success: boolean }> {
    const verificationToken = await this.prisma.emailVerificationToken.findUnique({
      where: { token },
    });

    if (!verificationToken || verificationToken.expiresAt < new Date()) {
      throw new BadRequestException('Недействительная или истёкшая ссылка подтверждения');
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: verificationToken.userId },
        data: { emailVerified: true },
      }),
      this.prisma.emailVerificationToken.delete({
        where: { id: verificationToken.id },
      }),
    ]);

    const user = await this.prisma.user.findUnique({ where: { id: verificationToken.userId } });
    if (user) {
      this.email.sendWelcome(user.email, user.name ?? '').catch(() => {});
    }

    this.logger.log(`Email verified for user ${verificationToken.userId}`);
    return { success: true };
  }

  async forgotPassword(email: string): Promise<{ success: boolean }> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return { success: true };
    }

    await this.prisma.passwordResetToken.deleteMany({
      where: { userId: user.id, used: false },
    });

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await this.prisma.passwordResetToken.create({
      data: { token, userId: user.id, expiresAt },
    });

    const appUrl = this.config.get<string>('APP_URL') ?? 'https://neonix.online';
    const resetUrl = `${appUrl}/reset-password?token=${token}`;

    this.email.sendPasswordReset(user.email, user.name ?? '', resetUrl).catch(() => {});

    this.logger.log(`Password reset requested for ${user.email}`);
    return { success: true };
  }

  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean }> {
    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetToken || resetToken.used || resetToken.expiresAt < new Date()) {
      throw new BadRequestException('Недействительный или истёкший токен сброса');
    }

    const newHash = await bcrypt.hash(newPassword, 12);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash: newHash },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true },
      }),
      this.prisma.refreshToken.updateMany({
        where: { userId: resetToken.userId, revoked: false },
        data: { revoked: true },
      }),
    ]);

    this.logger.log(`Password reset completed for user ${resetToken.userId}`);
    return { success: true };
  }

  private async issueTokens(
    userId: string,
    email: string,
    name: string | null,
    timezone: string,
  ): Promise<AuthResult> {
    const payload: JwtPayload = { sub: userId, email };

    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.config.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.config.get<string>('ACCESS_TTL') ?? '15m',
    });

    const refreshTtl = parseTtlSeconds(
      this.config.get<string>('REFRESH_TTL') ?? '30d', 2592000,
    );
    const refreshToken = randomBytes(48).toString('base64url');
    const expiresAt = new Date(Date.now() + refreshTtl * 1000);

    await this.prisma.refreshToken.create({
      data: { token: refreshToken, userId, expiresAt },
    });

    return {
      user: { id: userId, email, name, timezone },
      accessToken,
      refreshToken,
      expiresIn: parseTtlSeconds(
        this.config.get<string>('ACCESS_TTL') ?? '15m', 900,
      ),
    };
  }
}
