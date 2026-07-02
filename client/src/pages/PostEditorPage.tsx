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
  { key: 'telegram', label: 'Telegram', color: 'text-sky-400 border-sky-400/30 bg-sky-400/5', icon: '✈', desc: 'Текст + фото/видео' },
  { key: 'pinterest', label: 'Pinterest', color: 'text-red-400 border-red-400/30 bg-red-400/5', icon: '📌', desc: 'Изображение + описание' },
  { key: 'youtube', label: 'YouTube', color: 'text-red-500 border-red-500/30 bg-red-500/5', icon: '▶', desc: 'Видео + заголовок' },
  { key: 'instagram', label: 'Instagram', color: 'text-pink-400 border-pink-400/30 bg-pink-400/5', icon: '📷', desc: 'Фото/Reels + подпись' },
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
  h = h.replace(/`([^`]+)`/g, '<code style="background:#1a1d23;padding:1px 4px;border-radius:4px;color:#d4ff3a;font-size:0.9em;font-family:monospace">$1</code>');
  h = h.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color:#58a6ff;text-decoration:underline">$1</a>');
  h = h.replace(/^>\s?(.*)$/gm, '<blockquote style="border-left:3px solid #30363d;padding-left:10px;color:#8b949e;margin:6px 0;font-style:italic">$1</blockquote>');
  h = h.replace(/^---$/gm, '<hr style="border:none;border-top:1px solid #30363d;margin:8px 0">');
  h = h.replace(/\|\|(.+?)\|\|/g, '<span style="background:#30363d;color:#30363d;border-radius:3px;padding:0 3px;cursor:pointer" onclick="this.style.color=\'#e6edf3\'">$1</span>');
  h = h.replace(/^- (.+)$/gm, '<span style="color:#3fb950">•</span> $1');
  h = h.replace(/^(\d+)\. (.+)$/gm, '<span style="color:#58a6ff;font-weight:bold">$1.</span> $2');
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
    <div className="card p-3">
      <h3 className="text-xs font-semibold text-graphite-300 mb-2 uppercase tracking-wider">Шаблоны</h3>
      <div className="space-y-1 max-h-[200px] overflow-y-auto">
        {templates.map((t: { id: string; name: string; text: string }) => (
          <div key={t.id} className="group flex items-center gap-2 p-1.5 rounded-lg hover:bg-graphite-800/60 cursor-pointer transition" onClick={() => onInsert(t.text)}>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-graphite-200 truncate">{t.name}</div>
            </div>
            <button type="button" onClick={(e) => { e.stopPropagation(); remove(t.id); }} className="opacity-0 group-hover:opacity-100 text-graphite-600 hover:text-red-400 text-[10px] shrink-0">✕</button>
          </div>
        ))}
      </div>
      {showAdd ? (
        <div className="mt-2 space-y-1.5">
          <input className="input text-xs py-1.5" placeholder="Название" value={newName} onChange={(e) => setNewName(e.target.value)} />
          <textarea className="input text-xs py-1.5 h-14 resize-none" placeholder="Текст" value={newText} onChange={(e) => setNewText(e.target.value)} />
          <div className="flex gap-1">
            <button type="button" onClick={add} className="btn-primary text-xs py-1 flex-1">Добавить</button>
            <button type="button" onClick={() => setShowAdd(false)} className="btn-ghost text-xs py-1">✕</button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setShowAdd(true)} className="mt-1.5 w-full text-[11px] text-graphite-500 hover:text-lime transition">+ Новый</button>
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
  const [showPreview, setShowPreview] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const savedRange = useRef<Range | null>(null);

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

  const saveSelection = useCallback(() => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && editorRef.current?.contains(sel.anchorNode)) {
      savedRange.current = sel.getRangeAt(0).cloneRange();
    }
  }, []);

  const insertAtCursor = (text: string) => {
    const el = editorRef.current;
    if (!el) return;
    el.focus();
    if (savedRange.current && el.contains(savedRange.current.startContainer)) {
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(savedRange.current);
      savedRange.current.deleteContents();
      savedRange.current.insertNode(document.createTextNode(text));
      savedRange.current.collapse(false);
      sel?.removeAllRanges();
      sel?.addRange(savedRange.current);
    } else {
      document.execCommand('insertText', false, text);
    }
    syncBody();
  };

  const execCmd = (cmd: string, val?: string) => { document.execCommand(cmd, false, val); editorRef.current?.focus(); saveSelection(); syncBody(); };
  const insertMd = (before: string, after: string) => {
    const sel = window.getSelection();
    if (!sel || !editorRef.current) return;
    document.execCommand('insertText', false, before + sel.toString() + after);
    saveSelection();
    syncBody();
  };

  const handleMediaChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (media.length + files.length > limits.maxMedia) { setError(`Максимум ${limits.maxMedia} файлов`); return; }
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
    for (let i = 0; i < files.length; i++) autoUploadFile(files[i], startIdx + i);
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

  const toggleChannel = (chId: string) => setSelectedChannels((prev) => prev.includes(chId) ? prev.filter((c) => c !== chId) : [...prev, chId]);

  const addInlineButton = () => {
    if (!newBtnText.trim() || !newBtnUrl.trim()) return;
    setButtons((prev) => [...prev, { text: newBtnText.trim(), url: newBtnUrl.trim() }]);
    setNewBtnText(''); setNewBtnUrl(''); setShowButtonAdd(false);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (editorRef.current) syncBody();
    if (!body.trim() && selectedChannels.length === 0) { setError('Введите контент или выберите аккаунт'); return; }
    if (media.some((m) => m.kind === 'uploading')) { setError('Дождитесь загрузки файлов'); return; }
    setSaving(true); setError(null);
    const scheduledAt = scheduledDate ? `${scheduledDate}T${scheduledTime}:00` : undefined;
    try {
      const postId = draftPostId;
      const data = { title: title || undefined, body, buttons: buttons.length > 0 ? buttons : undefined, scheduledAt, socialAccountIds: selectedChannels, link: link || undefined } as any;
      if (postId) await api.updatePost(postId, data); else await api.createPost(data);
      navigate('/app/calendar');
    } catch (err) { setError(err instanceof HttpError ? err.message : 'Ошибка'); }
    finally { setSaving(false); }
  };

  const previewHtml = mdToHtml(body);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-4 pb-20 lg:pb-10 lg:p-8">
        <div className="max-w-[800px] mx-auto">
          <div className="flex items-center justify-between mb-5">
            <h1 className="text-xl font-bold text-white">{isEdit ? 'Редактирование' : 'Новый пост'}</h1>
            <button onClick={() => navigate('/app/calendar')} className="text-sm text-graphite-400 hover:text-white transition">← Календарь</button>
          </div>

          {/* Platform */}
          <div className="mb-4">
            <div className="grid grid-cols-4 gap-1.5">
              {PLATFORMS.map((p) => (
                <button key={p.key} type="button" onClick={() => { setPlatform(p.key); setSelectedChannels([]); }}
                  className={`p-2 rounded-lg border text-center transition text-xs ${platform === p.key ? p.color : 'border-graphite-700/40 text-graphite-400 hover:border-graphite-600/60'}`}>
                  <span className="mr-1">{p.icon}</span> {p.label}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            {error && <div className="rounded-lg border border-red-500/30 bg-red-500/5 px-3 py-2 text-xs text-red-400">{error}</div>}

            {platform === 'telegram' && (
              <>
                {/* Title */}
                <div>
                  <label className="label text-xs">Заголовок</label>
                  <input className="input py-2 text-sm" value={title} onChange={(e) => setTitle(e.target.value.slice(0, limits.title))} placeholder="Краткое описание (необязательно)" />
                  <span className="text-[10px] text-graphite-600 mt-0.5 block text-right">{title.length}/{limits.title}</span>
                </div>

                {/* Text editor */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="label text-xs">Текст поста</label>
                    <button type="button" onClick={() => setShowPreview(!showPreview)} className="text-[11px] text-graphite-500 hover:text-lime transition">
                      {showPreview ? 'Редактировать' : '👁 Превью'}
                    </button>
                  </div>
                  {showPreview ? (
                    <div className="rounded-lg border border-graphite-700/40 bg-[#0d1117] p-4 text-sm text-[#e6edf3] leading-relaxed min-h-[200px] max-h-[400px] overflow-y-auto">
                      {title && <div className="font-bold mb-2 text-white">{title}</div>}
                      <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
                    </div>
                  ) : (
                    <div className="rounded-lg border border-graphite-700/40 bg-[#0d1117] overflow-hidden">
                      <div className="flex items-center gap-0.5 border-b border-graphite-800 px-1.5 py-1">
                        {[
                          { cmd: 'bold', label: 'B', cls: 'font-bold', title: 'Жирный' },
                          { cmd: 'italic', label: 'I', cls: 'italic', title: 'Курсив' },
                          { cmd: 'strikeThrough', label: 'S', cls: 'line-through', title: 'Зачёркнутый' },
                          { cmd: 'underline', label: 'U', cls: 'underline', title: 'Подчёркнутый' },
                        ].map((b) => (
                          <button key={b.cmd} type="button" onClick={() => execCmd(b.cmd)} className={`w-7 h-7 flex items-center justify-center rounded text-xs text-gray-400 hover:text-white hover:bg-gray-800 transition ${b.cls}`} title={b.title}>{b.label}</button>
                        ))}
                        <div className="w-px h-4 bg-graphite-800 mx-0.5" />
                        <button type="button" onClick={() => insertMd('`', '`')} className="w-7 h-7 flex items-center justify-center rounded text-xs text-gray-400 hover:text-white hover:bg-gray-800 transition font-mono" title="Код">{'<>'}</button>
                        <button type="button" onClick={() => insertMd('\n> ', '')} className="w-7 h-7 flex items-center justify-center rounded text-xs text-gray-400 hover:text-white hover:bg-gray-800 transition" title="Цитата">❝</button>
                        <button type="button" onClick={() => insertMd('||', '||')} className="w-7 h-7 flex items-center justify-center rounded text-xs text-gray-400 hover:text-white hover:bg-gray-800 transition font-mono" title="Спойлер">||</button>
                        <button type="button" onClick={() => insertMd('\n---\n', '')} className="w-7 h-7 flex items-center justify-center rounded text-xs text-gray-400 hover:text-white hover:bg-gray-800 transition" title="Разделитель">—</button>
                        <div className="w-px h-4 bg-graphite-800 mx-0.5" />
                        <EmojiPicker onEmoji={(e) => insertAtCursor(e)} />
                      </div>
                      <div ref={editorRef} contentEditable suppressContentEditableWarning onInput={syncBody} onMouseUp={saveSelection} onKeyUp={saveSelection}
                        className="min-h-[200px] max-h-[400px] overflow-y-auto px-3 py-2.5 text-sm text-[#e6edf3] leading-relaxed focus:outline-none whitespace-pre-wrap" />
                    </div>
                  )}
                  <div className="flex justify-end mt-1">
                    <span className={`text-[10px] ${body.length > limits.body ? 'text-red-400' : 'text-graphite-600'}`}>{body.length}/{limits.body}</span>
                  </div>
                </div>

                {/* Inline buttons */}
                <div className="rounded-lg border border-graphite-700/40 bg-graphite-900/30 p-3 max-w-[400px]">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-medium text-graphite-300">Кнопки</h3>
                    <button type="button" onClick={() => setShowButtonAdd(!showButtonAdd)} className="text-[11px] text-graphite-500 hover:text-lime transition">
                      {showButtonAdd ? '✕' : '+ Добавить'}
                    </button>
                  </div>
                  {buttons.length > 0 && (
                    <div className="space-y-1 mb-2">
                      {buttons.map((btn, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs">
                          <span className="text-sky-400 truncate">{btn.text}</span>
                          <span className="text-graphite-600 truncate max-w-[150px]">{btn.url}</span>
                          <button type="button" onClick={() => setButtons((p) => p.filter((_, i) => i !== idx))} className="text-graphite-600 hover:text-red-400 shrink-0 ml-auto">✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                  {showButtonAdd && (
                    <div className="space-y-1.5">
                      <input className="input text-xs py-1.5" placeholder="Текст кнопки" value={newBtnText} onChange={(e) => setNewBtnText(e.target.value)} />
                      <input className="input text-xs py-1.5" placeholder="https://..." value={newBtnUrl} onChange={(e) => setNewBtnUrl(e.target.value)} />
                      <button type="button" onClick={addInlineButton} className="w-full text-xs py-1.5 rounded-lg bg-sky-500/20 text-sky-400 hover:bg-sky-500/30 transition">Добавить</button>
                    </div>
                  )}
                  {buttons.length === 0 && !showButtonAdd && (
                    <p className="text-[10px] text-graphite-600">URL-кнопки под постом</p>
                  )}
                </div>

                {/* Media */}
                <div>
                  <label className="label text-xs">Медиа</label>
                  <div className="flex flex-wrap gap-1.5">
                    {media.map((m, i) => (
                      <div key={m.kind === 'existing' ? m.id : `up-${i}`}
                        className={`relative w-16 h-16 rounded-lg overflow-hidden border bg-graphite-900 ${m.kind === 'uploading' ? (m.status === 'error' ? 'border-red-500/50' : 'border-lime/30') : 'border-graphite-700/40'}`}>
                        {m.mediaKind === 'video' ? (
                          <div className="w-full h-full flex items-center justify-center text-sm text-graphite-400">▶</div>
                        ) : (
                          <img src={m.kind === 'existing' ? m.url : m.preview} alt="" className="w-full h-full object-cover" />
                        )}
                        {m.kind === 'uploading' && m.status === 'uploading' && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-graphite-600 border-t-lime" />
                          </div>
                        )}
                        <button type="button" onClick={() => removeMedia(i)} className="absolute top-0.5 right-0.5 h-3.5 w-3.5 rounded bg-red-500/80 text-white text-[9px] flex items-center justify-center hover:bg-red-500">✕</button>
                      </div>
                    ))}
                    {media.length < limits.maxMedia && (
                      <label className="w-16 h-16 rounded-lg border border-dashed border-graphite-700/40 flex items-center justify-center cursor-pointer hover:border-graphite-500 transition">
                        <span className="text-graphite-500 text-lg">+</span>
                        <input type="file" accept={limits.mediaTypes} multiple className="hidden" onChange={handleMediaChange} />
                      </label>
                    )}
                  </div>
                </div>

                {/* Templates — mobile */}
                <div className="lg:hidden">
                  <TemplatesPanel onInsert={insertAtCursor} />
                </div>
              </>
            )}

            {platform === 'pinterest' && (
              <>
                <div><label className="label text-xs">Изображение</label><MediaUpload media={media} limits={limits} onAdd={handleMediaChange} onRemove={removeMedia} /></div>
                <div><label className="label text-xs">Название</label><input className="input py-2 text-sm" value={title} onChange={(e) => setTitle(e.target.value.slice(0, limits.title))} placeholder="Название пина" /><span className="text-[10px] text-graphite-600 block text-right">{title.length}/{limits.title}</span></div>
                <div><label className="label text-xs">Описание</label><textarea className="input min-h-[80px] resize-none py-2 text-sm" value={body} onChange={(e) => setBody(e.target.value.slice(0, limits.body))} placeholder="Описание пина" /><span className="text-[10px] text-graphite-600 block text-right">{body.length}/{limits.body}</span></div>
                <div><label className="label text-xs">Ссылка</label><input className="input py-2 text-sm" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://..." /></div>
              </>
            )}

            {platform === 'youtube' && (
              <>
                <div><label className="label text-xs">Видео</label><MediaUpload media={media} limits={limits} onAdd={handleMediaChange} onRemove={removeMedia} /></div>
                <div><label className="label text-xs">Заголовок</label><input className="input py-2 text-sm" value={title} onChange={(e) => setTitle(e.target.value.slice(0, limits.title))} placeholder="Заголовок видео" /><span className="text-[10px] text-graphite-600 block text-right">{title.length}/{limits.title}</span></div>
                <div><label className="label text-xs">Описание</label><textarea className="input min-h-[100px] resize-none py-2 text-sm" value={body} onChange={(e) => setBody(e.target.value.slice(0, limits.body))} placeholder="Описание видео" /><span className="text-[10px] text-graphite-600 block text-right">{body.length}/{limits.body}</span></div>
              </>
            )}

            {platform === 'instagram' && (
              <>
                <div><label className="label text-xs">Медиа</label><MediaUpload media={media} limits={limits} onAdd={handleMediaChange} onRemove={removeMedia} /><p className="text-[10px] text-graphite-500 mt-1">{media.length === 0 ? 'Фото или видео' : `${media.length} файл(ов)`}</p></div>
                <div><label className="label text-xs">Подпись</label><textarea className="input min-h-[100px] resize-none py-2 text-sm" value={body} onChange={(e) => setBody(e.target.value.slice(0, limits.body))} placeholder="#Хэштеги поддерживаются" /><span className="text-[10px] text-graphite-600 block text-right">{body.length}/{limits.body}</span></div>
              </>
            )}

            {/* Schedule — compact */}
            <div className="max-w-[360px]">
              <label className="label text-xs">Расписание</label>
              <DateTimePicker date={scheduledDate} time={scheduledTime} onDateChange={setScheduledDate} onTimeChange={setScheduledTime} />
            </div>

            {/* Channels */}
            <div>
              <label className="label text-xs">Аккаунты ({filteredChannels.length})</label>
              {filteredChannels.length === 0 ? (
                <p className="text-xs text-graphite-400">Нет аккаунтов. <a href="/app/channels" className="text-lime hover:underline">Подключить</a></p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {filteredChannels.map((ch) => (
                    <button key={ch.id} type="button" onClick={() => toggleChannel(ch.id)}
                      className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs transition ${selectedChannels.includes(ch.id) ? 'border-lime/50 bg-lime/5 text-lime' : 'border-graphite-700/40 text-graphite-300 hover:border-graphite-600/60'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${selectedChannels.includes(ch.id) ? 'bg-lime' : 'bg-graphite-600'}`} />
                      {ch.title}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={saving} className="btn-primary text-sm px-6">{saving ? '...' : isEdit ? 'Сохранить' : 'Запланировать'}</button>
              <button type="button" onClick={() => navigate('/app/calendar')} className="btn-ghost text-sm">Отмена</button>
            </div>
          </form>
        </div>

        {/* Templates — desktop sidebar */}
        {platform === 'telegram' && (
          <div className="hidden lg:block fixed right-6 top-20 w-[200px]">
            <TemplatesPanel onInsert={insertAtCursor} />
          </div>
        )}
      </main>
    </div>
  );
}

