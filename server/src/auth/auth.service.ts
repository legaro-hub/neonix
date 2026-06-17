import {
  Injectable,
  ConflictException,
  UnauthorizedException,
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

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
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
