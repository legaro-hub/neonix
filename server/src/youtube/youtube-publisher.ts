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
import { YouTubeAuthService } from './youtube-auth.service';

@Injectable()
export class YouTubePublisher implements SocialDriver {
  readonly platform = 'youtube';
  private readonly logger = new Logger(YouTubePublisher.name);
  private readonly uploadDir: string;

  constructor(private readonly authService: YouTubeAuthService) {
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

      const video = post.media.find((m) => m.kind === 'video');
      if (!video) {
        return { ok: false, error: 'Нет видеофайла для YouTube' };
      }

      const filepath = join(this.uploadDir, video.storageKey);
      const fileBuffer = readFileSync(filepath);

      const title = (post.title || post.body || '').slice(0, 100);
      const description = (post.body || '').slice(0, 5000);
      const tags = this.extractTags(post.body || '');
      const meta = (account.metadata as Record<string, unknown>) ?? {};
      const privacy = (meta.privacy as string) || 'public';
      const categoryId = (meta.categoryId as string) || '22';

      const result = await this.authService.uploadVideo(
        token,
        title,
        description,
        tags,
        categoryId,
        privacy as 'public' | 'unlisted' | 'private',
        fileBuffer,
        video.mimeType ?? 'video/mp4',
      );

      return {
        ok: true,
        externalId: result.id,
        externalUrl: result.url,
      };
    } catch (err: any) {
      this.logger.error(`YouTube publish error: ${err.message}`);
      return { ok: false, error: err.message };
    }
  }

  private extractTags(text: string): string[] {
    const hashtags = text.match(/#[\w\u0400-\u04FF]+/g) ?? [];
    return hashtags.map((t) => t.slice(1)).slice(0, 30);
  }

  async delete(account: SocialAccountData, externalId: string): Promise<void> {
    const token = await this.authService.resolveToken(account.accessToken, account.refreshToken);
    await this.authService.deleteVideo(token, externalId);
  }

  async fetchMetrics(account: SocialAccountData, externalId: string): Promise<Metrics> {
    const token = await this.authService.resolveToken(account.accessToken, account.refreshToken);

    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${externalId}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );

    if (!res.ok) return {};

    const data = (await res.json()) as {
      items?: Array<{
        statistics?: {
          viewCount?: string;
          likeCount?: string;
          commentCount?: string;
        };
      }>;
    };

    const stats = data.items?.[0]?.statistics ?? {};
    return {
      views: parseInt(stats.viewCount ?? '0', 10),
      likes: parseInt(stats.likeCount ?? '0', 10),
      comments: parseInt(stats.commentCount ?? '0', 10),
    };
  }
}
