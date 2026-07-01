export interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  timezone: string;
  language: string;
  createdAt?: string;
  channelsCount?: number;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  expiresIn: number;
}

export interface SocialAccount {
  id: string;
  platform: string;
  platformBotName?: string | null;
  externalId?: string;
  title: string;
  username: string | null;
  status: string;
  metadata?: unknown;
  linkedAt: string;
}

export interface LinkCodeResult {
  code: string;
  botName: string;
  expiresAt: string;
}

export interface NotificationSettings {
  id: string;
  userId: string;
  emailOnPublish: boolean;
  emailOnFailure: boolean;
  emailOnBilling: boolean;
  inAppOnPublish: boolean;
  inAppOnFailure: boolean;
  digestEnabled: boolean;
  digestDay: string;
  digestHour: number;
}

export interface ApiError {
  statusCode: number;
  message: string | string[];
  error?: string;
}

export interface Post {
  id: string;
  title: string | null;
  body: string;
  buttons: Array<{ text: string; url: string }> | null;
  status: string;
  scheduledAt: string | null;
  createdAt: string;
  updatedAt: string;
  media: MediaAsset[];
  publications: PostPublication[];
}

export interface MediaAsset {
  id: string;
  kind: string;
  filename: string;
  mimeType: string | null;
  sizeBytes: number | null;
  storageKey: string;
  ord: number;
}

export interface PostPublication {
  id: string;
  status: string;
  scheduledAt: string;
  publishedAt: string | null;
  externalId: string | null;
  socialAccount: {
    id: string;
    title: string;
    username: string | null;
    platform: string;
  };
}

export interface AnalyticsOverview {
  totalPosts: number;
  totalPublications: number;
  channels: number;
  byStatus: { draft: number; queued: number; in_progress: number; published: number; failed: number };
  successRate: number;
}

export interface AnalyticsTimeline {
  date: string;
  count: number;
}

export interface AnalyticsChannel {
  id: string;
  title: string;
  username: string | null;
  total: number;
  published: number;
  failed: number;
  queued: number;
  successRate: number;
}

export interface AnalyticsPost {
  id: string;
  title: string;
  body: string;
  status: string;
  scheduledAt: string | null;
  createdAt: string;
  mediaCount: number;
  channels: string[];
  published: number;
  failed: number;
  total: number;
}

export interface ChannelStats {
  id: string;
  title: string;
  username: string | null;
  externalId: string;
  currentMembers: number | null;
  description: string | null;
  memberHistory: Array<{ date: string; members: number | null }>;
  publications: { total: number; published: number };
}
