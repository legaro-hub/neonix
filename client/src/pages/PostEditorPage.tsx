import { useState, useEffect, useRef, useCallback, type FormEvent } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { DateTimePicker } from '../components/DateTimePicker';
import { api, HttpError } from '../lib/api';
import type { SocialAccount } from '../lib/types';

type MediaItem =
  | { kind: 'existing'; id: string; filename: string; url: string; mediaKind: string }
  | { kind: 'uploading'; file: File; preview: string; mediaKind: string; status: 'uploading' | 'error' };

type Platform = 'telegram' | 'pinterest' | 'youtube' | 'instagram';

type ButtonItem = { text: string; url: string };

const PLATFORMS: Array<{ key: Platform; label: string; color: string; icon: string; desc: string }> = [
  { key: 'telegram', label: 'Telegram', color: 'text-sky-400 border-sky-400/30 bg-sky-400/5', icon: '✈', desc: 'Текст + фото/видео/альбом' },
  { key: 'pinterest', label: 'Pinterest', color: 'text-red-400 border-red-400/30 bg-red-400/5', icon: '📌', desc: 'Изображение + описание (100 символов)' },
  { key: 'youtube', label: 'YouTube', color: 'text-red-500 border-red-500/30 bg-red-500/5', icon: '▶', desc: 'Видео + заголовок + описание' },
  { key: 'instagram', label: 'Instagram', color: 'text-pink-400 border-pink-400/30 bg-pink-400/5', icon: '📷', desc: 'Фото/Reels + подпись (2200 символов)' },
];

const LIMITS: Record<Platform, { title: number; body: number; maxMedia: number; mediaTypes: string; label: string }> = {
  telegram: { title: 100, body: 4096, maxMedia: 10, mediaTypes: 'image/*,video/mp4,.gif', label: 'Текст поста' },
  pinterest: { title: 100, body: 800, maxMedia: 5, mediaTypes: 'image/*', label: 'Описание пина' },
  youtube: { title: 100, body: 5000, maxMedia: 1, mediaTypes: 'video/mp4,video/mov', label: 'Описание видео' },
  instagram: { title: 0, body: 2200, maxMedia: 10, mediaTypes: 'image/*,video/mp4', label: 'Подпись' },
};

