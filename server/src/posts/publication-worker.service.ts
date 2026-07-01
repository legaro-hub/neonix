import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { readFileSync } from 'fs';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { DriverRegistry } from '../common/drivers/driver-registry';
import type { MediaDescriptor } from '../common/interfaces/social-driver.interface';

@Injectable()
export class PublicationWorkerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PublicationWorkerService.name);
  private timer: ReturnType<typeof setInterval> | null = null;
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;
  private processing = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly emailService: EmailService,
    private readonly driverRegistry: DriverRegistry,
  ) {}

  onModuleInit() {
    const interval = this.config.get<number>('WORKER_INTERVAL_MS') ?? 30000;
    this.logger.log(`Starting publication worker (interval: ${interval}ms)`);
    this.timer = setInterval(() => this.processDuePublications(), interval);
    this.processDuePublications();

    const cleanupInterval = this.config.get<number>('CLEANUP_INTERVAL_MS') ?? 3600000;
    this.logger.log(`Starting media cleanup worker (interval: ${cleanupInterval}ms)`);
    this.cleanupTimer = setInterval(() => this.cleanupOldMedia(), cleanupInterval);
    this.cleanupOldMedia();
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
    if (this.cleanupTimer) clearInterval(this.cleanupTimer);
  }

  private async processDuePublications() {
    if (this.processing) return;
    this.processing = true;

    try {
      const now = new Date();
      const duePublications = await this.prisma.postPublication.findMany({
        where: {
          status: 'queued',
          scheduledAt: { lte: now },
        },
        include: {
          post: true,
          socialAccount: true,
        },
        orderBy: { scheduledAt: 'asc' },
        take: 10,
      });

      if (duePublications.length === 0) {
        this.processing = false;
        return;
      }

      this.logger.log(`Found ${duePublications.length} due publications`);

      for (const pub of duePublications) {
        await this.publishOne(pub);
      }
    } catch (err) {
      this.logger.error(`Worker error: ${err}`);
    } finally {
      this.processing = false;
    }
  }

  private async cleanupOldMedia() {
    try {
      const retentionDays = this.config.get<number>('MEDIA_RETENTION_DAYS') ?? 90;
      const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
      const uploadDir = this.config.get<string>('UPLOAD_DIR') ?? '/app/uploads';

      const postsWithOldMedia = await this.prisma.post.findMany({
        where: {
          publications: {
            some: {
              status: 'published',
              publishedAt: { lt: cutoff },
            },
          },
          media: { some: {} },
        },
        include: {
          media: true,
          publications: { select: { status: true, publishedAt: true } },
        },
      });

      let deletedCount = 0;
      for (const post of postsWithOldMedia) {
        const allPublished = post.publications.every((p) => p.status === 'published');
        if (!allPublished) continue;

        const latestPublished = post.publications
          .filter((p) => p.publishedAt)
          .sort((a, b) => (b.publishedAt!.getTime() - a.publishedAt!.getTime()))[0];

        if (!latestPublished || latestPublished.publishedAt! > cutoff) continue;

        for (const asset of post.media) {
          const filepath = join(uploadDir, asset.storageKey);
          await unlink(filepath).catch(() => {});
        }

        await this.prisma.mediaAsset.deleteMany({ where: { postId: post.id } });
        deletedCount++;
        this.logger.log(`Cleaned up media for post ${post.id} (published ${latestPublished.publishedAt?.toISOString()})`);
      }

      if (deletedCount > 0) {
        this.logger.log(`Media cleanup: removed files for ${deletedCount} posts older than ${retentionDays} days`);
      }
    } catch (err) {
      this.logger.error(`Media cleanup error: ${err}`);
    }
  }

  private async publishOne(pub: any) {
    const { id, post, socialAccount } = pub;

    this.logger.log(`Publishing post ${post.id} to ${socialAccount.title} (${socialAccount.externalId}) [${socialAccount.platform}]`);

    await this.prisma.postPublication.update({
      where: { id },
      data: { status: 'in_progress', attempts: { increment: 1 } },
    });

    try {
      let result: { ok: boolean; messageId?: number; externalId?: string; externalUrl?: string; description?: string };

      if (socialAccount.platform === 'telegram') {
        result = await this.publishToTelegram(socialAccount, post);
      } else if (this.driverRegistry.has(socialAccount.platform)) {
        const media = await this.prisma.mediaAsset.findMany({
          where: { postId: post.id },
          orderBy: { ord: 'asc' },
        });
        const driver = this.driverRegistry.get(socialAccount.platform);
        const meta = (socialAccount.metadata as Record<string, unknown>) ?? {};
        const pubResult = await driver.publish(
          {
            id: socialAccount.id,
            externalId: socialAccount.externalId,
            title: socialAccount.title,
            username: socialAccount.username,
            metadata: meta,
            accessToken: meta.accessToken as string | undefined,
            refreshToken: meta.refreshToken as string | undefined,
          },
          {
            title: post.title,
            body: post.body,
            media: media.map((m) => ({
              kind: m.kind as 'image' | 'video' | 'document',
              storageKey: m.storageKey,
              mimeType: m.mimeType,
              filename: m.filename,
            })),
          },
        );
        result = {
          ok: pubResult.ok,
          externalId: pubResult.externalId,
          externalUrl: pubResult.externalUrl,
          description: pubResult.error,
        };
      } else {
        throw new Error(`Платформа не поддерживается: ${socialAccount.platform}`);
      }

      if (result.ok) {
        await this.prisma.postPublication.update({
          where: { id },
          data: {
            status: 'published',
            publishedAt: new Date(),
            externalId: String(result.externalId ?? result.messageId),
            externalUrl: result.externalUrl,
          },
        });
        this.logger.log(`Post ${post.id} published successfully to ${socialAccount.title}`);

        try {
          const user = await this.prisma.user.findUnique({ where: { id: post.userId } });
          if (user) {
            await this.emailService.sendPublicationSuccess(
              user.email,
              user.name || 'Пользователь',
              post.title || 'Без заголовка',
              socialAccount.title,
              result.externalUrl || `${this.config.get('APP_URL')}/app/posts/${post.id}`,
            );
          }
        } catch { /* email is best-effort */ }
      } else {
        throw new Error(result.description || 'Publishing API error');
      }
    } catch (err: any) {
      const maxAttempts = 3;
      const attempts = pub.attempts + 1;

      if (attempts < maxAttempts) {
        const delay = Math.pow(2, attempts) * 60000;
        const nextRetry = new Date(Date.now() + delay);

        await this.prisma.postPublication.update({
          where: { id },
          data: {
            status: 'queued',
            scheduledAt: nextRetry,
            errorCode: String(err.errorCode || 'UNKNOWN'),
            errorMessage: err.message || 'Unknown error',
          },
        });

        this.logger.warn(`Post ${post.id} failed (attempt ${attempts}/${maxAttempts}), retry at ${nextRetry.toISOString()}: ${err.message}`);
      } else {
        await this.prisma.postPublication.update({
          where: { id },
          data: {
            status: 'failed',
            errorCode: String(err.errorCode || 'UNKNOWN'),
            errorMessage: err.message || 'Unknown error',
          },
        });
        this.logger.error(`Post ${post.id} failed permanently after ${maxAttempts} attempts: ${err.message}`);

        try {
          const user = await this.prisma.user.findUnique({ where: { id: post.userId } });
          if (user) {
            await this.emailService.sendPublicationFailed(
              user.email,
              user.name || 'Пользователь',
              post.title || 'Без заголовка',
              socialAccount.title,
              err.message || 'Неизвестная ошибка',
            );
          }
        } catch { /* email is best-effort */ }
      }
    }
  }

  private async publishToTelegram(socialAccount: any, post: any) {
    const token = this.config.get<string>('TG_BOT_TOKEN');
    if (!token) throw new Error('TG_BOT_TOKEN not set');

    const chatId = socialAccount.externalId;
    const text = this.formatPostText(post.title, post.body);
    const buttons = post.buttons as Array<{ text: string; url: string }> | null;

    const media = await this.prisma.mediaAsset.findMany({
      where: { postId: post.id },
      orderBy: { ord: 'asc' },
    });

    let result;
    if (media.length === 0) {
      result = await this.sendTelegramMessage(token, chatId, text, buttons);
    } else if (media.length === 1) {
      const file = media[0];
      if (file.kind === 'video') {
        result = await this.sendTelegramVideo(token, chatId, file, text, buttons);
      } else {
        result = await this.sendTelegramPhoto(token, chatId, file, text, buttons);
      }
    } else {
      result = await this.sendTelegramMediaGroup(token, chatId, media, text);
    }

    return {
      ok: result.ok,
      messageId: result.messageId,
      description: result.description,
    };
  }

  private formatPostText(title: string | null, body: string): string {
    let text = this.markdownToHtml(body);
    if (title) {
      text = `<b>${this.escapeHtml(title)}</b>\n\n${text}`;
    }
    return text;
  }

  private markdownToHtml(md: string): string {
    let html = md;
    html = html.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
    html = html.replace(/\*(.+?)\*/g, '<i>$1</i>');
    html = html.replace(/_(.+?)_/g, '<i>$1</i>');
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    html = html.replace(/^> (.+)$/gm, '<i>$1</i>');
    html = html.replace(/^---$/gm, '──────────');
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
    return html;
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  private async sendTelegramMessage(
    token: string,
    chatId: string,
    text: string,
    buttons?: Array<{ text: string; url: string }> | null,
  ): Promise<{ ok: boolean; messageId?: number; description?: string }> {
    const payload: Record<string, unknown> = {
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: false,
    };
    if (buttons && buttons.length > 0) {
      payload.reply_markup = {
        inline_keyboard: buttons.map((b) => [{ text: b.text, url: b.url }]),
      };
    }
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json() as any;

    if (data.ok) {
      return { ok: true, messageId: data.result?.message_id };
    }

    return {
      ok: false,
      description: data.description || 'Unknown error',
    };
  }

  private async sendTelegramPhoto(
    token: string,
    chatId: string,
    file: any,
    caption: string,
    buttons?: Array<{ text: string; url: string }> | null,
  ): Promise<{ ok: boolean; messageId?: number; description?: string }> {
    const uploadDir = this.config.get<string>('UPLOAD_DIR') ?? '/app/uploads';
    const filepath = `${uploadDir}/${file.storageKey}`;

    try {
      const fileBuffer = readFileSync(filepath);
      const formData = new FormData();
      formData.append('chat_id', chatId);
      formData.append('photo', new Blob([fileBuffer], { type: file.mimeType }), file.filename);
      formData.append('caption', caption);
      formData.append('parse_mode', 'HTML');
      if (buttons && buttons.length > 0) {
        formData.append('reply_markup', JSON.stringify({
          inline_keyboard: buttons.map((b) => [{ text: b.text, url: b.url }]),
        }));
      }

      const res = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json() as any;
      if (data.ok) return { ok: true, messageId: data.result?.message_id };
      return { ok: false, description: data.description || 'Unknown error' };
    } catch (err: any) {
      return { ok: false, description: err.message || 'File read error' };
    }
  }

  private async sendTelegramVideo(
    token: string,
    chatId: string,
    file: any,
    caption: string,
    buttons?: Array<{ text: string; url: string }> | null,
  ): Promise<{ ok: boolean; messageId?: number; description?: string }> {
    const uploadDir = this.config.get<string>('UPLOAD_DIR') ?? '/app/uploads';
    const filepath = `${uploadDir}/${file.storageKey}`;

    try {
      const fileBuffer = readFileSync(filepath);
      const formData = new FormData();
      formData.append('chat_id', chatId);
      formData.append('video', new Blob([fileBuffer], { type: file.mimeType }), file.filename);
      formData.append('caption', caption);
      formData.append('parse_mode', 'HTML');
      if (buttons && buttons.length > 0) {
        formData.append('reply_markup', JSON.stringify({
          inline_keyboard: buttons.map((b) => [{ text: b.text, url: b.url }]),
        }));
      }

      const res = await fetch(`https://api.telegram.org/bot${token}/sendVideo`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json() as any;
      if (data.ok) return { ok: true, messageId: data.result?.message_id };
      return { ok: false, description: data.description || 'Unknown error' };
    } catch (err: any) {
      return { ok: false, description: err.message || 'File read error' };
    }
  }

  private async sendTelegramMediaGroup(
    token: string,
    chatId: string,
    media: any[],
    caption: string,
  ): Promise<{ ok: boolean; messageId?: number; description?: string }> {
    const uploadDir = this.config.get<string>('UPLOAD_DIR') ?? '/app/uploads';
    const formData = new FormData();
    formData.append('chat_id', chatId);

    const mediaJson: any[] = [];
    for (let i = 0; i < Math.min(media.length, 10); i++) {
      const file = media[i];
      const filepath = `${uploadDir}/${file.storageKey}`;
      const fileBuffer = readFileSync(filepath);
      const blob = new Blob([fileBuffer], { type: file.mimeType });
      formData.append(`file${i}`, blob, file.filename);
      const type = file.kind === 'video' ? 'video' : 'photo';
      const item: any = { type, media: `attach://file${i}` };
      if (i === 0) {
        item.caption = caption;
        item.parse_mode = 'HTML';
      }
      mediaJson.push(item);
    }

    formData.append('media', JSON.stringify(mediaJson));

    const res = await fetch(`https://api.telegram.org/bot${token}/sendMediaGroup`, {
      method: 'POST',
      body: formData,
    });

    const data = await res.json() as any;
    if (data.ok) return { ok: true, messageId: data.result?.[0]?.message_id };
    return { ok: false, description: data.description || 'Unknown error' };
  }
}
