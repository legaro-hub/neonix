import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

interface TelegramChat {
  id: number;
  type: string;
  title?: string;
  username?: string;
  description?: string;
  members_count?: number;
}

@Injectable()
export class TelegramStatsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelegramStatsService.name);
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  onModuleInit() {
    const interval = this.config.get<number>('STATS_INTERVAL_MS') ?? 3600000;
    this.logger.log(`Starting channel stats collector (interval: ${interval}ms)`);
    this.timer = setInterval(() => this.collectAll(), interval);
    this.collectAll();
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  async collectAll() {
    try {
      const token = this.config.get<string>('TG_BOT_TOKEN');
      if (!token || token === 'REPLACE_WITH_REAL_TOKEN') return;

      const channels = await this.prisma.socialAccount.findMany({
        where: { platform: 'telegram', status: 'active' },
      });

      for (const ch of channels) {
        try {
          await this.collectOne(token, ch.id, ch.externalId);
        } catch (err) {
          this.logger.warn(`Failed to collect stats for channel ${ch.title}: ${err}`);
        }
      }
    } catch (err) {
      this.logger.error(`Stats collection error: ${err}`);
    }
  }

  async collectOne(token: string, socialAccountId: string, externalId: string) {
    const chat = await this.getChat(token, externalId);
    if (!chat) return;

    await this.prisma.channelStat.create({
      data: {
        socialAccountId,
        memberCount: chat.members_count ?? null,
        title: chat.title ?? null,
        username: chat.username ?? null,
        description: chat.description ?? null,
      },
    });
  }

  async getChat(token: string, chatId: string): Promise<TelegramChat | null> {
    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/getChat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId }),
      });
      const data = await res.json() as any;
      if (data.ok) return data.result;
      return null;
    } catch {
      return null;
    }
  }

  async getMemberCount(token: string, chatId: string): Promise<number | null> {
    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/getChatMemberCount`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId }),
      });
      const data = await res.json() as any;
      if (data.ok) return data.result;
      return null;
    } catch {
      return null;
    }
  }

  async getChannelStats(userId: string) {
    const channels = await this.prisma.socialAccount.findMany({
      where: { userId, platform: 'telegram', status: 'active' },
      include: {
        stats: {
          orderBy: { createdAt: 'desc' },
          take: 30,
        },
        publications: {
          select: { status: true, publishedAt: true },
        },
      },
    });

    return channels.map((ch) => {
      const latest = ch.stats[0];
      const memberHistory = ch.stats
        .slice()
        .reverse()
        .map((s) => ({
          date: s.createdAt.toISOString().slice(0, 10),
          members: s.memberCount,
        }));

      const total = ch.publications.length;
      const published = ch.publications.filter((p) => p.status === 'published').length;

      return {
        id: ch.id,
        title: ch.title,
        username: ch.username,
        externalId: ch.externalId,
        currentMembers: latest?.memberCount ?? null,
        description: latest?.description ?? null,
        memberHistory,
        publications: { total, published },
      };
    });
  }
}
