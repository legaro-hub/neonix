import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { api } from '../lib/api';
import type { Post, SocialAccount } from '../lib/types';
import Modal from '../components/Modal';

const MONTH_NAMES = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
const DAY_NAMES = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

export function CalendarPage() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [posts, setPosts] = useState<Post[]>([]);
  const [channels, setChannels] = useState<SocialAccount[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<string>('all');
  const [, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [dayPosts, setDayPosts] = useState<Post[]>([]);
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');

  const month = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [calPosts, chans] = await Promise.all([
        api.getCalendar(month),
        api.getChannels(),
      ]);
      setPosts(calPosts);
      setChannels(chans);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => { loadData(); }, [loadData]);

  const prevMonth = () => {
    const d = new Date(currentDate);
    d.setMonth(d.getMonth() - 1);
    setCurrentDate(d);
  };

  const nextMonth = () => {
    const d = new Date(currentDate);
    d.setMonth(d.getMonth() + 1);
    setCurrentDate(d);
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const m = currentDate.getMonth();
    const firstDay = new Date(year, m, 1);
    const lastDay = new Date(year, m + 1, 0);
    const startDay = (firstDay.getDay() + 6) % 7;
    const totalDays = lastDay.getDate();
    const days: (Date | null)[] = [];
    for (let i = 0; i < startDay; i++) days.push(null);
    for (let i = 1; i <= totalDays; i++) days.push(new Date(year, m, i));
    return days;
  };

  const getPostsForDay = (date: Date): Post[] => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    return posts.filter((p) => {
      if (!p.scheduledAt) return false;
      const pDate = p.scheduledAt.slice(0, 10);
      if (pDate !== dateStr) return false;
      if (selectedChannel !== 'all') {
        return p.publications.some((pub) => pub.socialAccount.id === selectedChannel);
      }
      return true;
    });
  };

  const openDay = (date: Date) => {
    setSelectedDay(date);
    setDayPosts(getPostsForDay(date));
  };

  const deletePost = async (postId: string) => {
    if (!confirm('Удалить пост?')) return;
    try {
      await api.deletePost(postId);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      setDayPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch { /* ignore */ }
  };

  const days = getDaysInMonth();

  return (
    <div className="flex min-h-screen bg-[#0a0b0d]">
      <Sidebar />
      <main className="flex-1 p-6 pb-20 lg:pb-10 lg:p-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-2xl font-bold text-white">Календарь</h1>
          <div className="flex items-center gap-2">
            <button onClick={() => { setCurrentDate(new Date()); }} className="py-2 px-4 rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl text-white/60 hover:text-white hover:border-white/20 transition-all duration-200 text-sm">
              Сегодня
            </button>
            <button onClick={() => navigate('/app/bulk-upload')} className="py-2 px-4 rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl text-white/60 hover:text-white hover:border-white/20 transition-all duration-200 text-sm hidden sm:inline-flex">
              📥 Массовая загрузка
            </button>
            <button onClick={() => navigate('/app/posts/new')} className="bg-[#d4ff3a] text-[#0a0b0d] font-semibold px-4 py-2 rounded-2xl text-sm hover:bg-[#d4ff3a]/90 transition-all duration-200">
              + Новый пост
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4 mb-4">
          <select
            className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl px-4 py-2 text-sm text-white max-w-xs focus:outline-none focus:border-[#d4ff3a]/30 transition-all duration-200"
            value={selectedChannel}
            onChange={(e) => setSelectedChannel(e.target.value)}
          >
            <option value="all" className="bg-[#0a0b0d]">Все каналы</option>
            {channels.map((ch) => (
              <option key={ch.id} value={ch.id} className="bg-[#0a0b0d]">{ch.title}</option>
            ))}
          </select>
        </div>

        <div className="bg-white/[0.02] backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
            <button onClick={prevMonth} className="px-3 py-2 rounded-2xl border border-white/10 bg-white/[0.02] text-white/60 hover:text-white hover:border-white/20 transition-all duration-200 text-sm">←</button>
            <div className="flex items-center gap-4">
              <h2 className="font-display text-lg font-bold text-white">
                {MONTH_NAMES[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <div className="hidden sm:flex gap-1 rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl p-0.5">
                <button
                  onClick={() => setViewMode('month')}
                  className={`px-3 py-1 rounded-xl text-xs font-medium transition-all duration-200 ${viewMode === 'month' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'}`}
                >
                  Месяц
                </button>
                <button
                  onClick={() => setViewMode('week')}
                  className={`px-3 py-1 rounded-xl text-xs font-medium transition-all duration-200 ${viewMode === 'week' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'}`}
                >
                  Неделя
                </button>
              </div>
            </div>
            <button onClick={nextMonth} className="px-3 py-2 rounded-2xl border border-white/10 bg-white/[0.02] text-white/60 hover:text-white hover:border-white/20 transition-all duration-200 text-sm">→</button>
          </div>

          <div className="grid grid-cols-7 border-b border-white/5">
            {DAY_NAMES.map((d) => (
              <div key={d} className="px-2 py-2 text-center text-xs font-semibold text-white/30">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {days.map((date, i) => {
              if (!date) return <div key={`empty-${i}`} className="min-h-[100px] border-b border-r border-white/5" />;
              const dayPosts = getPostsForDay(date);
                  const today = new Date();
                  const isToday = date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth() && date.getDate() === today.getDate();

              return (
                <div
                  key={date.toISOString()}
                  className={`min-h-[100px] border-b border-r border-white/5 p-1.5 cursor-pointer transition-all duration-200 hover:bg-white/[0.03] ${isToday ? 'bg-[#d4ff3a]/5' : ''}`}
                  onClick={() => openDay(date)}
                >
                  <div className={`text-xs font-semibold mb-1 ${isToday ? 'text-[#d4ff3a]' : 'text-white/30'}`}>
                    {date.getDate()}
                  </div>
                  <div className="space-y-1">
                    {dayPosts.length === 1 && (
                      <div className="rounded-xl border border-[#d4ff3a]/30 bg-[#d4ff3a]/10 px-1.5 py-1">
                        {dayPosts[0].media.length > 0 && dayPosts[0].media[0].kind === 'image' && (
                          <div className="h-12 rounded overflow-hidden mb-1">
                            <img src={`/api/media/file/${dayPosts[0].media[0].id}`} alt="" className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="text-[10px] font-semibold text-[#d4ff3a] truncate">
                          {dayPosts[0].title || dayPosts[0].body.slice(0, 30)}
                        </div>
                        <div className="text-[9px] text-white/30">
                          {dayPosts[0].publications.length} кан.{dayPosts[0].media.length > 0 && ` · ${dayPosts[0].media.length} медиа`}
                        </div>
                      </div>
                    )}
                    {dayPosts.length > 1 && (
                      <>
                        {dayPosts.slice(0, 3).map((p) => (
                          <div key={p.id} className="rounded-xl bg-white/[0.05] border border-white/5 px-1.5 py-0.5">
                            <div className="text-[10px] text-white/60 truncate">
                              {p.title || p.body.slice(0, 20)}
                            </div>
                          </div>
                        ))}
                        {dayPosts.length > 3 && (
                          <div className="text-[9px] text-white/30 text-center">
                            +{dayPosts.length - 3} ещё
                          </div>
                        )}
                      </>
                    )}
                    {dayPosts.length === 0 && (
                      <div className="text-[10px] text-white/20 text-center mt-2">+</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {selectedDay && (
        <DayModal
          date={selectedDay}
          posts={dayPosts}
          onClose={() => { setSelectedDay(null); setDayPosts([]); }}
          onEdit={(postId) => navigate(`/app/posts/${postId}`)}
          onDelete={deletePost}
          onNewPost={() => navigate(`/app/posts/new?date=${selectedDay.toISOString().slice(0, 10)}`)}
        />
      )}
    </div>
  );
}

function DayModal({
  date,
  posts,
  onClose,
  onEdit,
  onDelete,
  onNewPost,
}: {
  date: Date;
  posts: Post[];
  onClose: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onNewPost: () => void;
}) {
  const dateStr = `${date.getDate()} ${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;

  return (
    <Modal open={true} onClose={onClose} maxWidth="max-w-2xl">
      <div className="bg-white/[0.02] backdrop-blur-xl border border-white/5 rounded-2xl p-6 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg font-bold text-white">{dateStr}</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white text-lg transition-colors">✕</button>
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-white/40 mb-4">Нет запланированных постов</p>
            <button onClick={onNewPost} className="bg-[#d4ff3a] text-[#0a0b0d] font-semibold px-6 py-3 rounded-2xl hover:bg-[#d4ff3a]/90 transition-all duration-200">+ Создать пост</button>
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => (
              <div key={post.id} className="bg-white/[0.02] backdrop-blur-xl border border-white/5 rounded-2xl p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    {post.title && <div className="font-semibold text-white text-sm">{post.title}</div>}
                    <div className="text-sm text-white/60 mt-1 line-clamp-2">{post.body}</div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {post.publications.map((pub) => (
                        <span key={pub.id} className={`px-2 py-1 rounded-xl text-[10px] border ${pub.status === 'published' ? 'text-[#d4ff3a] border-[#d4ff3a]/30 bg-[#d4ff3a]/10' : pub.status === 'failed' ? 'text-red-400 border-red-400/30 bg-red-400/10' : 'text-white/40 border-white/10 bg-white/5'}`}>
                          {pub.socialAccount.title}
                          {pub.status === 'published' && ' ✓'}
                          {pub.status === 'failed' && ' ✗'}
                        </span>
                      ))}
                    </div>
                    {post.media.length > 0 && (
                      <div className="flex gap-1.5 mt-2">
                        {post.media.slice(0, 5).map((m) => (
                          m.kind === 'image' ? (
                            <div key={m.id} className="w-12 h-12 rounded-xl overflow-hidden border border-white/10">
                              <img src={`/api/media/file/${m.id}`} alt="" className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <span key={m.id} className="px-2 py-1 rounded-xl text-[10px] border border-white/10 bg-white/5">
                              {m.kind === 'video' ? '🎬' : '📎'} {m.filename}
                            </span>
                          )
                        ))}
                        {post.media.length > 5 && <span className="px-2 py-1 rounded-xl text-[10px] border border-white/10 bg-white/5">+{post.media.length - 5}</span>}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1 ml-3 shrink-0">
                    <button onClick={() => onEdit(post.id)} className="rounded-xl px-2 py-1 text-xs text-white/40 hover:text-[#d4ff3a] hover:bg-white/10 transition-all duration-200">✏️</button>
                    <button onClick={() => onDelete(post.id)} className="rounded-xl px-2 py-1 text-xs text-white/40 hover:text-red-400 hover:bg-white/10 transition-all duration-200">🗑</button>
                  </div>
                </div>
              </div>
            ))}
            <button onClick={onNewPost} className="w-full py-3 rounded-2xl border border-white/10 bg-white/[0.02] text-white/60 hover:text-white hover:border-white/20 transition-all duration-200 text-sm">+ Ещё пост</button>
          </div>
        )}
      </div>
    </Modal>
  );
}
