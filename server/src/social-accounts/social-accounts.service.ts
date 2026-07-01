import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { PromoService } from '../common/promo.service';
import { UpdateChannelDto } from './dto/update-channel.dto';

const LINK_CODES = new Map<
  string,
  { userId: string; botName: string; createdAt: number }
>();

const PENDING_LINKS = new Map<
  number,
  { userId: string; telegramUserId?: number; createdAt: number }
>();

const CODE_TTL_MS = 10 * 60 * 1000;
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

@Injectable()
export class SocialAccountsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SocialAccountsService.name);
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly promoService: PromoService,
  ) {}

  onModuleInit() {
    this.cleanupTimer = setInterval(() => this.cleanup(), CLEANUP_INTERVAL_MS);
  }

  onModuleDestroy() {
    if (this.cleanupTimer) clearInterval(this.cleanupTimer);
  }

  private cleanup() {
    const now = Date.now();
    let linkCount = 0;
    let pendingCount = 0;

    for (const [key, val] of LINK_CODES) {
      if (now - val.createdAt > CODE_TTL_MS) {
        LINK_CODES.delete(key);
        linkCount++;
      }
    }

    for (const [key, val] of PENDING_LINKS) {
      if (now - val.createdAt > 30 * 60 * 1000) {
        PENDING_LINKS.delete(key);
        pendingCount++;
      }
    }

    if (linkCount > 0 || pendingCount > 0) {
      this.logger.debug(`Cleanup: removed ${linkCount} link codes, ${pendingCount} pending links`);
    }
  }

  async generateLinkCode(userId: string) {
    let count = 0;
    for (const v of LINK_CODES.values()) {
      if (v.userId === userId && v.createdAt + CODE_TTL_MS > Date.now()) count++;
    }
    if (count >= 5) {
      throw new BadRequestException(
        'Слишком много активных кодов. Подождите или используйте существующий.',
      );
    }

    const botName = process.env.TG_BOT_NAME ?? 'manager_neonix_bot';
    const code = randomBytes(6).toString('hex').slice(0, 8).toUpperCase();
    LINK_CODES.set(code, { userId, botName, createdAt: Date.now() });

    return { code, botName, expiresAt: new Date(Date.now() + CODE_TTL_MS).toISOString() };
  }

  async validateLinkCode(code: string): Promise<{ userId: string; botName: string } | null> {
    const entry = LINK_CODES.get(code.toUpperCase());
    if (!entry) return null;
    if (entry.createdAt + CODE_TTL_MS < Date.now()) {
      LINK_CODES.delete(code.toUpperCase());
      return null;
    }
    LINK_CODES.delete(code.toUpperCase());
    return { userId: entry.userId, botName: entry.botName };
  }

  async storePendingLink(userId: string, chatId: number, telegramUserId?: number) {
    if (telegramUserId) {
      PENDING_LINKS.set(telegramUserId, { userId, telegramUserId, createdAt: Date.now() });
    }
    PENDING_LINKS.set(chatId, { userId, telegramUserId, createdAt: Date.now() });
  }

  async findPendingLinkByTelegramUserId(telegramUserId: number) {
    const entry = PENDING_LINKS.get(telegramUserId);
    if (!entry) return null;
    if (Date.now() - entry.createdAt > 30 * 60 * 1000) {
      PENDING_LINKS.delete(telegramUserId);
      return null;
    }
    return entry;
  }

  async findPendingLinkByChatId(chatId: number) {
    const entry = PENDING_LINKS.get(chatId);
    if (!entry) return null;
    if (Date.now() - entry.createdAt > 30 * 60 * 1000) {
      PENDING_LINKS.delete(chatId);
      return null;
    }
    return entry;
  }

  async clearPendingLink(chatId: number) {
    PENDING_LINKS.delete(chatId);
  }

  async revokeByExternalId(externalId: string, platform = 'telegram') {
    await this.prisma.socialAccount.updateMany({
      where: { externalId, platform },
      data: { status: 'revoked' },
    });
  }

  async addChannel(
    userId: string,
    data: {
      externalId: string;
      title: string;
      username?: string;
      memberCount?: number;
      platform?: string;
      platformBotName?: string;
      metadata?: Record<string, unknown>;
    },
  ) {
    const platform = data.platform ?? 'telegram';

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Пользователь не найден');

    const existing = await this.prisma.socialAccount.findFirst({
      where: { externalId: data.externalId, platform },
    });

    if (existing) {
      if (existing.userId === userId) {
        const updateData: Record<string, unknown> = {
          title: data.title,
          username: data.username ?? existing.username,
          status: 'active',
        };
        if (data.memberCount) {
          updateData.metadata = { memberCount: data.memberCount };
        }
        return this.prisma.socialAccount.update({
          where: { id: existing.id },
          data: updateData,
        });
      }
      throw new BadRequestException('Этот канал уже привязан к другому аккаунту');
    }

    const existingCount = await this.prisma.socialAccount.count({
      where: { userId, platform, status: 'active' },
    });

    const limitCheck = await this.promoService.checkAccountLimit(userId, platform);
    if (!limitCheck.allowed) {
      throw new BadRequestException(
        `Достигнут лимит ${platform} аккаунтов (${limitCheck.max}) для вашего тарифа. Обновите план для увеличения лимита.`,
      );
    }

    return this.prisma.socialAccount.create({
      data: {
        userId,
        externalId: data.externalId,
        title: data.title,
        username: data.username ?? null,
        platform,
        platformBotName: data.platformBotName ?? null,
        metadata: (data.metadata as any) ?? undefined,
      },
    });
  }

  async listChannels(userId: string) {
    return this.prisma.socialAccount.findMany({
      where: { userId },
      orderBy: { linkedAt: 'desc' },
    });
  }

  async getChannel(userId: string, channelId: string) {
    const ch = await this.prisma.socialAccount.findFirst({
      where: { id: channelId, userId },
    });
    if (!ch) throw new NotFoundException('Канал не найден');
    return ch;
  }

  async updateChannel(userId: string, channelId: string, dto: UpdateChannelDto) {
    await this.getChannel(userId, channelId);
    return this.prisma.socialAccount.update({
      where: { id: channelId },
      data: { title: dto.title, username: dto.username },
    });
  }

  async removeChannel(userId: string, channelId: string) {
    await this.getChannel(userId, channelId);
    return this.prisma.socialAccount.update({
      where: { id: channelId },
      data: { status: 'revoked' },
    });
  }
}