/* ─── Media Upload ─── */
function MediaUpload({ media, limits, onAdd, onRemove }: {
  media: MediaItem[]; limits: { maxMedia: number; mediaTypes: string }; onAdd: (e: React.ChangeEvent<HTMLInputElement>) => void; onRemove: (i: number) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {media.map((m, i) => (
        <div key={m.kind === 'existing' ? m.id : `up-${i}`}
          className={`relative w-16 h-16 rounded-lg overflow-hidden border bg-graphite-900 ${m.kind === 'uploading' ? (m.status === 'error' ? 'border-red-500/50' : 'border-lime/30') : 'border-graphite-700/40'}`}>
          {m.mediaKind === 'video' ? (
            <div className="w-full h-full flex items-center justify-center text-sm text-graphite-400">▶</div>
          ) : (
            <img src={m.kind === 'existing' ? m.url : m.preview} alt="" className="w-full h-full object-cover" />
          )}
          {m.kind === 'uploading' && m.status === 'uploading' && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-graphite-600 border-t-lime" />
            </div>
          )}
          <button type="button" onClick={() => onRemove(i)} className="absolute top-0.5 right-0.5 h-3.5 w-3.5 rounded bg-red-500/80 text-white text-[9px] flex items-center justify-center hover:bg-red-500">✕</button>
        </div>
      ))}
      {media.length < limits.maxMedia && (
        <label className="w-16 h-16 rounded-lg border border-dashed border-graphite-700/40 flex items-center justify-center cursor-pointer hover:border-graphite-500 transition">
          <span className="text-graphite-500 text-lg">+</span>
          <input type="file" accept={limits.mediaTypes} multiple className="hidden" onChange={onAdd} />
        </label>
      )}
    </div>
  );
}

