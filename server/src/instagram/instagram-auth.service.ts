import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

const FB_API = 'https://graph.facebook.com/v19.0';

@Injectable()
export class InstagramAuthService implements OnModuleInit {
  private readonly logger = new Logger(InstagramAuthService.name);
  private appId = '';
  private appSecret = '';
  private redirectUri = '';

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    this.appId = this.config.get<string>('INSTAGRAM_APP_ID') ?? '';
    this.appSecret = this.config.get<string>('INSTAGRAM_APP_SECRET') ?? '';
    this.redirectUri = (this.config.get<string>('APP_URL') ?? 'https://neonix.online') + '/api/instagram/callback';
    if (!this.appId || !this.appSecret) {
      this.logger.warn('Instagram OAuth not configured');
    }
  }

  isConfigured(): boolean {
    return !!(this.appId && this.appSecret);
  }

  getAuthUrl(state: string): string {
    const scopes = [
      'instagram_basic',
      'instagram_content_publish',
      'pages_show_list',
      'pages_read_engagement',
      'instagram_manage_insights',
    ];
    return (
      `https://www.facebook.com/v19.0/dialog/oauth` +
      `?client_id=${this.appId}` +
      `&redirect_uri=${encodeURIComponent(this.redirectUri)}` +
      `&scope=${encodeURIComponent(scopes.join(','))}` +
      `&response_type=code` +
      `&state=${state}`
    );
  }

  generateState(userId: string): string {
    const payload = { userId, ts: Date.now(), platform: 'instagram' };
    const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const sig = crypto.createHmac('sha256', this.appSecret).update(encoded).digest('base64url');
    return `${encoded}.${sig}`;
  }

  verifyState(state: string): string | null {
    try {
      const [encoded, sig] = state.split('.');
      if (!encoded || !sig) return null;
      const expected = crypto.createHmac('sha256', this.appSecret).update(encoded).digest('base64url');
      if (sig !== expected) return null;
      const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString());
      if (Date.now() - payload.ts > 10 * 60 * 1000) return null;
      return payload.userId;
    } catch {
      return null;
    }
  }

  private async fbApi(path: string, params: Record<string, string> = {}): Promise<any> {
    const url = new URL(`${FB_API}${path}`);
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v);
    }
    const res = await fetch(url.toString());
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Facebook API ${res.status}: ${err}`);
    }
    return res.json();
  }

  async exchangeCode(code: string) {
    const tokenData = await this.fbApi('/oauth/access_token', {
      client_id: this.appId,
      client_secret: this.appSecret,
      redirect_uri: this.redirectUri,
      code,
    });

    const longLived = await this.fbApi('/oauth/access_token', {
      grant_type: 'fb_exchange_token',
      client_id: this.appId,
      client_secret: this.appSecret,
      fb_exchange_token: tokenData.access_token,
    });

    const pages = await this.fbApi('/me/accounts', {
      access_token: longLived.access_token,
    });

    if (!pages.data || pages.data.length === 0) {
      throw new Error('Нет привязанных Facebook-страниц. Привяжите Instagram-аккаунт к странице.');
    }

    const page = pages.data[0];
    const pageToken = page.access_token;

    const igData = await this.fbApi(`/${page.id}`, {
      fields: 'instagram_business_account',
      access_token: pageToken,
    });

    if (!igData.instagram_business_account) {
      throw new Error('Instagram-аккаунт не привязан к этой Facebook-странице.');
    }

    const igId = igData.instagram_business_account.id;
    const igProfile = await this.fbApi(`/${igId}`, {
      fields: 'username,name,profile_picture_url',
      access_token: pageToken,
    });

    return {
      accessToken: pageToken,
      instagramId: igId,
      username: igProfile.username || '',
      name: igProfile.name || '',
      pageId: page.id,
      pageName: page.name || '',
    };
  }

  async resolveToken(accessToken: string | undefined): Promise<string> {
    if (!accessToken) throw new Error('No Instagram access token');
    return accessToken;
  }

  async getProfile(accessToken: string, igUserId: string) {
    return this.fbApi(`/${igUserId}`, {
      fields: 'id,username,name,profile_picture_url,followers_count,media_count',
      access_token: accessToken,
    });
  }

  async getMedia(accessToken: string, igUserId: string, after?: string) {
    const params: Record<string, string> = {
      fields: 'id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count',
      access_token: accessToken,
      limit: '25',
    };
    if (after) params.after = after;
    return this.fbApi(`/${igUserId}/media`, params);
  }

  async getInsights(accessToken: string, igUserId: string, metrics: string) {
    return this.fbApi(`/${igUserId}/insights`, {
      metric: metrics,
      period: 'lifetime',
      access_token: accessToken,
    });
  }

  async getMediaInsights(accessToken: string, mediaId: string, metrics: string) {
    return this.fbApi(`/${mediaId}/insights`, {
      metric: metrics,
      access_token: accessToken,
    });
  }

  async createImageContainer(accessToken: string, igUserId: string, imageUrl: string, caption: string, locationId?: string) {
    const params: Record<string, string> = {
      image_url: imageUrl,
      caption,
      access_token: accessToken,
    };
    if (locationId) params.location_id = locationId;
    return this.fbApi(`/${igUserId}/media`, params);
  }

  async createVideoContainer(accessToken: string, igUserId: string, videoUrl: string, caption: string, shareToFeed = true) {
    return this.fbApi(`/${igUserId}/media`, {
      media_type: 'REELS',
      video_url: videoUrl,
      caption,
      share_to_feed: String(shareToFeed),
      access_token: accessToken,
    });
  }

  async createCarouselContainer(accessToken: string, igUserId: string, childrenIds: string[], caption: string) {
    return this.fbApi(`/${igUserId}/media`, {
      media_type: 'CAROUSEL',
      children: childrenIds.join(','),
      caption,
      access_token: accessToken,
    });
  }

  async publishContainer(accessToken: string, igUserId: string, containerId: string) {
    return this.fbApi(`/${igUserId}/media_publish`, {
      creation_id: containerId,
      access_token: accessToken,
    });
  }

  async getContainerStatus(accessToken: string, containerId: string) {
    return this.fbApi(`/${containerId}`, {
      fields: 'status_code,status',
      access_token: accessToken,
    });
  }

  async deleteMedia(accessToken: string, mediaId: string) {
    return this.fbApi(`/${mediaId}`, {
      access_token: accessToken,
    });
  }

  async getAccountInsightsAll(accessToken: string, igUserId: string) {
    return this.fbApi(`/${igUserId}/insights`, {
      metric: 'impressions,reach,follower_count,profile_views,website_clicks,email_contacts,phone_call_clicks,total_interactions,accounts_engaged',
      period: 'lifetime',
      access_token: accessToken,
    });
  }

  async getFollowerGrowth(accessToken: string, igUserId: string) {
    return this.fbApi(`/${igUserId}/insights`, {
      metric: 'follower_count',
      period: 'day',
      access_token: accessToken,
    });
  }

  async getMediaInsightsDeep(accessToken: string, mediaId: string) {
    return this.fbApi(`/${mediaId}/insights`, {
      metric: 'impressions,reach,engagement,saved,video_views,plays,ig_reels_avg_watch_time',
      access_token: accessToken,
    });
  }

  async getAudienceDemographics(accessToken: string, igUserId: string) {
    const [gender, country, city] = await Promise.all([
      this.fbApi(`/${igUserId}/insights`, {
        metric: 'audience_gender_age',
        period: 'lifetime',
        access_token: accessToken,
      }).catch(() => null),
      this.fbApi(`/${igUserId}/insights`, {
        metric: 'audience_country',
        period: 'lifetime',
        access_token: accessToken,
      }).catch(() => null),
      this.fbApi(`/${igUserId}/insights`, {
        metric: 'audience_city',
        period: 'lifetime',
        access_token: accessToken,
      }).catch(() => null),
    ]);
    return { gender, country, city };
  }

  async getStoriesInsights(accessToken: string, igUserId: string) {
    return this.fbApi(`/${igUserId}/insights`, {
      metric: 'impressions,reach,taps_forward,taps_back,exits,replies',
      period: 'day',
      access_token: accessToken,
    });
  }
}
