import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { api, HttpError } from '../lib/api';
import { Sidebar } from '../components/Sidebar';
import Modal from '../components/Modal';
import { StatCard } from '../components/StatCard';
import { EmptyState } from '../components/EmptyState';
import { Skeleton, SkeletonList } from '../components/Skeleton';
import { PlatformBadge } from '../components/Badge';
import { Avatar } from '../components/Avatar';
import { GlowOrb } from '../components/GlowOrb';

export function DashboardPage() {
  const { user, setUser } = useAuth();
  const [channels, setChannels] = useState<Array<{ id: string; platform: string; title: string; username: string | null; externalId?: string; status: string; linkedAt: string }>>([]);
  const [loadingChannels, setLoadingChannels] = useState(true);
  const [linkCode, setLinkCode] = useState<{ code: string; botName: string; expiresAt: string } | null>(null);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [scheduledCount, setScheduledCount] = useState(0);
  const [publishedCount, setPublishedCount] = useState(0);
  const [recentPosts, setRecentPosts] = useState<Array<{ id: string; title: string; body: string; status: string; scheduledAt: string | null; mediaCount: number }>>([]);

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
        // Last 3 posts for recent list
        const sorted = [...posts].sort((a, b) => new Date(b.scheduledAt || b.createdAt || '').getTime() - new Date(a.scheduledAt || a.createdAt || '').getTime());
        setRecentPosts(sorted.slice(0, 3).map(p => ({
          id: p.id,
          title: p.title || p.body.slice(0, 50),
          body: p.body.slice(0, 80),
          status: p.status,
          scheduledAt: p.scheduledAt,
          mediaCount: p.media.length,
        })));
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
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 6) return 'Доброй ночи';
    if (h < 12) return 'Доброе утро';
    if (h < 18) return 'Добрый день';
    return 'Добрый вечер';
  })();

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-6 pb-20 lg:pb-10 lg:p-10 relative">
        <GlowOrb color="#d4ff3a" size={300} blur={150} className="top-0 right-0 opacity-20" />
        {/* Header */}
        <div className="mb-8 relative z-10">
          <h1 className="text-2xl font-bold text-white">{greeting}, {user?.name || 'коллега'}</h1>
          <p className="mt-1 text-sm text-graphite-500">
            {active.length === 0
              ? 'Подключите аккаунт для начала работы'
              : `${active.length} ${active.length === 1 ? 'аккаунт' : 'аккаунта'} подключено · ${scheduledCount} запланировано`
            }
          </p>
        </div>

        {loadingChannels ? (
          <>
            <div className="grid gap-3 sm:grid-cols-3 mb-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="card p-4"><Skeleton className="h-8 w-16 mb-2" /><Skeleton className="h-3 w-24" /></div>
              ))}
            </div>
            <SkeletonList count={2} />
          </>
        ) : active.length === 0 ? (
          <EmptyState
            icon="🚀"
            title="Начните с подключения канала"
            description="Добавьте Telegram, Pinterest, YouTube или Instagram для автоматической публикации"
            action={
              <button onClick={() => setShowAddModal(true)} className="btn-primary">
                Подключить первый канал
              </button>
            }
          />
        ) : (
          <>
            {/* Stats */}
            <div className="grid gap-3 sm:grid-cols-3 mb-8">
              <StatCard label="Запланировано" value={scheduledCount} icon="📋" />
              <StatCard label="Опубликовано" value={publishedCount} icon="✅" color="text-lime" />
              <StatCard label="Аккаунтов" value={active.length} icon="🔗" />
            </div>

            {/* Quick actions */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-semibold text-graphite-500 uppercase tracking-wider">Аккаунты</h2>
              <button onClick={() => setShowAddModal(true)} className="text-sm text-graphite-400 hover:text-lime transition">+ Добавить</button>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 mb-8">
              {active.map((ch) => (
                <div key={ch.id} className="card p-3 flex items-center justify-between card-interactive">
                  <div className="flex items-center gap-3 min-w-0">
                    <PlatformBadge platform={ch.platform as any} />
                    <Avatar name={ch.title} platform={ch.platform} size="sm" />
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-graphite-100 truncate">{ch.title}</div>
                      <div className="text-[11px] text-graphite-500 truncate">@{ch.username || ch.externalId}</div>
                    </div>
                  </div>
                  <button onClick={() => unlinkChannel(ch.id)} className="text-[11px] text-graphite-500 hover:text-red-400 transition ml-2">Удалить</button>
                </div>
              ))}
            </div>

            {/* Recent posts */}
            {recentPosts.length > 0 && (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xs font-semibold text-graphite-500 uppercase tracking-wider">Недавние посты</h2>
                  <Link to="/app/posts" className="text-sm text-graphite-400 hover:text-lime transition">Все посты →</Link>
                </div>
                <div className="space-y-2">
                  {recentPosts.map((post) => (
                    <Link key={post.id} to={`/app/posts/${post.id}`} className="card p-4 flex items-center gap-4 card-interactive block">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-graphite-100 truncate">{post.title}</div>
                        <div className="text-xs text-graphite-400 mt-0.5">{post.body}</div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {post.mediaCount > 0 && <span className="text-[10px] text-graphite-500">📎 {post.mediaCount}</span>}
                        <span className={`chip text-[10px] ${
                          post.status === 'published' ? 'text-lime border-lime/30' :
                          post.status === 'failed' ? 'text-red-400 border-red-400/30' :
                          'text-graphite-400 border-graphite-600'
                        }`}>
                          {post.status === 'published' ? 'Опубликован' : post.status === 'failed' ? 'Ошибка' : 'Черновик'}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </>
            )}

            {/* Create post CTA */}
            <div className="mt-8">
              <Link to="/app/posts/new" className="btn-primary w-full sm:w-auto">
                + Создать пост
              </Link>
            </div>
          </>
        )}
      </main>

      {/* Add modal */}
      <Modal open={showAddModal} onClose={() => setShowAddModal(false)}>
        <div className="card p-6">
          <h3 className="text-lg font-bold text-white mb-4">Подключить</h3>
          <div className="space-y-2">
            {[
              { label: 'Telegram', sub: 'Через бота', color: 'hover:border-sky-400/40', icon: '✈', action: () => { setShowAddModal(false); startLink(); } },
              { label: 'Pinterest', sub: 'OAuth', color: 'hover:border-red-400/40', icon: '📌', action: () => { setShowAddModal(false); connectPinterest(); } },
              { label: 'YouTube', sub: 'OAuth + видео', color: 'hover:border-red-500/40', icon: '▶', action: () => { setShowAddModal(false); connectYouTube(); } },
              { label: 'Instagram', sub: 'OAuth + Reels', color: 'hover:border-pink-400/40', icon: '📷', action: () => { setShowAddModal(false); connectInstagram(); } },
            ].map((p) => (
              <button key={p.label} onClick={p.action} className={`w-full flex items-center gap-3 p-3 rounded-xl border border-graphite-700/40 bg-graphite-850/50 transition text-left ${p.color}`}>
                <span className="text-lg">{p.icon}</span>
                <div>
                  <div className="font-medium text-white text-sm">{p.label}</div>
                  <div className="text-[11px] text-graphite-500">{p.sub}</div>
                </div>
              </button>
            ))}
          </div>
          <button onClick={() => setShowAddModal(false)} className="btn-ghost mt-4 w-full">Закрыть</button>
        </div>
      </Modal>

      <Modal open={showLinkModal} onClose={() => setShowLinkModal(false)} maxWidth="max-w-md">
        {linkCode && (
          <div className="card p-5">
            <h3 className="text-lg font-bold text-white mb-4">Telegram</h3>
            <ol className="space-y-2 text-sm text-graphite-300 list-decimal list-inside">
              <li>Найдите бота <a href={`https://t.me/${linkCode.botName}`} target="_blank" rel="noopener noreferrer" className="text-lime hover:underline font-medium">@{linkCode.botName}</a></li>
              <li>Отправьте команду:</li>
            </ol>
            <div className="mt-2 rounded-lg bg-graphite-800 p-3 text-center font-mono text-sm text-lime select-all">/start {linkCode.code}</div>
            <p className="mt-3 text-[11px] text-graphite-500">Код действителен 10 минут</p>
            <button onClick={() => setShowLinkModal(false)} className="btn-ghost mt-3 w-full">Закрыть</button>
          </div>
        )}
      </Modal>
    </div>
  );
}
