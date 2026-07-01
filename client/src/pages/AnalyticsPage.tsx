import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { api } from '../lib/api';
import type { AnalyticsOverview, AnalyticsTimeline, AnalyticsChannel, AnalyticsPost, ChannelStats } from '../lib/types';

function BarChart({ data, max }: { data: AnalyticsTimeline[]; max: number }) {
  return (
    <div className="flex items-end gap-1 h-28">
      {data.map((d) => (
        <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group relative">
          <div
            className="w-full rounded-t bg-graphite-600 transition-all hover:bg-lime min-h-[2px]"
            style={{ height: max > 0 ? `${(d.count / max) * 100}%` : '2px' }}
          />
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block bg-graphite-900 border border-graphite-700 rounded px-2 py-1 text-[10px] text-white whitespace-nowrap z-10">
            {d.date.slice(5)}: {d.count}
          </div>
        </div>
      ))}
    </div>
  );
}

function MiniLineChart({ data, height = 32 }: { data: Array<{ date: string; members: number | null }>; height?: number }) {
  const valid = data.filter((d) => d.members !== null) as Array<{ date: string; members: number }>;
  if (valid.length < 2) return <div className="text-[11px] text-graphite-500">Нет данных</div>;
  const min = Math.min(...valid.map((d) => d.members));
  const max = Math.max(...valid.map((d) => d.members));
  const range = max - min || 1;
  const w = 160;
  const points = valid.map((d, i) => `${(i / (valid.length - 1)) * w},${height - ((d.members - min) / range) * (height - 6) - 3}`).join(' ');
  const diff = valid[valid.length - 1].members - valid[0].members;
  const color = diff >= 0 ? '#4ade80' : '#f87171';
  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="w-full" style={{ height }}>
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { c: string; l: string }> = {
    draft: { c: 'text-graphite-400', l: 'Черновик' },
    queued: { c: 'text-yellow-400', l: 'В очереди' },
    in_progress: { c: 'text-yellow-400', l: 'Отправляется' },
    published: { c: 'text-green-400', l: 'Опубликован' },
    failed: { c: 'text-red-400', l: 'Ошибка' },
  };
  const s = map[status] ?? map.draft;
  return <span className={`text-[10px] font-medium ${s.c}`}>{s.l}</span>;
}

const PLATFORMS = [
  { key: 'telegram', label: 'Telegram', color: 'bg-sky-500' },
  { key: 'pinterest', label: 'Pinterest', color: 'bg-red-400' },
  { key: 'youtube', label: 'YouTube', color: 'bg-red-500' },
  { key: 'instagram', label: 'Instagram', color: 'bg-gradient-to-r from-purple-500 to-pink-500' },
] as const;

type Platform = typeof PLATFORMS[number]['key'];

