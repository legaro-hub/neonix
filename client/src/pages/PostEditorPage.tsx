import { useState, useEffect, useRef, useCallback, type FormEvent } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { api, HttpError } from '../lib/api';
import type { SocialAccount } from '../lib/types';

function mdToHtml(md: string): string {
  let html = md;
  html = html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  html = html.replace(/^### (.+)$/gm, '<b style="font-size:1.1em">$1</b>');
  html = html.replace(/^## (.+)$/gm, '<b style="font-size:1.2em">$1</b>');
  html = html.replace(/^# (.+)$/gm, '<b style="font-size:1.3em">$1</b>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
  html = html.replace(/\*(.+?)\*/g, '<i>$1</i>');
  html = html.replace(/_(.+?)_/g, '<i>$1</i>');
  html = html.replace(/`([^`]+)`/g, '<code style="background:#1a1d23;padding:1px 4px;border-radius:4px;color:#d4ff3a;font-size:0.9em">$1</code>');
  html = html.replace(/```([\s\S]*?)```/g, '<pre style="background:#1a1d23;padding:8px;border-radius:8px;overflow-x:auto;font-size:0.85em;margin:8px 0"><code>$1</code></pre>');
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, linkText, url) => {
    const safeUrl = url.replace(/javascript:/gi, '').replace(/data:/gi, '').replace(/vbscript:/gi, '');
    return `<a href="${safeUrl}" style="color:#d4ff3a;text-decoration:underline" target="_blank" rel="noopener">${linkText}</a>`;
  });
  html = html.replace(/^&gt;\s?(.*)$/gm, '<blockquote style="border-left:3px solid #2e343d;padding-left:12px;color:#a8aeb8;margin:8px 0">$1</blockquote>');
  html = html.replace(/^---$/gm, '<hr style="border:none;border-top:1px solid #232830;margin:12px 0">');
  html = html.replace(/^[-*]\s+(.*)$/gm, '• $1');
  html = html.replace(/\n/g, '<br>');
  return html;
}

function htmlToMd(html: string): string {
  let md = html;
  md = md.replace(/<br\s*\/?>/gi, '\n');
  md = md.replace(/<b style="font-size:1\.3em">(.*?)<\/b>/gi, '# $1');
  md = md.replace(/<b style="font-size:1\.2em">(.*?)<\/b>/gi, '## $1');
  md = md.replace(/<b style="font-size:1\.1em">(.*?)<\/b>/gi, '### $1');
  md = md.replace(/<b>(.*?)<\/b>/gi, '**$1**');
  md = md.replace(/<i>(.*?)<\/i>/gi, '*$1*');
  md = md.replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`');
  md = md.replace(/<pre[^>]*><code>([\s\S]*?)<\/code><\/pre>/gi, '```\n$1\n```');
  md = md.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)');
  md = md.replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gi, '> $1');
  md = md.replace(/<hr[^>]*\/?>/gi, '---');
  md = md.replace(/<div[^>]*>/gi, '\n');
  md = md.replace(/<\/div>/gi, '');
  md = md.replace(/<[^>]+>/g, '');
  md = md.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
  md = md.replace(/\n{3,}/g, '\n\n');
  return md.trim();
}

type MediaItem =
  | { kind: 'existing'; id: string; filename: string; url: string; mediaKind: string }
  | { kind: 'uploading'; file: File; preview: string; mediaKind: string; status: 'uploading' | 'error' };

const DEFAULT_TEMPLATES = [
  { id: '1', name: 'Анонс', text: '📢 Анонс\n\nСкоро у нас важные новости! Следите за обновлениями.' },
  { id: '2', name: 'Скидка', text: '🔥 СКИДКА\n\nТолько сегодня скидка 20% на все тарифы!\nИспользуйте промокод: NEONIX20' },
  { id: '3', name: 'Вопрос', text: '❓ Вопрос дня\n\nКакой ваш любимый формат контента?\n1. Текст\n2. Видео\n3. Мемы' },
  { id: '4', name: 'Итоги дня', text: '📊 Итоги дня\n\n✅ Выполнено:\n• \n\n❌ Проблемы:\n• ' },
  { id: '5', name: 'Призыв к действию', text: '👉 Подпишитесь, чтобы не пропустить!\n\n🔗 Ссылка: ' },
  { id: '6', name: 'Цитата', text: '💬 «Цитата дня»\n\n— Автор' },
];

