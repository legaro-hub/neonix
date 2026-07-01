import type { AuthResponse, User, Post, AnalyticsOverview, AnalyticsTimeline, AnalyticsChannel, AnalyticsPost, ChannelStats } from './types';

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

  uploadMedia: async (postId: string, file: File): Promise<{ id: string; kind: string; filename: string; url: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const headers: Record<string, string> = {};
    if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
    const res = await fetch(`${BASE}/media/upload/${postId}`, {
      method: 'POST',
      headers,
      body: formData,
      credentials: 'include',
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new HttpError(res.status, (data as any)?.message || 'Ошибка загрузки файла', data);
    }
    return res.json();
  },

  deleteMedia: (id: string) =>
    request<{ success: boolean }>(`/media/${id}`, { method: 'DELETE' }),

  createBulkPosts: (posts: Array<{ title?: string; body: string; scheduledAt: string; channelTitles: string[] }>) =>
    request<Array<{ success?: boolean; postId?: string; error?: string }>>('/posts/bulk', { method: 'POST', body: JSON.stringify({ posts }) }),

  forgotPassword: (email: string) =>
    request<{ success: boolean }>('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),

  resetPassword: (token: string, newPassword: string) =>
    request<{ success: boolean }>('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, newPassword }) }),

  getAnalyticsOverview: () =>
    request<AnalyticsOverview>('/analytics/overview'),

  getAnalyticsTimeline: (days?: number) =>
    request<AnalyticsTimeline[]>(`/analytics/timeline${days ? `?days=${days}` : ''}`),

  getAnalyticsChannels: () =>
    request<AnalyticsChannel[]>('/analytics/channels'),

  getAnalyticsPosts: (limit?: number) =>
    request<AnalyticsPost[]>(`/analytics/posts${limit ? `?limit=${limit}` : ''}`),

  getAnalyticsWeekly: () =>
    request<{ thisWeek: number; lastWeek: number; diff: number }>('/analytics/weekly'),

  getAnalyticsMedia: () =>
    request<{ totalFiles: number; totalSize: number; byKind: Record<string, number> }>('/analytics/media'),

  getChannelStats: () =>
    request<ChannelStats[]>('/channel-stats'),

  collectChannelStats: () =>
    request<{ success: boolean }>('/channel-stats/collect', { method: 'POST' }),

  getMtprotoStatus: () =>
    request<{ authorized: boolean; configured: boolean; pendingStep: string | null }>('/mtproto/status'),

  mtprotoAuthPhone: (phone: string) =>
    request<{ step?: string; message?: string; error?: string }>('/mtproto/auth/phone', { method: 'POST', body: JSON.stringify({ phone }) }),

  mtprotoAuthCode: (code: string) =>
    request<{ step?: string; message?: string; error?: string }>('/mtproto/auth/code', { method: 'POST', body: JSON.stringify({ code }) }),

  mtprotoAuthPassword: (password: string) =>
    request<{ step?: string; message?: string; error?: string }>('/mtproto/auth/password', { method: 'POST', body: JSON.stringify({ password }) }),

  mtprotoLogout: () =>
    request<{ message: string }>('/mtproto/auth/logout', { method: 'POST' }),

  getMtprotoChannelStats: (username: string) =>
    request<Array<{ id: number; date: string; text: string; views: number; forwards: number; replies: number; reactions: Record<string, number> }>>(`/mtproto/channel/${username}/stats`),

  collectMtprotoStats: () =>
    request<{ results?: Array<{ channel: string; username: string; postsFound: number; totalViews: number }>; error?: string }>('/mtproto/collect', { method: 'POST' }),

  // ─── PINTEREST ───

  pinterestAuthUrl: () =>
    request<{ url: string }>('/pinterest/auth-url'),

  pinterestUser: (accountId: string) =>
    request<any>(`/pinterest/user?accountId=${accountId}`),

  pinterestBoards: (accountId: string, bookmark?: string) =>
    request<any>(`/pinterest/boards?accountId=${accountId}${bookmark ? `&bookmark=${bookmark}` : ''}`),

  pinterestCreateBoard: (accountId: string, data: { name: string; description?: string; privacy?: string }) =>
    request<any>(`/pinterest/boards?accountId=${accountId}`, { method: 'POST', body: JSON.stringify(data) }),

  pinterestDeleteBoard: (accountId: string, boardId: string) =>
    request<any>(`/pinterest/boards/${boardId}?accountId=${accountId}`, { method: 'DELETE' }),

  pinterestBoardPins: (accountId: string, boardId: string, bookmark?: string) =>
    request<any>(`/pinterest/boards/${boardId}/pins?accountId=${accountId}${bookmark ? `&bookmark=${bookmark}` : ''}`),

  pinterestBoardSections: (accountId: string, boardId: string) =>
    request<any>(`/pinterest/boards/${boardId}/sections?accountId=${accountId}`),

  pinterestCreateBoardSection: (accountId: string, boardId: string, name: string) =>
    request<any>(`/pinterest/boards/${boardId}/sections?accountId=${accountId}`, { method: 'POST', body: JSON.stringify({ name }) }),

  pinterestSelectBoard: (accountId: string, boardId: string) =>
    request<{ success: boolean }>(`/pinterest/select-board?accountId=${accountId}&boardId=${boardId}`),

  pinterestPins: (accountId: string, bookmark?: string) =>
    request<any>(`/pinterest/pins?accountId=${accountId}${bookmark ? `&bookmark=${bookmark}` : ''}`),

  pinterestCreatePin: (accountId: string, data: any) =>
    request<any>(`/pinterest/pins?accountId=${accountId}`, { method: 'POST', body: JSON.stringify(data) }),

  pinterestBulkCreatePins: (accountId: string, data: { board_id: string; pins: any[] }) =>
    request<any>(`/pinterest/pins/bulk?accountId=${accountId}`, { method: 'POST', body: JSON.stringify(data) }),

  pinterestDeletePin: (accountId: string, pinId: string) =>
    request<any>(`/pinterest/pins/${pinId}?accountId=${accountId}`, { method: 'DELETE' }),

  pinterestGetPin: (accountId: string, pinId: string) =>
    request<any>(`/pinterest/pins/${pinId}?accountId=${accountId}`),

  pinterestUpdatePin: (accountId: string, pinId: string, data: any) =>
    request<any>(`/pinterest/pins/${pinId}?accountId=${accountId}`, { method: 'PATCH', body: JSON.stringify(data) }),

  pinterestAccountAnalytics: (accountId: string, startDate?: string, endDate?: string) =>
    request<any>(`/pinterest/analytics/account?accountId=${accountId}${startDate ? `&startDate=${startDate}` : ''}${endDate ? `&endDate=${endDate}` : ''}`),

  pinterestTopPins: (accountId: string, startDate?: string, endDate?: string, sortBy?: string, limit?: number) =>
    request<any>(`/pinterest/analytics/pins?accountId=${accountId}${startDate ? `&startDate=${startDate}` : ''}${endDate ? `&endDate=${endDate}` : ''}${sortBy ? `&sortBy=${sortBy}` : ''}${limit ? `&limit=${limit}` : ''}`),

  pinterestPinAnalytics: (accountId: string, pinId: string, startDate?: string, endDate?: string) =>
    request<any>(`/pinterest/analytics/pin/${pinId}?accountId=${accountId}${startDate ? `&startDate=${startDate}` : ''}${endDate ? `&endDate=${endDate}` : ''}`),

  connectPostpin: (cookies: any[], proxy: string, username: string) =>
    request<any>('/pinterest/connect-cookies', { method: 'POST', body: JSON.stringify({ cookies, proxy, username }) }),

  getPostpinEmail: () =>
    request<{ email: string }>('/pinterest/postpin-email'),

  setPostpinEmail: (email: string) =>
    request<{ success: boolean }>('/pinterest/postpin-email', { method: 'POST', body: JSON.stringify({ email }) }),

  // ─── YOUTUBE ───

  youtubeAuthUrl: () =>
    request<{ url: string }>('/youtube/auth-url'),

  youtubeChannels: (accountId: string) =>
    request<any>(`/youtube/channels?accountId=${accountId}`),

  youtubeVideos: (accountId: string, pageToken?: string) =>
    request<any>(`/youtube/videos?accountId=${accountId}${pageToken ? `&pageToken=${pageToken}` : ''}`),

  youtubeStats: (accountId: string) =>
    request<any>(`/youtube/stats?accountId=${accountId}`),

  // ─── INSTAGRAM ───

  instagramAuthUrl: () =>
    request<{ url: string }>('/instagram/auth-url'),

  instagramProfile: (accountId: string) =>
    request<any>(`/instagram/profile?accountId=${accountId}`),

  instagramMedia: (accountId: string, after?: string) =>
    request<any>(`/instagram/media?accountId=${accountId}${after ? `&after=${after}` : ''}`),

  instagramInsights: (accountId: string) =>
    request<any>(`/instagram/insights?accountId=${accountId}`),

  // ─── ANALYTICS ───

  deepAnalytics: (startDate?: string, endDate?: string) =>
    request<any>(`/analytics/deep${startDate ? `?startDate=${startDate}` : ''}${endDate ? `&endDate=${endDate}` : ''}`),

  channelAnalytics: (channelId: string, days?: string) =>
    request<any>(`/channel-analytics/${channelId}${days ? `?days=${days}` : ''}`),
};
