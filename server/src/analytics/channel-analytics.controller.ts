import { Controller, Get, Param, Query, UseGuards, Req, BadRequestException } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequestUser } from '../auth/strategies/jwt.strategy';
import { PrismaService } from '../prisma/prisma.service';
import { PinterestAuthService } from '../pinterest/pinterest-auth.service';
import { YouTubeAuthService } from '../youtube/youtube-auth.service';
import { InstagramAuthService } from '../instagram/instagram-auth.service';

@Controller('channel-analytics')
@UseGuards(JwtAuthGuard)
export class ChannelAnalyticsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pinterestAuth: PinterestAuthService,
    private readonly youtubeAuth: YouTubeAuthService,
    private readonly instagramAuth: InstagramAuthService,
  ) {}

  @Get(':id')
  async getChannelAnalytics(
    @Req() req: Request & { user: RequestUser },
    @Param('id') id: string,
    @Query('days') days?: string,
  ) {
    const account = await this.prisma.socialAccount.findFirst({
      where: { id, userId: req.user.id },
    });
    if (!account) throw new BadRequestException('Аккаунт не найден');

    const meta = (account.metadata as Record<string, unknown>) ?? {};
    const token = meta.accessToken as string | undefined;
    const daysNum = days ? parseInt(days, 10) : 30;
    const end = new Date().toISOString().split('T')[0];
    const start = new Date(Date.now() - daysNum * 86400000).toISOString().split('T')[0];

    switch (account.platform) {
      case 'telegram':
        return this.getTelegramAnalytics(account);
      case 'pinterest':
        return this.getPinterestAnalytics(token!, account, start, end);
      case 'youtube':
        return this.getYouTubeAnalytics(token!, account, start, end);
      case 'instagram':
        return this.getInstagramAnalytics(token!, account, start, end);
      default:
        throw new BadRequestException(`Платформа ${account.platform} не поддерживается`);
    }
  }

  private async getTelegramAnalytics(account: any) {
    const stats = await this.prisma.channelStat.findMany({
      where: { socialAccountId: account.id },
      orderBy: { createdAt: 'asc' },
    });

    const publications = await this.prisma.postPublication.findMany({
      where: { socialAccountId: account.id },
      include: { post: { select: { title: true, createdAt: true } } },
      orderBy: { scheduledAt: 'desc' },
      take: 50,
    });

    const total = publications.length;
    const published = publications.filter((p) => p.status === 'published').length;
    const failed = publications.filter((p) => p.status === 'failed').length;
    const successRate = total > 0 ? Math.round((published / total) * 100) : 0;

    const memberHistory = stats.map((s) => ({
      date: s.createdAt.toISOString().split('T')[0],
      members: s.memberCount,
    }));

    const latestStats = stats[stats.length - 1];
    const earliestStats = stats[0];
    const memberGrowth = latestStats && earliestStats && latestStats.memberCount && earliestStats.memberCount
      ? latestStats.memberCount - earliestStats.memberCount
      : 0;

    // Publications by day of week
    const byDayOfWeek: Record<string, number> = { 'Пн': 0, 'Вт': 0, 'Ср': 0, 'Чт': 0, 'Пт': 0, 'Сб': 0, 'Вс': 0 };
    const dayNames = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
    for (const pub of publications) {
      if (pub.scheduledAt) {
        const day = dayNames[pub.scheduledAt.getDay()];
        byDayOfWeek[day] = (byDayOfWeek[day] || 0) + 1;
      }
    }

    // Publications by hour
    const byHour: number[] = new Array(24).fill(0);
    for (const pub of publications) {
      if (pub.scheduledAt) {
        byHour[pub.scheduledAt.getHours()]++;
      }
    }

    return {
      platform: 'telegram',
      channel: { title: account.title, username: account.username, externalId: account.externalId },
      stats: {
        total, published, failed, successRate, memberGrowth,
        currentMembers: latestStats?.memberCount ?? 0,
      },
      memberHistory,
      byDayOfWeek,
      byHour,
      recentPublications: publications.slice(0, 20).map((p) => ({
        title: p.post.title,
        status: p.status,
        scheduledAt: p.scheduledAt,
        publishedAt: p.publishedAt,
        externalId: p.externalId,
      })),
    };
  }

  private async getPinterestAnalytics(token: string, account: any, start: string, end: string) {
    const boardId = (account.metadata as Record<string, unknown>)?.boardId as string | undefined;

    const [profile, accountAnalytics, topPins, allPins, byFormat] = await Promise.all([
      this.pinterestAuth.getUserAccount(token).catch(() => null),
      this.pinterestAuth.getAccountAnalytics(token, start, end).catch(() => null),
      this.pinterestAuth.getTopPins(token, start, end, 'ENGAGEMENTS', 20).catch(() => null),
      this.pinterestAuth.listAllPins(token).catch(() => null),
      this.pinterestAuth.getAnalyticsByFormat(token, start, end).catch(() => null),
    ]);

    const m = accountAnalytics?.data?.[0]?.metrics ?? {};

    const totalPins = allPins?.items?.length ?? 0;

    return {
      platform: 'pinterest',
      channel: { title: account.title, username: account.username, externalId: account.externalId },
      profile: {
        username: profile?.username,
        name: profile?.name,
        followers: profile?.follower_count ?? 0,
        totalPins,
      },
      metrics: {
        impressions: m.IMPRESSIONS ?? 0,
        saves: m.SAVES ?? 0,
        pinClicks: m.PIN_CLICKS ?? 0,
        outboundClicks: m.OUTBOUND_CLICKS ?? 0,
        engagements: m.ENGAGEMENTS ?? 0,
        follows: m.FOLLOWS ?? 0,
        engagementRate: m.IMPRESSIONS ? Math.round(((m.ENGAGEMENTS ?? 0) / m.IMPRESSIONS) * 10000) / 100 : 0,
      },
      byFormat: byFormat?.data ?? [],
      topPins: topPins?.items ?? [],
      boardId,
      period: { start, end },
    };
  }

  private async getYouTubeAnalytics(token: string, account: any, start: string, end: string) {
    const channelId = account.externalId;

    const [channel, analytics, demographics, geography, traffic, devices, topVideos] = await Promise.all([
      this.youtubeAuth.getChannelDetails(token, channelId).catch(() => null),
      this.youtubeAuth.getChannelAnalytics(channelId, token, start, end).catch(() => null),
      this.youtubeAuth.getYouTubeDemographics(channelId, token, start, end).catch(() => null),
      this.youtubeAuth.getYouTubeGeography(channelId, token, start, end).catch(() => null),
      this.youtubeAuth.getYouTubeTrafficSources(channelId, token, start, end).catch(() => null),
      this.youtubeAuth.getYouTubeDeviceTypes(channelId, token, start, end).catch(() => null),
      this.youtubeAuth.getYouTubeTopVideos(channelId, token, start, end).catch(() => null),
    ]);

    const ch = channel?.items?.[0] ?? {};
    const stats = ch.statistics ?? {};
    const dailyRows = analytics?.rows ?? [];

    const totals = {
      views: 0, likes: 0, comments: 0, shares: 0,
      minutesWatched: 0, avgViewDuration: 0, avgViewPct: 0,
      subscribersGained: 0, subscribersLost: 0,
    };
    for (const row of dailyRows) {
      totals.views += row[0] ?? 0;
      totals.likes += row[1] ?? 0;
      totals.comments += row[2] ?? 0;
      totals.shares += row[3] ?? 0;
      totals.minutesWatched += row[4] ?? 0;
    }
    if (dailyRows.length > 0) {
      totals.avgViewDuration = Math.round(dailyRows.reduce((s: number, r: any) => s + (r[5] ?? 0), 0) / dailyRows.length);
      totals.avgViewPct = Math.round(dailyRows.reduce((s: number, r: any) => s + (r[6] ?? 0), 0) / dailyRows.length * 100) / 100;
      totals.subscribersGained = dailyRows.reduce((s: number, r: any) => s + (r[7] ?? 0), 0);
      totals.subscribersLost = dailyRows.reduce((s: number, r: any) => s + (r[8] ?? 0), 0);
    }

    const dailyTrend = dailyRows.map((r: any) => ({
      date: r[9] ?? '',
      views: r[0] ?? 0,
      likes: r[1] ?? 0,
      comments: r[2] ?? 0,
      subscribersGained: r[7] ?? 0,
    }));

    return {
      platform: 'youtube',
      channel: {
        title: ch.snippet?.title ?? account.title,
        description: ch.snippet?.description ?? '',
        subscribers: stats.subscriberCount ?? 0,
        totalViews: stats.viewCount ?? 0,
        totalVideos: stats.videoCount ?? 0,
      },
      periodMetrics: totals,
      dailyTrend,
      demographics: demographics?.rows ?? [],
      geography: (geography?.rows ?? []).slice(0, 10),
      trafficSources: traffic?.rows ?? [],
      devices: devices?.rows ?? [],
      topVideos: (topVideos?.rows ?? []).slice(0, 15),
      period: { start, end },
    };
  }

  private async getInstagramAnalytics(token: string, account: any, start: string, end: string) {
    const igId = account.externalId;

    const [profile, insightsAll, growth, audience, media] = await Promise.all([
      this.instagramAuth.getProfile(token, igId).catch(() => null),
      this.instagramAuth.getAccountInsightsAll(token, igId).catch(() => null),
      this.instagramAuth.getFollowerGrowth(token, igId).catch(() => null),
      this.instagramAuth.getAudienceDemographics(token, igId).catch(() => null),
      this.instagramAuth.getMedia(token, igId).catch(() => null),
    ]);

    const insightValues: Record<string, number> = {};
    if (insightsAll?.data) {
      for (const item of insightsAll.data) {
        insightValues[item.name] = item.values?.[0]?.value ?? 0;
      }
    }

    const growthData = growth?.data?.[0]?.values ?? [];

    const mediaItems = (media?.data ?? []).map((m: any) => {
      const totalInteractions = (m.like_count ?? 0) + (m.comments_count ?? 0);
      return {
        id: m.id,
        caption: (m.caption ?? '').slice(0, 80),
        type: m.media_type,
        likes: m.like_count ?? 0,
        comments: m.comments_count ?? 0,
        totalInteractions,
        permalink: m.permalink,
        timestamp: m.timestamp,
      };
    }).sort((a: any, b: any) => b.totalInteractions - a.totalInteractions);

    return {
      platform: 'instagram',
      channel: { title: account.title, username: account.username, externalId: igId },
      profile: {
        followers: profile?.followers_count ?? 0,
        mediaCount: profile?.media_count ?? 0,
        profilePicture: profile?.profile_picture_url,
      },
      metrics: {
        impressions: insightValues.impressions ?? 0,
        reach: insightValues.reach ?? 0,
        profileViews: insightValues.profile_views ?? 0,
        websiteClicks: insightValues.website_clicks ?? 0,
        emailContacts: insightValues.email_contacts ?? 0,
        totalInteractions: insightValues.total_interactions ?? 0,
        accountsEngaged: insightValues.accounts_engaged ?? 0,
        engagementRate: insightValues.reach ? Math.round(((insightValues.total_interactions ?? 0) / insightValues.reach) * 10000) / 100 : 0,
      },
      followerGrowth: growthData,
      audience: {
        gender: audience?.gender?.data ?? [],
        countries: (audience?.country?.data ?? []).slice(0, 10),
        cities: (audience?.city?.data ?? []).slice(0, 10),
      },
      topMedia: mediaItems.slice(0, 15),
      period: { start, end },
    };
  }
}
