import { useState, useEffect } from 'react';
import { Sidebar } from '../components/Sidebar';
import { api } from '../lib/api';
import type { ChannelStats } from '../lib/types';

function MiniLineChart({ data, height = 40 }: { data: Array<{ date: string; members: number | null }>; height?: number }) {
  const valid = data.filter((d) => d.members !== null) as Array<{ date: string; members: number }>;
  if (valid.length < 2) {
    return <div className="text-xs text-graphite-500">Недостаточно данных</div>;
  }

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

export function ChannelStatsPage() {
  const [channels, setChannels] = useState<ChannelStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [collecting, setCollecting] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const data = await api.getChannelStats();
      setChannels(data);
    } catch { /* ignore */ }
    setLoading(false);
  };

  const collectNow = async () => {
    setCollecting(true);
    try {
      await api.collectChannelStats();
      await loadStats();
    } catch { /* ignore */ }
    setCollecting(false);
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-white">Статистика каналов</h1>
            <p className="text-sm text-graphite-400">Данные Telegram Bot API · обновляется каждый час</p>
          </div>
          <button onClick={collectNow} disabled={collecting} className="btn-ghost text-sm">
            {collecting ? 'Сбор...' : '🔄 Обновить сейчас'}
          </button>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {[1, 2].map((i) => (
              <div key={i} className="card p-6 animate-pulse">
                <div className="h-6 w-40 rounded bg-graphite-800 mb-4" />
                <div className="h-4 w-24 rounded bg-graphite-800 mb-2" />
                <div className="h-20 rounded bg-graphite-800" />
              </div>
            ))}
          </div>
        ) : channels.length === 0 ? (
          <div className="card p-8 text-center">
            <div className="text-4xl mb-4">📡</div>
            <h2 className="font-display text-xl font-bold text-white">Нет каналов</h2>
            <p className="mt-2 text-sm text-graphite-300">Подключите Telegram-канал, чтобы собирать статистику.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {channels.map((ch) => (
              <div key={ch.id} className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-display text-lg font-bold text-white">{ch.title}</h3>
                    {ch.username && <p className="text-xs text-graphite-400">@{ch.username}</p>}
                  </div>
                  {ch.currentMembers !== null && (
                    <div className="text-right">
                      <div className="font-display text-2xl font-bold text-lime">{ch.currentMembers.toLocaleString()}</div>
                      <div className="text-[10px] text-graphite-400">подписчиков</div>
                    </div>
                  )}
                </div>

                {ch.description && (
                  <p className="text-xs text-graphite-400 mb-4 line-clamp-2">{ch.description}</p>
                )}

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="rounded-xl bg-graphite-850 p-3 text-center">
                    <div className="font-display text-lg font-bold text-graphite-100">{ch.publications.total}</div>
                    <div className="text-[10px] text-graphite-400">всего постов</div>
                  </div>
                  <div className="rounded-xl bg-graphite-850 p-3 text-center">
                    <div className="font-display text-lg font-bold text-green-400">{ch.publications.published}</div>
                    <div className="text-[10px] text-graphite-400">опубликовано</div>
                  </div>
                </div>

                {ch.memberHistory.length > 1 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-graphite-400">Динамика подписчиков</span>
                      {ch.memberHistory.length > 1 && ch.memberHistory[0].members !== null && ch.memberHistory[ch.memberHistory.length - 1].members !== null && (
                        <span className={`text-xs font-medium ${((ch.memberHistory[ch.memberHistory.length - 1].members ?? 0) - (ch.memberHistory[0].members ?? 0)) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {(ch.memberHistory[ch.memberHistory.length - 1].members ?? 0) - (ch.memberHistory[0].members ?? 0) >= 0 ? '+' : ''}
                          {((ch.memberHistory[ch.memberHistory.length - 1].members ?? 0) - (ch.memberHistory[0].members ?? 0)).toLocaleString()}
                        </span>
                      )}
                    </div>
                    <MiniLineChart data={ch.memberHistory} />
                  </div>
                )}

                <div className="mt-3 text-[10px] text-graphite-500">
                  ID: {ch.externalId} · Снимков: {ch.memberHistory.length}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 card p-4">
          <p className="text-xs text-graphite-400">
            <strong className="text-graphite-300">О сборе данных:</strong> Бот Telegram собирает количество подписчиков и информацию о каналах через{' '}
            <code className="text-lime text-[11px]">getChat</code> API каждый час. Детальная статистика постов (просмотры, реакции){' '}
            недоступна через Bot API — для неё нужен MTProto ( user session).
          </p>
        </div>
      </main>
    </div>
  );
}
