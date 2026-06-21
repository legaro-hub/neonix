export interface SocialDriver {
  readonly platform: string;

  publish(
    account: SocialAccountData,
    post: UnifiedPost,
  ): Promise<PublishResult>;

  delete?(account: SocialAccountData, externalId: string): Promise<void>;

  fetchMetrics?(
    account: SocialAccountData,
    externalId: string,
  ): Promise<Metrics>;
}

export interface SocialAccountData {
  id: string;
  externalId: string;
  title: string;
  username?: string | null;
  metadata?: Record<string, unknown> | null;
  accessToken?: string;
  refreshToken?: string;
}

export interface UnifiedPost {
  title?: string | null;
  body: string;
  media: MediaDescriptor[];
}

export interface MediaDescriptor {
  kind: 'image' | 'video' | 'document';
  storageKey: string;
  mimeType: string | null;
  filename: string;
}

export interface PublishResult {
  ok: boolean;
  externalId?: string;
  externalUrl?: string;
  error?: string;
}

export interface Metrics {
  impressions?: number;
  views?: number;
  likes?: number;
  saves?: number;
  comments?: number;
}
