import { useState, useEffect, type FormEvent } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { api, HttpError } from '../lib/api';
import type { SocialAccount } from '../lib/types';

export function PostEditorPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [scheduledDate, setScheduledDate] = useState(searchParams.get('date') || '');
  const [scheduledTime, setScheduledTime] = useState('10:00');
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [channels, setChannels] = useState<SocialAccount[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreview, setMediaPreview] = useState<Array<{ file: File; preview: string; kind: string }>>([]);

  useEffect(() => {
    (async () => {
      try {
        const chans = await api.getChannels();
        setChannels(chans);
        if (isEdit && id) {
          const post = await api.getPost(id);
          setTitle(post.title || '');
          setBody(post.body);
          if (post.scheduledAt) {
            setScheduledDate(post.scheduledAt.slice(0, 10));
            setScheduledTime(post.scheduledAt.slice(11, 16));
          }
          setSelectedChannels(post.publications.map((p) => p.socialAccount.id));
        }
      } catch { /* ignore */ }
    })();
  }, [id, isEdit]);

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (mediaFiles.length + files.length > 10) {
      setError('Максимум 10 медиафайлов');
      return;
    }
    const newFiles = files.slice(0, 10 - mediaFiles.length);
    setMediaFiles((prev) => [...prev, ...newFiles]);

    newFiles.forEach((file) => {
      const kind = file.type.startsWith('video/') ? 'video' : file.type === 'image/gif' ? 'gif' : 'image';
      const reader = new FileReader();
      reader.onload = () => {
        setMediaPreview((prev) => [...prev, { file, preview: reader.result as string, kind }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeMedia = (index: number) => {
    setMediaFiles((prev) => prev.filter((_, i) => i !== index));
    setMediaPreview((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleChannel = (chId: string) => {
    setSelectedChannels((prev) =>
      prev.includes(chId) ? prev.filter((c) => c !== chId) : [...prev, chId]
    );
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!body.trim() && selectedChannels.length === 0) {
      setError('Введите текст или выберите каналы');
      return;
    }
    setSaving(true);
    setError(null);

    const scheduledAt = scheduledDate
      ? `${scheduledDate}T${scheduledTime}:00`
      : undefined;

    try {
      if (isEdit && id) {
        await api.updatePost(id, { title, body, scheduledAt, socialAccountIds: selectedChannels });
      } else {
        await api.createPost({ title, body, scheduledAt, socialAccountIds: selectedChannels });
      }
      navigate('/app/calendar');
    } catch (err) {
      setError(err instanceof HttpError ? err.message : 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const insertFormat = (before: string, after: string) => {
    const ta = document.querySelector('textarea');
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = body.slice(start, end);
    const newText = body.slice(0, start) + before + selected + after + body.slice(end);
    setBody(newText);
    setTimeout(() => {
      ta.focus();
      ta.selectionStart = start + before.length;
      ta.selectionEnd = start + before.length + selected.length;
    }, 0);
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-2xl font-bold text-white">
            {isEdit ? 'Редактирование поста' : 'Новый пост'}
          </h1>
          <button onClick={() => navigate('/app/calendar')} className="btn-ghost text-sm">
            ← Календарь
          </button>
        </div>

        <form onSubmit={onSubmit} className="max-w-3xl space-y-5">
          {error && (
            <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>
          )}

          <div>
            <label className="label">Заголовок (необязательно)</label>
            <input
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Краткое описание поста"
            />
          </div>

          <div>
            <label className="label">Текст поста</label>
            <div className="flex gap-1 mb-2 flex-wrap">
              <button type="button" onClick={() => insertFormat('**', '**')} className="rounded-lg border border-graphite-700 bg-graphite-850 px-2 py-1 text-xs text-graphite-300 hover:text-white" title="Жирный">B</button>
              <button type="button" onClick={() => insertFormat('*', '*')} className="rounded-lg border border-graphite-700 bg-graphite-850 px-2 py-1 text-xs text-graphite-300 hover:text-white italic" title="Курсив">I</button>
              <button type="button" onClick={() => insertFormat('`', '`')} className="rounded-lg border border-graphite-700 bg-graphite-850 px-2 py-1 text-xs text-graphite-300 hover:text-white font-mono" title="Код">{'<>'}</button>
              <button type="button" onClick={() => insertFormat('```\n', '\n```')} className="rounded-lg border border-graphite-700 bg-graphite-850 px-2 py-1 text-xs text-graphite-300 hover:text-white" title="Блок кода">{'{ }'}</button>
              <button type="button" onClick={() => insertFormat('[', '](url)')} className="rounded-lg border border-graphite-700 bg-graphite-850 px-2 py-1 text-xs text-graphite-300 hover:text-white" title="Ссылка">🔗</button>
              <button type="button" onClick={() => insertFormat('\n> ', '')} className="rounded-lg border border-graphite-700 bg-graphite-850 px-2 py-1 text-xs text-graphite-300 hover:text-white" title="Цитата">❝</button>
              <button type="button" onClick={() => insertFormat('\n- ', '')} className="rounded-lg border border-graphite-700 bg-graphite-850 px-2 py-1 text-xs text-graphite-300 hover:text-white" title="Список">☰</button>
              <button type="button" onClick={() => insertFormat('\n---\n', '')} className="rounded-lg border border-graphite-700 bg-graphite-850 px-2 py-1 text-xs text-graphite-300 hover:text-white" title="Разделитель">—</button>
            </div>
            <textarea
              className="input min-h-[200px] font-mono text-sm resize-y"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Текст поста... Поддерживается Markdown-форматирование Telegram"
              required
            />
            <p className="mt-1 text-xs text-graphite-500">
              Telegram поддерживает: *жирный*, _курсив_, `код`, [ссылки](url), &gt; цитаты, списки
            </p>
          </div>

          <div>
            <label className="label">Медиафайлы (до 10)</label>
            <div className="flex flex-wrap gap-3">
              {mediaPreview.map((m, i) => (
                <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden border border-graphite-700 bg-graphite-850">
                  {m.kind === 'video' ? (
                    <div className="w-full h-full flex items-center justify-center text-2xl">🎬</div>
                  ) : (
                    <img src={m.preview} alt="" className="w-full h-full object-cover" />
                  )}
                  <button
                    type="button"
                    onClick={() => removeMedia(i)}
                    className="absolute top-1 right-1 h-5 w-5 rounded-full bg-red-500/80 text-white text-xs flex items-center justify-center"
                  >
                    ✕
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-[9px] text-center py-0.5 text-graphite-300 truncate px-1">
                    {m.file.name}
                  </div>
                </div>
              ))}
              {mediaFiles.length < 10 && (
                <label className="w-24 h-24 rounded-xl border-2 border-dashed border-graphite-700 flex flex-col items-center justify-center cursor-pointer hover:border-lime/40 transition">
                  <span className="text-2xl text-graphite-500">+</span>
                  <span className="text-[10px] text-graphite-500 mt-1">Добавить</span>
                  <input
                    type="file"
                    accept="image/*,video/mp4,.gif"
                    multiple
                    className="hidden"
                    onChange={handleMediaChange}
                  />
                </label>
              )}
            </div>
            <p className="mt-1 text-xs text-graphite-500">JPG, PNG, WebP, GIF, MP4. До 50 МБ каждый.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Дата публикации</label>
              <input
                type="date"
                className="input"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Время</label>
              <input
                type="time"
                className="input"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                disabled={!scheduledDate}
              />
            </div>
          </div>

          <div>
            <label className="label">Каналы</label>
            {channels.length === 0 ? (
              <p className="text-sm text-graphite-400">Нет подключённых каналов. <a href="/app" className="text-lime hover:underline">Подключить</a></p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {channels.map((ch) => (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => toggleChannel(ch.id)}
                    className={`rounded-xl border px-4 py-2 text-sm transition ${
                      selectedChannels.includes(ch.id)
                        ? 'border-lime/50 bg-lime/10 text-lime'
                        : 'border-graphite-700 bg-graphite-850 text-graphite-300 hover:border-graphite-600'
                    }`}
                  >
                    {ch.title}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Сохранение...' : isEdit ? 'Сохранить' : 'Запланировать'}
            </button>
            <button type="button" onClick={() => navigate('/app/calendar')} className="btn-ghost">
              Отмена
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