/* ─── Emoji Picker ─── */
const EMOJI_ROWS = [
  ['👍', '❤️', '🔥', '⭐', '✅', '❌', '🎉', '📢', '💬', '📊', '🔗', '💡', '🚀', '💰', '🎯', '📌'],
  ['😊', '😍', '🤔', '😎', '🥳', '😢', '😱', '🤩', '😂', '🤣', '😏', '🥺', '😴', '🤯', '😤', '😈'],
  ['👉', '💪', '🙏', '👏', '🤝', '👋', '✋', '🫶', '✊', '🍕', '🍔', '☕', '🎂', '🍩', '🍰', '🧁'],
  ['🌸', '🌙', '🌈', '☀️', '🌊', '❄️', '🐶', '🐱', '🦊', '🦋', '📱', '💻', '🎮', '🎵', '🎶', '🧲'],
  ['🔴', '🟢', '🔵', '🟡', '🟠', '🟣', '💯', '🔴', '🟧', '🟨', '🟩', '🟦', '⬛', '⬜', '🟤', '🟫'],
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
      <button type="button" onClick={() => setOpen(!open)} className="w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:text-white hover:bg-gray-800 transition text-sm">😊</button>
      {open && (
        <div className="absolute top-full left-0 mt-2 z-[100] bg-[#161b22] border border-gray-700 rounded-xl p-2 shadow-2xl shadow-black/50 w-56 max-h-[280px] overflow-y-auto">
          {EMOJI_ROWS.map((row, i) => (
            <div key={i} className="flex gap-0.5 mb-0.5">
              {row.map((e, j) => (
                <button key={`${i}-${j}`} type="button" onClick={() => { onEmoji(e); setOpen(false); }}
                  className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-800 text-sm transition">{e}</button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
