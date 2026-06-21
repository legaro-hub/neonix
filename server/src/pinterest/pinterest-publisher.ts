import { Injectable, Logger } from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';
import type {
  SocialDriver,
  SocialAccountData,
  UnifiedPost,
  PublishResult,
  Metrics,
} from '../common/interfaces/social-driver.interface';
import { PinterestAuthService } from './pinterest-auth.service';

@Injectable()
export class PinterestPublisher implements SocialDriver {
  readonly platform = 'pinterest';
  private readonly logger = new Logger(PinterestPublisher.name);
  private readonly uploadDir: string;

  constructor(private readonly authService: PinterestAuthService) {
    this.uploadDir = process.env.UPLOAD_DIR ?? '/app/uploads';
  }

  async publish(
    account: SocialAccountData,
    post: UnifiedPost,
  ): Promise<PublishResult> {
    try {
      const token = await this.authService.resolveToken(
        account.accessToken,
        account.refreshToken,
      );

      const boardId = (account.metadata as Record<string, unknown>)?.boardId as string | undefined;
      if (!boardId) {
        return { ok: false, error: 'Доска не выбрана для Pinterest' };
      }

      const images = post.media.filter((m) => m.kind === 'image');
      const video = post.media.find((m) => m.kind === 'video');

      if (video) {
        return await this.createVideoPin(token, boardId, post, video);
      }

      if (images.length > 1) {
        return await this.createMultiImagePin(token, boardId, post, images);
      }

      if (images.length === 1) {
        return await this.createImagePin(token, boardId, post, images[0]);
      }

      return await this.createImagePin(token, boardId, post, undefined);
    } catch (err: any) {
      this.logger.error(`Pinterest publish error: ${err.message}`);
      return { ok: false, error: err.message };
    }
  }

  private buildBaseBody(boardId: string, post: UnifiedPost, link?: string): Record<string, unknown> {
    return {
      board_id: boardId,
      title: (post.title || post.body || '').slice(0, 100),
      description: (post.body || '').slice(0, 800),
      link: link || undefined,
    };
  }

  private async createImagePin(
    token: string,
    boardId: string,
    post: UnifiedPost,
    image?: { storageKey: string; mimeType: string | null; filename: string },
    link?: string,
  ): Promise<PublishResult> {
    const body = this.buildBaseBody(boardId, post, link);

    if (image) {
      const filepath = join(this.uploadDir, image.storageKey);
      const buffer = readFileSync(filepath);
      body.media_source = {
        source_type: 'image_base64',
        content_type: image.mimeType ?? 'image/jpeg',
        data: buffer.toString('base64'),
      };
    } else {
      return { ok: false, error: 'Нет изображения для пина' };
    }

    const result = await this.authService.createPin(token, body as any);
    return {
      ok: true,
      externalId: result.id,
      externalUrl: `https://pinterest.com/pin/${result.id}`,
    };
  }

  private async createMultiImagePin(
    token: string,
    boardId: string,
    post: UnifiedPost,
    images: Array<{ storageKey: string; mimeType: string | null; filename: string }>,
    link?: string,
  ): Promise<PublishResult> {
    const body = this.buildBaseBody(boardId, post, link);

    body.media_source = {
      source_type: 'multiple_image_base64',
      items: images.slice(0, 5).map((img) => {
        const filepath = join(this.uploadDir, img.storageKey);
        const buffer = readFileSync(filepath);
        return {
          content_type: img.mimeType ?? 'image/jpeg',
          data: buffer.toString('base64'),
        };
      }),
    };

    const result = await this.authService.createPin(token, body as any);
    return {
      ok: true,
      externalId: result.id,
      externalUrl: `https://pinterest.com/pin/${result.id}`,
    };
  }

  private async createVideoPin(
    token: string,
    boardId: string,
    post: UnifiedPost,
    video: { storageKey: string; mimeType: string | null; filename: string },
    link?: string,
  ): Promise<PublishResult> {
    const reg = await this.authService.registerMedia(token);

    const filepath = join(this.uploadDir, video.storageKey);
    const fileBuffer = readFileSync(filepath);

    await this.authService.uploadToS3(
      reg.upload_url,
      reg.upload_parameters,
      fileBuffer,
      video.mimeType ?? 'video/mp4',
    );

    let status = 'processing';
    for (let i = 0; i < 60; i++) {
      await new Promise((r) => setTimeout(r, 3000));
      const media = await this.authService.getMediaStatus(token, reg.media_id);
      status = media.status ?? 'processing';
      if (status === 'succeeded') break;
      if (status === 'failed') throw new Error('Обработка видео не удалась');
    }

    if (status !== 'succeeded') {
      throw new Error('Таймаут обработки видео');
    }

    const body = this.buildBaseBody(boardId, post, link);
    body.media_source = {
      source_type: 'video_id',
      media_id: reg.media_id,
    };

    const result = await this.authService.createPin(token, body as any);
    return {
      ok: true,
      externalId: result.id,
      externalUrl: `https://pinterest.com/pin/${result.id}`,
    };
  }

  async delete(account: SocialAccountData, externalId: string): Promise<void> {
    const token = await this.authService.resolveToken(account.accessToken, account.refreshToken);
    await this.authService.deletePin(token, externalId);
  }

  async fetchMetrics(account: SocialAccountData, externalId: string): Promise<Metrics> {
    const token = await this.authService.resolveToken(account.accessToken, account.refreshToken);
    const now = new Date();
    const endDate = now.toISOString().split('T')[0];
    const startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const data = await this.authService.getPinAnalytics(token, externalId, startDate, endDate);
    const values = data?.[0]?.metrics ?? {};

    return {
      impressions: values.IMPRESSIONS,
      saves: values.SAVES,
      likes: values.PIN_CLICKS,
      comments: values.OUTBOUND_CLICKS,
    };
  }
}
