import {
  Controller, Get, Post, Query, Req, UseGuards, Body,
  BadRequestException,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequestUser } from '../auth/strategies/jwt.strategy';
import { InstagramAuthService } from './instagram-auth.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('instagram')
export class InstagramController {
  constructor(
    private readonly igAuth: InstagramAuthService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('auth-url')
  @UseGuards(JwtAuthGuard)
  getAuthUrl(@Req() req: Request & { user: RequestUser }) {
    if (!this.igAuth.isConfigured()) {
      throw new BadRequestException('Instagram не подключён');
    }
    const state = this.igAuth.generateState(req.user.id);
    return { url: this.igAuth.getAuthUrl(state) };
  }

  @Get('callback')
  async handleCallback(@Query('code') code: string, @Query('state') state: string) {
    if (!code || !state) throw new BadRequestException('Отсутствуют параметры');
    const userId = this.igAuth.verifyState(state);
    if (!userId) throw new BadRequestException('Невалидная ссылка');

    const data = await this.igAuth.exchangeCode(code);

    const existing = await this.prisma.socialAccount.findFirst({
      where: { userId, platform: 'instagram', externalId: data.instagramId },
    });

    if (existing) {
      await this.prisma.socialAccount.update({
        where: { id: existing.id },
        data: {
          status: 'active',
          title: data.username || data.name,
          username: data.username,
          metadata: {
            accessToken: data.accessToken,
            pageId: data.pageId,
            pageName: data.pageName,
          },
        },
      });
    } else {
      await this.prisma.socialAccount.create({
        data: {
          userId, platform: 'instagram', externalId: data.instagramId,
          title: data.username || data.name || 'Instagram',
          username: data.username,
          metadata: {
            accessToken: data.accessToken,
            pageId: data.pageId,
            pageName: data.pageName,
          },
          status: 'active',
        },
      });
    }

    return { redirect: `${process.env.APP_URL ?? 'https://neonix.online'}/app/channels?instagram=linked` };
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Req() req: Request & { user: RequestUser }, @Query('accountId') accountId: string) {
    const account = await this.prisma.socialAccount.findFirst({
      where: { id: accountId, userId: req.user.id, platform: 'instagram' },
    });
    if (!account) throw new BadRequestException('Аккаунт не найден');
    const meta = (account.metadata as Record<string, unknown>) ?? {};
    const token = await this.igAuth.resolveToken(meta.accessToken as string | undefined);
    return this.igAuth.getProfile(token, account.externalId);
  }

  @Get('media')
  @UseGuards(JwtAuthGuard)
  async listMedia(
    @Req() req: Request & { user: RequestUser },
    @Query('accountId') accountId: string,
    @Query('after') after?: string,
  ) {
    const account = await this.prisma.socialAccount.findFirst({
      where: { id: accountId, userId: req.user.id, platform: 'instagram' },
    });
    if (!account) throw new BadRequestException('Аккаунт не найден');
    const meta = (account.metadata as Record<string, unknown>) ?? {};
    const token = await this.igAuth.resolveToken(meta.accessToken as string | undefined);
    return this.igAuth.getMedia(token, account.externalId, after);
  }

  @Get('insights')
  @UseGuards(JwtAuthGuard)
  async getInsights(@Req() req: Request & { user: RequestUser }, @Query('accountId') accountId: string) {
    const account = await this.prisma.socialAccount.findFirst({
      where: { id: accountId, userId: req.user.id, platform: 'instagram' },
    });
    if (!account) throw new BadRequestException('Аккаунт не найден');
    const meta = (account.metadata as Record<string, unknown>) ?? {};
    const token = await this.igAuth.resolveToken(meta.accessToken as string | undefined);
    return this.igAuth.getInsights(token, account.externalId, 'impressions,reach,follower_count,profile_views,website_clicks');
  }

  @Post('select-profile')
  @UseGuards(JwtAuthGuard)
  async selectProfile(
    @Req() req: Request & { user: RequestUser },
    @Body() body: { accountId: string },
  ) {
    const account = await this.prisma.socialAccount.findFirst({
      where: { id: body.accountId, userId: req.user.id, platform: 'instagram' },
    });
    if (!account) throw new BadRequestException('Аккаунт не найден');
    return { success: true };
  }
}
