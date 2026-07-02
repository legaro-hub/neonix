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

const YTIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 13.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

const IGIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.199-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
  </svg>
);

export function ChannelsPage() {
  const [channels, setChannels] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [linkCode, setLinkCode] = useState<{ code: string; botName: string; expiresAt: string } | null>(null);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [connectingPinterest, setConnectingPinterest] = useState(false);
  const [connectingYoutube, setConnectingYoutube] = useState(false);
  const [connectingInstagram, setConnectingInstagram] = useState(false);
  const [pinterestBoards, setPinterestBoards] = useState<any[]>([]);
  const [selectedPinterestAccount, setSelectedPinterestAccount] = useState<string | null>(null);
  const [showBoardSelect, setShowBoardSelect] = useState(false);
  const [loadingBoards, setLoadingBoards] = useState(false);
  const [showPostpinModal, setShowPostpinModal] = useState(false);
  const [postpinCookies, setPostpinCookies] = useState('');
  const [postpinProxy, setPostpinProxy] = useState('');
  const [postpinUsername, setPostpinUsername] = useState('');
  const [postpinConnecting, setPostpinConnecting] = useState(false);
  const [piClickCount, setPiClickCount] = useState(0);
  const [piClickTimer, setPiClickTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

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
      const msg = err instanceof HttpError ? err.message : '';
      alert(msg.includes('не подключён')
        ? 'Pinterest не настроен на сервере. Обратитесь к администратору для настройки PINTEREST_APP_ID и PINTEREST_APP_SECRET.'
        : msg || 'Ошибка подключения Pinterest');
      setConnectingPinterest(false);
    }
  };

  const connectYouTube = async () => {
    setConnectingYoutube(true);
    try {
      const { url } = await api.youtubeAuthUrl();
      window.location.href = url;
    } catch (err) {
      const msg = err instanceof HttpError ? err.message : '';
      alert(msg.includes('не подключён')
        ? 'YouTube не настроен на сервере. Обратитесь к администратору для настройки YOUTUBE_CLIENT_ID и YOUTUBE_CLIENT_SECRET.'
        : msg || 'Ошибка подключения YouTube');
      setConnectingYoutube(false);
    }
  };

  const connectInstagram = async () => {
    setConnectingInstagram(true);
    try {
      const { url } = await api.instagramAuthUrl();
      window.location.href = url;
    } catch (err) {
      const msg = err instanceof HttpError ? err.message : '';
      alert(msg.includes('не подключён')
        ? 'Instagram не настроен на сервере. Обратитесь к администратору для настройки INSTAGRAM_APP_ID и INSTAGRAM_APP_SECRET.'
        : msg || 'Ошибка подключения Instagram');
      setConnectingInstagram(false);
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

  const handleSecretPiClick = () => {
    if (piClickTimer) clearTimeout(piClickTimer);
    const next = piClickCount + 1;
    setPiClickCount(next);
    setPiClickTimer(setTimeout(() => { setPiClickCount(0); }, 2000));
    if (next >= 5) {
      setPiClickCount(0);
      setShowPostpinModal(true);
    }
  };

  const handlePostpinConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postpinCookies.trim()) { alert('Вставьте cookies'); return; }
    setPostpinConnecting(true);
    try {
      const parsed = JSON.parse(postpinCookies);
      await api.connectPostpin(parsed, postpinProxy, postpinUsername);
      await loadChannels();
      setShowPostpinModal(false);
      setPostpinCookies('');
      setPostpinProxy('');
      setPostpinUsername('');
    } catch (err) {
      alert(err instanceof HttpError ? err.message : 'Ошибка подключения');
    }
    setPostpinConnecting(false);
  };

  const tgChannels = channels.filter((c) => c.platform === 'telegram' && c.status === 'active');
  const piAccounts = channels.filter((c) => c.platform === 'pinterest' && c.status === 'active');
  const ytAccounts = channels.filter((c) => c.platform === 'youtube' && c.status === 'active');
  const igAccounts = channels.filter((c) => c.platform === 'instagram' && c.status === 'active');
  const inactiveChannels = channels.filter((c) => c.status !== 'active');

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-6 pb-20 lg:pb-10 lg:p-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">Аккаунты</h1>
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
          <div className="card p-10 text-center max-w-lg mx-auto">
            <div className="text-3xl mb-4">+</div>
            <h2 className="text-lg font-semibold text-white mb-2">Нет аккаунтов</h2>
            <p className="text-sm text-graphite-400 mb-6">Подключите Telegram, Pinterest, YouTube или Instagram</p>
            <button onClick={() => setShowAddModal(true)} className="btn-primary">Подключить</button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Telegram */}
            {tgChannels.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] font-bold text-sky-400 bg-sky-400/10 rounded px-1.5 py-0.5">TG</span>
                  <h2 className="text-xs font-semibold text-graphite-500 uppercase tracking-wider">Telegram · {tgChannels.length}</h2>
                </div>
                <div className="divide-y divide-graphite-800/50 border-t border-graphite-800/50">
                  {tgChannels.map((ch) => (
                    <ChannelRow key={ch.id} channel={ch} onUnlink={unlinkChannel} />
                  ))}
                </div>
              </div>
            )}

            {/* Pinterest */}
            {piAccounts.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span onClick={handleSecretPiClick} className="text-[10px] font-bold text-red-400 bg-red-400/10 rounded px-1.5 py-0.5 cursor-default select-none">PI</span>
                  <h2 className="text-xs font-semibold text-graphite-500 uppercase tracking-wider">Pinterest · {piAccounts.length}</h2>
                </div>
                <div className="divide-y divide-graphite-800/50 border-t border-graphite-800/50">
                  {piAccounts.map((ch) => (
                    <PinterestRow key={ch.id} channel={ch} onUnlink={unlinkChannel} onSelectBoard={openBoardSelect} />
                  ))}
                </div>
              </div>
            )}

            {/* YouTube */}
            {ytAccounts.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] font-bold text-red-500 bg-red-500/10 rounded px-1.5 py-0.5">YT</span>
                  <h2 className="text-xs font-semibold text-graphite-500 uppercase tracking-wider">YouTube · {ytAccounts.length}</h2>
                </div>
                <div className="divide-y divide-graphite-800/50 border-t border-graphite-800/50">
                  {ytAccounts.map((ch) => (
                    <ChannelRow key={ch.id} channel={ch} onUnlink={unlinkChannel} />
                  ))}
                </div>
              </div>
            )}

            {/* Instagram */}
            {igAccounts.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] font-bold text-pink-400 bg-pink-400/10 rounded px-1.5 py-0.5">IG</span>
                  <h2 className="text-xs font-semibold text-graphite-500 uppercase tracking-wider">Instagram · {igAccounts.length}</h2>
                </div>
                <div className="divide-y divide-graphite-800/50 border-t border-graphite-800/50">
                  {igAccounts.map((ch) => (
                    <ChannelRow key={ch.id} channel={ch} onUnlink={unlinkChannel} />
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
            <div className="space-y-2">
              <button onClick={() => { setShowAddModal(false); startLink(); }} className="w-full flex items-center gap-4 p-3 rounded-xl border border-graphite-700/50 bg-graphite-850/50 hover:border-sky-400/40 transition text-left">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-sky-500/15 text-sky-400 shrink-0"><TgIcon /></div>
                <div>
                  <div className="font-semibold text-white text-sm">Telegram</div>
                  <div className="text-xs text-graphite-400">Через бота</div>
                </div>
              </button>
              <button onClick={(e) => { setShowAddModal(false); if (e.shiftKey) { setShowPostpinModal(true); } else { connectPinterest(); } }} disabled={connectingPinterest} className="w-full flex items-center gap-4 p-3 rounded-xl border border-graphite-700/50 bg-graphite-850/50 hover:border-red-400/40 transition text-left">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-red-500/15 text-red-400 shrink-0"><PIcon /></div>
                <div>
                  <div className="font-semibold text-white text-sm">{connectingPinterest ? 'Подключение...' : 'Pinterest'}</div>
                  <div className="text-xs text-graphite-400">OAuth</div>
                </div>
              </button>
              <button onClick={() => { setShowAddModal(false); connectYouTube(); }} disabled={connectingYoutube} className="w-full flex items-center gap-4 p-3 rounded-xl border border-graphite-700/50 bg-graphite-850/50 hover:border-red-500/40 transition text-left">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-red-500/15 text-red-500 shrink-0"><YTIcon /></div>
                <div>
                  <div className="font-semibold text-white text-sm">{connectingYoutube ? 'Подключение...' : 'YouTube'}</div>
                  <div className="text-xs text-graphite-400">OAuth + загрузка видео</div>
                </div>
              </button>
              <button onClick={() => { setShowAddModal(false); connectInstagram(); }} disabled={connectingInstagram} className="w-full flex items-center gap-4 p-3 rounded-xl border border-graphite-700/50 bg-graphite-850/50 hover:border-pink-400/40 transition text-left">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-purple-500/15 to-pink-500/15 text-pink-400 shrink-0"><IGIcon /></div>
                <div>
                  <div className="font-semibold text-white text-sm">{connectingInstagram ? 'Подключение...' : 'Instagram'}</div>
                  <div className="text-xs text-graphite-400">OAuth + Reels/Carousels</div>
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

      {/* PostPin connect modal (hidden) */}
      {showPostpinModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm" onClick={() => setShowPostpinModal(false)}>
          <div className="card w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-lg font-bold text-white mb-4">Подключение аккаунта</h3>
            <form onSubmit={handlePostpinConnect} className="space-y-3">
              <div>
                <label className="label">Cookies</label>
                <textarea className="input text-xs py-2 min-h-[80px] resize-none font-mono" value={postpinCookies} onChange={(e) => setPostpinCookies(e.target.value)} placeholder='[{"name":"_auth","value":"...","domain":".pinterest.com"}]' />
                <p className="text-[10px] text-graphite-500 mt-1">Извлеките из браузера через расширение «Cookie Editor» или DevTools</p>
              </div>
              <div>
                <label className="label">Username</label>
                <input className="input text-xs py-2" value={postpinUsername} onChange={(e) => setPostpinUsername(e.target.value)} placeholder="pinterest_username" />
              </div>
              <div>
                <label className="label">Proxy (необязательно)</label>
                <input className="input text-xs py-2" value={postpinProxy} onChange={(e) => setPostpinProxy(e.target.value)} placeholder="http://user:pass@host:port" />
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={postpinConnecting} className="btn-primary text-sm flex-1">{postpinConnecting ? 'Подключение...' : 'Подключить'}</button>
                <button type="button" onClick={() => setShowPostpinModal(false)} className="btn-ghost text-sm">Закрыть</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function ChannelRow({ channel, onUnlink }: { channel: SocialAccount; onUnlink: (id: string, title: string) => void }) {
  const isTg = channel.platform === 'telegram';
  const isYt = channel.platform === 'youtube';
  const isIg = channel.platform === 'instagram';
  const avatarBg = isTg ? 'bg-sky-500/20 text-sky-400' : isYt ? 'bg-red-500/20 text-red-400' : isIg ? 'bg-pink-400/20 text-pink-400' : 'bg-red-400/20 text-red-400';
  const letter = (channel.title || '?').charAt(0).toUpperCase();

  return (
    <div className="flex items-center gap-3 py-2 px-1">
      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${avatarBg}`}>
        {letter}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-graphite-100 truncate">{channel.title}</div>
        <div className="text-[11px] text-graphite-500 truncate">@{channel.username || channel.externalId}</div>
      </div>
      <button onClick={() => onUnlink(channel.id, channel.title)} className="text-[11px] text-graphite-500 hover:text-red-400 transition shrink-0">Удалить</button>
    </div>
  );
}

function PinterestRow({ channel, onUnlink, onSelectBoard }: { channel: SocialAccount; onUnlink: (id: string, title: string) => void; onSelectBoard: (accountId: string) => void }) {
  const meta = (channel.metadata as Record<string, unknown>) ?? {};
  const boardId = meta.boardId as string | undefined;
  const letter = (channel.title || 'P').charAt(0).toUpperCase();

  return (
    <div className="flex items-center gap-3 py-2 px-1">
      <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 bg-red-400/20 text-red-400">
        {letter}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-graphite-100 truncate">{channel.title}</div>
        <div className="text-[11px] text-graphite-500 truncate">
          {boardId ? `Доска: ${boardId}` : 'Доска не выбрана'}
        </div>
      </div>
      <button onClick={() => onSelectBoard(channel.id)} className="text-[11px] text-graphite-500 hover:text-lime transition shrink-0">Доска</button>
      <button onClick={() => onUnlink(channel.id, channel.title)} className="text-[11px] text-graphite-500 hover:text-red-400 transition shrink-0">Удалить</button>
    </div>
  );
}
