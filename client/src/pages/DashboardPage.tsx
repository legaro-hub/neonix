import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { api, HttpError } from '../lib/api';
import { Sidebar } from '../components/Sidebar';

export function DashboardPage() {
  const { user, setUser } = useAuth();
  const [channels, setChannels] = useState<Array<{ id: string; platform: string; title: string; username: string | null; status: string; linkedAt: string }>>([]);
  const [loadingChannels, setLoadingChannels] = useState(true);
  const [linkCode, setLinkCode] = useState<{ code: string; botName: string; expiresAt: string } | null>(null);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [connectingPinterest, setConnectingPinterest] = useState(false);
  const [scheduledCount, setScheduledCount] = useState(0);
  const [publishedCount, setPublishedCount] = useState(0);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const ch = await api.getChannels();
        if (active) setChannels(ch);
      } catch { /* ignore */ }
      finally { if (active) setLoadingChannels(false); }
    })();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const posts = await api.getPosts();
        if (!active) return;
        let scheduled = 0;
        let published = 0;
        for (const p of posts) {
          for (const pub of p.publications) {
            if (pub.status === 'queued' || pub.status === 'in_progress') scheduled++;
            if (pub.status === 'published') published++;
          }
        }
        setScheduledCount(scheduled);
        setPublishedCount(published);
      } catch { /* ignore */ }
    })();
    return () => { active = false; };
  }, []);

  const startLink = async () => {
    try {
      const code = await api.generateLinkCode();
      setLinkCode(code);
      setShowLinkModal(true);
    } catch { /* ignore */ }
  };

  const connectPinterest = async () => {
    setConnectingPinterest(true);
    try {
      const { url } = await api.pinterestAuthUrl();
      window.location.href = url;
    } catch (err) {
      alert(err instanceof HttpError ? err.message : 'Ошибка Pinterest');
      setConnectingPinterest(false);
    }
  };

  const unlinkChannel = async (id: string) => {
    if (!confirm('Отключить аккаунт?')) return;
    try {
      await api.deleteChannel(id);
      setChannels((prev) => prev.filter((c) => c.id !== id));
      if (user) setUser({ ...user, channelsCount: (user.channelsCount ?? 1) - 1 });
    } catch { /* ignore */ }
  };

  const activeChannels = channels.filter((c) => c.status === 'active');
  const tgCount = activeChannels.filter((c) => c.platform === 'telegram').length;
  const piCount = activeChannels.filter((c) => c.platform === 'pinterest').length;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-10">
        <div className="mb-8">
          <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">
            Привет, {user?.name || 'коллега'} 👋
          </h1>
          <p className="mt-1 text-graphite-300">
            {activeChannels.length === 0
              ? 'Начните с подключения Telegram-канала или Pinterest.'
              : `Подключено: ${tgCount} Telegram ${tgCount > 0 ? (tgCount === 1 ? 'канал' : 'канала') : ''}${tgCount > 0 && piCount > 0 ? ', ' : ''}${piCount > 0 ? `${piCount} Pinterest ${piCount === 1 ? 'аккаунт' : 'аккаунта'}` : ''}`}
          </p>
        </div>

        {activeChannels.length === 0 && !loadingChannels && (
          <div className="card relative overflow-hidden p-8 sm:p-12">
            <div className="pointer-events-none absolute inset-0 bg-grid-faint bg-[size:40px_40px] opacity-40" />
            <div className="relative flex flex-col items-center text-center">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-lime/10 text-lime ring-1 ring-lime/20">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.9 4.3 2.6 11.6c-.9.4-.9 1.6.1 1.9l4.8 1.5 1.8 5.7c.3.8 1.3.9 1.8.2l2.5-3.2 4.9 3.6c.6.5 1.6.1 1.7-.7L22.9 5.4c.2-.9-.6-1.5-1-1.1Z" />
                </svg>
              </div>
              <h2 className="mt-5 font-display text-xl font-bold text-white">
                Подключите аккаунт
              </h2>
              <p className="mt-2 max-w-md text-sm text-graphite-300">
                Telegram-канал для публикации постов или Pinterest для пинов.
              </p>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowAddModal(true)} className="btn-primary">
                  Подключить аккаунт
                </button>
              </div>
            </div>
          </div>
        )}

        {activeChannels.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-semibold text-white">Аккаунты</h2>
              <button onClick={() => setShowAddModal(true)} className="btn-primary text-sm">
                + Добавить
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {activeChannels.map((ch) => {
                const isTg = ch.platform === 'telegram';
                return (
                  <div key={ch.id} className="card p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`grid h-10 w-10 place-items-center rounded-xl text-sm ${isTg ? 'bg-sky-500/10 text-sky-400' : 'bg-red-500/10 text-red-400'}`}>
                        {isTg ? '✈' : '📌'}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-graphite-100">{ch.title}</div>
                        {ch.username && <div className="text-xs text-graphite-400">@{ch.username}</div>}
                        <div className="text-[10px] text-graphite-500">{isTg ? 'Telegram' : 'Pinterest'}</div>
                      </div>
                    </div>
                    <button onClick={() => unlinkChannel(ch.id)} className="text-xs text-graphite-500 hover:text-red-400 transition">Отключить</button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {[
            { icon: '📅', label: 'Запланировано', value: String(scheduledCount) },
            { icon: '⚡', label: 'Опубликовано', value: String(publishedCount) },
            { icon: '📊', label: 'Аккаунтов', value: String(activeChannels.length) },
          ].map((s) => (
            <div key={s.label} className="card p-5">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-graphite-800 text-lg">{s.icon}</div>
                <div>
                  <div className="font-display text-2xl font-bold text-graphite-100">{s.value}</div>
                  <div className="text-xs text-graphite-400">{s.label}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-xl border border-dashed border-graphite-700 px-5 py-4 text-center text-sm text-graphite-400">
          💡 Используйте календарь для планирования постов и редактор для создания нового контента.
        </div>
      </main>

      {/* Add account modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)}>
          <div className="card w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-lg font-bold text-white mb-4">Подключить</h3>
            <div className="space-y-3">
              <button onClick={() => { setShowAddModal(false); startLink(); }} className="w-full flex items-center gap-4 p-4 rounded-xl border border-graphite-700 bg-graphite-850 hover:border-sky-400/40 transition text-left">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-sky-500/15 text-sky-400 shrink-0 text-xl">✈</div>
                <div>
                  <div className="font-semibold text-white">Telegram-канал</div>
                  <div className="text-xs text-graphite-400">Через бот @manager_neonix_bot</div>
                </div>
              </button>
              <button onClick={() => { setShowAddModal(false); connectPinterest(); }} disabled={connectingPinterest} className="w-full flex items-center gap-4 p-4 rounded-xl border border-graphite-700 bg-graphite-850 hover:border-red-400/40 transition text-left">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-red-500/15 text-red-400 shrink-0 text-xl">📌</div>
                <div>
                  <div className="font-semibold text-white">{connectingPinterest ? 'Подключение...' : 'Pinterest'}</div>
                  <div className="text-xs text-graphite-400">OAuth-авторизация</div>
                </div>
              </button>
            </div>
            <button onClick={() => setShowAddModal(false)} className="btn-ghost mt-4 w-full">Закрыть</button>
          </div>
        </div>
      )}

      {/* TG link modal */}
      {showLinkModal && linkCode && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm">
          <div className="card w-full max-w-md p-6">
            <h3 className="font-display text-lg font-bold text-white mb-4">Подключение Telegram</h3>
            <ol className="space-y-3 text-sm text-graphite-300 list-decimal list-inside">
              <li>Откройте Telegram, найдите бота <a href={`https://t.me/${linkCode.botName}`} target="_blank" rel="noopener noreferrer" className="font-semibold text-lime hover:underline">@{linkCode.botName}</a></li>
              <li>Отправьте команду:</li>
            </ol>
            <div className="mt-2 rounded-xl bg-graphite-850 p-3 text-center font-mono text-sm text-lime select-all">/start {linkCode.code}</div>
            <p className="mt-3 text-xs text-graphite-400">Код действителен 10 минут. Канал привяжется автоматически.</p>
            <button onClick={() => setShowLinkModal(false)} className="btn-ghost mt-4 w-full">Закрыть</button>
          </div>
        </div>
      )}
    </div>
  );
}
