import { useState, useEffect } from 'react';
import { Sidebar } from '../components/Sidebar';
import { api, HttpError } from '../lib/api';
import type { SocialAccount } from '../lib/types';

const TgIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M21.9 4.3 2.6 11.6c-.9.4-.9 1.6.1 1.9l4.8 1.5 1.8 5.7c.3.8 1.3.9 1.8.2l2.5-3.2 4.9 3.6c.6.5 1.6.1 1.7-.7L22.9 5.4c.2-.9-.6-1.5-1-1.1Z" />
  </svg>
);

const PIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" />
  </svg>
);

export function ChannelsPage() {
  const [channels, setChannels] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [linkCode, setLinkCode] = useState<{ code: string; botName: string; expiresAt: string } | null>(null);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [connectingPinterest, setConnectingPinterest] = useState(false);
  const [pinterestBoards, setPinterestBoards] = useState<any[]>([]);
  const [selectedPinterestAccount, setSelectedPinterestAccount] = useState<string | null>(null);
  const [showBoardSelect, setShowBoardSelect] = useState(false);
  const [loadingBoards, setLoadingBoards] = useState(false);

  const loadChannels = async () => {
    try {
      const ch = await api.getChannels();
      setChannels(ch);
    } catch { /* ignore */ }
  };

  useEffect(() => {
    loadChannels().finally(() => setLoading(false));
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
      alert(err instanceof HttpError ? err.message : 'Ошибка подключения Pinterest');
      setConnectingPinterest(false);
    }
  };

  const openBoardSelect = async (accountId: string) => {
    setSelectedPinterestAccount(accountId);
    setShowBoardSelect(true);
    setLoadingBoards(true);
    try {
      const data = await api.pinterestBoards(accountId);
      setPinterestBoards(data.items ?? data ?? []);
    } catch (err) {
      alert(err instanceof HttpError ? err.message : 'Ошибка загрузки досок');
    } finally {
      setLoadingBoards(false);
    }
  };

  const selectBoard = async (boardId: string) => {
    if (!selectedPinterestAccount) return;
    try {
      await api.pinterestSelectBoard(selectedPinterestAccount, boardId);
      await loadChannels();
      setShowBoardSelect(false);
    } catch (err) {
      alert(err instanceof HttpError ? err.message : 'Ошибка');
    }
  };

  const unlinkChannel = async (id: string, title: string) => {
    if (!confirm(`Отключить «${title}»?`)) return;
    try {
      await api.deleteChannel(id);
      setChannels((prev) => prev.filter((c) => c.id !== id));
    } catch { /* ignore */ }
  };

  const tgChannels = channels.filter((c) => c.platform === 'telegram' && c.status === 'active');
  const piAccounts = channels.filter((c) => c.platform === 'pinterest' && c.status === 'active');
  const inactiveChannels = channels.filter((c) => c.status !== 'active');

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-2xl font-bold text-white">Каналы и аккаунты</h1>
          <button onClick={() => setShowAddModal(true)} className="btn-primary text-sm">
            + Подключить
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
        ) : channels.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="text-5xl mb-4">📡</div>
            <h2 className="font-display text-xl font-bold text-white mb-2">Нет подключённых аккаунтов</h2>
            <p className="text-sm text-graphite-300 max-w-md mx-auto mb-6">
              Подключите Telegram-канал или Pinterest для начала публикаций.
            </p>
            <button onClick={() => setShowAddModal(true)} className="btn-primary">Подключить первый аккаунт</button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Telegram channels */}
            {tgChannels.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="grid h-7 w-7 place-items-center rounded-lg bg-sky-500/15 text-sky-400"><TgIcon /></div>
                  <h2 className="font-display text-lg font-bold text-white">Telegram</h2>
                  <span className="text-xs text-graphite-500">· {tgChannels.length}</span>
                </div>
                <div className="space-y-2">
                  {tgChannels.map((ch) => (
                    <ChannelRow key={ch.id} channel={ch} onUnlink={unlinkChannel} />
                  ))}
                </div>
              </div>
            )}

            {/* Pinterest accounts */}
            {piAccounts.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="grid h-7 w-7 place-items-center rounded-lg bg-red-500/15 text-red-400"><PIcon /></div>
                  <h2 className="font-display text-lg font-bold text-white">Pinterest</h2>
                  <span className="text-xs text-graphite-500">· {piAccounts.length}</span>
                </div>
                <div className="space-y-2">
                  {piAccounts.map((ch) => (
                    <PinterestRow key={ch.id} channel={ch} onUnlink={unlinkChannel} onSelectBoard={openBoardSelect} />
                  ))}
                </div>
              </div>
            )}

            {/* Inactive */}
            {inactiveChannels.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-graphite-400 mb-3">Отключённые</h3>
                <div className="space-y-2">
                  {inactiveChannels.map((ch) => (
                    <div key={ch.id} className="card p-4 opacity-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-sm text-graphite-300">{ch.title}</span>
                          <span className="ml-2 text-xs text-graphite-500">({ch.platform})</span>
                        </div>
                        <button onClick={() => unlinkChannel(ch.id, ch.title)} className="text-xs text-graphite-500 hover:text-red-400">Удалить</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Add modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)}>
          <div className="card w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-lg font-bold text-white mb-4">Подключить</h3>
            <div className="space-y-3">
              <button onClick={() => { setShowAddModal(false); startLink(); }} className="w-full flex items-center gap-4 p-4 rounded-xl border border-graphite-700 bg-graphite-850 hover:border-sky-400/40 transition text-left">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-sky-500/15 text-sky-400 shrink-0"><TgIcon /></div>
                <div>
                  <div className="font-semibold text-white">Telegram-канал</div>
                  <div className="text-xs text-graphite-400">Через бот @manager_neonix_bot</div>
                </div>
              </button>
              <button onClick={() => { setShowAddModal(false); connectPinterest(); }} disabled={connectingPinterest} className="w-full flex items-center gap-4 p-4 rounded-xl border border-graphite-700 bg-graphite-850 hover:border-red-400/40 transition text-left">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-red-500/15 text-red-400 shrink-0"><PIcon /></div>
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

      {/* Board select modal */}
      {showBoardSelect && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm" onClick={() => setShowBoardSelect(false)}>
          <div className="card w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-lg font-bold text-white mb-4">Выберите доску</h3>
            {loadingBoards ? (
              <div className="text-center py-8 text-graphite-400">Загрузка досок...</div>
            ) : pinterestBoards.length === 0 ? (
              <div className="text-center py-8 text-graphite-400">Нет досок. Создайте доску в Pinterest.</div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {pinterestBoards.map((b: any) => (
                  <button key={b.id} onClick={() => selectBoard(b.id)} className="w-full text-left p-3 rounded-xl border border-graphite-700 bg-graphite-850 hover:border-lime/40 transition">
                    <div className="font-semibold text-sm text-white">{b.name}</div>
                    <div className="text-xs text-graphite-400">{b.pin_count ?? 0} пинов</div>
                  </button>
                ))}
              </div>
            )}
            <button onClick={() => setShowBoardSelect(false)} className="btn-ghost mt-4 w-full">Закрыть</button>
          </div>
        </div>
      )}
    </div>
  );
}

