import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PostsService {
  private readonly logger = new Logger(PostsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string, from?: string, to?: string, socialAccountId?: string) {
    const where: any = { userId };
    if (from || to) {
      where.scheduledAt = {};
      if (from) where.scheduledAt.gte = new Date(from);
      if (to) where.scheduledAt.lte = new Date(to);
    }

    if (socialAccountId) {
      where.publications = { some: { socialAccountId } };
    }

    return this.prisma.post.findMany({
      where,
      include: {
        media: { orderBy: { ord: 'asc' } },
        publications: {
          include: { socialAccount: { select: { id: true, title: true, username: true, platform: true } } },
        },
      },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  async getOne(userId: string, postId: string) {
    const post = await this.prisma.post.findFirst({
      where: { id: postId, userId },
      include: {
        media: { orderBy: { ord: 'asc' } },
        publications: {
          include: { socialAccount: { select: { id: true, title: true, username: true, platform: true } } },
        },
      },
    });
    if (!post) throw new NotFoundException('Пост не найден');
    return post;
  }

  async create(userId: string, data: {
    title?: string;
    body: string;
    scheduledAt?: string;
    socialAccountIds: string[];
  }) {
    const isDraft = !data.scheduledAt && data.socialAccountIds.length === 0;
    if (!isDraft && !data.body.trim() && data.socialAccountIds.length === 0) {
      throw new BadRequestException('Текст или хотя бы один канал обязательны');
    }

    if (data.socialAccountIds.length > 0) {
      const validAccounts = await this.prisma.socialAccount.findMany({
        where: { id: { in: data.socialAccountIds }, userId, status: 'active' },
        select: { id: true },
      });
      if (validAccounts.length !== data.socialAccountIds.length) {
        throw new BadRequestException('Один или несколько каналов не принадлежат вам');
      }
    }

    const post = await this.prisma.post.create({
      data: {
        userId,
        title: data.title || null,
        body: data.body,
        status: data.scheduledAt ? 'scheduled' : 'draft',
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
        publications: {
          create: data.socialAccountIds.map((saId) => ({
            socialAccountId: saId,
            status: data.scheduledAt ? 'queued' : 'draft',
            scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : new Date(),
          })),
        },
      },
      include: {
        media: true,
        publications: {
          include: { socialAccount: { select: { id: true, title: true, username: true } } },
        },
      },
    });

    return post;
  }

  async update(userId: string, postId: string, data: {
    title?: string;
    body?: string;
    scheduledAt?: string | null;
    socialAccountIds?: string[];
  }) {
    const existing = await this.prisma.post.findFirst({ where: { id: postId, userId } });
    if (!existing) throw new NotFoundException('Пост не найден');

    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.body !== undefined) updateData.body = data.body;
    if (data.scheduledAt !== undefined) {
      updateData.scheduledAt = data.scheduledAt ? new Date(data.scheduledAt) : null;
      updateData.status = data.scheduledAt ? 'scheduled' : 'draft';
    }

    if (data.socialAccountIds) {
      const validAccounts = await this.prisma.socialAccount.findMany({
        where: { id: { in: data.socialAccountIds }, userId, status: 'active' },
        select: { id: true },
      });
      if (validAccounts.length !== data.socialAccountIds.length) {
        throw new BadRequestException('Один или несколько каналов не принадлежат вам');
      }

      await this.prisma.$transaction([
        this.prisma.postPublication.deleteMany({ where: { postId } }),
        this.prisma.postPublication.createMany({
          data: data.socialAccountIds.map((saId) => ({
            postId,
            socialAccountId: saId,
            status: data.scheduledAt ? 'queued' : 'draft',
            scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : new Date(),
          })),
        }),
      ]);
    }

    return this.prisma.post.update({
      where: { id: postId },
      data: updateData,
      include: {
        media: { orderBy: { ord: 'asc' } },
        publications: {
          include: { socialAccount: { select: { id: true, title: true, username: true } } },
        },
      },
    });
  }

  async delete(userId: string, postId: string) {
    const existing = await this.prisma.post.findFirst({ where: { id: postId, userId } });
    if (!existing) throw new NotFoundException('Пост не найден');
    await this.prisma.post.delete({ where: { id: postId } });
    return { success: true };
  }

  async getCalendar(userId: string, month: string) {
    const start = new Date(month + '-01');
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);

    const posts = await this.prisma.post.findMany({
      where: {
        userId,
        scheduledAt: { gte: start, lt: end },
      },
      include: {
        media: { select: { id: true, kind: true, filename: true } },
        publications: {
          select: { id: true, status: true, socialAccount: { select: { id: true, title: true } } },
        },
      },
      orderBy: { scheduledAt: 'asc' },
    });

    return posts;
  }

  async createBulk(userId: string, posts: Array<{
    title?: string;
    body: string;
    scheduledAt: string;
    channelTitles: string[];
  }>) {
    const channels = await this.prisma.socialAccount.findMany({
      where: { userId, status: 'active' },
    });

    const channelMap = new Map(channels.map((c) => [c.title.toLowerCase(), c.id]));

    const results = [];
    for (const item of posts) {
      const accountIds = item.channelTitles
        .map((t) => channelMap.get(t.toLowerCase().trim()))
        .filter(Boolean) as string[];

      if (accountIds.length === 0) {
        results.push({ error: `Каналы не найдены для: ${item.channelTitles.join(', ')}`, body: item.body });
        continue;
      }

      const post = await this.create(userId, {
        title: item.title,
        body: item.body,
        scheduledAt: item.scheduledAt,
        socialAccountIds: accountIds,
      });
      results.push({ success: true, postId: post.id });
    }

    return results;
  }
}