export function AnalyticsPage() {
  const [platform, setPlatform] = useState<Platform>('telegram');
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  // Telegram
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [timeline, setTimeline] = useState<AnalyticsTimeline[]>([]);
  const [analyticsChannels, setAnalyticsChannels] = useState<AnalyticsChannel[]>([]);
  const [posts, setPosts] = useState<AnalyticsPost[]>([]);
  const [channelStats, setChannelStats] = useState<ChannelStats[]>([]);

  // Pinterest
  const [piAccounts, setPiAccounts] = useState<any[]>([]);
  const [piAnalytics, setPiAnalytics] = useState<any>(null);
  const [piTopPins, setPiTopPins] = useState<any[]>([]);

  // YouTube
  const [ytAccounts, setYtAccounts] = useState<any[]>([]);
  const [ytStats, setYtStats] = useState<any>(null);
  const [ytVideos, setYtVideos] = useState<any[]>([]);

  // Instagram
  const [igAccounts, setIgAccounts] = useState<any[]>([]);
  const [igProfile, setIgProfile] = useState<any>(null);
  const [igInsights, setIgInsights] = useState<any>(null);
  const [igMedia, setIgMedia] = useState<any[]>([]);

  useEffect(() => {
    let active = true;
    setLoading(true);

    (async () => {
      try {
        const channels = await api.getChannels();

        if (platform === 'telegram') {
          const [ov, tl, ch, ps, cs] = await Promise.all([
            api.getAnalyticsOverview(),
            api.getAnalyticsTimeline(days),
            api.getAnalyticsChannels(),
            api.getAnalyticsPosts(20),
            api.getChannelStats(),
          ]);
          if (!active) return;
          setOverview(ov); setTimeline(tl); setAnalyticsChannels(ch); setPosts(ps); setChannelStats(cs);
        }

        if (platform === 'pinterest') {
          const pa = channels.filter((c) => c.platform === 'pinterest' && c.status === 'active');
          setPiAccounts(pa);
          if (pa.length > 0) {
            const [analytics, topPins] = await Promise.all([
              api.pinterestAccountAnalytics(pa[0].id),
              api.pinterestTopPins(pa[0].id, undefined, undefined, 'IMPRESSIONS', 10),
            ]);
            setPiAnalytics(analytics);
            setPiTopPins(topPins?.items ?? []);
          }
        }

        if (platform === 'youtube') {
          const ya = channels.filter((c) => c.platform === 'youtube' && c.status === 'active');
          setYtAccounts(ya);
          if (ya.length > 0) {
            const [stats, videos] = await Promise.all([
              api.youtubeStats(ya[0].id),
              api.youtubeVideos(ya[0].id),
            ]);
            setYtStats(stats?.items?.[0] ?? null);
            setYtVideos(videos?.items ?? []);
          }
        }

        if (platform === 'instagram') {
          const ia = channels.filter((c) => c.platform === 'instagram' && c.status === 'active');
          setIgAccounts(ia);
          if (ia.length > 0) {
            const [profile, insights, media] = await Promise.all([
              api.instagramProfile(ia[0].id),
              api.instagramInsights(ia[0].id),
              api.instagramMedia(ia[0].id),
            ]);
            setIgProfile(profile);
            setIgInsights(insights);
            setIgMedia(media?.data ?? []);
          }
        }
      } catch {}
      if (active) setLoading(false);
    })();

    return () => { active = false; };
  }, [platform, days]);

  const maxTimeline = Math.max(1, ...timeline.map((d) => d.count));

  const DATE_OPTIONS = [
    { value: 7, label: '7 дней' },
    { value: 14, label: '14 дней' },
    { value: 30, label: '30 дней' },
    { value: 90, label: '90 дней' },
  ];

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-6 pb-20 lg:pb-10 lg:p-10">
        {/* Header + Tabs + Date filter */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
          <h1 className="text-2xl font-bold text-white">Аналитика</h1>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-graphite-700/40 overflow-hidden">
              {PLATFORMS.map((p) => (
                <button
                  key={p.key}
                  onClick={() => setPlatform(p.key)}
                  className={`px-3 py-1.5 text-xs font-medium transition ${platform === p.key ? `${p.color} text-white` : 'text-graphite-400 hover:text-graphite-200'}`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div className="flex rounded-lg border border-graphite-700/40 overflow-hidden">
              {DATE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setDays(opt.value)}
                  className={`px-3 py-1.5 text-xs font-medium transition ${days === opt.value ? 'bg-graphite-700 text-white' : 'text-graphite-400 hover:text-graphite-200'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="card p-4 animate-pulse">
                <div className="h-5 w-20 rounded bg-graphite-800 mb-2" />
                <div className="h-7 w-16 rounded bg-graphite-800" />
              </div>
            ))}
          </div>
        ) : platform === 'telegram' ? (
          <TelegramAnalytics overview={overview} timeline={timeline} maxTimeline={maxTimeline} analyticsChannels={analyticsChannels} posts={posts} channelStats={channelStats} />
        ) : platform === 'pinterest' ? (
          <PinterestAnalytics accounts={piAccounts} analytics={piAnalytics} topPins={piTopPins} />
        ) : platform === 'youtube' ? (
          <YouTubeAnalytics accounts={ytAccounts} stats={ytStats} videos={ytVideos} />
        ) : (
          <InstagramAnalytics accounts={igAccounts} profile={igProfile} insights={igInsights} media={igMedia} />
        )}
      </main>
    </div>
  );
}

function EmptyState({ icon, title, text, link }: { icon: string; title: string; text: string; link?: string }) {
  return (
    <div className="card p-10 text-center">
      <div className="text-3xl mb-3">{icon}</div>
      <h2 className="text-lg font-semibold text-white mb-1">{title}</h2>
      <p className="text-sm text-graphite-400 mb-4">{text}</p>
      {link && <a href={link} className="btn-primary inline-block">Подключить</a>}
    </div>
  );
}

/* ═══ TELEGRAM ═══ */
function TelegramAnalytics({ overview, timeline, maxTimeline, analyticsChannels, posts, channelStats }: {
  overview: AnalyticsOverview | null; timeline: AnalyticsTimeline[]; maxTimeline: number;
  analyticsChannels: AnalyticsChannel[]; posts: AnalyticsPost[]; channelStats: ChannelStats[];
}) {
  if (!overview) return <EmptyState icon="📊" title="Нет данных" text="Создайте посты, чтобы увидеть статистику" />;
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        {[
          { l: 'Постов', v: overview.totalPosts },
          { l: 'Опубликовано', v: overview.byStatus.published, c: 'text-green-400' },
          { l: 'В очереди', v: overview.byStatus.queued + overview.byStatus.in_progress },
          { l: 'Ошибки', v: overview.byStatus.failed, c: 'text-red-400' },
        ].map((s) => (
          <div key={s.l} className="card p-4">
            <div className="text-xs text-graphite-500 mb-1">{s.l}</div>
            <div className={`text-xl font-bold ${s.c ?? 'text-white'}`}>{s.v}</div>
          </div>
        ))}
      </div>

      {timeline.some((d) => d.count > 0) && (
        <div className="card p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-graphite-500 uppercase tracking-wider font-medium">Публикации по дням</span>
            <span className="text-[11px] text-graphite-500">{overview.totalPublications} всего</span>
          </div>
          <BarChart data={timeline} max={maxTimeline} />
        </div>
      )}

      {channelStats.length > 0 && (
        <div className="mb-6">
          <h3 className="text-xs text-graphite-500 uppercase tracking-wider font-medium mb-3">Подписчики</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {channelStats.map((ch) => (
              <Link key={ch.id} to={`/app/analytics/${ch.id}`} className="card p-4 hover:border-graphite-600/60 transition block">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="text-sm font-medium text-white">{ch.title}</div>
                    {ch.username && <div className="text-[11px] text-graphite-500">@{ch.username}</div>}
                  </div>
                  {ch.currentMembers !== null && (
                    <div className="text-right">
                      <div className="text-lg font-bold text-white">{ch.currentMembers.toLocaleString()}</div>
                      <div className="text-[10px] text-graphite-500">подписчиков</div>
                    </div>
                  )}
                </div>
                {ch.memberHistory.length > 1 && <MiniLineChart data={ch.memberHistory} />}
              </Link>
            ))}
          </div>
        </div>
      )}

      {analyticsChannels.length > 0 && (
        <div className="card p-4 mb-6">
          <h3 className="text-xs text-graphite-500 uppercase tracking-wider font-medium mb-3">Публикации по каналам</h3>
          <div className="space-y-1">
            {analyticsChannels.map((ch) => (
              <div key={ch.id} className="flex items-center justify-between py-2 text-sm border-b border-graphite-800/50 last:border-0">
                <span className="text-graphite-200 truncate">{ch.title}</span>
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-graphite-400">{ch.total} всего</span>
                  <span className="text-green-400">{ch.published}</span>
                  <span className="text-red-400">{ch.failed}</span>
                  <span className={ch.successRate >= 90 ? 'text-green-400' : ch.successRate >= 70 ? 'text-yellow-400' : 'text-red-400'}>{ch.successRate}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {posts.length > 0 && (
        <div className="card p-4">
          <h3 className="text-xs text-graphite-500 uppercase tracking-wider font-medium mb-3">Последние посты</h3>
          <div className="space-y-1">
            {posts.map((post) => (
              <div key={post.id} className="flex items-center justify-between py-2 border-b border-graphite-800/50 last:border-0">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-graphite-200 truncate">{post.title || 'Без заголовка'}</span>
                    <StatusBadge status={post.status} />
                  </div>
                  <div className="text-[11px] text-graphite-500 mt-0.5">
                    {post.channels.length > 0 ? post.channels.join(', ') : 'Без каналов'} · {post.published}/{post.total} опубл.
                  </div>
                </div>
                <span className="text-[11px] text-graphite-500 ml-3 shrink-0">{new Date(post.createdAt).toLocaleDateString('ru-RU')}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

/* ═══ PINTEREST ═══ */
function PinterestAnalytics({ accounts, analytics, topPins }: { accounts: any[]; analytics: any; topPins: any[] }) {
  if (accounts.length === 0) return <EmptyState icon="📌" title="Pinterest не подключён" text="Подключите аккаунт для аналитики" link="/app/channels" />;
  const m = analytics?.[0]?.metrics ?? {};
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        {[
          { l: 'Показы', v: m.IMPRESSIONS ?? 0, c: 'text-white' },
          { l: 'Сохранения', v: m.SAVES ?? 0, c: 'text-white' },
          { l: 'Клики', v: m.PIN_CLICKS ?? 0, c: 'text-white' },
          { l: 'Переходы', v: m.OUTBOUND_CLICKS ?? 0, c: 'text-white' },
        ].map((s) => (
          <div key={s.l} className="card p-4">
            <div className="text-xs text-graphite-500 mb-1">{s.l}</div>
            <div className={`text-xl font-bold ${s.c}`}>{Number(s.v).toLocaleString()}</div>
          </div>
        ))}
      </div>

      {topPins.length > 0 && (
        <div className="card p-4 mb-6">
          <h3 className="text-xs text-graphite-500 uppercase tracking-wider font-medium mb-3">Топ пинов</h3>
          <div className="space-y-1">
            {topPins.map((pin: any) => (
              <div key={pin.pin_id} className="flex items-center justify-between py-2 border-b border-graphite-800/50 last:border-0 text-sm">
                <span className="text-graphite-300 truncate flex-1">{pin.title || pin.permalink || pin.pin_id}</span>
                <div className="flex gap-4 text-xs text-graphite-400 ml-3 shrink-0">
                  {pin.pin_metrics?.['90d'] && (
                    <>
                      <span>👁 {(pin.pin_metrics['90d'].IMPRESSIONS ?? 0).toLocaleString()}</span>
                      <span>💾 {(pin.pin_metrics['90d'].SAVES ?? 0).toLocaleString()}</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card p-4">
        <h3 className="text-xs text-graphite-500 uppercase tracking-wider font-medium mb-3">Аккаунты</h3>
        {accounts.map((acc: any) => (
          <div key={acc.id} className="flex items-center justify-between py-2 border-b border-graphite-800/50 last:border-0">
            <span className="text-sm text-graphite-200">{acc.title}</span>
            <span className="text-[11px] text-graphite-500">@{acc.username}</span>
          </div>
        ))}
      </div>
    </>
  );
}

/* ═══ YOUTUBE ═══ */
function YouTubeAnalytics({ accounts, stats, videos }: { accounts: any[]; stats: any; videos: any[] }) {
  if (accounts.length === 0) return <EmptyState icon="▶" title="YouTube не подключён" text="Подключите аккаунт для аналитики" link="/app/channels" />;
  const s = stats?.statistics ?? {};
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        {[
          { l: 'Подписчики', v: s.subscriberCount ?? 0 },
          { l: 'Видео', v: s.videoCount ?? 0 },
          { l: 'Просмотры', v: s.viewCount ?? 0 },
          { l: 'Комментарии', v: s.commentCount ?? 0 },
        ].map((st) => (
          <div key={st.l} className="card p-4">
            <div className="text-xs text-graphite-500 mb-1">{st.l}</div>
            <div className="text-xl font-bold text-white">{Number(st.v).toLocaleString()}</div>
          </div>
        ))}
      </div>

      {videos.length > 0 && (
        <div className="card p-4 mb-6">
          <h3 className="text-xs text-graphite-500 uppercase tracking-wider font-medium mb-3">Последние видео</h3>
          <div className="space-y-1">
            {videos.slice(0, 10).map((v: any) => {
              const st = v.statistics ?? {};
              return (
                <div key={v.id} className="flex items-center justify-between py-2 border-b border-graphite-800/50 last:border-0 text-sm">
                  <span className="text-graphite-300 truncate flex-1">{v.snippet?.title ?? v.id}</span>
                  <div className="flex gap-4 text-xs text-graphite-400 ml-3 shrink-0">
                    <span>👁 {(st.viewCount ?? 0).toLocaleString()}</span>
                    <span>👍 {(st.likeCount ?? 0).toLocaleString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="card p-4">
        <h3 className="text-xs text-graphite-500 uppercase tracking-wider font-medium mb-3">Аккаунты</h3>
        {accounts.map((acc: any) => (
          <div key={acc.id} className="flex items-center justify-between py-2 border-b border-graphite-800/50 last:border-0">
            <span className="text-sm text-graphite-200">{acc.title}</span>
            <span className="text-[11px] text-graphite-500">{acc.externalId}</span>
          </div>
        ))}
      </div>
    </>
  );
}

/* ═══ INSTAGRAM ═══ */
function InstagramAnalytics({ accounts, profile, insights, media }: { accounts: any[]; profile: any; insights: any; media: any[] }) {
  if (accounts.length === 0) return <EmptyState icon="📷" title="Instagram не подключён" text="Подключите аккаунт для аналитики" link="/app/channels" />;

  const insightValues: Record<string, number> = {};
  if (insights?.data) {
    for (const item of insights.data) {
      insightValues[item.name] = item.values?.[0]?.value ?? 0;
    }
  }

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        {[
          { l: 'Подписчики', v: profile?.followers_count ?? 0 },
          { l: 'Постов', v: profile?.media_count ?? 0 },
          { l: 'Показы', v: insightValues.impressions ?? 0 },
          { l: 'Охват', v: insightValues.reach ?? 0 },
        ].map((s) => (
          <div key={s.l} className="card p-4">
            <div className="text-xs text-graphite-500 mb-1">{s.l}</div>
            <div className="text-xl font-bold text-white">{Number(s.v).toLocaleString()}</div>
          </div>
        ))}
      </div>

      {media.length > 0 && (
        <div className="card p-4 mb-6">
          <h3 className="text-xs text-graphite-500 uppercase tracking-wider font-medium mb-3">Последние посты</h3>
          <div className="space-y-1">
            {media.slice(0, 10).map((m: any) => (
              <div key={m.id} className="flex items-center justify-between py-2 border-b border-graphite-800/50 last:border-0 text-sm">
                <span className="text-graphite-300 truncate flex-1">{m.caption?.slice(0, 60) || m.media_type}</span>
                <div className="flex gap-4 text-xs text-graphite-400 ml-3 shrink-0">
                  <span>❤ {m.like_count ?? 0}</span>
                  <span>💬 {m.comments_count ?? 0}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card p-4">
        <h3 className="text-xs text-graphite-500 uppercase tracking-wider font-medium mb-3">Аккаунты</h3>
        {accounts.map((acc: any) => (
          <div key={acc.id} className="flex items-center justify-between py-2 border-b border-graphite-800/50 last:border-0">
            <span className="text-sm text-graphite-200">{acc.title}</span>
            <span className="text-[11px] text-graphite-500">@{acc.username}</span>
          </div>
        ))}
      </div>
    </>
  );
}
