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
    <div className="flex min-h-screen bg-[#0a0b0d]">
      <Sidebar />
      <main className="flex-1 p-6 pb-20 lg:pb-10 lg:p-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">{greeting}, {user?.name || 'коллега'}</h1>
          <p className="mt-1 text-sm text-white/40">
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
                <div key={i} className="bg-white/[0.02] backdrop-blur-xl border border-white/5 rounded-2xl p-4">
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-3 w-24" />
                </div>
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
              <button onClick={() => setShowAddModal(true)} className="bg-[#d4ff3a] text-[#0a0b0d] font-semibold px-6 py-3 rounded-2xl hover:bg-[#d4ff3a]/90 transition-all duration-200">
                Подключить первый канал
              </button>
            }
          />
        ) : (
          <>
            {/* Stats */}
            <div className="grid gap-3 sm:grid-cols-3 mb-8">
              <StatCard label="Запланировано" value={scheduledCount} icon="📋" />
              <StatCard label="Опубликовано" value={publishedCount} icon="✅" color="text-[#d4ff3a]" />
              <StatCard label="Аккаунтов" value={active.length} icon="🔗" />
            </div>

            {/* Quick actions */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider">Аккаунты</h2>
              <button onClick={() => setShowAddModal(true)} className="text-sm text-white/40 hover:text-[#d4ff3a] transition-colors">+ Добавить</button>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 mb-8">
              {active.map((ch) => (
                <div key={ch.id} className="bg-white/[0.02] backdrop-blur-xl border border-white/5 rounded-2xl p-3 flex items-center justify-between hover:border-[#d4ff3a]/20 transition-all duration-200">
                  <div className="flex items-center gap-3 min-w-0">
                    <PlatformBadge platform={ch.platform as any} />
                    <Avatar name={ch.title} platform={ch.platform} size="sm" />
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-white truncate">{ch.title}</div>
                      <div className="text-[11px] text-white/30 truncate">@{ch.username || ch.externalId}</div>
                    </div>
                  </div>
                  <button onClick={() => unlinkChannel(ch.id)} className="text-[11px] text-white/30 hover:text-red-400 transition-colors ml-2">Удалить</button>
                </div>
              ))}
            </div>

            {/* Recent posts */}
            {recentPosts.length > 0 && (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider">Недавние посты</h2>
                  <Link to="/app/posts" className="text-sm text-white/40 hover:text-[#d4ff3a] transition-colors">Все посты →</Link>
                </div>
                <div className="space-y-2">
                  {recentPosts.map((post) => (
                    <Link key={post.id} to={`/app/posts/${post.id}`} className="bg-white/[0.02] backdrop-blur-xl border border-white/5 rounded-2xl p-4 flex items-center gap-4 hover:border-[#d4ff3a]/20 transition-all duration-200 block">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-white truncate">{post.title}</div>
                        <div className="text-xs text-white/40 mt-0.5">{post.body}</div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {post.mediaCount > 0 && <span className="text-[10px] text-white/30">📎 {post.mediaCount}</span>}
                        <span className={`px-2 py-1 rounded-xl text-[10px] border ${
                          post.status === 'published' ? 'text-[#d4ff3a] border-[#d4ff3a]/30 bg-[#d4ff3a]/10' :
                          post.status === 'failed' ? 'text-red-400 border-red-400/30 bg-red-400/10' :
                          'text-white/40 border-white/10 bg-white/5'
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
              <Link to="/app/posts/new" className="bg-[#d4ff3a] text-[#0a0b0d] font-semibold px-6 py-3 rounded-2xl hover:bg-[#d4ff3a]/90 transition-all duration-200 inline-block w-full sm:w-auto text-center">
                + Создать пост
              </Link>
            </div>
          </>
        )}
      </main>

      {/* Add modal */}
      <Modal open={showAddModal} onClose={() => setShowAddModal(false)}>
        <div className="bg-white/[0.02] backdrop-blur-xl border border-white/5 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Подключить</h3>
          <div className="space-y-2">
            {[
              { label: 'Telegram', sub: 'Через бота', color: 'hover:border-sky-400/40', icon: '✈', action: () => { setShowAddModal(false); startLink(); } },
              { label: 'Pinterest', sub: 'OAuth', color: 'hover:border-red-400/40', icon: '📌', action: () => { setShowAddModal(false); connectPinterest(); } },
              { label: 'YouTube', sub: 'OAuth + видео', color: 'hover:border-red-500/40', icon: '▶', action: () => { setShowAddModal(false); connectYouTube(); } },
              { label: 'Instagram', sub: 'OAuth + Reels', color: 'hover:border-pink-400/40', icon: '📷', action: () => { setShowAddModal(false); connectInstagram(); } },
            ].map((p) => (
              <button key={p.label} onClick={p.action} className={`w-full flex items-center gap-3 p-3 rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl transition-all duration-200 text-left ${p.color}`}>
                <span className="text-lg">{p.icon}</span>
                <div>
                  <div className="font-medium text-white text-sm">{p.label}</div>
                  <div className="text-[11px] text-white/30">{p.sub}</div>
                </div>
              </button>
            ))}
          </div>
          <button onClick={() => setShowAddModal(false)} className="mt-4 w-full py-3 rounded-2xl border border-white/10 bg-white/[0.02] text-white/60 hover:text-white hover:border-white/20 transition-all duration-200 text-sm">Закрыть</button>
        </div>
      </Modal>

      <Modal open={showLinkModal} onClose={() => setShowLinkModal(false)} maxWidth="max-w-md">
        {linkCode && (
          <div className="bg-white/[0.02] backdrop-blur-xl border border-white/5 rounded-2xl p-5">
            <h3 className="text-lg font-bold text-white mb-4">Telegram</h3>
            <ol className="space-y-2 text-sm text-white/60 list-decimal list-inside">
              <li>Найдите бота <a href={`https://t.me/${linkCode.botName}`} target="_blank" rel="noopener noreferrer" className="text-[#d4ff3a] hover:underline font-medium">@{linkCode.botName}</a></li>
              <li>Отправьте команду:</li>
            </ol>
            <div className="mt-2 rounded-2xl bg-white/[0.05] border border-white/10 p-3 text-center font-mono text-sm text-[#d4ff3a] select-all">/start {linkCode.code}</div>
            <p className="mt-3 text-[11px] text-white/30">Код действителен 10 минут</p>
            <button onClick={() => setShowLinkModal(false)} className="mt-3 w-full py-3 rounded-2xl border border-white/10 bg-white/[0.02] text-white/60 hover:text-white hover:border-white/20 transition-all duration-200 text-sm">Закрыть</button>
          </div>
        )}
      </Modal>
    </div>
  );
}