function mdToHtml(md: string): string {
  let h = md.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  h = h.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\*(.+?)\*/g, '<i>$1</i>');
  h = h.replace(/`([^`]+)`/g, '<code style="background:#1a1d23;padding:1px 4px;border-radius:4px;color:#d4ff3a;font-size:0.9em">$1</code>');
  h = h.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color:#d4ff3a;text-decoration:underline">$1</a>');
  h = h.replace(/^>\s?(.*)$/gm, '<blockquote style="border-left:3px solid #2e343d;padding-left:12px;color:#8a8b9e;margin:8px 0">$1</blockquote>');
  return h.replace(/\n/g, '<br>');
}

const DEFAULT_TEMPLATES = [
  { id: '1', name: 'Анонс', text: '📢 Анонс\n\nСкоро у нас важные новости! Следите за обновлениями.' },
  { id: '2', name: 'Скидка', text: '🔥 СКИДКА\n\nТолько сегодня скидка 20% на все тарифы!\nИспользуйте промокод: NEONIX20' },
  { id: '3', name: 'Вопрос', text: '❓ Вопрос дня\n\nКакой ваш любимый формат контента?\n1. Текст\n2. Видео\n3. Мемы' },
  { id: '4', name: 'Итоги', text: '📊 Итоги дня\n\n✅ Выполнено:\n• \n\n❌ Проблемы:\n• ' },
  { id: '5', name: 'CTA', text: '👉 Подпишитесь, чтобы не пропустить!\n\n🔗 Ссылка: ' },
  { id: '6', name: 'Цитата', text: '💬 «Цитата дня»\n\n— Автор' },
];

function TemplatesPanel({ onInsert }: { onInsert: (text: string) => void }) {
  const [templates, setTemplates] = useState(() => {
    try { return JSON.parse(localStorage.getItem('neonix_templates') || '') || DEFAULT_TEMPLATES; } catch { return DEFAULT_TEMPLATES; }
  });
  const [newName, setNewName] = useState('');
  const [newText, setNewText] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  const save = (t: typeof templates) => { setTemplates(t); localStorage.setItem('neonix_templates', JSON.stringify(t)); };
  const add = () => { if (!newName.trim() || !newText.trim()) return; save([...templates, { id: Date.now().toString(), name: newName, text: newText }]); setNewName(''); setNewText(''); setShowAdd(false); };
  const remove = (id: string) => save(templates.filter((t: { id: string }) => t.id !== id));

  return (
    <div className="card p-4">
      <h3 className="text-sm font-semibold text-white mb-3">Шаблоны</h3>
      <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
        {templates.map((t: { id: string; name: string; text: string }) => (
          <div key={t.id} className="group flex items-start gap-2 p-2 rounded-lg bg-graphite-800/40 border border-graphite-700/30 hover:border-graphite-600/50 cursor-pointer transition" onClick={() => onInsert(t.text)}>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-graphite-200 truncate">{t.name}</div>
              <div className="text-[10px] text-graphite-500 truncate mt-0.5">{t.text.slice(0, 50)}...</div>
            </div>
            <button type="button" onClick={(e) => { e.stopPropagation(); remove(t.id); }} className="opacity-0 group-hover:opacity-100 text-graphite-600 hover:text-red-400 text-xs shrink-0">✕</button>
          </div>
        ))}
      </div>
      {showAdd ? (
        <div className="mt-2 space-y-1.5">
          <input className="input text-xs py-2" placeholder="Название" value={newName} onChange={(e) => setNewName(e.target.value)} />
          <textarea className="input text-xs py-2 h-16 resize-none" placeholder="Текст" value={newText} onChange={(e) => setNewText(e.target.value)} />
          <div className="flex gap-1.5">
            <button type="button" onClick={add} className="btn-primary text-xs py-1.5 flex-1">Добавить</button>
            <button type="button" onClick={() => setShowAdd(false)} className="btn-ghost text-xs py-1.5">Отмена</button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setShowAdd(true)} className="mt-2 w-full text-xs text-graphite-500 hover:text-lime transition">+ Добавить</button>
      )}
    </div>
  );
}

export function PostEditorPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [platform, setPlatform] = useState<Platform>((searchParams.get('platform') as Platform) || 'telegram');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [link, setLink] = useState('');
  const [scheduledDate, setScheduledDate] = useState(searchParams.get('date') || '');
  const [scheduledTime, setScheduledTime] = useState('10:00');
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [channels, setChannels] = useState<SocialAccount[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [draftPostId, setDraftPostId] = useState<string | null>(id || null);
  const [buttons, setButtons] = useState<ButtonItem[]>([]);
  const [showButtonAdd, setShowButtonAdd] = useState(false);
  const [newBtnText, setNewBtnText] = useState('');
  const [newBtnUrl, setNewBtnUrl] = useState('');
  const editorRef = useRef<HTMLDivElement>(null);

  const limits = LIMITS[platform];
  const filteredChannels = channels.filter((c) => c.platform === platform && c.status === 'active');

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
          if (post.buttons) setButtons(post.buttons as ButtonItem[]);
          if (post.scheduledAt) {
            setScheduledDate(post.scheduledAt.slice(0, 10));
            setScheduledTime(post.scheduledAt.slice(11, 16));
          }
          setSelectedChannels(post.publications.map((p) => p.socialAccount.id));
          setMedia(post.media.map((m) => ({ kind: 'existing' as const, id: m.id, filename: m.filename, url: `/api/media/file/${m.id}`, mediaKind: m.kind })));
          if (post.publications[0]) setPlatform(post.publications[0].socialAccount.platform as Platform);
        }
      } catch {}
    })();
  }, [id, isEdit]);

  const syncBody = useCallback(() => {
    if (editorRef.current) setBody(editorRef.current.innerHTML);
  }, []);

  const execCmd = (cmd: string, val?: string) => { document.execCommand(cmd, false, val); editorRef.current?.focus(); syncBody(); };

  const insertMd = (before: string, after: string) => {
    const sel = window.getSelection();
    if (!sel || !editorRef.current) return;
    const text = before + sel.toString() + after;
    document.execCommand('insertText', false, text);
    syncBody();
  };

  const insertAtCursor = (text: string) => {
    const el = editorRef.current;
    if (!el) return;
    el.focus();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) {
      document.execCommand('insertText', false, text);
    } else {
      const range = sel.getRangeAt(0);
      if (!el.contains(range.commonAncestorContainer)) {
        range.selectNodeContents(el);
        range.collapse(false);
      }
      range.deleteContents();
      range.insertNode(document.createTextNode(text));
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
    }
    syncBody();
  };

  const handleMediaChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (media.length + files.length > limits.maxMedia) {
      setError(`Максимум ${limits.maxMedia} файлов`);
      return;
    }
    const newMedia: MediaItem[] = [];
    for (const file of files) {
      const reader = new FileReader();
      const preview = await new Promise<string>((r) => { reader.onload = () => r(reader.result as string); reader.readAsDataURL(file); });
      const mediaKind = file.type.startsWith('video/') ? 'video' : file.type === 'image/gif' ? 'gif' : 'image';
      newMedia.push({ kind: 'uploading', file, preview, mediaKind, status: 'uploading' });
    }
    const startIdx = media.length;
    setMedia((prev) => [...prev, ...newMedia]);
    e.target.value = '';
    for (let i = 0; i < files.length; i++) {
      autoUploadFile(files[i], startIdx + i);
    }
  };

  const autoUploadFile = async (file: File, index: number) => {
    let postId = draftPostId;
    if (!postId) {
      try { const post = await api.createPost({ body: ' ', socialAccountIds: [] }); postId = post.id; setDraftPostId(postId); } catch {
        setMedia((prev) => prev.map((m, i) => i === index && m.kind === 'uploading' ? { ...m, status: 'error' as const } : m));
        return;
      }
    }
    try {
      const asset = await api.uploadMedia(postId, file);
      setMedia((prev) => prev.map((m, i) => i === index && m.kind === 'uploading' ? { kind: 'existing' as const, id: asset.id, filename: asset.filename, url: asset.url, mediaKind: asset.kind } : m));
    } catch {
      setMedia((prev) => prev.map((m, i) => i === index && m.kind === 'uploading' ? { ...m, status: 'error' as const } : m));
    }
  };

  const removeMedia = (index: number) => {
    const item = media[index];
    if (item.kind === 'existing') api.deleteMedia(item.id).catch(() => {});
    setMedia((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleChannel = (chId: string) => {
    setSelectedChannels((prev) => prev.includes(chId) ? prev.filter((c) => c !== chId) : [...prev, chId]);
  };

  const addInlineButton = () => {
    if (!newBtnText.trim() || !newBtnUrl.trim()) return;
    setButtons((prev) => [...prev, { text: newBtnText.trim(), url: newBtnUrl.trim() }]);
    setNewBtnText('');
    setNewBtnUrl('');
    setShowButtonAdd(false);
  };

  const removeInlineButton = (idx: number) => {
    setButtons((prev) => prev.filter((_, i) => i !== idx));
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (editorRef.current) syncBody();
    if (!body.trim() && selectedChannels.length === 0) {
      setError('Введите контент или выберите аккаунт');
      return;
    }
    if (media.some((m) => m.kind === 'uploading')) {
      setError('Дождитесь загрузки файлов');
      return;
    }
    setSaving(true);
    setError(null);
    const scheduledAt = scheduledDate ? `${scheduledDate}T${scheduledTime}:00` : undefined;
    try {
      const postId = draftPostId;
      const data = { title: title || undefined, body, buttons: buttons.length > 0 ? buttons : undefined, scheduledAt, socialAccountIds: selectedChannels, link: link || undefined } as any;
      if (postId) { await api.updatePost(postId, data); }
      else { await api.createPost(data); }
      navigate('/app/calendar');
    } catch (err) {
      setError(err instanceof HttpError ? err.message : 'Ошибка');
    } finally { setSaving(false); }
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-6 pb-20 lg:pb-10 lg:p-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">{isEdit ? 'Редактирование' : 'Новый пост'}</h1>
          <button onClick={() => navigate('/app/calendar')} className="text-sm text-graphite-400 hover:text-white transition">← Календарь</button>
        </div>

        <div className="mb-6">
          <label className="label">Платформа</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {PLATFORMS.map((p) => (
              <button key={p.key} type="button" onClick={() => { setPlatform(p.key); setSelectedChannels([]); }}
                className={`p-3 rounded-xl border text-left transition ${platform === p.key ? p.color : 'border-graphite-700/40 text-graphite-400 hover:border-graphite-600/60'}`}>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{p.icon}</span>
                  <span className="text-sm font-medium">{p.label}</span>
                </div>
                <p className="text-[11px] text-graphite-500 mt-1">{p.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-5">
        <form onSubmit={onSubmit} className="space-y-5">
          {error && <div className="rounded-lg border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-400">{error}</div>}

          {platform === 'telegram' && (
            <>
              <div>
                <label className="label">Заголовок</label>
                <input className="input" value={title} onChange={(e) => setTitle(e.target.value.slice(0, limits.title))} placeholder="Краткое описание (необязательно)" />
                <span className="text-[10px] text-graphite-600 mt-0.5 block">{title.length}/{limits.title}</span>
              </div>
              <div>
                <label className="label">Текст поста</label>
                <div className="rounded-xl border border-graphite-700/40 bg-graphite-900/40 overflow-hidden relative z-0">
                  <div className="flex gap-0.5 border-b border-graphite-700/40 px-2 py-1.5 flex-wrap relative z-10">
                    {[
                      { cmd: 'bold', label: 'B', title: 'Жирный', cls: 'font-bold' },
                      { cmd: 'italic', label: 'I', title: 'Курсив', cls: 'italic' },
                      { cmd: 'strikeThrough', label: 'S', title: 'Зачёркнутый', cls: 'line-through' },
                    ].map((b) => (
                      <button key={b.cmd} type="button" onClick={() => execCmd(b.cmd)} className={`rounded-lg px-2.5 py-1 text-xs text-graphite-400 hover:text-white transition ${b.cls}`} title={b.title}>{b.label}</button>
                    ))}
                    <div className="w-px bg-graphite-700/40 mx-1" />
                    <button type="button" onClick={() => insertMd('\n> ', '')} className="rounded-lg px-2.5 py-1 text-xs text-graphite-400 hover:text-white transition" title="Цитата">❝</button>
                    <button type="button" onClick={() => insertMd('||', '||')} className="rounded-lg px-2.5 py-1 text-xs text-graphite-400 hover:text-white transition font-mono" title="Спойлер">||</button>
                    <button type="button" onClick={() => insertMd('\n---\n', '')} className="rounded-lg px-2.5 py-1 text-xs text-graphite-400 hover:text-white transition" title="Разделитель">—</button>
                    <button type="button" onClick={() => insertMd('\n', '')} className="rounded-lg px-2.5 py-1 text-xs text-graphite-400 hover:text-white transition font-mono" title="Перенос">↵</button>
                    <div className="w-px bg-graphite-700/40 mx-1" />
                    <EmojiPicker onEmoji={(e) => insertAtCursor(e)} />
                  </div>
                  <div ref={editorRef} contentEditable suppressContentEditableWarning onInput={syncBody}
                    className="min-h-[180px] max-h-[400px] overflow-y-auto px-4 py-3 text-sm text-graphite-200 leading-relaxed focus:outline-none relative z-0" />
                </div>
                <div className="flex justify-end mt-1">
                  <span className={`text-[11px] ${body.length > limits.body ? 'text-red-400' : 'text-graphite-600'}`}>{body.length}/{limits.body}</span>
                </div>
              </div>

              {/* Inline buttons */}
              <div className="card p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-white">Кнопки</h3>
                  <button type="button" onClick={() => setShowButtonAdd(!showButtonAdd)} className="text-xs text-graphite-500 hover:text-lime transition">
                    {showButtonAdd ? 'Отмена' : '+ Добавить'}
                  </button>
                </div>
                {buttons.length > 0 && (
                  <div className="space-y-1.5 mb-3">
                    {buttons.map((btn, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-graphite-800/40 border border-graphite-700/30">
                        <span className="text-xs text-sky-400 truncate flex-1">{btn.text}</span>
                        <span className="text-[10px] text-graphite-500 truncate max-w-[200px]">{btn.url}</span>
                        <button type="button" onClick={() => removeInlineButton(idx)} className="text-graphite-600 hover:text-red-400 text-xs shrink-0">✕</button>
                      </div>
                    ))}
                  </div>
                )}
                {showButtonAdd && (
                  <div className="space-y-2 p-3 rounded-lg bg-graphite-800/40 border border-graphite-700/30">
                    <input className="input text-xs py-2" placeholder="Текст кнопки" value={newBtnText} onChange={(e) => setNewBtnText(e.target.value)} />
                    <input className="input text-xs py-2" placeholder="https://..." value={newBtnUrl} onChange={(e) => setNewBtnUrl(e.target.value)} />
                    <button type="button" onClick={addInlineButton} className="btn-primary text-xs py-1.5 w-full">Добавить</button>
                  </div>
                )}
                {buttons.length === 0 && !showButtonAdd && (
                  <p className="text-[11px] text-graphite-500">URL-кнопки под постом в Telegram</p>
                )}
              </div>

              <MediaUpload media={media} limits={limits} onAdd={handleMediaChange} onRemove={removeMedia} />
              <div className="lg:hidden mt-4">
                <TemplatesPanel onInsert={insertAtCursor} />
              </div>
            </>
          )}

          {platform === 'pinterest' && (
            <>
              <div>
                <label className="label">Изображение</label>
                <MediaUpload media={media} limits={limits} onAdd={handleMediaChange} onRemove={removeMedia} />
              </div>
              <div>
                <label className="label">Название</label>
                <input className="input" value={title} onChange={(e) => setTitle(e.target.value.slice(0, limits.title))} placeholder="Название пина" />
                <span className="text-[10px] text-graphite-600 mt-0.5 block">{title.length}/{limits.title}</span>
              </div>
              <div>
                <label className="label">Описание</label>
                <textarea className="input min-h-[100px] resize-none" value={body} onChange={(e) => setBody(e.target.value.slice(0, limits.body))} placeholder="Описание пина" />
                <span className="text-[10px] text-graphite-600 mt-0.5 block">{body.length}/{limits.body}</span>
              </div>
              <div>
                <label className="label">Ссылка (необязательно)</label>
                <input className="input" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://..." />
              </div>
            </>
          )}

          {platform === 'youtube' && (
            <>
              <div>
                <label className="label">Видео</label>
                <MediaUpload media={media} limits={limits} onAdd={handleMediaChange} onRemove={removeMedia} />
              </div>
              <div>
                <label className="label">Заголовок</label>
                <input className="input" value={title} onChange={(e) => setTitle(e.target.value.slice(0, limits.title))} placeholder="Заголовок видео" />
                <span className="text-[10px] text-graphite-600 mt-0.5 block">{title.length}/{limits.title}</span>
              </div>
              <div>
                <label className="label">Описание</label>
                <textarea className="input min-h-[120px] resize-none" value={body} onChange={(e) => setBody(e.target.value.slice(0, limits.body))} placeholder="Описание видео. Используйте #теги для хэштегов." />
                <span className="text-[10px] text-graphite-600 mt-0.5 block">{body.length}/{limits.body}</span>
              </div>
            </>
          )}

          {platform === 'instagram' && (
            <>
              <div>
                <label className="label">Медиа (фото, Reels, карусель)</label>
                <MediaUpload media={media} limits={limits} onAdd={handleMediaChange} onRemove={removeMedia} />
                <p className="text-[11px] text-graphite-500 mt-1">
                  {media.length === 0 ? 'Загрузите фото или видео' : media.length === 1 ? '1 файл — обычный пост' : `${media.length} файлов — карусель (до 10)`}
                </p>
              </div>
              <div>
                <label className="label">Подпись</label>
                <textarea className="input min-h-[120px] resize-none" value={body} onChange={(e) => setBody(e.target.value.slice(0, limits.body))} placeholder="Подпись к посту. #Хэштеги поддерживаются." />
                <span className="text-[10px] text-graphite-600 mt-0.5 block">{body.length}/{limits.body}</span>
              </div>
            </>
          )}

          <div>
            <label className="label">Расписание</label>
            <DateTimePicker date={scheduledDate} time={scheduledTime} onDateChange={setScheduledDate} onTimeChange={setScheduledTime} />
          </div>

          <div>
            <label className="label">Аккаунты ({filteredChannels.length})</label>
            {filteredChannels.length === 0 ? (
              <p className="text-sm text-graphite-400">Нет аккаунтов {PLATFORMS.find((p) => p.key === platform)?.label}. <a href="/app/channels" className="text-lime hover:underline">Подключить</a></p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {filteredChannels.map((ch) => (
                  <button key={ch.id} type="button" onClick={() => toggleChannel(ch.id)}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${selectedChannels.includes(ch.id) ? 'border-lime/50 bg-lime/5 text-lime' : 'border-graphite-700/40 text-graphite-300 hover:border-graphite-600/60'}`}>
                    <span className={`w-2 h-2 rounded-full ${selectedChannels.includes(ch.id) ? 'bg-lime' : 'bg-graphite-600'}`} />
                    {ch.title}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Сохранение...' : isEdit ? 'Сохранить' : 'Запланировать'}</button>
            <button type="button" onClick={() => navigate('/app/calendar')} className="btn-ghost">Отмена</button>
          </div>
        </form>
        {platform === 'telegram' && (
          <div className="hidden lg:block">
            <div className="sticky top-6">
              <TemplatesPanel onInsert={insertAtCursor} />
            </div>
          </div>
        )}
        </div>
      </main>
    </div>
  );
}

