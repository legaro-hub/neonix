import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { api } from '../lib/api';
import type { Post, SocialAccount } from '../lib/types';
import Modal from '../components/Modal';

type Filter = 'all' | 'scheduled' | 'published' | 'draft' | 'failed';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  queued: { label: 'Ожидает', color: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10' },
  in_progress: { label: 'Отправляется', color: 'text-blue-400 border-blue-400/30 bg-blue-400/10' },
  published: { label: 'Опубликован', color: 'text-[#d4ff3a] border-[#d4ff3a]/30 bg-[#d4ff3a]/10' },
  failed: { label: 'Ошибка', color: 'text-red-400 border-red-400/30 bg-red-400/10' },
  draft: { label: 'Черновик', color: 'text-white/40 border-white/10 bg-white/5' },
};

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Все' },
  { key: 'scheduled', label: 'Запланированы' },
  { key: 'published', label: 'Опубликованы' },
  { key: 'draft', label: 'Черновики' },
  { key: 'failed', label: 'Ошибки' },
];

function renderMd(text: string): string {
  let html = text;
  html = html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  html = html.replace(/^### (.+)$/gm, '<b>$1</b>');
  html = html.replace(/^## (.+)$/gm, '<b>$1</b>');
  html = html.replace(/^# (.+)$/gm, '<b>$1</b>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
  html = html.replace(/\*(.+?)\*/g, '<i>$1</i>');
  html = html.replace(/_(.+?)_/g, '<i>$1</i>');
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, text, url) => {
      const safeUrl = url.replace(/javascript:/gi, '').replace(/data:/gi, '').replace(/vbscript:/gi, '').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
      const safeText = text.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
      return `<a href="${safeUrl}" style="color:#87cefa">${safeText}</a>`;
    });
  html = html.replace(/^&gt;\s?(.*)$/gm, '<blockquote style="border-left:2px solid #555;padding-left:8px;color:#999">$1</blockquote>');
  html = html.replace(/^[-*]\s+(.*)$/gm, '• $1');
  html = html.replace(/\n/g, '<br>');
  return html;
}

function TelegramPreview({ post, onClose }: { post: Post; onClose: () => void }) {
  return (
    <Modal open={true} onClose={onClose} maxWidth="max-w-[420px]" preventBackdropClose>
      <div className="rounded-2xl overflow-hidden shadow-2xl">
        {/* Telegram-style header */}
        <div className="bg-[#17212b] px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-[#2b5278] flex items-center justify-center text-white font-bold text-sm">
              {(post.title || post.body).charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="text-sm font-semibold text-white">{post.title || 'Без заголовка'}</div>
              <div className="text-xs text-[#6c7883]">
                {post.scheduledAt ? new Date(post.scheduledAt).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : 'Черновик'}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-[#6c7883] hover:text-white text-xl">✕</button>
        </div>

        {/* Telegram-style message */}
        <div className="bg-[#0e1621] p-4">
          <div className="rounded-xl bg-[#182533] p-3 max-w-full">
            {/* Media gallery */}
            {post.media.length > 0 && (
              <div className={`mb-2 ${post.media.length > 1 ? 'grid grid-cols-2 gap-1' : ''} rounded-lg overflow-hidden`}>
                {post.media.slice(0, 4).map((m) => (
                  <div key={m.id} className="relative bg-[#0e1621]">
                    {m.kind === 'video' ? (
                      <div className="aspect-video flex items-center justify-center bg-[#0e1621] text-[#6c7883]">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                      </div>
                    ) : (
                      <img
                        src={`/api/media/file/${m.id}`}
                        alt={m.filename}
                        className="w-full aspect-video object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          const parent = (e.target as HTMLImageElement).parentElement;
                          if (parent) {
                            const fallback = document.createElement('div');
                            fallback.className = 'aspect-video flex items-center justify-center bg-[#0e1621] text-[#6c7883]';
                            fallback.innerHTML = '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>';
                            parent.appendChild(fallback);
                          }
                        }}
                      />
                    )}
                  </div>
                ))}
                {post.media.length > 4 && (
                  <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
                    +{post.media.length - 4}
                  </div>
                )}
              </div>
            )}

            {/* Text */}
            <div
              className="text-sm text-white leading-relaxed break-words"
              dangerouslySetInnerHTML={{ __html: renderMd(post.body) }}
            />
          </div>
        </div>

        {/* Status bar */}
        <div className="bg-[#17212b] px-4 py-3 flex flex-wrap gap-2">
          {post.publications.map((pub) => (
            <div key={pub.id} className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${pub.status === 'published' ? 'bg-[#4fae4e]' : pub.status === 'failed' ? 'bg-[#e53935]' : 'bg-[#eab308]'}`} />
              <span className="text-xs text-[#6c7883]">{pub.socialAccount.title}</span>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}

export function PostsPage() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [channels, setChannels] = useState<SocialAccount[]>([]);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [previewPost, setPreviewPost] = useState<Post | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [data, chans] = await Promise.all([api.getPosts(), api.getChannels()]);
        if (active) { setPosts(data); setChannels(chans); }
      } catch { /* ignore */ }
      finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, []);

  const filtered = posts.filter((p) => {
    if (filter === 'scheduled' && p.status !== 'scheduled') return false;
    if (filter === 'published' && !p.publications.some((pub) => pub.status === 'published')) return false;
    if (filter === 'draft' && p.status !== 'draft') return false;
    if (filter === 'failed' && !p.publications.some((pub) => pub.status === 'failed')) return false;
    if (channelFilter !== 'all' && !p.publications.some((pub) => pub.socialAccount.id === channelFilter)) return false;
    return true;
  });

  const handleDelete = async (e: React.MouseEvent, postId: string) => {
    e.stopPropagation();
    if (!confirm('Удалить пост?')) return;
    setDeleting(postId);
    try {
      await api.deletePost(postId);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch { /* ignore */ }
    finally { setDeleting(null); }
  };

  const getPostStatus = (post: Post): string => {
    if (post.status === 'draft') return 'draft';
    const pubs = post.publications;
    if (pubs.length === 0) return 'draft';
    if (pubs.some((p) => p.status === 'failed')) return 'failed';
    if (pubs.every((p) => p.status === 'published')) return 'published';
    return 'scheduled';
  };

  return (
    <div className="flex min-h-screen bg-[#0a0b0d]">
      <Sidebar />
      <main className="flex-1 p-6 pb-20 lg:pb-10 lg:p-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-white">Посты</h1>
            <p className="text-xs text-white/40 mt-1">{posts.length} всего</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex gap-1 rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl p-0.5">
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-xl transition-all duration-200 ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'}`}
                title="Список"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-xl transition-all duration-200 ${viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'}`}
                title="Сетка"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
              </button>
            </div>
            <button onClick={() => navigate('/app/posts/new')} className="bg-[#d4ff3a] text-[#0a0b0d] font-semibold px-4 py-2 rounded-2xl text-sm hover:bg-[#d4ff3a]/90 transition-all duration-200">+ Новый пост</button>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <div className="flex gap-2 flex-wrap">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`rounded-2xl px-4 py-2 text-sm transition-all duration-200 ${
                  filter === f.key
                    ? 'bg-[#d4ff3a]/15 text-[#d4ff3a] border border-[#d4ff3a]/30'
                    : 'border border-white/10 bg-white/[0.02] backdrop-blur-xl text-white/40 hover:border-white/20'
                }`}
              >
                {f.label}
                {f.key === 'all' && <span className="ml-1.5 text-white/30">{posts.length}</span>}
              </button>
            ))}
          </div>
          {channels.length > 0 && (
            <select className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl px-4 py-2 text-sm text-white max-w-[200px] focus:outline-none focus:border-[#d4ff3a]/30 transition-all duration-200" value={channelFilter} onChange={(e) => setChannelFilter(e.target.value)}>
              <option value="all" className="bg-[#0a0b0d]">Все каналы</option>
              {channels.map((ch) => (
                <option key={ch.id} value={ch.id} className="bg-[#0a0b0d]">{ch.title}</option>
              ))}
            </select>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white/[0.02] backdrop-blur-xl border border-white/5 rounded-2xl p-5 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-white/5" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-48 rounded bg-white/5" />
                    <div className="h-3 w-32 rounded bg-white/5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white/[0.02] backdrop-blur-xl border border-white/5 rounded-2xl p-12 text-center">
            <div className="text-5xl mb-4">📝</div>
            <h2 className="font-display text-xl font-bold text-white mb-2">
              {filter === 'all' && channelFilter === 'all' ? 'Нет постов' : 'Нет постов с фильтром'}
            </h2>
            <p className="text-sm text-white/40 mb-6">Создайте первый пост или загрузите массово из Excel.</p>
            <button onClick={() => navigate('/app/posts/new')} className="bg-[#d4ff3a] text-[#0a0b0d] font-semibold px-6 py-3 rounded-2xl hover:bg-[#d4ff3a]/90 transition-all duration-200">Создать пост</button>
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid gap-3 sm:grid-cols-2 lg:grid-cols-3' : 'space-y-3'}>
            {filtered.map((post) => {
              const status = getPostStatus(post);
              const statusInfo = STATUS_LABELS[status] || STATUS_LABELS.draft;
              const scheduledDate = post.scheduledAt
                ? new Date(post.scheduledAt).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                : null;

              return (
                <div
                  key={post.id}
                  onClick={() => navigate(`/app/posts/${post.id}`)}
                  className="bg-white/[0.02] backdrop-blur-xl border border-white/5 rounded-2xl p-5 hover:border-[#d4ff3a]/20 hover:bg-white/[0.04] transition-all duration-200 cursor-pointer group"
                >
                  <div className="flex items-start gap-4">
                    {/* Media thumbnail */}
                    {post.media.length > 0 && (
                      <div className="shrink-0 w-16 h-16 rounded-xl overflow-hidden bg-white/5">
                        {post.media[0].kind === 'video' ? (
                          <div className="w-full h-full flex items-center justify-center text-2xl">🎬</div>
                        ) : (
                          <img
                            src={`/api/media/file/${post.media[0].id}`}
                            alt=""
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                              const parent = (e.target as HTMLImageElement).parentElement;
                              if (parent) {
                                parent.innerHTML = '<div class="w-full h-full flex items-center justify-center text-2xl">🖼</div>';
                              }
                            }}
                          />
                        )}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-1 rounded-xl text-[10px] border ${statusInfo.color}`}>{statusInfo.label}</span>
                        {scheduledDate && <span className="text-xs text-white/30">{scheduledDate}</span>}
                        {post.media.length > 0 && (
                          <span className="text-[10px] text-white/30">📎 {post.media.length}</span>
                        )}
                      </div>
                      {post.title && <h3 className="font-semibold text-white text-sm mb-0.5 truncate">{post.title}</h3>}
                      <p className="text-sm text-white/60 line-clamp-2">{post.body}</p>

                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {post.publications.map((pub) => {
                          const pubStatus = STATUS_LABELS[pub.status] || STATUS_LABELS.draft;
                          return (
                            <span key={pub.id} className={`px-2 py-1 rounded-xl text-[10px] border ${pubStatus.color}`}>
                              {pub.socialAccount.title}
                              {pub.status === 'published' && ' ✓'}
                              {pub.status === 'failed' && ' ✗'}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        onClick={(e) => { e.stopPropagation(); setPreviewPost(post); }}
                        className="rounded-xl px-2 py-1.5 text-xs text-white/40 hover:text-[#d4ff3a] hover:bg-white/10 transition-all duration-200"
                        title="Предпросмотр"
                      >👁</button>
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/app/posts/${post.id}`); }}
                        className="rounded-xl px-2 py-1.5 text-xs text-white/40 hover:text-[#d4ff3a] hover:bg-white/10 transition-all duration-200"
                        title="Редактировать"
                      >✏️</button>
                      <button
                        onClick={(e) => handleDelete(e, post.id)}
                        disabled={deleting === post.id}
                        className="rounded-xl px-2 py-1.5 text-xs text-white/40 hover:text-red-400 hover:bg-white/10 transition-all duration-200 disabled:opacity-50"
                        title="Удалить"
                      >{deleting === post.id ? '...' : '🗑'}</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {previewPost && (
        <TelegramPreview post={previewPost} onClose={() => setPreviewPost(null)} />
      )}
    </div>
  );
}
