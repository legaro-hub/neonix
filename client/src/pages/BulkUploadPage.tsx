import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
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
    const wb = XLSX.utils.book_new();

    const headers = ['Заголовок', 'Текст поста', 'Дата (ГГГГ-ММ-ДД)', 'Время (ЧЧ:ММ)', 'Каналы (через запятую)'];
    const examples = [
      ['Анонс вебинара', 'Приглашаем на вебинар по SMM! 15 июня в 19:00.', '2026-06-20', '10:00', 'Мой канал, Новости'],
      ['Технические работы', 'Завтра с 2:00 до 5:00 будет профилактика.', '2026-06-21', '09:00', 'Важное'],
      ['', 'Просто текст без заголовка', '2026-06-22', '14:30', 'Мой канал'],
    ];

    const wsData = [
      headers,
      ...examples,
      [],
      ['# Подсказки:', '', '', '', ''],
      ['# - Дата в формате ГГГГ-ММ-ДД', '', '', '', ''],
      ['# - Время в формате ЧЧ:ММ (24-часовой)', '', '', '', ''],
      ['# - Каналы через запятую, точное название как в панели', '', '', '', ''],
      ['# - Заголовок необязателен (оставьте пустым)', '', '', '', ''],
      ['# - Текст поддерживает Markdown: *жирный*, _курсив_, `код`, [ссылка](url)', '', '', '', ''],
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    ws['!cols'] = [
      { wch: 30 },
      { wch: 60 },
      { wch: 18 },
      { wch: 12 },
      { wch: 35 },
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Посты');
    XLSX.writeFile(wb, 'neonix_posts_template.xlsx');
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
        if (!row || row.length < 4) continue;
        const title = String(row[0] || '').trim();
        const body = String(row[1] || '').trim();
        const date = String(row[2] || '').trim();
        const time = String(row[3] || '10:00').trim();
        const channels = String(row[4] || '').trim();
        if (body && date && !title.startsWith('#')) {
          parsed.push({ title, body, date, time, channels });
        }
      }
      setRows(parsed);
    };
    reader.readAsArrayBuffer(file);
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
                accept=".xlsx,.xls,.csv"
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
