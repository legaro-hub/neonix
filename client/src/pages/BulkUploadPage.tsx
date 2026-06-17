import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { api, HttpError } from '../lib/api';
import type { SocialAccount } from '../lib/types';

interface BulkRow {
  title: string;
  body: string;
  date: string;
  time: string;
  channels: string;
  error?: string;
  success?: boolean;
}

export function BulkUploadPage() {
  const navigate = useNavigate();
  const [channels, setChannels] = useState<SocialAccount[]>([]);
  const [rows, setRows] = useState<BulkRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [, setResults] = useState<Array<{ success?: boolean; postId?: string; error?: string }>>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.getChannels().then(setChannels).catch(() => {});
  }, []);

  const addRow = () => {
    setRows((prev) => [...prev, { title: '', body: '', date: '', time: '10:00', channels: '' }]);
  };

  const updateRow = (index: number, field: keyof BulkRow, value: string) => {
    setRows((prev) => prev.map((r, i) => i === index ? { ...r, [field]: value } : r));
  };

  const removeRow = (index: number) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  const downloadTemplate = () => {
    const header = 'Заголовок\tТекст поста\tДата (ГГГГ-ММ-ДД)\tВремя (ЧЧ:ММ)\tКаналы (через запятую)';
    const example1 = 'Анонс вебинара\tПриглашаем на вебинар по SMM! 15 июня в 19:00.\t2026-06-20\t10:00\tМой канал, Новости';
    const example2 = 'Технические работы\tЗавтра с 2:00 до 5:00 будет профилактика.\t2026-06-21\t09:00\tВажное';
    const example3 = '\tПросто текст без заголовка\t2026-06-22\t14:30\tМой канал';
    const hint = '# Подсказки:\n# - Дата в формате ГГГГ-ММ-ДД\n# - Время в формате ЧЧ:ММ (24-часовой)\n# - Каналы через запятую, точное название как в панели\n# - Заголовок необязателен (оставьте пустым)\n# - Текст поддерживает Markdown: *жирный*, _курсив_, `код`, [ссылка](url)';

    const content = `${header}\n${example1}\n${example2}\n${example3}\n\n${hint}`;
    const blob = new Blob(['\uFEFF' + content], { type: 'text/tab-separated-values;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'neonix_posts_template.tsv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      const lines = text.split('\n').filter((l) => l.trim() && !l.startsWith('#'));
      if (lines.length < 2) return;

      const parsed: BulkRow[] = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split('\t');
        if (cols.length >= 4) {
          parsed.push({
            title: cols[0]?.trim() || '',
            body: cols[1]?.trim() || '',
            date: cols[2]?.trim() || '',
            time: cols[3]?.trim() || '10:00',
            channels: cols[4]?.trim() || '',
          });
        }
      }
      setRows(parsed);
    };
    reader.readAsText(file, 'utf-8');
  };

  const submitAll = async () => {
    setLoading(true);
    setResults([]);

    const posts = rows
      .filter((r) => r.body.trim() && r.date)
      .map((r) => ({
        title: r.title || undefined,
        body: r.body,
        scheduledAt: `${r.date}T${r.time || '10:00'}:00`,
        channelTitles: r.channels.split(',').map((c) => c.trim()).filter(Boolean),
      }));

    if (posts.length === 0) {
      setResults([{ error: 'Нет постов для загрузки' }]);
      setLoading(false);
      return;
    }

    try {
      const res = await api.createBulkPosts(posts);
      setResults(res);
      setRows((prev) => prev.map((r, i) => ({
        ...r,
        success: res[i]?.success,
        error: res[i]?.error,
      })));
    } catch (err) {
      setResults([{ error: err instanceof HttpError ? err.message : 'Ошибка загрузки' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-2xl font-bold text-white">Массовая загрузка постов</h1>
          <button onClick={() => navigate('/app/calendar')} className="btn-ghost text-sm">
            ← Календарь
          </button>
        </div>

        <div className="card p-6 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            <button onClick={downloadTemplate} className="btn-ghost text-sm">
              📥 Скачать шаблон
            </button>
            <label className="btn-ghost text-sm cursor-pointer">
              📤 Загрузить файл
              <input
                ref={fileRef}
                type="file"
                accept=".tsv,.csv,.txt"
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>
            <button onClick={addRow} className="btn-ghost text-sm">
              + Добавить строку
            </button>
            <div className="flex-1" />
            <button
              onClick={submitAll}
              disabled={loading || rows.length === 0}
              className="btn-primary text-sm"
            >
              {loading ? 'Загрузка...' : `Запланировать (${rows.filter((r) => r.body && r.date).length})`}
            </button>
          </div>
        </div>

        {channels.length > 0 && (
          <div className="card p-4 mb-4">
            <div className="text-xs text-graphite-400 mb-2">Доступные каналы:</div>
            <div className="flex flex-wrap gap-2">
              {channels.map((ch) => (
                <span key={ch.id} className="chip text-[10px]">{ch.title}</span>
              ))}
            </div>
          </div>
        )}

        {rows.length > 0 && (
          <div className="space-y-2">
            {rows.map((row, i) => (
              <div key={i} className={`card p-4 ${row.success ? 'border-lime/40' : row.error ? 'border-red-500/40' : ''}`}>
                <div className="flex items-start gap-3">
                  <span className="text-xs text-graphite-500 mt-3 shrink-0 w-6 text-right">{i + 1}</span>
                  <div className="flex-1 grid gap-2 sm:grid-cols-[1fr_2fr_120px_80px_1fr]">
                    <input
                      className="input text-sm"
                      placeholder="Заголовок"
                      value={row.title}
                      onChange={(e) => updateRow(i, 'title', e.target.value)}
                    />
                    <input
                      className="input text-sm"
                      placeholder="Текст поста"
                      value={row.body}
                      onChange={(e) => updateRow(i, 'body', e.target.value)}
                    />
                    <input
                      type="date"
                      className="input text-sm"
                      value={row.date}
                      onChange={(e) => updateRow(i, 'date', e.target.value)}
                    />
                    <input
                      type="time"
                      className="input text-sm"
                      value={row.time}
                      onChange={(e) => updateRow(i, 'time', e.target.value)}
                    />
                    <input
                      className="input text-sm"
                      placeholder="Каналы через запятую"
                      value={row.channels}
                      onChange={(e) => updateRow(i, 'channels', e.target.value)}
                    />
                  </div>
                  <button onClick={() => removeRow(i)} className="text-graphite-500 hover:text-red-400 mt-2 shrink-0">✕</button>
                </div>
                {row.error && <div className="mt-2 text-xs text-red-400">{row.error}</div>}
                {row.success && <div className="mt-2 text-xs text-lime">✓ Пост создан</div>}
              </div>
            ))}
          </div>
        )}

        {rows.length === 0 && (
          <div className="card p-12 text-center">
            <div className="text-4xl mb-4">📥</div>
            <h2 className="font-display text-xl font-bold text-white">Загрузите посты из файла</h2>
            <p className="mt-2 text-sm text-graphite-300 max-w-md mx-auto">
              Скачайте шаблон, заполните его и загрузите обратно. Или добавляйте посты по одному через кнопку.
            </p>
            <div className="flex justify-center gap-3 mt-6">
              <button onClick={downloadTemplate} className="btn-primary text-sm">📥 Скачать шаблон</button>
              <button onClick={addRow} className="btn-ghost text-sm">+ Добавить строку</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