function ChannelRow({ channel, onUnlink }: { channel: SocialAccount; onUnlink: (id: string, title: string) => void }) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-sky-500/10 text-sky-400">
            <TgIcon />
          </div>
          <div>
            <div className="font-semibold text-white">{channel.title}</div>
            <div className="text-sm text-graphite-400">
              {channel.username ? `@${channel.username}` : 'Приватный канал'}
              {' · '}<span className="text-lime">Активен</span>
            </div>
            <div className="text-xs text-graphite-500 mt-0.5">
              Подключён {new Date(channel.linkedAt).toLocaleDateString('ru-RU')}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {channel.username && (
            <a href={`https://t.me/${channel.username}`} target="_blank" rel="noopener noreferrer" className="rounded-lg px-3 py-2 text-xs text-graphite-400 hover:text-sky-400 hover:bg-graphite-800 transition">Открыть</a>
          )}
          <button onClick={() => onUnlink(channel.id, channel.title)} className="rounded-lg px-3 py-2 text-xs text-graphite-400 hover:text-red-400 hover:bg-graphite-800 transition">Отключить</button>
        </div>
      </div>
    </div>
  );
}

function PinterestRow({ channel, onUnlink, onSelectBoard }: { channel: SocialAccount; onUnlink: (id: string, title: string) => void; onSelectBoard: (accountId: string) => void }) {
  const meta = (channel.metadata as Record<string, unknown>) ?? {};
  const boardId = meta.boardId as string | undefined;

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-red-500/10 text-red-400">
            <PIcon />
          </div>
          <div>
            <div className="font-semibold text-white">{channel.title}</div>
            <div className="text-sm text-graphite-400">
              {channel.username ? `@${channel.username}` : channel.externalId}
              {' · '}<span className="text-lime">Активен</span>
            </div>
            <div className="text-xs text-graphite-500 mt-0.5">
              {boardId ? `Доска: ${boardId}` : 'Доска не выбрана'}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!boardId && (
            <button onClick={() => onSelectBoard(channel.id)} className="rounded-lg px-3 py-2 text-xs text-graphite-400 hover:text-red-400 hover:bg-graphite-800 transition">Выбрать доску</button>
          )}
          {boardId && (
            <button onClick={() => onSelectBoard(channel.id)} className="rounded-lg px-3 py-2 text-xs text-graphite-400 hover:text-red-400 hover:bg-graphite-800 transition">Сменить доску</button>
          )}
          <button onClick={() => onUnlink(channel.id, channel.title)} className="rounded-lg px-3 py-2 text-xs text-graphite-400 hover:text-red-400 hover:bg-graphite-800 transition">Отключить</button>
        </div>
      </div>
    </div>
  );
}
