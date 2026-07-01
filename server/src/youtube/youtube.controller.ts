import {
  Controller, Get, Post, Query, Req, UseGuards,
  BadRequestException, Body,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequestUser } from '../auth/strategies/jwt.strategy';
import { YouTubeAuthService } from './youtube-auth.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('youtube')
export class YouTubeController {
  constructor(
    private readonly ytAuth: YouTubeAuthService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('auth-url')
  @UseGuards(JwtAuthGuard)
  getAuthUrl(@Req() req: Request & { user: RequestUser }) {
    if (!this.ytAuth.isConfigured()) {
      throw new BadRequestException('YouTube не подключён');
    }
    const state = this.ytAuth.generateState(req.user.id);
    return { url: this.ytAuth.getAuthUrl(state) };
  }

  @Get('callback')
  async handleCallback(@Query('code') code: string, @Query('state') state: string) {
    if (!code || !state) throw new BadRequestException('Отсутствуют параметры');
    const userId = this.ytAuth.verifyState(state);
    if (!userId) throw new BadRequestException('Невалидная ссылка');

    const tokenData = await this.ytAuth.exchangeCode(code);

    const existing = await this.prisma.socialAccount.findFirst({
      where: { userId, platform: 'youtube', externalId: tokenData.channelId },
    });

    if (existing) {
      await this.prisma.socialAccount.update({
        where: { id: existing.id },
        data: {
          status: 'active',
          metadata: {
            accessToken: tokenData.accessToken,
            refreshToken: tokenData.refreshToken,
            expiresAt: tokenData.expiresAt?.toISOString(),
          },
        },
      });
    } else {
      await this.prisma.socialAccount.create({
        data: {
          userId, platform: 'youtube', externalId: tokenData.channelId,
          title: tokenData.channelTitle || 'YouTube',
          metadata: {
            accessToken: tokenData.accessToken,
            refreshToken: tokenData.refreshToken,
            expiresAt: tokenData.expiresAt?.toISOString(),
          },
          status: 'active',
        },
      });
    }

    return { redirect: `${process.env.APP_URL ?? 'https://neonix.online'}/app/channels?youtube=linked` };
  }

  @Get('channels')
  @UseGuards(JwtAuthGuard)
  async listChannels(@Req() req: Request & { user: RequestUser }, @Query('accountId') accountId: string) {
    const account = await this.prisma.socialAccount.findFirst({
      where: { id: accountId, userId: req.user.id, platform: 'youtube' },
    });
    if (!account) throw new BadRequestException('Аккаунт не найден');
    const meta = (account.metadata as Record<string, unknown>) ?? {};
    const token = await this.ytAuth.resolveToken(
      meta.accessToken as string | undefined,
      meta.refreshToken as string | undefined,
    );
    return this.ytAuth.listChannels(token);
  }

  @Get('videos')
  @UseGuards(JwtAuthGuard)
  async listVideos(
    @Req() req: Request & { user: RequestUser },
    @Query('accountId') accountId: string,
    @Query('pageToken') pageToken?: string,
  ) {
    const account = await this.prisma.socialAccount.findFirst({
      where: { id: accountId, userId: req.user.id, platform: 'youtube' },
    });
    if (!account) throw new BadRequestException('Аккаунт не найден');
    const meta = (account.metadata as Record<string, unknown>) ?? {};
    const token = await this.ytAuth.resolveToken(
      meta.accessToken as string | undefined,
      meta.refreshToken as string | undefined,
    );
    return this.ytAuth.listVideos(token, account.externalId, pageToken);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  async getStats(@Req() req: Request & { user: RequestUser }, @Query('accountId') accountId: string) {
    const account = await this.prisma.socialAccount.findFirst({
      where: { id: accountId, userId: req.user.id, platform: 'youtube' },
    });
    if (!account) throw new BadRequestException('Аккаунт не найден');
    const meta = (account.metadata as Record<string, unknown>) ?? {};
    const token = await this.ytAuth.resolveToken(
      meta.accessToken as string | undefined,
      meta.refreshToken as string | undefined,
    );
    return this.ytAuth.getChannelStats(token, account.externalId);
  }

  @Post('select-channel')
  @UseGuards(JwtAuthGuard)
  async selectChannel(
    @Req() req: Request & { user: RequestUser },
    @Body() body: { accountId: string },
  ) {
    const account = await this.prisma.socialAccount.findFirst({
      where: { id: body.accountId, userId: req.user.id, platform: 'youtube' },
    });
    if (!account) throw new BadRequestException('Аккаунт не найден');
    return { success: true };
  }
}
