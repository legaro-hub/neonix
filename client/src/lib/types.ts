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
