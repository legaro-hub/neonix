import { useState, useEffect } from 'react';
import { Sidebar } from '../components/Sidebar';
import { api } from '../lib/api';
import type { AnalyticsOverview, AnalyticsTimeline, AnalyticsChannel, AnalyticsPost, ChannelStats } from '../lib/types';

function BarChart({ data, max }: { data: AnalyticsTimeline[]; max: number }) {
  return (
    <div className="flex items-end gap-1 h-32">
      {data.map((d) => (
        <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group relative">
          <div
            className="w-full rounded-t bg-lime/80 transition-all hover:bg-lime min-h-[2px]"
            style={{ height: max > 0 ? `${(d.count / max) * 100}%` : '2px' }}
          />
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block bg-graphite-900 border border-graphite-700 rounded px-2 py-1 text-[10px] text-white whitespace-nowrap z-10">
            {d.date.slice(5)}: {d.count}
          </div>
          {data.length <= 14 && (
            <span className="text-[9px] text-graphite-500 -rotate-45 origin-top-left mt-1">
              {d.date.slice(8)}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

function MiniLineChart({ data, height = 40 }: { data: Array<{ date: string; members: number | null }>; height?: number }) {
  const valid = data.filter((d) => d.members !== null) as Array<{ date: string; members: number }>;
  if (valid.length < 2) return <div className="text-xs text-graphite-500">Недостаточно данных</div>;
  const min = Math.min(...valid.map((d) => d.members));
  const max = Math.max(...valid.map((d) => d.members));
  const range = max - min || 1;
  const w = 200;
  const points = valid.map((d, i) => {
    const x = (i / (valid.length - 1)) * w;
    const y = height - ((d.members - min) / range) * (height - 8) - 4;
    return `${x},${y}`;
  }).join(' ');
  const diff = valid[valid.length - 1].members - valid[0].members;
  const color = diff >= 0 ? '#4ade80' : '#f87171';
  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="w-full" style={{ height }}>
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {valid.length <= 14 && valid.map((d, i) => (
        <circle key={i} cx={(i / (valid.length - 1)) * w} cy={height - ((d.members - min) / range) * (height - 8) - 4} r="2" fill={color} />
      ))}
    </svg>
  );
}

function StatCard({ icon, label, value, sub }: { icon: string; label: string; value: string | number; sub?: string }) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-graphite-800 text-lg">{icon}</div>
        <div>
          <div className="font-display text-2xl font-bold text-graphite-100">{value}</div>
          <div className="text-xs text-graphite-400">{label}</div>
          {sub && <div className="text-[10px] text-graphite-500">{sub}</div>}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    draft: { bg: 'bg-graphite-700', text: 'text-graphite-300', label: 'Черновик' },
    scheduled: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Запланирован' },
    queued: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'В очереди' },
    in_progress: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'Отправляется' },
    published: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Опубликован' },
    failed: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Ошибка' },
  };
  const s = map[status] || map.draft;
  return <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${s.bg} ${s.text}`}>{s.label}</span>;
}

export function AnalyticsPage() {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [timeline, setTimeline] = useState<AnalyticsTimeline[]>([]);
  const [analyticsChannels, setAnalyticsChannels] = useState<AnalyticsChannel[]>([]);
  const [posts, setPosts] = useState<AnalyticsPost[]>([]);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  // Channel stats (Bot API)
  const [channelStats, setChannelStats] = useState<ChannelStats[]>([]);
  const [collecting, setCollecting] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const [ov, tl, ch, ps, cs] = await Promise.all([
          api.getAnalyticsOverview(),
          api.getAnalyticsTimeline(days),
          api.getAnalyticsChannels(),
          api.getAnalyticsPosts(20),
          api.getChannelStats(),
        ]);
        if (!active) return;
        setOverview(ov);
        setTimeline(tl);
        setAnalyticsChannels(ch);
        setPosts(ps);
        setChannelStats(cs);
      } catch { /* ignore */ }
      if (active) setLoading(false);
    })();
    return () => { active = false; };
  }, [days]);

  const collectNow = async () => {
    setCollecting(true);
    try {
      await api.collectChannelStats();
      const cs = await api.getChannelStats();
      setChannelStats(cs);
    } catch { /* ignore */ }
    setCollecting(false);
  };

  const maxTimeline = Math.max(1, ...timeline.map((d) => d.count));

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-white">Аналитика и статистика</h1>
            <p className="text-sm text-graphite-400">Публикации, каналы, подписчики</p>
          </div>
          <div className="flex gap-2">
            <select value={days} onChange={(e) => setDays(Number(e.target.value))} className="input text-sm w-40">
              <option value={7}>За 7 дней</option>
              <option value={14}>За 14 дней</option>
              <option value={30}>За 30 дней</option>
              <option value={90}>За 90 дней</option>
            </select>
            <button onClick={collectNow} disabled={collecting} className="btn-ghost text-sm">
              {collecting ? 'Сбор...' : '🔄 Обновить'}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="card p-5 animate-pulse">
                <div className="h-10 w-10 rounded-xl bg-graphite-800" />
                <div className="mt-3 h-6 w-20 rounded bg-graphite-800" />
              </div>
            ))}
          </div>
        ) : overview ? (
          <>
            {/* Обзор */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
              <StatCard icon="📝" label="Всего постов" value={overview.totalPosts} />
              <StatCard icon="⚡" label="Опубликовано" value={overview.byStatus.published} sub={`${overview.successRate}% успеха`} />
              <StatCard icon="📅" label="В очереди" value={overview.byStatus.queued + overview.byStatus.in_progress} />
              <StatCard icon="❌" label="Ошибок" value={overview.byStatus.failed} />
            </div>

            {/* График */}
            <div className="card p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-lg font-bold text-white">Публикации по дням</h2>
                <span className="text-xs text-graphite-400">{overview.totalPublications} всего</span>
              </div>
              {timeline.some((d) => d.count > 0) ? (
                <BarChart data={timeline} max={maxTimeline} />
              ) : (
                <p className="text-sm text-graphite-400 text-center py-8">Нет данных за выбранный период</p>
              )}
              <div className="flex justify-between mt-2 text-[10px] text-graphite-500">
                <span>{timeline[0]?.date?.slice(5)}</span>
                <span>{timeline[timeline.length - 1]?.date?.slice(5)}</span>
              </div>
            </div>

            {/* Статистика каналов — подписчики */}
            {channelStats.length > 0 && (
              <div className="mb-6">
                <h2 className="font-display text-lg font-bold text-white mb-4">Подписчики каналов</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {channelStats.map((ch) => (
                    <div key={ch.id} className="card p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-white">{ch.title}</h3>
                          {ch.username && <p className="text-xs text-graphite-400">@{ch.username}</p>}
                        </div>
                        {ch.currentMembers !== null && (
                          <div className="text-right">
                            <div className="font-display text-xl font-bold text-lime">{ch.currentMembers.toLocaleString()}</div>
                            <div className="text-[10px] text-graphite-400">подписчиков</div>
                          </div>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div className="rounded-lg bg-graphite-850 p-2 text-center">
                          <div className="font-bold text-graphite-100">{ch.publications.total}</div>
                          <div className="text-[10px] text-graphite-400">постов</div>
                        </div>
                        <div className="rounded-lg bg-graphite-850 p-2 text-center">
                          <div className="font-bold text-green-400">{ch.publications.published}</div>
                          <div className="text-[10px] text-graphite-400">опубл.</div>
                        </div>
                      </div>
                      {ch.memberHistory.length > 1 && (
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] text-graphite-400">Динамика</span>
                            {ch.memberHistory[0].members !== null && ch.memberHistory[ch.memberHistory.length - 1].members !== null && (
                              <span className={`text-[10px] font-medium ${((ch.memberHistory[ch.memberHistory.length - 1].members ?? 0) - (ch.memberHistory[0].members ?? 0)) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {(ch.memberHistory[ch.memberHistory.length - 1].members ?? 0) - (ch.memberHistory[0].members ?? 0) >= 0 ? '+' : ''}
                                {((ch.memberHistory[ch.memberHistory.length - 1].members ?? 0) - (ch.memberHistory[0].members ?? 0)).toLocaleString()}
                              </span>
                            )}
                          </div>
                          <MiniLineChart data={ch.memberHistory} height={30} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Таблица по каналам (аналитика публикаций) */}
            {analyticsChannels.length > 0 && (
              <div className="card p-6 mb-6">
                <h2 className="font-display text-lg font-bold text-white mb-4">Публикации по каналам</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-graphite-700 text-graphite-400 text-left">
                        <th className="pb-2 font-medium">Канал</th>
                        <th className="pb-2 font-medium text-center">Всего</th>
                        <th className="pb-2 font-medium text-center">Опубликовано</th>
                        <th className="pb-2 font-medium text-center">Ошибки</th>
                        <th className="pb-2 font-medium text-center">Успех</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analyticsChannels.map((ch) => (
                        <tr key={ch.id} className="border-b border-graphite-800">
                          <td className="py-3">
                            <div className="font-medium text-graphite-100">{ch.title}</div>
                            {ch.username && <div className="text-xs text-graphite-500">@{ch.username}</div>}
                          </td>
                          <td className="py-3 text-center text-graphite-300">{ch.total}</td>
                          <td className="py-3 text-center text-green-400">{ch.published}</td>
                          <td className="py-3 text-center text-red-400">{ch.failed}</td>
                          <td className="py-3 text-center">
                            <span className={`font-medium ${ch.successRate >= 90 ? 'text-green-400' : ch.successRate >= 70 ? 'text-yellow-400' : 'text-red-400'}`}>
                              {ch.successRate}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Последние посты */}
            <div className="card p-6">
              <h2 className="font-display text-lg font-bold text-white mb-4">Последние посты</h2>
              {posts.length === 0 ? (
                <p className="text-sm text-graphite-400 text-center py-8">Пока нет постов</p>
              ) : (
                <div className="space-y-3">
                  {posts.map((post) => (
                    <div key={post.id} className="flex items-center justify-between p-3 rounded-xl bg-graphite-850 border border-graphite-800">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-graphite-100 truncate">{post.title}</span>
                          <StatusBadge status={post.status} />
                        </div>
                        <div className="flex items-center gap-3 text-xs text-graphite-400">
                          <span>{post.channels.length > 0 ? post.channels.join(', ') : 'Без каналов'}</span>
                          <span>·</span>
                          <span>{post.published}/{post.total} опубл.</span>
                          {post.mediaCount > 0 && <span>· {post.mediaCount} медиа</span>}
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <div className="text-xs text-graphite-500">
                          {new Date(post.createdAt).toLocaleDateString('ru-RU')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="card p-8 text-center">
            <div className="text-4xl mb-4">📊</div>
            <h2 className="font-display text-xl font-bold text-white">Нет данных</h2>
            <p className="mt-2 text-sm text-graphite-300">Создайте и опубликуйте посты, чтобы увидеть статистику.</p>
          </div>
        )}
      </main>
    </div>
  );
}
