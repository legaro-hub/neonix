import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

const API = 'https://api.pinterest.com/v5';

export interface PinterestTokenData {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  userId: string;
  username: string;
}

@Injectable()
export class PinterestAuthService implements OnModuleInit {
  private readonly logger = new Logger(PinterestAuthService.name);
  private appId = '';
  private appSecret = '';
  private redirectUri = '';

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    this.appId = this.config.get<string>('PINTEREST_APP_ID') ?? '';
    this.appSecret = this.config.get<string>('PINTEREST_APP_SECRET') ?? '';
    this.redirectUri =
      this.config.get<string>('APP_URL') ?? 'https://neonix.online';
    this.redirectUri += '/api/pinterest/callback';

    if (!this.appId || !this.appSecret) {
      this.logger.warn('Pinterest OAuth not configured');
    }
  }

  isConfigured(): boolean {
    return !!(this.appId && this.appSecret);
  }

  getAuthUrl(state: string): string {
    const scopes = [
      'boards:read', 'boards:write',
      'pins:read', 'pins:write',
      'user_accounts:read',
    ];
    return (
      `https://www.pinterest.com/oauth/?client_id=${this.appId}` +
      `&redirect_uri=${encodeURIComponent(this.redirectUri)}` +
      `&response_type=code` +
      `&scope=${encodeURIComponent(scopes.join(','))}` +
      `&state=${state}`
    );
  }

  generateState(userId: string): string {
    const payload = { userId, ts: Date.now() };
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

  private credentials(): string {
    return Buffer.from(`${this.appId}:${this.appSecret}`).toString('base64');
  }

  private async api(path: string, accessToken: string, init?: RequestInit): Promise<any> {
    const res = await fetch(`${API}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        ...init?.headers,
      },
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Pinterest API ${res.status}: ${text}`);
    }
    if (res.status === 204) return null;
    return res.json();
  }

  private async apiForm(path: string, accessToken: string, body: FormData): Promise<any> {
    const res = await fetch(`${API}${path}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      body,
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Pinterest API ${res.status}: ${text}`);
    }
    return res.json();
  }

  async exchangeCode(code: string): Promise<PinterestTokenData> {
    const res = await fetch(`${API}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${this.credentials()}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: this.redirectUri,
      }).toString(),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Pinterest token exchange failed: ${res.status} ${err}`);
    }

    const data = (await res.json()) as {
      access_token: string;
      refresh_token?: string;
      expires_in?: number;
    };

    const userData = await this.api('/user_account', data.access_token);

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: data.expires_in ? new Date(Date.now() + data.expires_in * 1000) : undefined,
      userId: userData?.id ?? '',
      username: userData?.username ?? '',
    };
  }

  async refreshAccessToken(refreshToken: string) {
    const res = await fetch(`${API}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${this.credentials()}`,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }).toString(),
    });

    if (!res.ok) throw new Error(`Pinterest token refresh failed: ${res.status}`);

    const data = (await res.json()) as {
      access_token: string;
      refresh_token?: string;
      expires_in?: number;
    };

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: data.expires_in ? new Date(Date.now() + data.expires_in * 1000) : undefined,
    };
  }

  async resolveToken(accessToken: string | undefined, refreshToken: string | undefined): Promise<string> {
    if (accessToken) return accessToken;
    if (refreshToken) {
      const r = await this.refreshAccessToken(refreshToken);
      return r.accessToken;
    }
    throw new Error('No Pinterest access token');
  }

  // ─── BOARDS ───

  async listBoards(accessToken: string, bookmark?: string, pageSize = 25) {
    const params = new URLSearchParams({ page_size: String(pageSize) });
    if (bookmark) params.set('bookmark', bookmark);
    return this.api(`/boards?${params}`, accessToken);
  }

  async createBoard(accessToken: string, data: { name: string; description?: string; privacy?: string }) {
    return this.api('/boards', accessToken, {
      method: 'POST',
      body: JSON.stringify({ name: data.name, description: data.description ?? null, privacy: data.privacy ?? 'PUBLIC' }),
    });
  }

  async getBoard(accessToken: string, boardId: string) {
    return this.api(`/boards/${boardId}`, accessToken);
  }

  async deleteBoard(accessToken: string, boardId: string) {
    return this.api(`/boards/${boardId}`, accessToken, { method: 'DELETE' });
  }

  async updateBoard(accessToken: string, boardId: string, data: { name?: string; description?: string; privacy?: string }) {
    return this.api(`/boards/${boardId}`, accessToken, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async listBoardPins(accessToken: string, boardId: string, bookmark?: string, pageSize = 25) {
    const params = new URLSearchParams({ page_size: String(pageSize), pin_metrics: 'true' });
    if (bookmark) params.set('bookmark', bookmark);
    return this.api(`/boards/${boardId}/pins?${params}`, accessToken);
  }

  async listBoardSections(accessToken: string, boardId: string) {
    return this.api(`/boards/${boardId}/sections?page_size=250`, accessToken);
  }

  async createBoardSection(accessToken: string, boardId: string, name: string) {
    return this.api(`/boards/${boardId}/sections`, accessToken, {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  }

  async deleteBoardSection(accessToken: string, boardId: string, sectionId: string) {
    return this.api(`/boards/${boardId}/sections/${sectionId}`, accessToken, { method: 'DELETE' });
  }

  // ─── PINS ───

  async createPin(accessToken: string, data: {
    board_id: string;
    title?: string;
    description?: string;
    link?: string;
    alt_text?: string;
    media_source: Record<string, unknown>;
    board_section_id?: string;
  }) {
    return this.api('/pins', accessToken, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getPin(accessToken: string, pinId: string) {
    return this.api(`/pins/${pinId}?pin_metrics=true`, accessToken);
  }

  async deletePin(accessToken: string, pinId: string) {
    return this.api(`/pins/${pinId}`, accessToken, { method: 'DELETE' });
  }

  async updatePin(accessToken: string, pinId: string, data: Record<string, unknown>) {
    return this.api(`/pins/${pinId}`, accessToken, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async listPins(accessToken: string, bookmark?: string, pageSize = 25) {
    const params = new URLSearchParams({ page_size: String(pageSize), pin_metrics: 'true' });
    if (bookmark) params.set('bookmark', bookmark);
    return this.api(`/pins?${params}`, accessToken);
  }

  // ─── MEDIA (video) ───

  async registerMedia(accessToken: string) {
    return this.api('/media', accessToken, {
      method: 'POST',
      body: JSON.stringify({ media_type: 'video' }),
    });
  }

  async uploadToS3(uploadUrl: string, uploadParameters: Record<string, string>, fileBuffer: Buffer, contentType: string) {
    const formData = new FormData();
    for (const [key, value] of Object.entries(uploadParameters)) {
      formData.append(key, value);
    }
    formData.append('file', new Blob([new Uint8Array(fileBuffer)], { type: contentType }));

    const res = await fetch(uploadUrl, { method: 'POST', body: formData });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`S3 upload failed: ${res.status} ${text}`);
    }
  }

  async getMediaStatus(accessToken: string, mediaId: string) {
    return this.api(`/media/${mediaId}`, accessToken);
  }

  // ─── ANALYTICS ───

  async getPinAnalytics(accessToken: string, pinId: string, startDate: string, endDate: string, metrics?: string[]) {
    const defaultMetrics = ['IMPRESSIONS', 'SAVES', 'PIN_CLICKS', 'OUTBOUND_CLICKS', 'ENGAGEMENTS'];
    const params = new URLSearchParams({
      start_date: startDate,
      end_date: endDate,
      metric_types: (metrics ?? defaultMetrics).join(','),
    });
    return this.api(`/pins/${pinId}/analytics?${params}`, accessToken);
  }

  async getMultiPinAnalytics(accessToken: string, pinIds: string[], startDate: string, endDate: string, metrics?: string[]) {
    const defaultMetrics = ['IMPRESSIONS', 'SAVES', 'PIN_CLICKS', 'OUTBOUND_CLICKS', 'ENGAGEMENTS'];
    const params = new URLSearchParams({
      start_date: startDate,
      end_date: endDate,
      metric_types: (metrics ?? defaultMetrics).join(','),
    });
    pinIds.slice(0, 100).forEach((id, i) => params.append('pin_ids', id));
    return this.api(`/pins/analytics?${params}`, accessToken);
  }

  async getAccountAnalytics(accessToken: string, startDate: string, endDate: string) {
    const params = new URLSearchParams({
      start_date: startDate,
      end_date: endDate,
      from_claimed_content: 'true',
      pin_format: 'all',
      app_types: 'all',
      content_type: 'all',
      source: 'all',
      metric_types: 'IMPRESSIONS,SAVES,PIN_CLICKS,OUTBOUND_CLICKS,ENGAGEMENTS,FOLLOWS',
      split_field: 'NO_SPLIT',
    });
    return this.api(`/user_account/analytics?${params}`, accessToken);
  }

  async getTopPins(accessToken: string, startDate: string, endDate: string, sortBy = 'IMPRESSIONS', numOfPins = 10) {
    const params = new URLSearchParams({
      start_date: startDate,
      end_date: endDate,
      sort_by: sortBy,
      num_of_pins: String(numOfPins),
      from_claimed_content: 'true',
      pin_format: 'all',
      app_types: 'all',
      content_type: 'all',
      source: 'all',
      metric_types: 'IMPRESSIONS,SAVES,PIN_CLICKS,OUTBOUND_CLICKS,ENGAGEMENTS',
    });
    return this.api(`/user_account/analytics/top_pins?${params}`, accessToken);
  }

  async getUserAccount(accessToken: string) {
    return this.api('/user_account', accessToken);
  }

  async getBoardAnalytics(accessToken: string, boardId: string, startDate: string, endDate: string) {
    const params = new URLSearchParams({
      start_date: startDate,
      end_date: endDate,
      metric_types: 'IMPRESSIONS,SAVES,PIN_CLICKS,OUTBOUND_CLICKS,ENGAGEMENTS',
    });
    return this.api(`/boards/${boardId}/analytics?${params}`, accessToken);
  }

  async getAnalyticsByFormat(accessToken: string, startDate: string, endDate: string) {
    const params = new URLSearchParams({
      start_date: startDate,
      end_date: endDate,
      from_claimed_content: 'true',
      pin_format: 'all',
      app_types: 'all',
      content_type: 'all',
      source: 'all',
      metric_types: 'IMPRESSIONS,SAVES,PIN_CLICKS,ENGAGEMENTS',
      split_field: 'BY_PIN_FORMAT',
    });
    return this.api(`/user_account/analytics?${params}`, accessToken);
  }

  async getAnalyticsByDevice(accessToken: string, startDate: string, endDate: string) {
    const params = new URLSearchParams({
      start_date: startDate,
      end_date: endDate,
      from_claimed_content: 'true',
      pin_format: 'all',
      app_types: 'all',
      content_type: 'all',
      source: 'all',
      metric_types: 'IMPRESSIONS,PIN_CLICKS',
      split_field: 'BY_APP_TYPES',
    });
    return this.api(`/user_account/analytics?${params}`, accessToken);
  }

  async listAllPins(accessToken: string, bookmark?: string) {
    const params = new URLSearchParams({ page_size: '25', pin_metrics: 'true' });
    if (bookmark) params.set('bookmark', bookmark);
    return this.api(`/pins?${params}`, accessToken);
  }
}
