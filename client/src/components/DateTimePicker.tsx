import { useState, useRef, useEffect } from 'react';

const QUICK_OPTIONS = [
  { label: 'Сейчас', offset: 0 },
  { label: '+1ч', offset: 60 },
  { label: '+2ч', offset: 120 },
  { label: '+3ч', offset: 180 },
  { label: 'Завтра 10:00', next: true, time: '10:00' },
  { label: 'Завтра 12:00', next: true, time: '12:00' },
  { label: 'Завтра 18:00', next: true, time: '18:00' },
  { label: 'Понедельник 10:00', weekday: 1, time: '10:00' },
];

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function toDateInput(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function toTimeInput(d: Date) {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const MONTHS = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];

interface Props {
  date: string;
  time: string;
  onDateChange: (date: string) => void;
  onTimeChange: (time: string) => void;
  disabled?: boolean;
}

export function DateTimePicker({ date, time, onDateChange, onTimeChange, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleQuick = (opt: typeof QUICK_OPTIONS[0]) => {
    const d = new Date();
    if (opt.offset) {
      d.setMinutes(d.getMinutes() + opt.offset);
    } else if (opt.next) {
      d.setDate(d.getDate() + 1);
      const [h, m] = (opt.time ?? '10:00').split(':').map(Number);
      d.setHours(h, m, 0, 0);
    } else if (opt.weekday !== undefined) {
      const diff = ((opt.weekday - d.getDay() + 7) % 7) || 7;
      d.setDate(d.getDate() + diff);
      const [h, m] = (opt.time ?? '10:00').split(':').map(Number);
      d.setHours(h, m, 0, 0);
    }
    onDateChange(toDateInput(d));
    onTimeChange(toTimeInput(d));
    setOpen(false);
  };

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  let firstDay = getFirstDayOfMonth(viewYear, viewMonth);
  firstDay = firstDay === 0 ? 6 : firstDay - 1;

  const today = toDateInput(now);

  const displayValue = date
    ? `${new Date(date + 'T' + time).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })} ${time}`
    : 'Выбрать дату и время';

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
        className={`w-full flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${
          disabled ? 'opacity-40 cursor-not-allowed border-graphite-700 bg-graphite-900' :
          date ? 'border-lime/30 bg-lime/5 hover:border-lime/50' : 'border-graphite-700 bg-graphite-900 hover:border-graphite-600'
        }`}
      >
        <span className="text-lg">{date ? '📅' : '🕐'}</span>
        <div className="flex-1 min-w-0">
          <div className={`text-sm font-semibold ${date ? 'text-lime' : 'text-graphite-300'}`}>
            {displayValue}
          </div>
          {date && (
            <div className="text-[10px] text-graphite-500 mt-0.5">
              {new Date(date + 'T' + time) < now ? 'Прошлое время' : `Через ${formatRelative(date, time)}`}
            </div>
          )}
        </div>
        {!disabled && (
          <svg className="w-4 h-4 text-graphite-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        )}
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-2 z-50 w-80 bg-graphite-900 border border-graphite-700 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden">
          {/* Quick presets */}
          <div className="p-3 border-b border-graphite-800">
            <div className="text-[10px] uppercase tracking-wider text-graphite-500 mb-2 font-semibold">Быстро</div>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_OPTIONS.map((opt) => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => handleQuick(opt)}
                  className="rounded-lg bg-graphite-800 border border-graphite-700 px-2.5 py-1.5 text-xs text-graphite-300 hover:border-lime/40 hover:text-lime hover:bg-lime/5 transition"
                >
                  {opt.label}
                </button>
              ))}
              {date && (
                <button
                  type="button"
                  onClick={() => { onDateChange(''); onTimeChange('10:00'); setOpen(false); }}
                  className="rounded-lg bg-graphite-800 border border-graphite-700 px-2.5 py-1.5 text-xs text-red-400 hover:border-red-500/40 hover:bg-red-500/5 transition"
                >
                  Очистить
                </button>
              )}
            </div>
          </div>

          {/* Calendar */}
          <div className="p-3">
            <div className="flex items-center justify-between mb-3">
              <button type="button" onClick={() => { setViewMonth(viewMonth - 1); if (viewMonth === 0) { setViewYear(viewYear - 1); setViewMonth(11); } }} className="text-graphite-400 hover:text-white p-1">‹</button>
              <span className="text-sm font-bold text-white">{MONTHS[viewMonth]} {viewYear}</span>
              <button type="button" onClick={() => { setViewMonth(viewMonth + 1); if (viewMonth === 11) { setViewYear(viewYear + 1); setViewMonth(0); } }} className="text-graphite-400 hover:text-white p-1">›</button>
            </div>
            <div className="grid grid-cols-7 gap-0.5">
              {WEEKDAYS.map((d) => (
                <div key={d} className="text-center text-[10px] font-semibold text-graphite-500 py-1">{d}</div>
              ))}
              {Array.from({ length: firstDay }, (_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const dayNum = i + 1;
                const dateStr = `${viewYear}-${pad(viewMonth + 1)}-${pad(dayNum)}`;
                const isSelected = date === dateStr;
                const isToday = dateStr === today;
                return (
                  <button
                    key={dayNum}
                    type="button"
                    onClick={() => {
                      onDateChange(dateStr);
                      if (!time || time === '10:00') onTimeChange('10:00');
                    }}
                    className={`h-8 rounded-lg text-xs font-medium transition ${
                      isSelected
                        ? 'bg-lime text-graphite-950 font-bold'
                        : isToday
                        ? 'bg-lime/15 text-lime font-semibold'
                        : 'text-graphite-300 hover:bg-graphite-800 hover:text-white'
                    }`}
                  >
                    {dayNum}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time picker */}
          <div className="p-3 border-t border-graphite-800">
            <div className="text-[10px] uppercase tracking-wider text-graphite-500 mb-2 font-semibold">Время</div>
            <div className="flex items-center gap-2">
              <input
                type="time"
                value={time}
                onChange={(e) => onTimeChange(e.target.value)}
                className="flex-1 bg-graphite-800 border border-graphite-700 rounded-xl px-3 py-2 text-sm text-white focus:border-lime focus:outline-none"
              />
              <div className="flex gap-1">
                {['09:00', '12:00', '15:00', '18:00', '21:00'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => onTimeChange(t)}
                    className={`rounded-lg px-2 py-1.5 text-[10px] font-medium transition ${
                      time === t ? 'bg-lime text-graphite-950' : 'bg-graphite-800 text-graphite-400 hover:text-white'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Close */}
          <div className="p-3 border-t border-graphite-800 flex justify-end">
            <button type="button" onClick={() => setOpen(false)} className="rounded-xl bg-lime px-5 py-2 text-sm font-bold text-graphite-950 hover:bg-lime/90 transition">
              Готово
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function formatRelative(dateStr: string, timeStr: string): string {
  const target = new Date(`${dateStr}T${timeStr}`);
  const diff = target.getTime() - Date.now();
  if (diff < 0) return '';
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} мин`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} ч ${mins % 60 > 0 ? `${mins % 60} мин` : ''}`;
  const days = Math.floor(hours / 24);
  return `${days} дн ${hours % 24 > 0 ? `${hours % 24} ч` : ''}`;
}
