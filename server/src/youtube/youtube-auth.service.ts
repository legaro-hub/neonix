import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

const YT_API = 'https://www.googleapis.com/youtube/v3';

export interface YouTubeTokenData {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  channelId: string;
  channelTitle: string;
}

@Injectable()
export class YouTubeAuthService implements OnModuleInit {
  private readonly logger = new Logger(YouTubeAuthService.name);
  private clientId = '';
  private clientSecret = '';
  private redirectUri = '';

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    this.clientId = this.config.get<string>('YOUTUBE_CLIENT_ID') ?? '';
    this.clientSecret = this.config.get<string>('YOUTUBE_CLIENT_SECRET') ?? '';
    this.redirectUri = (this.config.get<string>('APP_URL') ?? 'https://neonix.online') + '/api/youtube/callback';

    if (!this.clientId || !this.clientSecret) {
      this.logger.warn('YouTube OAuth not configured');
    }
  }

  isConfigured(): boolean {
    return !!(this.clientId && this.clientSecret);
  }

  getAuthUrl(state: string): string {
    const scopes = [
      'https://www.googleapis.com/auth/youtube',
      'https://www.googleapis.com/auth/youtube.upload',
      'https://www.googleapis.com/auth/youtube.readonly',
      'https://www.googleapis.com/auth/userinfo.profile',
    ];
    return (
      `https://accounts.google.com/o/oauth2/v2/auth` +
      `?client_id=${this.clientId}` +
      `&redirect_uri=${encodeURIComponent(this.redirectUri)}` +
      `&response_type=code` +
      `&scope=${encodeURIComponent(scopes.join(' '))}` +
      `&access_type=offline` +
      `&prompt=consent` +
      `&state=${state}`
    );
  }

  generateState(userId: string): string {
    const payload = { userId, ts: Date.now(), platform: 'youtube' };
    const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const sig = crypto.createHmac('sha256', this.clientSecret).update(encoded).digest('base64url');
    return `${encoded}.${sig}`;
  }

  verifyState(state: string): string | null {
    try {
      const [encoded, sig] = state.split('.');
      if (!encoded || !sig) return null;
      const expected = crypto.createHmac('sha256', this.clientSecret).update(encoded).digest('base64url');
      if (sig !== expected) return null;
      const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString());
      if (Date.now() - payload.ts > 10 * 60 * 1000) return null;
      return payload.userId;
    } catch {
      return null;
    }
  }

  async exchangeCode(code: string): Promise<YouTubeTokenData> {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: this.redirectUri,
      }).toString(),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`YouTube token exchange failed: ${res.status} ${err}`);
    }

    const data = (await res.json()) as {
      access_token: string;
      refresh_token?: string;
      expires_in?: number;
    };

    const channelRes = await fetch(
      `${YT_API}/channels?part=snippet&mine=true`,
      { headers: { Authorization: `Bearer ${data.access_token}` } },
    );

    let channelId = '';
    let channelTitle = '';
    if (channelRes.ok) {
      const chData = (await channelRes.json()) as { items?: Array<{ id: string; snippet?: { title?: string } }> };
      channelId = chData.items?.[0]?.id ?? '';
      channelTitle = chData.items?.[0]?.snippet?.title ?? '';
    }

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: data.expires_in ? new Date(Date.now() + data.expires_in * 1000) : undefined,
      channelId,
      channelTitle,
    };
  }

  async refreshAccessToken(refreshToken: string) {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }).toString(),
    });

    if (!res.ok) throw new Error(`YouTube token refresh failed: ${res.status}`);

    const data = (await res.json()) as {
      access_token: string;
      expires_in?: number;
    };

    return {
      accessToken: data.access_token,
      expiresAt: data.expires_in ? new Date(Date.now() + data.expires_in * 1000) : undefined,
    };
  }

  async resolveToken(accessToken: string | undefined, refreshToken: string | undefined): Promise<string> {
    if (accessToken) return accessToken;
    if (refreshToken) {
      const r = await this.refreshAccessToken(refreshToken);
      return r.accessToken;
    }
    throw new Error('No YouTube access token');
  }

  async listChannels(accessToken: string) {
    const res = await fetch(
      `${YT_API}/channels?part=snippet,statistics&mine=true`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    if (!res.ok) throw new Error(`YouTube list channels failed: ${res.status}`);
    return res.json();
  }

  async listVideos(accessToken: string, channelId: string, pageToken?: string) {
    const params = new URLSearchParams({
      part: 'snippet,status,statistics',
      channelId,
      maxResults: '25',
      order: 'date',
    });
    if (pageToken) params.set('pageToken', pageToken);

    const res = await fetch(`${YT_API}/videos?${params}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) throw new Error(`YouTube list videos failed: ${res.status}`);
    return res.json();
  }

  async getChannelStats(accessToken: string, channelId: string) {
    const res = await fetch(
      `${YT_API}/channels?part=statistics&id=${channelId}`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    if (!res.ok) throw new Error(`YouTube channel stats failed: ${res.status}`);
    return res.json();
  }

  async uploadVideo(
    accessToken: string,
    title: string,
    description: string,
    tags: string[],
    categoryId: string,
    privacy: 'public' | 'unlisted' | 'private',
    fileBuffer: Buffer,
    mimeType: string,
  ): Promise<{ id: string; url: string }> {
    const metadata = {
      snippet: { title, description, tags, categoryId },
      status: { privacyStatus: privacy, selfDeclaredMadeForKids: false },
    };

    const boundary = 'neonix' + Date.now();
    const metadataJson = JSON.stringify(metadata);

    const bodyParts: Buffer[] = [];
    bodyParts.push(Buffer.from(
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadataJson}\r\n`
    ));
    bodyParts.push(Buffer.from(
      `--${boundary}\r\nContent-Type: ${mimeType}\r\nContent-Transfer-Encoding: binary\r\n\r\n`
    ));
    bodyParts.push(fileBuffer);
    bodyParts.push(Buffer.from(`\r\n--${boundary}--\r\n`));

    const body = Buffer.concat(bodyParts);

    const res = await fetch(
      'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
          'X-Upload-Content-Length': String(fileBuffer.length),
          'X-Upload-Content-Type': mimeType,
        },
        body,
      },
    );

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`YouTube upload failed: ${res.status} ${err}`);
    }

    const data = (await res.json()) as { id: string };
    return {
      id: data.id,
      url: `https://youtube.com/watch?v=${data.id}`,
    };
  }

  async deleteVideo(accessToken: string, videoId: string) {
    const res = await fetch(`${YT_API}/videos?id=${videoId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) throw new Error(`YouTube delete video failed: ${res.status}`);
  }

  async getChannelDetails(accessToken: string, channelId: string) {
    const res = await fetch(`${YT_API}/channels?part=snippet,statistics,brandingSettings,topicDetails&id=${channelId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) throw new Error(`YouTube channel details failed: ${res.status}`);
    return res.json();
  }

  async getChannelAnalytics(channelId: string, accessToken: string, startDate: string, endDate: string) {
    const params = new URLSearchParams({
      ids: `channel==${channelId}`,
      startDate,
      endDate,
      metrics: 'views,likes,comments,shares,estimatedMinutesWatched,averageViewDuration,averageViewPercentage,subscribersGained,subscribersLost',
      dimensions: 'day',
    });
    const res = await fetch(`https://youtubeanalytics.googleapis.com/v2/reports?${params}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) throw new Error(`YouTube Analytics failed: ${res.status}`);
    return res.json();
  }

  async getYouTubeDemographics(channelId: string, accessToken: string, startDate: string, endDate: string) {
    const params = new URLSearchParams({
      ids: `channel==${channelId}`,
      startDate,
      endDate,
      metrics: 'viewerPercentage',
      dimensions: 'ageGroup,gender',
    });
    const res = await fetch(`https://youtubeanalytics.googleapis.com/v2/reports?${params}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) throw new Error(`YouTube demographics failed: ${res.status}`);
    return res.json();
  }

  async getYouTubeGeography(channelId: string, accessToken: string, startDate: string, endDate: string) {
    const params = new URLSearchParams({
      ids: `channel==${channelId}`,
      startDate,
      endDate,
      metrics: 'views,estimatedMinutesWatched',
      dimensions: 'country',
      sort: '-views',
    });
    const res = await fetch(`https://youtubeanalytics.googleapis.com/v2/reports?${params}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) throw new Error(`YouTube geography failed: ${res.status}`);
    return res.json();
  }

  async getYouTubeTrafficSources(channelId: string, accessToken: string, startDate: string, endDate: string) {
    const params = new URLSearchParams({
      ids: `channel==${channelId}`,
      startDate,
      endDate,
      metrics: 'views',
      dimensions: 'insightTrafficSourceType',
    });
    const res = await fetch(`https://youtubeanalytics.googleapis.com/v2/reports?${params}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) throw new Error(`YouTube traffic sources failed: ${res.status}`);
    return res.json();
  }

  async getYouTubeDeviceTypes(channelId: string, accessToken: string, startDate: string, endDate: string) {
    const params = new URLSearchParams({
      ids: `channel==${channelId}`,
      startDate,
      endDate,
      metrics: 'views',
      dimensions: 'deviceType',
    });
    const res = await fetch(`https://youtubeanalytics.googleapis.com/v2/reports?${params}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) throw new Error(`YouTube devices failed: ${res.status}`);
    return res.json();
  }

  async getYouTubeTopVideos(channelId: string, accessToken: string, startDate: string, endDate: string) {
    const params = new URLSearchParams({
      ids: `channel==${channelId}`,
      startDate,
      endDate,
      metrics: 'views,likes,comments,estimatedMinutesWatched,averageViewPercentage,subscribersGained',
      sort: '-views',
      dimensions: 'video',
      maxResults: '25',
    });
    const res = await fetch(`https://youtubeanalytics.googleapis.com/v2/reports?${params}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) throw new Error(`YouTube top videos failed: ${res.status}`);
    return res.json();
  }
}
