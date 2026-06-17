import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { api } from '../lib/api';
import type { Post, SocialAccount } from '../lib/types';

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
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-2xl font-bold text-white">Календарь</h1>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/app/bulk-upload')} className="btn-ghost text-sm">
              📥 Массовая загрузка
            </button>
            <button onClick={() => navigate('/app/posts/new')} className="btn-primary text-sm">
              + Новый пост
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4 mb-4">
          <select
            className="input max-w-xs"
            value={selectedChannel}
            onChange={(e) => setSelectedChannel(e.target.value)}
          >
            <option value="all">Все каналы</option>
            {channels.map((ch) => (
              <option key={ch.id} value={ch.id}>{ch.title}</option>
            ))}
          </select>
        </div>

        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-graphite-800 px-6 py-4">
            <button onClick={prevMonth} className="btn-ghost px-3 py-2 text-sm">←</button>
            <h2 className="font-display text-lg font-bold text-white">
              {MONTH_NAMES[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <button onClick={nextMonth} className="btn-ghost px-3 py-2 text-sm">→</button>
          </div>

          <div className="grid grid-cols-7 border-b border-graphite-800">
            {DAY_NAMES.map((d) => (
              <div key={d} className="px-2 py-2 text-center text-xs font-semibold text-graphite-400">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {days.map((date, i) => {
              if (!date) return <div key={`empty-${i}`} className="min-h-[100px] border-b border-r border-graphite-800/50" />;
              const dayPosts = getPostsForDay(date);
                  const today = new Date();
                  const isToday = date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth() && date.getDate() === today.getDate();

              return (
                <div
                  key={date.toISOString()}
                  className={`min-h-[100px] border-b border-r border-graphite-800/50 p-1.5 cursor-pointer transition hover:bg-graphite-800/30 ${isToday ? 'bg-lime/5' : ''}`}
                  onClick={() => openDay(date)}
                >
                  <div className={`text-xs font-semibold mb-1 ${isToday ? 'text-lime' : 'text-graphite-400'}`}>
                    {date.getDate()}
                  </div>
                  <div className="space-y-1">
                    {dayPosts.length === 1 && (
                      <div className="rounded-md border border-lime/30 bg-lime/10 px-1.5 py-1">
                        <div className="text-[10px] font-semibold text-lime truncate">
                          {dayPosts[0].title || dayPosts[0].body.slice(0, 30)}
                        </div>
                        <div className="text-[9px] text-graphite-400">
                          {dayPosts[0].publications.length} кан.
                        </div>
                      </div>
                    )}
                    {dayPosts.length > 1 && (
                      <>
                        {dayPosts.slice(0, 3).map((p) => (
                          <div key={p.id} className="rounded-md bg-graphite-800/60 px-1.5 py-0.5">
                            <div className="text-[10px] text-graphite-300 truncate">
                              {p.title || p.body.slice(0, 20)}
                            </div>
                          </div>
                        ))}
                        {dayPosts.length > 3 && (
                          <div className="text-[9px] text-graphite-500 text-center">
                            +{dayPosts.length - 3} ещё
                          </div>
                        )}
                      </>
                    )}
                    {dayPosts.length === 0 && (
                      <div className="text-[10px] text-graphite-600 text-center mt-2">+</div>
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
          channels={channels}
          onClose={() => { setSelectedDay(null); setDayPosts([]); }}
          onEdit={(postId) => navigate(`/app/posts/${postId}`)}
          onDelete={deletePost}
          onNewPost={() => navigate(`/app/posts/new?date=${selectedDay.toISOString().slice(0, 10)}`)}
          onRefresh={loadData}
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
  channels: SocialAccount[];
  onClose: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onNewPost: () => void;
  onRefresh: () => void;
}) {
  const dateStr = `${date.getDate()} ${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm">
      <div className="card w-full max-w-2xl max-h-[80vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg font-bold text-white">{dateStr}</h3>
          <button onClick={onClose} className="text-graphite-400 hover:text-white text-lg">✕</button>
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-graphite-400 mb-4">Нет запланированных постов</p>
            <button onClick={onNewPost} className="btn-primary">+ Создать пост</button>
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => (
              <div key={post.id} className="card p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    {post.title && <div className="font-semibold text-white text-sm">{post.title}</div>}
                    <div className="text-sm text-graphite-300 mt-1 line-clamp-2">{post.body}</div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {post.publications.map((pub) => (
                        <span key={pub.id} className={`chip text-[10px] ${pub.status === 'published' ? 'text-lime border-lime/30' : pub.status === 'failed' ? 'text-red-400 border-red-400/30' : ''}`}>
                          {pub.socialAccount.title}
                          {pub.status === 'published' && ' ✓'}
                          {pub.status === 'failed' && ' ✗'}
                        </span>
                      ))}
                    </div>
                    {post.media.length > 0 && (
                      <div className="flex gap-1 mt-2">
                        {post.media.slice(0, 5).map((m) => (
                          <span key={m.id} className="chip text-[10px]">
                            {m.kind === 'image' ? '🖼' : m.kind === 'video' ? '🎬' : '📎'} {m.filename}
                          </span>
                        ))}
                        {post.media.length > 5 && <span className="chip text-[10px]">+{post.media.length - 5}</span>}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1 ml-3 shrink-0">
                    <button onClick={() => onEdit(post.id)} className="rounded-lg px-2 py-1 text-xs text-graphite-400 hover:text-lime hover:bg-graphite-800">✏️</button>
                    <button onClick={() => onDelete(post.id)} className="rounded-lg px-2 py-1 text-xs text-graphite-400 hover:text-red-400 hover:bg-graphite-800">🗑</button>
                  </div>
                </div>
              </div>
            ))}
            <button onClick={onNewPost} className="btn-ghost w-full text-sm">+ Ещё пост</button>
          </div>
        )}
      </div>
    </div>
  );
}
