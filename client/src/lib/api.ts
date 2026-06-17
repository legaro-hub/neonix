import type { AuthResponse, User, Post } from './types';

const BASE = '/api';

let accessToken: string | null = null;
export const setAccessToken = (t: string | null) => (accessToken = t);
export const getAccessToken = () => accessToken;

export class HttpError extends Error {
  status: number;
  data: unknown;
  constructor(status: number, message: string, data: unknown) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  _isRetry = false,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) ?? {}),
  };
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

  const res = await fetch(`${BASE}${path}`, { ...options, headers, credentials: 'include' });

  if (res.status === 401 && !path.startsWith('/auth/') && !_isRetry) {
    const refreshed = await tryRefresh();
    if (refreshed) return request<T>(path, options, true);
  }

  if (!res.ok) {
    let data: unknown = null;
    try {
      data = await res.json();
    } catch {
      /* ignore */
    }
    const msg =
      (data as { message?: string })?.message ??
      (Array.isArray(data) ? (data as string[])[0] : 'Ошибка запроса');
    throw new HttpError(res.status, msg, data);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

let refreshing: Promise<boolean> | null = null;
async function tryRefresh(): Promise<boolean> {
  if (refreshing) return refreshing;
  refreshing = (async () => {
    try {
      const res = await fetch(`${BASE}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) return false;
      const data = await res.json();
      if (data?.accessToken) {
        setAccessToken(data.accessToken);
        return true;
      }
      return false;
    } catch {
      setAccessToken(null);
      return false;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

export const api = {
  register: (body: { email: string; password: string; name?: string; captchaId: string; captchaAnswer: number }) =>
    request<AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify(body) }),

  login: (body: { email: string; password: string }) =>
    request<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),

  logout: () => request<{ success: boolean }>('/auth/logout', { method: 'POST' }),

  refresh: () => tryRefresh(),

  me: () => request<User>('/users/me'),

  getCaptcha: () =>
    request<{ id: string; question: string; a: number; b: number; op: string }>('/auth/captcha'),

  updateProfile: (body: { name?: string; email?: string; timezone?: string; language?: string }) =>
    request<User>('/users/me', { method: 'PATCH', body: JSON.stringify(body) }),

  changePassword: (body: { currentPassword: string; newPassword: string }) =>
    request<{ success: boolean }>('/users/me/change-password', { method: 'POST', body: JSON.stringify(body) }),

  deleteAccount: () =>
    request<{ success: boolean }>('/users/me', { method: 'DELETE' }),

  getNotifications: () =>
    request<{ id: string; userId: string; emailOnPublish: boolean; emailOnFailure: boolean; emailOnBilling: boolean; inAppOnPublish: boolean; inAppOnFailure: boolean; digestEnabled: boolean; digestDay: string; digestHour: number }>('/users/me/notifications'),

  updateNotifications: (body: Record<string, unknown>) =>
    request<{ id: string; userId: string }>('/users/me/notifications', { method: 'PATCH', body: JSON.stringify(body) }),

  getChannels: () =>
    request<Array<{ id: string; platform: string; title: string; username: string | null; status: string; linkedAt: string }>>('/social-accounts'),

  generateLinkCode: () =>
    request<{ code: string; botName: string; expiresAt: string }>('/social-accounts/link', { method: 'POST' }),

  deleteChannel: (id: string) =>
    request<{ success: boolean }>(`/social-accounts/${id}`, { method: 'DELETE' }),

  getPosts: (params?: { from?: string; to?: string; socialAccountId?: string }) => {
    const qs = new URLSearchParams();
    if (params?.from) qs.set('from', params.from);
    if (params?.to) qs.set('to', params.to);
    if (params?.socialAccountId) qs.set('socialAccountId', params.socialAccountId);
    const q = qs.toString();
    return request<Post[]>(`/posts${q ? '?' + q : ''}`);
  },

  getCalendar: (month: string) =>
    request<Post[]>(`/posts/calendar?month=${month}`),

  getPost: (id: string) =>
    request<Post>(`/posts/${id}`),

  createPost: (data: { title?: string; body: string; scheduledAt?: string; socialAccountIds: string[] }) =>
    request<Post>('/posts', { method: 'POST', body: JSON.stringify(data) }),

  updatePost: (id: string, data: { title?: string; body?: string; scheduledAt?: string | null; socialAccountIds?: string[] }) =>
    request<Post>(`/posts/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  deletePost: (id: string) =>
    request<{ success: boolean }>(`/posts/${id}`, { method: 'DELETE' }),

  createBulkPosts: (posts: Array<{ title?: string; body: string; scheduledAt: string; channelTitles: string[] }>) =>
    request<Array<{ success?: boolean; postId?: string; error?: string }>>('/posts/bulk', { method: 'POST', body: JSON.stringify({ posts }) }),
};
