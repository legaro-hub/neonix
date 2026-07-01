import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequestUser } from '../auth/strategies/jwt.strategy';
import { AnalyticsService } from './analytics.service';
import { PrismaService } from '../prisma/prisma.service';
import { PinterestAuthService } from '../pinterest/pinterest-auth.service';
import { YouTubeAuthService } from '../youtube/youtube-auth.service';
import { InstagramAuthService } from '../instagram/instagram-auth.service';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(
    private readonly analytics: AnalyticsService,
    private readonly prisma: PrismaService,
    private readonly pinterestAuth: PinterestAuthService,
    private readonly youtubeAuth: YouTubeAuthService,
    private readonly instagramAuth: InstagramAuthService,
  ) {}

  @Get('overview')
  overview(@Req() req: Request & { user: RequestUser }) {
    return this.analytics.getOverview(req.user.id);
  }

  @Get('timeline')
  timeline(@Req() req: Request & { user: RequestUser }, @Query('days') days?: string) {
    const d = days ? parseInt(days, 10) : 30;
    return this.analytics.getTimeline(req.user.id, isNaN(d) ? 30 : d);
  }

  @Get('channels')
  channels(@Req() req: Request & { user: RequestUser }) {
    return this.analytics.getByChannel(req.user.id);
  }

  @Get('posts')
  posts(@Req() req: Request & { user: RequestUser }, @Query('limit') limit?: string) {
    const l = limit ? parseInt(limit, 10) : 10;
    return this.analytics.getRecentPosts(req.user.id, isNaN(l) ? 10 : l);
  }

  @Get('weekly')
  weekly(@Req() req: Request & { user: RequestUser }) {
    return this.analytics.getWeeklyComparison(req.user.id);
  }

  @Get('media')
  media(@Req() req: Request & { user: RequestUser }) {
    return this.analytics.getMediaStats(req.user.id);
  }

  @Get('published')
  publishedPosts(@Req() req: Request & { user: RequestUser }) {
    return this.analytics.getPublishedPostMetrics(req.user.id);
  }

  @Get('deep')
  async deepAnalytics(
    @Req() req: Request & { user: RequestUser },
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const userId = req.user.id;
    const end = endDate ?? new Date().toISOString().split('T')[0];
    const start = startDate ?? new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];

    const accounts = await this.prisma.socialAccount.findMany({
      where: { userId, status: 'active' },
    });

    const result: Record<string, any> = {};

    for (const acc of accounts) {
      const meta = (acc.metadata as Record<string, unknown>) ?? {};
      const token = meta.accessToken as string | undefined;
      if (!token) continue;

      try {
        if (acc.platform === 'pinterest') {
          const [account, byFormat, byDevice, topPins] = await Promise.all([
            this.pinterestAuth.getAccountAnalytics(token, start, end).catch(() => null),
            this.pinterestAuth.getAnalyticsByFormat(token, start, end).catch(() => null),
            this.pinterestAuth.getAnalyticsByDevice(token, start, end).catch(() => null),
            this.pinterestAuth.getTopPins(token, start, end, 'ENGAGEMENTS', 10).catch(() => null),
          ]);
          result.pinterest = {
            account: this.extractMetrics(account),
            byFormat: this.extractSplitMetrics(byFormat),
            byDevice: this.extractSplitMetrics(byDevice),
            topPins: topPins?.items ?? [],
          };
        }

        if (acc.platform === 'youtube') {
          const channelId = acc.externalId;
          const [demographics, geography, traffic, devices, topVideos] = await Promise.all([
            this.youtubeAuth.getYouTubeDemographics(channelId, token, start, end).catch(() => null),
            this.youtubeAuth.getYouTubeGeography(channelId, token, start, end).catch(() => null),
            this.youtubeAuth.getYouTubeTrafficSources(channelId, token, start, end).catch(() => null),
            this.youtubeAuth.getYouTubeDeviceTypes(channelId, token, start, end).catch(() => null),
            this.youtubeAuth.getYouTubeTopVideos(channelId, token, start, end).catch(() => null),
          ]);
          result.youtube = {
            demographics: demographics?.rows ?? [],
            geography: geography?.rows ?? [],
            trafficSources: traffic?.rows ?? [],
            devices: devices?.rows ?? [],
            topVideos: topVideos?.rows ?? [],
          };
        }

        if (acc.platform === 'instagram') {
          const [insights, demographics] = await Promise.all([
            this.instagramAuth.getAccountInsightsAll(token, acc.externalId).catch(() => null),
            this.instagramAuth.getAudienceDemographics(token, acc.externalId).catch(() => null),
          ]);
          result.instagram = {
            insights: this.extractInsights(insights),
            demographics,
          };
        }
      } catch (err) {
        result[acc.platform] = { error: (err as Error).message };
      }
    }

    // Internal analytics
    const [overview, timeline] = await Promise.all([
      this.analytics.getOverview(userId),
      this.analytics.getTimeline(userId, 30),
    ]);

    result.overview = overview;
    result.timeline = timeline;
    result.period = { start, end };

    return result;
  }

  private extractMetrics(data: any) {
    if (!data?.data?.[0]?.metrics) return {};
    return data.data[0].metrics;
  }

  private extractSplitMetrics(data: any) {
    if (!data?.data) return [];
    return data.data.map((item: any) => ({
      category: item[Object.keys(item)[0]],
      metrics: item.metrics,
    }));
  }

  private extractInsights(data: any) {
    if (!data?.data) return {};
    const result: Record<string, number> = {};
    for (const item of data.data) {
      result[item.name] = item.values?.[0]?.value ?? 0;
    }
    return result;
  }
}
