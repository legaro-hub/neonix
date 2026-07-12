type Platform = 'telegram' | 'pinterest' | 'youtube' | 'instagram';

const PLATFORM_STYLES: Record<Platform, { color: string; bg: string; label: string }> = {
  telegram: { color: 'text-sky-400', bg: 'bg-sky-400/10', label: 'TG' },
  pinterest: { color: 'text-red-400', bg: 'bg-red-400/10', label: 'PI' },
  youtube: { color: 'text-red-500', bg: 'bg-red-500/10', label: 'YT' },
  instagram: { color: 'text-pink-400', bg: 'bg-pink-400/10', label: 'IG' },
};

export function PlatformBadge({ platform }: { platform: Platform }) {
  const style = PLATFORM_STYLES[platform] ?? { color: 'text-graphite-400', bg: 'bg-graphite-800', label: '??' };
  return (
    <span className={`text-[10px] font-bold ${style.color} ${style.bg} rounded px-1.5 py-0.5`}>
      {style.label}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { color: string; label: string }> = {
    active: { color: 'text-lime border-lime/30 bg-lime/10', label: 'Активен' },
    draft: { color: 'text-graphite-400 border-graphite-600 bg-graphite-800', label: 'Черновик' },
    queued: { color: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10', label: 'Ожидает' },
    in_progress: { color: 'text-blue-400 border-blue-400/30 bg-blue-400/10', label: 'Отправляется' },
    published: { color: 'text-lime border-lime/30 bg-lime/10', label: 'Опубликован' },
    failed: { color: 'text-red-400 border-red-400/30 bg-red-400/10', label: 'Ошибка' },
    connected: { color: 'text-lime border-lime/30 bg-lime/10', label: 'Подключён' },
    disconnected: { color: 'text-graphite-400 border-graphite-600 bg-graphite-800', label: 'Отключён' },
  };
  const s = map[status] ?? map.draft;
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${s.color}`}>
      {s.label}
    </span>
  );
}
