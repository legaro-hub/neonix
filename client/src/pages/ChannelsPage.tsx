import { useState, useEffect } from 'react';
import { Sidebar } from '../components/Sidebar';
import { api } from '../lib/api';
import type { SocialAccount } from '../lib/types';

export function ChannelsPage() {
  const [channels, setChannels] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [linking, setLinking] = useState(false);
  const [linkCode, setLinkCode] = useState<{ code: string; botName: string; expiresAt: string } | null>(null);
  const [showLinkModal, setShowLinkModal] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const ch = await api.getChannels();
        if (active) setChannels(ch);
      } catch { /* ignore */ }
      finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, []);

  const startLink = async () => {
    setLinking(true);
    try {
      const code = await api.generateLinkCode();
      setLinkCode(code);
      setShowLinkModal(true);
    } catch { /* ignore */ }
    finally { setLinking(false); }
  };

  const unlinkChannel = async (id: string, title: string) => {
    if (!confirm(`Отключить канал «${title}»?`)) return;
    try {
      await api.deleteChannel(id);
      setChannels((prev) => prev.filter((c) => c.id !== id));
    } catch { /* ignore */ }
  };

  const activeChannels = channels.filter((c) => c.status === 'active');
  const inactiveChannels = channels.filter((c) => c.status !== 'active');

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-2xl font-bold text-white">Каналы</h1>
          <button onClick={startLink} disabled={linking} className="btn-primary text-sm">
            {linking ? 'Генерируем...' : '+ Подключить канал'}
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card p-5 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-graphite-800" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-48 rounded bg-graphite-800" />
                    <div className="h-3 w-32 rounded bg-graphite-800" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : activeChannels.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="text-5xl mb-4">📡</div>
            <h2 className="font-display text-xl font-bold text-white mb-2">Нет подключённых каналов</h2>
            <p className="text-sm text-graphite-300 max-w-md mx-auto mb-6">
              Подключите Telegram-канал, чтобы начать планировать публикации.
            </p>
            <button onClick={startLink} disabled={linking} className="btn-primary">
              {linking ? 'Генерируем...' : 'Подключить первый канал'}
            </button>
          </div>
        ) : (
          <>
            <div className="mb-4 text-sm text-graphite-400">
              Активных: {activeChannels.length}
              {inactiveChannels.length > 0 && ` · Отключённых: ${inactiveChannels.length}`}
            </div>

            <div className="space-y-3">
              {activeChannels.map((ch) => (
                <div key={ch.id} className="card p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="grid h-12 w-12 place-items-center rounded-xl bg-lime/10 text-lime">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M21.9 4.3 2.6 11.6c-.9.4-.9 1.6.1 1.9l4.8 1.5 1.8 5.7c.3.8 1.3.9 1.8.2l2.5-3.2 4.9 3.6c.6.5 1.6.1 1.7-.7L22.9 5.4c.2-.9-.6-1.5-1-1.1Z" />
                        </svg>
                      </div>
                      <div>
                        <div className="font-semibold text-white">{ch.title}</div>
                        <div className="text-sm text-graphite-400">
                          {ch.username ? `@${ch.username}` : 'Приватный канал'}
                          {' · '}
                          <span className="text-lime">Активен</span>
                        </div>
                        <div className="text-xs text-graphite-500 mt-0.5">
                          Подключён {new Date(ch.linkedAt).toLocaleDateString('ru-RU')}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href={`https://t.me/${ch.username || ''}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg px-3 py-2 text-xs text-graphite-400 hover:text-lime hover:bg-graphite-800 transition"
                      >
                        Открыть
                      </a>
                      <button
                        onClick={() => unlinkChannel(ch.id, ch.title)}
                        className="rounded-lg px-3 py-2 text-xs text-graphite-400 hover:text-red-400 hover:bg-graphite-800 transition"
                      >
                        Отключить
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {inactiveChannels.length > 0 && (
              <div className="mt-8">
                <h3 className="text-sm font-semibold text-graphite-400 mb-3">Отключённые</h3>
                <div className="space-y-2">
                  {inactiveChannels.map((ch) => (
                    <div key={ch.id} className="card p-4 opacity-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-sm text-graphite-300">{ch.title}</span>
                          <span className="ml-2 text-xs text-graphite-500">({ch.status})</span>
                        </div>
                        <button
                          onClick={() => unlinkChannel(ch.id, ch.title)}
                          className="text-xs text-graphite-500 hover:text-red-400"
                        >
                          Удалить
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <div className="mt-8 card p-6">
          <h3 className="font-display text-lg font-semibold text-white mb-3">Как подключить канал</h3>
          <ol className="space-y-2 text-sm text-graphite-300 list-decimal list-inside">
            <li>Нажмите «Подключить канал» и скопируйте код</li>
            <li>Откройте Telegram и найдите бота <a href="https://t.me/manager_neonix_bot" target="_blank" rel="noopener noreferrer" className="text-lime hover:underline">@manager_neonix_bot</a></li>
            <li>Отправьте боту команду <code className="rounded bg-graphite-800 px-1.5 py-0.5 text-lime text-xs">/start ВАШ_КОД</code></li>
            <li>Добавьте бота администратором в канал с правом публикации</li>
            <li>Канал автоматически привяжется к вашему аккаунту</li>
          </ol>
        </div>
      </main>

      {showLinkModal && linkCode && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm">
          <div className="card w-full max-w-md p-6">
            <h3 className="font-display text-lg font-bold text-white mb-4">Подключение канала</h3>
            <ol className="space-y-3 text-sm text-graphite-300 list-decimal list-inside">
              <li>
                Откройте Telegram и найдите бота{' '}
                <a
                  href={`https://t.me/${linkCode.botName}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-lime hover:underline"
                >
                  @{linkCode.botName}
                </a>
              </li>
              <li>Отправьте команду:</li>
            </ol>
            <div className="mt-2 rounded-xl bg-graphite-850 p-3 text-center font-mono text-sm text-lime select-all">
              /start {linkCode.code}
            </div>
            <p className="mt-3 text-xs text-graphite-400">
              Код действителен 10 минут. После привязки канал появится автоматически.
            </p>
            <button onClick={() => setShowLinkModal(false)} className="btn-ghost mt-4 w-full">
              Закрыть
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