/* ─── Media Upload ─── */
function MediaUpload({ media, limits, onAdd, onRemove }: {
  media: MediaItem[]; limits: { maxMedia: number; mediaTypes: string }; onAdd: (e: React.ChangeEvent<HTMLInputElement>) => void; onRemove: (i: number) => void;
}) {
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {media.map((m, i) => {
          const preview = m.kind === 'existing' ? m.url : m.preview;
          return (
            <div key={m.kind === 'existing' ? m.id : `up-${i}`}
              className={`relative w-20 h-20 rounded-lg overflow-hidden border bg-graphite-900 ${m.kind === 'uploading' ? (m.status === 'error' ? 'border-red-500/50' : 'border-lime/30') : 'border-graphite-700/40'}`}>
              {m.mediaKind === 'video' ? (
                <div className="w-full h-full flex items-center justify-center text-xl text-graphite-400">▶</div>
              ) : (
                <img src={preview} alt="" className="w-full h-full object-cover" />
              )}
              {m.kind === 'uploading' && m.status === 'uploading' && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-graphite-600 border-t-lime" />
                </div>
              )}
              {m.kind === 'uploading' && m.status === 'error' && (
                <div className="absolute inset-0 bg-red-900/60 flex items-center justify-center">
                  <span className="text-red-400 text-xs">✕</span>
                </div>
              )}
              <button type="button" onClick={() => onRemove(i)} className="absolute top-0.5 right-0.5 h-4 w-4 rounded bg-red-500/80 text-white text-[10px] flex items-center justify-center hover:bg-red-500">✕</button>
            </div>
          );
        })}
        {media.length < limits.maxMedia && (
          <label className="w-20 h-20 rounded-lg border border-dashed border-graphite-700/40 flex flex-col items-center justify-center cursor-pointer hover:border-graphite-500 transition">
            <span className="text-lg text-graphite-500">+</span>
            <input type="file" accept={limits.mediaTypes} multiple className="hidden" onChange={onAdd} />
          </label>
        )}
      </div>
    </div>
  );
}

