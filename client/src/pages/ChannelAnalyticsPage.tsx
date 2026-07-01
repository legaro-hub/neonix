import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { api, HttpError } from '../lib/api';

export function ChannelAnalyticsPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(30);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    api.channelAnalytics(id, String(days))
      .then(setData)
      .catch((err) => setError(err instanceof HttpError ? err.message : 'Ошибка загрузки'))
      .finally(() => setLoading(false));
  }, [id, days]);

  if (loading) return (
    <div className="flex min-h-screen"><Sidebar />
      <main className="flex-1 p-6 pb-20 lg:pb-10 lg:p-10">
        <div className="space-y-4">
          <div className="h-8 w-48 rounded bg-graphite-800 animate-pulse" />
          <div className="grid grid-cols-4 gap-3">{[1,2,3,4].map(i => <div key={i} className="card p-4 h-20 animate-pulse" />)}</div>
        </div>
      </main>
    </div>
  );

  if (error) return (
    <div className="flex min-h-screen"><Sidebar />
      <main className="flex-1 p-6 pb-20 lg:pb-10 lg:p-10">
        <div className="card p-8 text-center"><p className="text-red-400">{error}</p><Link to="/app/analytics" className="btn-ghost mt-4 inline-block">← Назад</Link></div>
      </main>
    </div>
  );

  if (!data) return null;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-6 pb-20 lg:pb-10 lg:p-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link to="/app/analytics" className="text-graphite-400 hover:text-white transition">←</Link>
            <div>
              <h1 className="text-xl font-bold text-white">{data.channel.title}</h1>
              <p className="text-xs text-graphite-500">{data.platform} · @{data.channel.username || data.channel.externalId}</p>
            </div>
          </div>
          <div className="flex gap-1.5">
            {[7,14,30,90].map(d => (
              <button key={d} onClick={() => setDays(d)} className={`px-2.5 py-1 text-xs rounded-lg transition ${days === d ? 'bg-graphite-700 text-white' : 'text-graphite-400 hover:text-white'}`}>{d}д</button>
            ))}
          </div>
        </div>

        {data.platform === 'telegram' && <TelegramDetail data={data} />}
        {data.platform === 'pinterest' && <PinterestDetail data={data} />}
        {data.platform === 'youtube' && <YouTubeDetail data={data} />}
        {data.platform === 'instagram' && <InstagramDetail data={data} />}
      </main>
    </div>
  );
}

/* ── Шкала/бар ── */
function MiniBar({ data, max, color = '#6b7280' }: { data: Array<{ label: string; value: number }>; max: number; color?: string }) {
  return (
    <div className="space-y-1">
      {data.map(d => (
        <div key={d.label} className="flex items-center gap-2 text-xs">
          <span className="w-10 text-right text-graphite-500 shrink-0">{d.label}</span>
          <div className="flex-1 h-4 bg-graphite-800 rounded overflow-hidden">
            <div className="h-full rounded" style={{ width: max > 0 ? `${(d.value / max) * 100}%` : '0', background: color }} />
          </div>
          <span className="w-8 text-right text-graphite-400 shrink-0">{d.value}</span>
        </div>
      ))}
    </div>
  );
}

