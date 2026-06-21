import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview(userId: string) {
    const [totalPosts, publications, channels] = await Promise.all([
      this.prisma.post.count({ where: { userId } }),
      this.prisma.postPublication.findMany({
        where: { post: { userId } },
        select: { status: true, publishedAt: true, scheduledAt: true },
      }),
      this.prisma.socialAccount.count({ where: { userId, status: 'active' } }),
    ]);

    const byStatus = {
      draft: 0,
      queued: 0,
      in_progress: 0,
      published: 0,
      failed: 0,
    };

    for (const pub of publications) {
      if (pub.status in byStatus) {
        byStatus[pub.status as keyof typeof byStatus]++;
      }
    }

    const successRate = publications.length > 0
      ? Math.round((byStatus.published / publications.length) * 100)
      : 0;

    return {
      totalPosts,
      totalPublications: publications.length,
      channels,
      byStatus,
      successRate,
    };
  }

  async getTimeline(userId: string, days: number = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const publications = await this.prisma.postPublication.findMany({
      where: {
        post: { userId },
        publishedAt: { gte: since },
        status: 'published',
      },
      select: { publishedAt: true },
      orderBy: { publishedAt: 'asc' },
    });

    const byDay: Record<string, number> = {};
    for (let i = 0; i < days; i++) {
      const d = new Date(since.getTime() + i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      byDay[key] = 0;
    }

    for (const pub of publications) {
      if (pub.publishedAt) {
        const key = pub.publishedAt.toISOString().slice(0, 10);
        if (key in byDay) byDay[key]++;
      }
    }

    return Object.entries(byDay).map(([date, count]) => ({ date, count }));
  }

  async getByChannel(userId: string) {
    const channels = await this.prisma.socialAccount.findMany({
      where: { userId, status: 'active' },
      select: {
        id: true,
        title: true,
        username: true,
        publications: {
          select: { status: true },
        },
      },
    });

    return channels.map((ch) => {
      const total = ch.publications.length;
      const published = ch.publications.filter((p) => p.status === 'published').length;
      const failed = ch.publications.filter((p) => p.status === 'failed').length;
      const queued = ch.publications.filter((p) => p.status === 'queued' || p.status === 'in_progress').length;

      return {
        id: ch.id,
        title: ch.title,
        username: ch.username,
        total,
        published,
        failed,
        queued,
        successRate: total > 0 ? Math.round((published / total) * 100) : 0,
      };
    });
  }

  async getRecentPosts(userId: string, limit: number = 10) {
    const posts = await this.prisma.post.findMany({
      where: { userId },
      include: {
        publications: {
          select: { status: true, publishedAt: true, socialAccount: { select: { title: true } } },
        },
        media: { select: { id: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    });

    return posts.map((post) => {
      const total = post.publications.length;
      const published = post.publications.filter((p) => p.status === 'published').length;
      const failed = post.publications.filter((p) => p.status === 'failed').length;

      return {
        id: post.id,
        title: post.title || 'Без заголовка',
        body: post.body.slice(0, 100),
        status: post.status,
        scheduledAt: post.scheduledAt,
        createdAt: post.createdAt,
        mediaCount: post.media.length,
        channels: post.publications.map((p) => p.socialAccount.title),
        published,
        failed,
        total,
      };
    });
  }

  async getWeeklyComparison(userId: string) {
    const now = new Date();
    const thisWeekStart = new Date(now);
    thisWeekStart.setDate(now.getDate() - now.getDay());
    thisWeekStart.setHours(0, 0, 0, 0);

    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);

    const [thisWeekPubs, lastWeekPubs] = await Promise.all([
      this.prisma.postPublication.count({
        where: { post: { userId }, status: 'published', publishedAt: { gte: thisWeekStart } },
      }),
      this.prisma.postPublication.count({
        where: { post: { userId }, status: 'published', publishedAt: { gte: lastWeekStart, lt: thisWeekStart } },
      }),
    ]);

    const diff = lastWeekPubs > 0 ? Math.round(((thisWeekPubs - lastWeekPubs) / lastWeekPubs) * 100) : 0;

    return { thisWeek: thisWeekPubs, lastWeek: lastWeekPubs, diff };
  }

  async getMediaStats(userId: string) {
    const posts = await this.prisma.post.findMany({
      where: { userId },
      select: {
        media: { select: { kind: true, sizeBytes: true } },
      },
    });

    let totalFiles = 0;
    let totalSize = 0;
    const byKind: Record<string, number> = { image: 0, video: 0, gif: 0 };

    for (const post of posts) {
      for (const m of post.media) {
        totalFiles++;
        totalSize += m.sizeBytes || 0;
        if (m.kind in byKind) byKind[m.kind]++;
      }
    }

    return { totalFiles, totalSize, byKind };
  }
}
