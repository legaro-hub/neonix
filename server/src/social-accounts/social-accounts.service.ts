import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
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

@Injectable()
export class SocialAccountsService {
  private readonly logger = new Logger(SocialAccountsService.name);

  constructor(private readonly prisma: PrismaService) {}

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
    PENDING_LINKS.set(chatId, { userId, telegramUserId, createdAt: Date.now() });
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

  async revokeByExternalId(externalId: string) {
    await this.prisma.socialAccount.updateMany({
      where: { externalId, platform: 'telegram' },
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
    },
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Пользователь не найден');

    const existing = await this.prisma.socialAccount.findFirst({
      where: { externalId: data.externalId, platform: 'telegram' },
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
      where: { userId, status: 'active' },
    });

    const maxChannels = user.role === 'admin' || user.role === 'superadmin' ? Infinity : 1;
    if (existingCount >= maxChannels) {
      throw new BadRequestException('Достигнут лимит каналов для вашего тарифа');
    }

    return this.prisma.socialAccount.create({
      data: {
        userId,
        externalId: data.externalId,
        title: data.title,
        username: data.username ?? null,
        platform: 'telegram',
        platformBotName: process.env.TG_BOT_NAME ?? 'manager_neonix_bot',
        metadata: data.memberCount ? { memberCount: data.memberCount } : undefined,
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