function TemplatesPanel({ onInsert }: { onInsert: (text: string) => void }) {
  const [templates, setTemplates] = useState(() => {
    const saved = localStorage.getItem('neonix_templates');
    return saved ? JSON.parse(saved) : DEFAULT_TEMPLATES;
  });
  const [newName, setNewName] = useState('');
  const [newText, setNewText] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  const saveTemplates = (t: typeof templates) => {
    setTemplates(t);
    localStorage.setItem('neonix_templates', JSON.stringify(t));
  };

  const addTemplate = () => {
    if (!newName.trim() || !newText.trim()) return;
    saveTemplates([...templates, { id: Date.now().toString(), name: newName, text: newText }]);
    setNewName('');
    setNewText('');
    setShowAdd(false);
  };

  const removeTemplate = (id: string) => {
    saveTemplates(templates.filter((t: { id: string; name: string; text: string }) => t.id !== id));
  };

  return (
    <div className="card p-4 sticky top-6">
      <h3 className="font-display text-sm font-bold text-white mb-3">📝 Шаблоны</h3>
      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {templates.map((t: { id: string; name: string; text: string }) => (
          <div key={t.id} className="group flex items-start gap-2 p-2 rounded-lg bg-graphite-850 border border-graphite-800 hover:border-graphite-600 transition cursor-pointer" onClick={() => onInsert(t.text)}>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-graphite-200 truncate">{t.name}</div>
              <div className="text-[10px] text-graphite-500 truncate mt-0.5">{t.text.slice(0, 60)}...</div>
            </div>
            <button type="button" onClick={(e) => { e.stopPropagation(); removeTemplate(t.id); }} className="opacity-0 group-hover:opacity-100 text-graphite-500 hover:text-red-400 text-xs shrink-0">✕</button>
          </div>
        ))}
      </div>
      {showAdd ? (
        <div className="mt-3 space-y-2">
          <input className="input text-xs" placeholder="Название" value={newName} onChange={(e) => setNewName(e.target.value)} />
          <textarea className="input text-xs h-20 resize-none" placeholder="Текст шаблона" value={newText} onChange={(e) => setNewText(e.target.value)} />
          <div className="flex gap-2">
            <button type="button" onClick={addTemplate} className="btn-primary text-xs flex-1">Добавить</button>
            <button type="button" onClick={() => setShowAdd(false)} className="btn-ghost text-xs">Отмена</button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setShowAdd(true)} className="mt-3 w-full text-xs text-graphite-400 hover:text-lime transition">
          + Добавить шаблон
        </button>
      )}
    </div>
  );
}

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
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [draftPostId, setDraftPostId] = useState<string | null>(id || null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const chans = await api.getChannels();
        setChannels(chans);
        if (isEdit && id) {
          const post = await api.getPost(id);
          setTitle(post.title || '');
          setBody(post.body);
          if (editorRef.current) editorRef.current.innerHTML = mdToHtml(post.body);
          if (post.scheduledAt) {
            setScheduledDate(post.scheduledAt.slice(0, 10));
            setScheduledTime(post.scheduledAt.slice(11, 16));
          }
          setSelectedChannels(post.publications.map((p) => p.socialAccount.id));
          setMedia(post.media.map((m) => ({
            kind: 'existing' as const,
            id: m.id,
            filename: m.filename,
            url: `/api/media/file/${m.id}`,
            mediaKind: m.kind,
          })));
        }
      } catch { /* ignore */ }
    })();
  }, [id, isEdit]);

  const syncBody = useCallback(() => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      const md = htmlToMd(html);
      setBody(md);
    }
  }, []);

  const execCmd = (cmd: string, val?: string) => {
    document.execCommand(cmd, false, val);
    editorRef.current?.focus();
    syncBody();
  };

  const insertMd = (before: string, after: string) => {
    const sel = window.getSelection();
    if (!sel || !editorRef.current) return;
    const range = sel.getRangeAt(0);
    const selected = range.toString();
    const text = before + selected + after;
    document.execCommand('insertText', false, text);
    syncBody();
  };

  const insertLink = () => {
    const url = prompt('Введите URL ссылки:');
    if (url) {
      const safeUrl = url.replace(/javascript:/gi, '').replace(/data:/gi, '').replace(/vbscript:/gi, '').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
      const sel = window.getSelection();
      const text = sel?.toString() || 'ссылка';
      document.execCommand('insertHTML', false, `<a href="${safeUrl}" style="color:#d4ff3a;text-decoration:underline" target="_blank">${text}</a>`);
      syncBody();
    }
  };

  const handleMediaChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const existingCount = media.filter((m) => m.kind === 'existing').length;
    const uploadingCount = media.filter((m) => m.kind === 'uploading').length;
    if (existingCount + uploadingCount + files.length > 10) {
      setError('Максимум 10 медиафайлов');
      return;
    }

    for (const file of files) {
      const mediaKind = file.type.startsWith('video/') ? 'video' : file.type === 'image/gif' ? 'gif' : 'image';
      const reader = new FileReader();
      const preview = await new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      const idx = media.length;
      setMedia((prev) => [...prev, { kind: 'uploading', file, preview, mediaKind, status: 'uploading' }]);
      autoUploadFile(file, idx);
    }
    e.target.value = '';
  };

  const autoUploadFile = async (file: File, index: number) => {
    let postId = draftPostId;
    if (!postId) {
      try {
        const post = await api.createPost({ body: ' ', socialAccountIds: [] });
        postId = post.id;
        setDraftPostId(postId);
      } catch {
        setError('Не удалось создать черновик для загрузки файла');
        setMedia((prev) => prev.map((m, i) => i === index && m.kind === 'uploading' ? { ...m, status: 'error' as const } : m));
        return;
      }
    }
    try {
      const asset = await api.uploadMedia(postId, file);
      setMedia((prev) => prev.map((m, i) => i === index && m.kind === 'uploading'
        ? { kind: 'existing' as const, id: asset.id, filename: asset.filename, url: asset.url, mediaKind: asset.kind }
        : m));
    } catch {
      setMedia((prev) => prev.map((m, i) => i === index && m.kind === 'uploading' ? { ...m, status: 'error' as const } : m));
      setError(`Ошибка загрузки ${file.name}`);
    }
  };

  const removeMedia = (index: number) => {
    const item = media[index];
    if (!item) return;
    if (item.kind === 'existing') {
      api.deleteMedia(item.id).catch(() => {});
    }
    setMedia((prev) => prev.filter((_, i) => i !== index));
  };

  const onDragStart = (index: number) => setDragIdx(index);
  const onDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === index) return;
    setMedia((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragIdx, 1);
      next.splice(index, 0, moved);
      return next;
    });
    setDragIdx(index);
  };
  const onDragEnd = () => setDragIdx(null);

  const toggleChannel = (chId: string) => {
    setSelectedChannels((prev) =>
      prev.includes(chId) ? prev.filter((c) => c !== chId) : [...prev, chId]
    );
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    syncBody();
    if (!body.trim() && selectedChannels.length === 0) {
      setError('Введите текст или выберите каналы');
      return;
    }
    const hasUploading = media.some((m) => m.kind === 'uploading');
    if (hasUploading) {
      setError('Дождитесь загрузки всех файлов');
      return;
    }
    setSaving(true);
    setError(null);
    const scheduledAt = scheduledDate ? `${scheduledDate}T${scheduledTime}:00` : undefined;
    try {
      const postId = draftPostId;
      if (postId) {
        await api.updatePost(postId, { title, body, scheduledAt, socialAccountIds: selectedChannels });
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

  const totalCount = media.length;
  const uploadingCount = media.filter((m) => m.kind === 'uploading').length;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-2xl font-bold text-white">
            {isEdit ? 'Редактирование поста' : 'Новый пост'}
          </h1>
          <button onClick={() => navigate('/app/calendar')} className="btn-ghost text-sm">← Календарь</button>
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
          {error && (
            <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Левая колонка — основная форма */}
            <div className="lg:col-span-2 space-y-5">
              <div>
                <label className="label">Заголовок</label>
                <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Краткое описание" />
              </div>

              <div>
                <label className="label">Текст поста</label>
                <div className="rounded-xl border border-graphite-700 bg-graphite-850 overflow-hidden">
                  <div className="flex gap-0.5 border-b border-graphite-700 bg-graphite-900 px-2 py-1.5 flex-wrap">
                    <button type="button" onClick={() => execCmd('bold')} className="rounded-lg px-2.5 py-1 text-xs text-graphite-300 hover:bg-graphite-800 hover:text-white font-bold" title="Жирный">B</button>
                    <button type="button" onClick={() => execCmd('italic')} className="rounded-lg px-2.5 py-1 text-xs text-graphite-300 hover:bg-graphite-800 hover:text-white italic" title="Курсив">I</button>
                    <button type="button" onClick={() => execCmd('strikeThrough')} className="rounded-lg px-2.5 py-1 text-xs text-graphite-300 hover:bg-graphite-800 hover:text-white line-through" title="Зачёркнутый">S</button>
                    <div className="w-px bg-graphite-700 mx-1" />
                    <button type="button" onClick={() => insertMd('`', '`')} className="rounded-lg px-2.5 py-1 text-xs text-graphite-300 hover:bg-graphite-800 hover:text-white font-mono" title="Код">&lt;/&gt;</button>
                    <button type="button" onClick={() => insertMd('```\n', '\n```')} className="rounded-lg px-2.5 py-1 text-xs text-graphite-300 hover:bg-graphite-800 hover:text-white" title="Блок кода">{'{ }'}</button>
                    <div className="w-px bg-graphite-700 mx-1" />
                    <button type="button" onClick={insertLink} className="rounded-lg px-2.5 py-1 text-xs text-graphite-300 hover:bg-graphite-800 hover:text-white" title="Ссылка">🔗</button>
                    <button type="button" onClick={() => insertMd('\n> ', '')} className="rounded-lg px-2.5 py-1 text-xs text-graphite-300 hover:bg-graphite-800 hover:text-white" title="Цитата">❝</button>
                    <button type="button" onClick={() => document.execCommand('insertUnorderedList')} className="rounded-lg px-2.5 py-1 text-xs text-graphite-300 hover:bg-graphite-800 hover:text-white" title="Список">☰</button>
                    <button type="button" onClick={() => insertMd('\n---\n', '')} className="rounded-lg px-2.5 py-1 text-xs text-graphite-300 hover:bg-graphite-800 hover:text-white" title="Разделитель">—</button>
                  </div>
                  <div
                    ref={editorRef}
                    contentEditable
                    suppressContentEditableWarning
                    onInput={syncBody}
                    className="min-h-[200px] max-h-[500px] overflow-y-auto px-4 py-3 text-sm text-graphite-100 leading-relaxed focus:outline-none empty:before:content-['Начните_писать...'] empty:before:text-graphite-500"
                    data-placeholder="Начните вводить текст поста..."
                  />
                </div>
                <div className="flex items-center justify-between mt-1.5">
                  <p className="text-xs text-graphite-500">Форматирование: **жирный**, *курсив*, `код`, [ссылки](url), &gt; цитаты</p>
                  <span className="text-xs text-graphite-600">{body.length} символов</span>
                </div>
              </div>

              <div>
                <label className="label">Медиафайлы (до 10) — перетащите для порядка</label>
                <div className="flex flex-wrap gap-3">
                  {media.map((m, i) => {
                    const borderClass = m.kind === 'uploading'
                      ? m.status === 'error' ? 'border-red-500/50' : 'border-lime/30'
                      : 'border-graphite-700';
                    const preview = m.kind === 'existing' ? m.url : m.preview;
                    return (
                      <div
                        key={m.kind === 'existing' ? m.id : `up-${i}`}
                        draggable
                        onDragStart={() => onDragStart(i)}
                        onDragOver={(e) => onDragOver(e, i)}
                        onDragEnd={onDragEnd}
                        className={`relative w-24 h-24 rounded-xl overflow-hidden border bg-graphite-850 cursor-grab active:cursor-grabbing transition-opacity ${borderClass} ${dragIdx === i ? 'opacity-50' : ''}`}
                      >
                        {m.mediaKind === 'video' ? (
                          <div className="w-full h-full flex items-center justify-center text-2xl">🎬</div>
                        ) : m.mediaKind === 'gif' ? (
                          <div className="w-full h-full flex items-center justify-center text-2xl">🎞️</div>
                        ) : (
                          <img src={preview} alt="" className="w-full h-full object-cover" />
                        )}
                        {m.kind === 'uploading' && m.status === 'uploading' && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-graphite-600 border-t-lime" />
                          </div>
                        )}
                        <button type="button" onClick={() => removeMedia(i)} className="absolute top-1 right-1 h-5 w-5 rounded-full bg-red-500/80 text-white text-xs flex items-center justify-center hover:bg-red-500 z-10">✕</button>
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-[9px] text-center py-0.5 text-graphite-300 truncate px-1">
                          {i + 1}
                        </div>
                        {m.kind === 'uploading' && (
                          <div className="absolute top-1 left-1 h-4 w-4 rounded-full bg-graphite-900/80 text-[9px] text-lime flex items-center justify-center">↑</div>
                        )}
                      </div>
                    );
                  })}
                  {totalCount < 10 && (
                    <label className="w-24 h-24 rounded-xl border-2 border-dashed border-graphite-700 flex flex-col items-center justify-center cursor-pointer hover:border-lime/40 transition">
                      <span className="text-2xl text-graphite-500">+</span>
                      <span className="text-[10px] text-graphite-500 mt-1">Добавить</span>
                      <input type="file" accept="image/*,video/mp4,.gif" multiple className="hidden" onChange={handleMediaChange} />
                    </label>
                  )}
                </div>
                <p className="mt-1 text-xs text-graphite-500">
                  JPG, PNG, WebP, GIF, MP4. До 50 МБ. {totalCount > 0 && `${totalCount} файл(ов)`} {uploadingCount > 0 && `· загружается: ${uploadingCount}`}
                </p>
              </div>
            </div>

            {/* Правая колонка — шаблоны */}
            <div className="hidden lg:block">
              <TemplatesPanel onInsert={(text) => {
                if (editorRef.current) {
                  editorRef.current.focus();
                  document.execCommand('insertText', false, text);
                  syncBody();
                }
              }} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Дата публикации</label>
              <input type="date" className="input" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} />
            </div>
            <div>
              <label className="label">Время</label>
              <input type="time" className="input" value={scheduledTime} onChange={(e) => setScheduledTime(e.target.value)} disabled={!scheduledDate} />
            </div>
          </div>

          <div>
            <label className="label">Каналы</label>
            {channels.length === 0 ? (
              <p className="text-sm text-graphite-400">Нет подключённых каналов. <a href="/app" className="text-lime hover:underline">Подключить</a></p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {channels.map((ch) => (
                  <button key={ch.id} type="button" onClick={() => toggleChannel(ch.id)} className={`rounded-xl border px-4 py-2 text-sm transition ${selectedChannels.includes(ch.id) ? 'border-lime/50 bg-lime/10 text-lime' : 'border-graphite-700 bg-graphite-850 text-graphite-300 hover:border-graphite-600'}`}>
                    {ch.title}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button type="submit" disabled={saving || uploadingCount > 0} className="btn-primary">{saving ? 'Сохранение...' : isEdit ? 'Сохранить' : 'Запланировать'}</button>
            <button type="button" onClick={() => navigate('/app/calendar')} className="btn-ghost">Отмена</button>
          </div>
        </form>
      </main>
    </div>
  );
}