/* ── LINE CHART ── */
function LineChart({ data, color = '#6b7280', height = 60 }: { data: number[]; color?: string; height?: number }) {
  if (data.length < 2) return <div className="text-xs text-graphite-500 py-4">Недостаточно данных</div>;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 300;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${height - ((v - min) / range) * (height - 8) - 4}`).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="w-full" style={{ height }}>
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ── METRIC CARD ── */
function M({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="card p-4">
      <div className="text-[11px] text-graphite-500 uppercase tracking-wider mb-1">{label}</div>
      <div className={`text-xl font-bold ${color ?? 'text-white'}`}>{typeof value === 'number' ? value.toLocaleString() : value}</div>
      {sub && <div className="text-[11px] text-graphite-500 mt-0.5">{sub}</div>}
    </div>
  );
}

/* ═══ TELEGRAM DETAIL ═══ */
function TelegramDetail({ data }: { data: any }) {
  const s = data.stats;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <M label="Подписчиков" value={s.currentMembers} color="text-white" />
        <M label="Рост" value={`${s.memberGrowth >= 0 ? '+' : ''}${s.memberGrowth}`} color={s.memberGrowth >= 0 ? 'text-green-400' : 'text-red-400'} />
        <M label="Публикаций" value={s.total} />
        <M label="Опубликовано" value={s.published} color="text-green-400" />
        <M label="Успех" value={`${s.successRate}%`} color={s.successRate >= 90 ? 'text-green-400' : 'text-yellow-400'} />
      </div>

      {data.memberHistory.length > 1 && (
        <div className="card p-4">
          <div className="text-[11px] text-graphite-500 uppercase tracking-wider mb-3">Динамика подписчиков</div>
          <LineChart data={data.memberHistory.map((d: any) => d.members ?? 0)} color="#4ade80" height={80} />
          <div className="flex justify-between text-[10px] text-graphite-500 mt-1">
            <span>{data.memberHistory[0]?.date}</span>
            <span>{data.memberHistory[data.memberHistory.length - 1]?.date}</span>
          </div>
        </div>
      )}

      {Object.values(data.byDayOfWeek).some((v: any) => v > 0) && (
        <div className="card p-4">
          <div className="text-[11px] text-graphite-500 uppercase tracking-wider mb-3">Публикации по дням недели</div>
          <MiniBar data={Object.entries(data.byDayOfWeek).map(([k, v]) => ({ label: k, value: v as number }))} max={Math.max(...Object.values(data.byDayOfWeek) as number[])} color="#4ade80" />
        </div>
      )}

      {data.byHour.some((v: number) => v > 0) && (
        <div className="card p-4">
          <div className="text-[11px] text-graphite-500 uppercase tracking-wider mb-3">Публикации по часам</div>
          <div className="flex items-end gap-0.5 h-16">
            {data.byHour.map((v: number, i: number) => (
              <div key={i} className="flex-1 flex flex-col items-center">
                <div className="w-full rounded-t bg-graphite-600 min-h-[1px]" style={{ height: Math.max(1, (v / Math.max(...data.byHour)) * 50) }} />
                {i % 4 === 0 && <span className="text-[8px] text-graphite-500 mt-0.5">{i}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {data.recentPublications.length > 0 && (
        <div className="card p-4">
          <div className="text-[11px] text-graphite-500 uppercase tracking-wider mb-3">Последние публикации</div>
          <div className="space-y-1">
            {data.recentPublications.map((p: any, i: number) => (
              <div key={i} className="flex items-center justify-between py-1.5 text-xs border-b border-graphite-800/50 last:border-0">
                <span className="text-graphite-300 truncate flex-1">{p.title || 'Без заголовка'}</span>
                <span className={`ml-2 shrink-0 ${p.status === 'published' ? 'text-green-400' : p.status === 'failed' ? 'text-red-400' : 'text-graphite-500'}`}>
                  {p.status === 'published' ? '✓' : p.status === 'failed' ? '✕' : '⏳'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══ PINTEREST DETAIL ═══ */
function PinterestDetail({ data }: { data: any }) {
  const m = data.metrics;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <M label="Подписчики" value={data.profile.followers} />
        <M label="Пины" value={data.profile.totalPins} />
        <M label="Показы" value={m.impressions} />
        <M label="Сохранения" value={m.saves} color="text-white" />
        <M label="Engagement Rate" value={`${m.engagementRate}%`} color="text-lime" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <M label="Клики" value={m.pinClicks} />
        <M label="Внешние переходы" value={m.outboundClicks} />
        <M label="Вовлечения" value={m.engagements} />
        <M label="Подписки" value={m.follows} color="text-lime" />
      </div>

      {data.topPins.length > 0 && (
        <div className="card p-4">
          <div className="text-[11px] text-graphite-500 uppercase tracking-wider mb-3">Топ пинов по вовлечению</div>
          <div className="space-y-1">
            {data.topPins.slice(0, 15).map((pin: any) => (
              <div key={pin.id || Math.random()} className="flex items-center justify-between py-1.5 text-xs border-b border-graphite-800/50 last:border-0">
                <span className="text-graphite-300 truncate flex-1">{pin.title || pin.permalink?.slice(0, 50) || 'Пин'}</span>
                <div className="flex gap-3 shrink-0 text-graphite-400">
                  {pin.pin_metrics?.['90d'] && (
                    <>
                      <span>{(pin.pin_metrics['90d'].IMPRESSIONS ?? 0).toLocaleString()} 👁</span>
                      <span>{(pin.pin_metrics['90d'].SAVES ?? 0).toLocaleString()} 💾</span>
                      <span>{(pin.pin_metrics['90d'].PIN_CLICKS ?? 0).toLocaleString()} 🖱</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.byFormat.length > 0 && (
        <div className="card p-4">
          <div className="text-[11px] text-graphite-500 uppercase tracking-wider mb-3">По формату</div>
          <div className="space-y-1">
            {data.byFormat.map((f: any) => {
              const fmt = Object.values(f)[0] as string;
              const fmtMetrics = f.metrics ?? {};
              return (
                <div key={fmt} className="flex items-center justify-between py-1.5 text-xs border-b border-graphite-800/50 last:border-0">
                  <span className="text-graphite-300">{fmt}</span>
                  <div className="flex gap-3 text-graphite-400">
                    <span>{(fmtMetrics.IMPRESSIONS ?? 0).toLocaleString()} 👁</span>
                    <span>{(fmtMetrics.SAVES ?? 0).toLocaleString()} 💾</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══ YOUTUBE DETAIL ═══ */
function YouTubeDetail({ data }: { data: any }) {
  const ch = data.channel;
  const tm = data.periodMetrics;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <M label="Подписчики" value={ch.subscribers} />
        <M label="Просмотры" value={ch.totalViews} />
        <M label="Видео" value={ch.totalVideos} />
        <M label="Рост подписчиков" value={`${tm.subscribersGained >= 0 ? '+' : ''}${tm.subscribersGained}`} color={tm.subscribersGained >= 0 ? 'text-green-400' : 'text-red-400'} />
        <M label="Минут просмотра" value={Math.round(tm.minutesWatched)} />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <M label="Просмотры" value={tm.views} />
        <M label="Лайки" value={tm.likes} />
        <M label="Комментарии" value={tm.comments} />
        <M label="Среднее время" value={`${Math.floor(tm.avgViewDuration / 60)}:${String(tm.avgViewDuration % 60).padStart(2, '0')}`} />
      </div>

      {data.dailyTrend.length > 0 && (
        <div className="card p-4">
          <div className="text-[11px] text-graphite-500 uppercase tracking-wider mb-3">Просмотры по дням</div>
          <LineChart data={data.dailyTrend.map((d: any) => d.views)} color="#ef4444" height={60} />
          <div className="flex justify-between text-[10px] text-graphite-500 mt-1">
            <span>{data.dailyTrend[0]?.date?.slice(5)}</span>
            <span>{data.dailyTrend[data.dailyTrend.length - 1]?.date?.slice(5)}</span>
          </div>
        </div>
      )}

      {data.demographics.length > 0 && (
        <div className="card p-4">
          <div className="text-[11px] text-graphite-500 uppercase tracking-wider mb-3">Демография</div>
          <div className="space-y-1">
            {data.demographics.map(([age, gender, pct]: [string, string, number]) => (
              <div key={`${age}-${gender}`} className="flex items-center gap-2 text-xs">
                <span className="w-20 text-graphite-400">{age}</span>
                <span className="w-16 text-graphite-500">{gender}</span>
                <div className="flex-1 h-3 bg-graphite-800 rounded overflow-hidden">
                  <div className="h-full rounded bg-violet-500" style={{ width: `${pct}%` }} />
                </div>
                <span className="w-10 text-right text-graphite-400">{pct}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.geography.length > 0 && (
        <div className="card p-4">
          <div className="text-[11px] text-graphite-500 uppercase tracking-wider mb-3">География</div>
          <div className="space-y-1">
            {data.geography.map(([country, views, minutes]: [string, number, number]) => (
              <div key={country} className="flex items-center justify-between py-1 text-xs border-b border-graphite-800/50 last:border-0">
                <span className="text-graphite-300">{country}</span>
                <div className="flex gap-4 text-graphite-400">
                  <span>{views.toLocaleString()} 👁</span>
                  <span>{Math.round(minutes)} мин</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.trafficSources.length > 0 && (
        <div className="card p-4">
          <div className="text-[11px] text-graphite-500 uppercase tracking-wider mb-3">Источники трафика</div>
          <MiniBar data={data.trafficSources.map(([src, views]: [string, number]) => ({ label: src, value: views }))} max={Math.max(...data.trafficSources.map(([, v]: [string, number]) => v))} color="#8b5cf6" />
        </div>
      )}

      {data.devices.length > 0 && (
        <div className="card p-4">
          <div className="text-[11px] text-graphite-500 uppercase tracking-wider mb-3">Устройства</div>
          <MiniBar data={data.devices.map(([dev, views]: [string, number]) => ({ label: dev, value: views }))} max={Math.max(...data.devices.map(([, v]: [string, number]) => v))} color="#06b6d4" />
        </div>
      )}

      {data.topVideos.length > 0 && (
        <div className="card p-4">
          <div className="text-[11px] text-graphite-500 uppercase tracking-wider mb-3">Топ видео</div>
          <div className="space-y-1">
            {data.topVideos.map(([videoId, views, likes, comments, , avgPct]: any[]) => (
              <div key={videoId} className="flex items-center justify-between py-1.5 text-xs border-b border-graphite-800/50 last:border-0">
                <span className="text-graphite-300 truncate flex-1">{videoId}</span>
                <div className="flex gap-3 shrink-0 text-graphite-400">
                  <span>{views?.toLocaleString()} 👁</span>
                  <span>{likes} 👍</span>
                  <span>{comments} 💬</span>
                  <span>{Math.round(avgPct)}% 👀</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══ INSTAGRAM DETAIL ═══ */
function InstagramDetail({ data }: { data: any }) {
  const m = data.metrics;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <M label="Подписчики" value={data.profile.followers} />
        <M label="Постов" value={data.profile.mediaCount} />
        <M label="Показы" value={m.impressions} />
        <M label="Охват" value={m.reach} />
        <M label="Engagement Rate" value={`${m.engagementRate}%`} color="text-lime" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <M label="Просмотры профиля" value={m.profileViews} />
        <M label="Переходы на сайт" value={m.websiteClicks} />
        <M label="Взаимодействия" value={m.totalInteractions} />
        <M label="Охват аудитории" value={m.accountsEngaged} />
      </div>

      {data.followerGrowth.length > 0 && (
        <div className="card p-4">
          <div className="text-[11px] text-graphite-500 uppercase tracking-wider mb-3">Динамика подписчиков</div>
          <LineChart data={data.followerGrowth.map((d: any) => d.value ?? d.followers ?? 0)} color="#e11d48" height={60} />
        </div>
      )}

      {data.audience?.gender?.length > 0 && (
        <div className="card p-4">
          <div className="text-[11px] text-graphite-500 uppercase tracking-wider mb-3">Демография — пол и возраст</div>
          <div className="space-y-1">
            {data.audience.gender.map((g: any) => (
              <div key={g.name} className="flex items-center gap-2 text-xs">
                <span className="w-16 text-graphite-400">{g.name}</span>
                <div className="flex-1 h-3 bg-graphite-800 rounded overflow-hidden">
                  <div className="h-full rounded" style={{ width: `${g.values?.[0]?.percentage ?? 0}%`, background: g.name?.includes('F') ? '#ec4899' : '#3b82f6' }} />
                </div>
                <span className="w-10 text-right text-graphite-400">{g.values?.[0]?.percentage ?? 0}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.audience?.countries?.length > 0 && (
        <div className="card p-4">
          <div className="text-[11px] text-graphite-500 uppercase tracking-wider mb-3">Топ стран</div>
          <div className="space-y-1">
            {data.audience.countries.map((c: any) => (
              <div key={c.name} className="flex items-center justify-between py-1 text-xs border-b border-graphite-800/50 last:border-0">
                <span className="text-graphite-300">{c.name}</span>
                <span className="text-graphite-400">{(c.value ?? 0).toLocaleString()} 👁</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.topMedia.length > 0 && (
        <div className="card p-4">
          <div className="text-[11px] text-graphite-500 uppercase tracking-wider mb-3">Топ постов по взаимодействиям</div>
          <div className="space-y-1">
            {data.topMedia.slice(0, 15).map((m: any) => (
              <div key={m.id} className="flex items-center justify-between py-1.5 text-xs border-b border-graphite-800/50 last:border-0">
                <div className="flex-1 min-w-0">
                  <span className="text-graphite-300 truncate block">{m.caption || m.type}</span>
                  <span className="text-[10px] text-graphite-500">{m.type} · {new Date(m.timestamp).toLocaleDateString('ru-RU')}</span>
                </div>
                <div className="flex gap-3 shrink-0 text-graphite-400">
                  <span>❤ {m.likes}</span>
                  <span>💬 {m.comments}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
