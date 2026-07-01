import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { api, HttpError } from '../lib/api';
import { Sidebar } from '../components/Sidebar';

export function DashboardPage() {
  const { user, setUser } = useAuth();
  const [channels, setChannels] = useState<Array<{ id: string; platform: string; title: string; username: string | null; externalId?: string; status: string; linkedAt: string }>>([]);
  const [loadingChannels, setLoadingChannels] = useState(true);
  const [linkCode, setLinkCode] = useState<{ code: string; botName: string; expiresAt: string } | null>(null);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [scheduledCount, setScheduledCount] = useState(0);
  const [publishedCount, setPublishedCount] = useState(0);

  useEffect(() => {
    let active = true;
    (async () => {
      try { const ch = await api.getChannels(); if (active) setChannels(ch); } catch {} finally { if (active) setLoadingChannels(false); }
    })();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const posts = await api.getPosts();
        if (!active) return;
        let scheduled = 0, published = 0;
        for (const p of posts) for (const pub of p.publications) {
          if (pub.status === 'queued' || pub.status === 'in_progress') scheduled++;
          if (pub.status === 'published') published++;
        }
        setScheduledCount(scheduled);
        setPublishedCount(published);
      } catch {}
    })();
    return () => { active = false; };
  }, []);

  const startLink = async () => {
    try { const code = await api.generateLinkCode(); setLinkCode(code); setShowLinkModal(true); } catch {}
  };

  const connectPinterest = async () => {
    try { const { url } = await api.pinterestAuthUrl(); window.location.href = url; }
    catch (err) { const msg = err instanceof HttpError ? err.message : ''; alert(msg.includes('не подключён') ? 'Pinterest не настроен. Обратитесь к администратору.' : msg || 'Ошибка Pinterest'); }
  };

  const connectYouTube = async () => {
    try { const { url } = await api.youtubeAuthUrl(); window.location.href = url; }
    catch (err) { const msg = err instanceof HttpError ? err.message : ''; alert(msg.includes('не подключён') ? 'YouTube не настроен. Обратитесь к администратору.' : msg || 'Ошибка YouTube'); }
  };

  const connectInstagram = async () => {
    try { const { url } = await api.instagramAuthUrl(); window.location.href = url; }
    catch (err) { const msg = err instanceof HttpError ? err.message : ''; alert(msg.includes('не подключён') ? 'Instagram не настроен. Обратитесь к администратору.' : msg || 'Ошибка Instagram'); }
  };

  const unlinkChannel = async (id: string) => {
    if (!confirm('Отключить аккаунт?')) return;
    try { await api.deleteChannel(id); setChannels((p) => p.filter((c) => c.id !== id)); if (user) setUser({ ...user, channelsCount: (user.channelsCount ?? 1) - 1 }); } catch {}
  };

  const active = channels.filter((c) => c.status === 'active');

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-6 pb-20 lg:pb-10 lg:p-10">
        <div className="mb-10">
          <h1 className="text-2xl font-bold text-white">{user?.name || 'коллега'}</h1>
          <p className="mt-1 text-sm text-graphite-500">
            {active.length === 0 ? 'Подключите аккаунт для начала работы' : `${active.length} ${active.length === 1 ? 'аккаунт' : 'аккаунта'} подключено`}
          </p>
        </div>

        {active.length === 0 && !loadingChannels && (
          <div className="card p-10 text-center max-w-lg mx-auto">
            <div className="text-3xl mb-4">+</div>
            <h2 className="text-lg font-semibold text-white mb-2">Подключите аккаунт</h2>
            <p className="text-sm text-graphite-400 mb-6">Telegram, Pinterest, YouTube или Instagram</p>
            <button onClick={() => setShowAddModal(true)} className="btn-primary">Подключить</button>
          </div>
        )}

        {active.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold text-graphite-500 uppercase tracking-wider">Аккаунты</h2>
              <button onClick={() => setShowAddModal(true)} className="text-sm text-graphite-400 hover:text-lime transition">+ Добавить</button>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {active.map((ch) => {
                const m: Record<string, { c: string; l: string }> = { telegram: { c: 'text-sky-400', l: 'TG' }, pinterest: { c: 'text-red-400', l: 'PI' }, youtube: { c: 'text-red-500', l: 'YT' }, instagram: { c: 'text-pink-400', l: 'IG' } };
                const { c, l } = m[ch.platform] ?? { c: 'text-graphite-400', l: '??' };
                return (
                  <div key={ch.id} className="card p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`text-[10px] font-bold ${c} bg-graphite-800 rounded px-1.5 py-0.5 shrink-0`}>{l}</span>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-graphite-100 truncate">{ch.title}</div>
                        <div className="text-[11px] text-graphite-500 truncate">{ch.username || ch.externalId}</div>
                      </div>
                    </div>
                    <button onClick={() => unlinkChannel(ch.id)} className="text-[11px] text-graphite-500 hover:text-red-400 transition ml-2">Удалить</button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { label: 'Запланировано', value: scheduledCount },
            { label: 'Опубликовано', value: publishedCount },
            { label: 'Аккаунтов', value: active.length },
          ].map((s) => (
            <div key={s.label} className="card p-4">
              <div className="text-2xl font-bold text-graphite-100">{s.value}</div>
              <div className="text-xs text-graphite-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </main>

      {/* Add modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50" onClick={() => setShowAddModal(false)}>
          <div className="card w-full max-w-sm p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-white mb-4">Подключить</h3>
            <div className="space-y-2">
              {[
                { label: 'Telegram', sub: 'Через бота', color: 'text-sky-400', icon: '✈', action: () => { setShowAddModal(false); startLink(); } },
                { label: 'Pinterest', sub: 'OAuth', color: 'text-red-400', icon: '📌', action: () => { setShowAddModal(false); connectPinterest(); } },
                { label: 'YouTube', sub: 'OAuth + видео', color: 'text-red-500', icon: '▶', action: () => { setShowAddModal(false); connectYouTube(); } },
                { label: 'Instagram', sub: 'OAuth + Reels', color: 'text-pink-400', icon: '📷', action: () => { setShowAddModal(false); connectInstagram(); } },
              ].map((p) => (
                <button key={p.label} onClick={p.action} className="w-full flex items-center gap-3 p-3 rounded-xl border border-graphite-700/40 hover:border-graphite-600/60 transition text-left">
                  <span className={`text-lg ${p.color}`}>{p.icon}</span>
                  <div>
                    <div className="font-medium text-white text-sm">{p.label}</div>
                    <div className="text-[11px] text-graphite-500">{p.sub}</div>
                  </div>
                </button>
              ))}
            </div>
            <button onClick={() => setShowAddModal(false)} className="btn-ghost mt-3 w-full">Закрыть</button>
          </div>
        </div>
      )}

      {showLinkModal && linkCode && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50">
          <div className="card w-full max-w-md p-5">
            <h3 className="text-lg font-bold text-white mb-4">Telegram</h3>
            <ol className="space-y-2 text-sm text-graphite-300 list-decimal list-inside">
              <li>Найдите бота <a href={`https://t.me/${linkCode.botName}`} target="_blank" rel="noopener noreferrer" className="text-lime hover:underline font-medium">@{linkCode.botName}</a></li>
              <li>Отправьте команду:</li>
            </ol>
            <div className="mt-2 rounded-lg bg-graphite-800 p-3 text-center font-mono text-sm text-lime select-all">/start {linkCode.code}</div>
            <p className="mt-3 text-[11px] text-graphite-500">Код действителен 10 минут</p>
            <button onClick={() => setShowLinkModal(false)} className="btn-ghost mt-3 w-full">Закрыть</button>
          </div>
        </div>
      )}
    </div>
  );
}