/* ─── Emoji Picker ─── */
const EMOJI_ROWS = [
  ['👍', '❤️', '🔥', '⭐', '✅', '❌', '🎉', '📢', '💬', '📊', '🔗', '💡', '🚀', '💰', '🎯', '📌'],
  ['😊', '😍', '🤔', '😎', '🥳', '😢', '😱', '🤩', '😂', '🤣', '😏', '🥺', '😴', '🤯', '😤', '😈'],
  ['👉', '💪', '🙏', '👏', '🤝', '👋', '✋', '🫶', '✊', '💪', '🍕', '🍔', '☕', '🎂', '🍩', '🍰'],
  ['🌸', '🌙', '🌈', '☀️', '🌊', '❄️', '🐶', '🐱', '🦊', '🦋', '📱', '💻', '🎮', '🎵', '🎶', '🧲'],
  ['🔴', '🟢', '🔵', '🟡', '🟠', '🟣', '⚫', '⚪', '🟤', '💯', '🔴', '🟧', '🟨', '🟩', '🟦', '⬛'],
];

function EmojiPicker({ onEmoji }: { onEmoji: (e: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    if (open) document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(!open)} className="rounded-lg px-2.5 py-1 text-xs text-graphite-400 hover:text-white transition">😊</button>
      {open && (
        <div className="absolute top-full left-0 mt-2 z-[100] bg-graphite-900 border border-graphite-700 rounded-xl p-2 shadow-2xl shadow-black/50 w-64 max-h-[320px] overflow-y-auto">
          {EMOJI_ROWS.map((row, i) => (
            <div key={i} className="flex flex-wrap gap-0.5 mb-1">
              {row.map((e, j) => (
                <button key={`${i}-${j}`} type="button" onClick={() => { onEmoji(e); setOpen(false); }}
                  className="w-7 h-7 flex items-center justify-center rounded hover:bg-graphite-800 text-sm transition">{e}</button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
