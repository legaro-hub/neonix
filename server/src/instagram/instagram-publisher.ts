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
import { InstagramAuthService } from './instagram-auth.service';

@Injectable()
export class InstagramPublisher implements SocialDriver {
  readonly platform = 'instagram';
  private readonly logger = new Logger(InstagramPublisher.name);
  private readonly uploadDir: string;

  constructor(private readonly authService: InstagramAuthService) {
    this.uploadDir = process.env.UPLOAD_DIR ?? '/app/uploads';
  }

  async publish(account: SocialAccountData, post: UnifiedPost): Promise<PublishResult> {
    try {
      const token = await this.authService.resolveToken(account.accessToken);
      const igUserId = account.externalId;

      const images = post.media.filter((m) => m.kind === 'image');
      const video = post.media.find((m) => m.kind === 'video');

      const caption = this.buildCaption(post);

      if (video) {
        return await this.publishVideo(token, igUserId, post, video, caption);
      }

      if (images.length > 1) {
        return await this.publishCarousel(token, igUserId, post, images, caption);
      }

      if (images.length === 1) {
        return await this.publishImage(token, igUserId, post, images[0], caption);
      }

      return { ok: false, error: 'Нет медиа для публикации в Instagram' };
    } catch (err: any) {
      this.logger.error(`Instagram publish error: ${err.message}`);
      return { ok: false, error: err.message };
    }
  }

  private buildCaption(post: UnifiedPost): string {
    let caption = '';
    if (post.title) caption += post.title + '\n\n';
    if (post.body) caption += post.body;
    return caption.slice(0, 2200);
  }

  private async uploadImageToServer(image: { storageKey: string; mimeType: string | null; filename: string }): Promise<string> {
    const filepath = join(this.uploadDir, image.storageKey);
    const buffer = readFileSync(filepath);
    const base64 = buffer.toString('base64');
    const mimeType = image.mimeType ?? 'image/jpeg';
    return `data:${mimeType};base64,${base64}`;
  }

  private async publishImage(
    token: string,
    igUserId: string,
    _post: UnifiedPost,
    image: { storageKey: string; mimeType: string | null; filename: string },
    caption: string,
  ): Promise<PublishResult> {
    const imageDataUrl = await this.uploadImageToServer(image);

    const container = await this.authService.createImageContainer(
      token, igUserId, imageDataUrl, caption,
    );

    const publishResult = await this.authService.publishContainer(
      token, igUserId, container.id,
    );

    return {
      ok: true,
      externalId: publishResult.id,
      externalUrl: `https://instagram.com/p/${publishResult.id}`,
    };
  }

  private async publishCarousel(
    token: string,
    igUserId: string,
    _post: UnifiedPost,
    images: Array<{ storageKey: string; mimeType: string | null; filename: string }>,
    caption: string,
  ): Promise<PublishResult> {
    const childIds: string[] = [];

    for (const img of images.slice(0, 10)) {
      const imageDataUrl = await this.uploadImageToServer(img);
      const child = await this.authService.createImageContainer(token, igUserId, imageDataUrl, '');
      childIds.push(child.id);
    }

    const container = await this.authService.createCarouselContainer(
      token, igUserId, childIds, caption,
    );

    const publishResult = await this.authService.publishContainer(
      token, igUserId, container.id,
    );

    return {
      ok: true,
      externalId: publishResult.id,
      externalUrl: `https://instagram.com/p/${publishResult.id}`,
    };
  }

  private async publishVideo(
    token: string,
    igUserId: string,
    _post: UnifiedPost,
    video: { storageKey: string; mimeType: string | null; filename: string },
    caption: string,
  ): Promise<PublishResult> {
    const filepath = join(this.uploadDir, video.storageKey);
    const buffer = readFileSync(filepath);
    const base64 = buffer.toString('base64');
    const mimeType = video.mimeType ?? 'video/mp4';
    const videoDataUrl = `data:${mimeType};base64,${base64}`;

    const container = await this.authService.createVideoContainer(
      token, igUserId, videoDataUrl, caption,
    );

    for (let i = 0; i < 60; i++) {
      await new Promise((r) => setTimeout(r, 3000));
      const status = await this.authService.getContainerStatus(token, container.id);
      if (status.status_code === 'FINISHED') break;
      if (status.status_code === 'ERROR') throw new Error('Ошибка обработки видео');
    }

    const publishResult = await this.authService.publishContainer(
      token, igUserId, container.id,
    );

    return {
      ok: true,
      externalId: publishResult.id,
      externalUrl: `https://instagram.com/reel/${publishResult.id}`,
    };
  }

  async delete(account: SocialAccountData, externalId: string): Promise<void> {
    const token = await this.authService.resolveToken(account.accessToken);
    await this.authService.deleteMedia(token, externalId);
  }

  async fetchMetrics(account: SocialAccountData, externalId: string): Promise<Metrics> {
    const token = await this.authService.resolveToken(account.accessToken);
    try {
      const data = await this.authService.getMediaInsights(
        token, externalId, 'impressions,reach,engagement,saved',
      );
      const metrics: Record<string, number> = {};
      for (const item of (data.data ?? [])) {
        metrics[item.name] = item.values?.[0]?.value ?? 0;
      }
      return {
        impressions: metrics.impressions,
        likes: metrics.engagement,
        saves: metrics.saved,
        views: metrics.reach,
      };
    } catch {
      return {};
    }
  }
}
