import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { Sidebar } from '../components/Sidebar';
import { api, HttpError } from '../lib/api';
import type { SocialAccount } from '../lib/types';

type Platform = 'telegram' | 'pinterest' | 'youtube' | 'instagram';

const PLATFORMS: Array<{ key: Platform; label: string; color: string; icon: string }> = [
  { key: 'telegram', label: 'Telegram', color: 'text-sky-400', icon: '✈' },
  { key: 'pinterest', label: 'Pinterest', color: 'text-red-400', icon: '📌' },
  { key: 'youtube', label: 'YouTube', color: 'text-red-500', icon: '▶' },
  { key: 'instagram', label: 'Instagram', color: 'text-pink-400', icon: '📷' },
];

interface BulkRow {
  title: string;
  body: string;
  date: string;
  time: string;
  channels: string;
  link?: string;
  error?: string;
  success?: boolean;
}

export function BulkUploadPage() {
  const navigate = useNavigate();
  const [platform, setPlatform] = useState<Platform>('telegram');
  const [channels, setChannels] = useState<SocialAccount[]>([]);
  const [rows, setRows] = useState<BulkRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Array<{ success?: boolean; postId?: string; error?: string }>>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.getChannels().then(setChannels).catch(() => {});
  }, []);

  const addRow = () => setRows((prev) => [...prev, { title: '', body: '', date: '', time: '10:00', channels: '' }]);
  const updateRow = (i: number, field: keyof BulkRow, value: string) => setRows((prev) => prev.map((r, idx) => idx === i ? { ...r, [field]: value } : r));
  const removeRow = (i: number) => setRows((prev) => prev.filter((_, idx) => idx !== i));

  const downloadTemplate = () => {
    const wb = XLSX.utils.book_new();
    const headers = platform === 'pinterest'
      ? ['Название', 'Описание', 'Ссылка', 'Дата', 'Время', 'Доска']
      : platform === 'youtube'
      ? ['Заголовок', 'Описание', 'Дата', 'Время', 'Канал']
      : ['Заголовок', 'Текст поста', 'Дата', 'Время', 'Каналы'];

    const ws = XLSX.utils.aoa_to_sheet([headers]);
    ws['!cols'] = headers.map(() => ({ wch: 30 }));
    XLSX.utils.book_append_sheet(wb, ws, 'Посты');
    XLSX.writeFile(wb, `neonix_${platform}_template.xlsx`);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const data = new Uint8Array(reader.result as ArrayBuffer);
      const wb = XLSX.read(data, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1 });
      if (rows.length < 2) return;
      const parsed: BulkRow[] = [];
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length < 3) continue;
        const title = String(row[0] || '').trim();
        const body = String(row[1] || '').trim();
        const date = String(row[2] || '').trim();
        const time = String(row[3] || '10:00').trim();
        const channels = String(row[4] || '').trim();
        const link = String(row[5] || '').trim();
        if (body && date && !title.startsWith('#')) {
          parsed.push({ title, body, date, time, channels, link });
        }
      }
      setRows(parsed);
    };
    reader.readAsArrayBuffer(file);
  };

  const submitAll = async () => {
    setLoading(true);
    setResults([]);
    const posts = rows.filter((r) => r.body.trim() && r.date).map((r) => ({
      title: r.title || undefined,
      body: r.body,
      scheduledAt: `${r.date}T${r.time || '10:00'}:00`,
      channelTitles: r.channels.split(',').map((c) => c.trim()).filter(Boolean),
    }));
    if (posts.length === 0) { setResults([{ error: 'Нет постов для загрузки' }]); setLoading(false); return; }
    try {
      const res = await api.createBulkPosts(posts);
      setResults(res);
      setRows((prev) => prev.map((r, i) => ({ ...r, success: res[i]?.success, error: res[i]?.error })));
    } catch (err) { setResults([{ error: err instanceof HttpError ? err.message : 'Ошибка' }]); }
    finally { setLoading(false); }
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-6 pb-20 lg:pb-10 lg:p-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">Массовая загрузка</h1>
          <button onClick={() => navigate('/app/calendar')} className="text-sm text-graphite-400 hover:text-white transition">← Календарь</button>
        </div>

        {/* Platform selector */}
        <div className="flex gap-2 mb-6">
          {PLATFORMS.map((p) => (
            <button key={p.key} onClick={() => { setPlatform(p.key); setRows([]); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition border ${platform === p.key ? `${p.color} border-current bg-current/5` : 'border-graphite-700/40 text-graphite-400 hover:text-graphite-200'}`}>
              <span>{p.icon}</span> {p.label}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <button onClick={downloadTemplate} className="btn-ghost text-sm">📥 Шаблон</button>
          <label className="btn-ghost text-sm cursor-pointer">
            📤 Загрузить файл
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFileUpload} />
          </label>
          <button onClick={addRow} className="btn-ghost text-sm">+ Строка</button>
          <div className="flex-1" />
          <button onClick={submitAll} disabled={loading || rows.length === 0} className="btn-primary text-sm">
            {loading ? 'Отправка...' : `Запланировать (${rows.filter((r) => r.body && r.date).length})`}
          </button>
        </div>

        {/* Channels list */}
        {channels.filter((c) => c.platform === platform).length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-1.5">
              {channels.filter((c) => c.platform === platform).map((ch) => (
                <span key={ch.id} className="text-[11px] text-graphite-500 bg-graphite-800/50 rounded px-2 py-0.5">{ch.title}</span>
              ))}
            </div>
          </div>
        )}

        {/* Rows */}
        {rows.length > 0 ? (
          <div className="space-y-1.5">
            {rows.map((row, i) => (
              <div key={i} className={`card p-3 ${row.success ? 'border-lime/40' : row.error ? 'border-red-500/30' : ''}`}>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-graphite-600 w-5 text-right shrink-0">{i + 1}</span>
                  <input className="input text-xs py-2 flex-1" placeholder={platform === 'youtube' ? 'Заголовок видео' : 'Заголовок'} value={row.title} onChange={(e) => updateRow(i, 'title', e.target.value)} />
                  <input className="input text-xs py-2 flex-[2]" placeholder={platform === 'pinterest' ? 'Описание пина' : 'Текст'} value={row.body} onChange={(e) => updateRow(i, 'body', e.target.value)} />
                  <input type="date" className="input text-xs py-2 w-28" value={row.date} onChange={(e) => updateRow(i, 'date', e.target.value)} />
                  <input type="time" className="input text-xs py-2 w-20" value={row.time} onChange={(e) => updateRow(i, 'time', e.target.value)} />
                  <input className="input text-xs py-2 w-32" placeholder="Каналы" value={row.channels} onChange={(e) => updateRow(i, 'channels', e.target.value)} />
                  <button onClick={() => removeRow(i)} className="text-graphite-600 hover:text-red-400 text-xs shrink-0 p-1">✕</button>
                </div>
                {row.error && <div className="mt-1 text-[11px] text-red-400 ml-7">{row.error}</div>}
                {row.success && <div className="mt-1 text-[11px] text-lime ml-7">✓ Создан</div>}
              </div>
            ))}
          </div>
        ) : (
          <div className="card p-10 text-center">
            <div className="text-3xl mb-3">📥</div>
            <h2 className="text-lg font-semibold text-white mb-2">Загрузите посты</h2>
            <p className="text-sm text-graphite-400 mb-4">Скачайте шаблон для {PLATFORMS.find((p) => p.key === platform)?.label}, заполните и загрузите</p>
            <div className="flex justify-center gap-2">
              <button onClick={downloadTemplate} className="btn-primary text-sm">📥 Шаблон</button>
              <button onClick={addRow} className="btn-ghost text-sm">+ Строка</button>
            </div>
          </div>
        )}

        {/* Results summary */}
        {results.length > 0 && (
          <div className="mt-4 card p-3">
            <div className="text-xs text-graphite-400">
              Успешно: <span className="text-lime">{results.filter((r) => r.success).length}</span>
              {' · '}Ошибки: <span className="text-red-400">{results.filter((r) => r.error).length}</span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
