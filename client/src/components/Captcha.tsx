import { useState, useCallback } from 'react';

interface CaptchaProps {
  question: string;
  id: string;
  onAnswer: (answer: number) => void;
  onRefresh: () => void;
  error?: string;
}

const SHAPES = ['circle', 'square', 'triangle', 'hexagon', 'star'];
const COLORS = ['#d4ff3a', '#00e5ff', '#8b5cf6', '#f472b6', '#4ade80', '#fbbf24'];

function ShapeIcon({ shape, color, size = 24 }: { shape: string; color: string; size?: number }) {
  const s = size;
  switch (shape) {
    case 'circle':
      return <div className="rounded-full" style={{ width: s, height: s, background: color }} />;
    case 'square':
      return <div className="rounded-sm" style={{ width: s, height: s, background: color }} />;
    case 'triangle':
      return (
        <div style={{ width: 0, height: 0, borderLeft: `${s/2}px solid transparent`, borderRight: `${s/2}px solid transparent`, borderBottom: `${s}px solid ${color}` }} />
      );
    case 'hexagon':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24">
          <polygon points="12,2 22,8.5 22,15.5 12,22 2,15.5 2,8.5" fill={color} />
        </svg>
      );
    case 'star':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill={color}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      );
    default:
      return <div className="rounded-full" style={{ width: s, height: s, background: color }} />;
  }
}

function DragCaptcha({ question, onAnswer, onRefresh, error }: CaptchaProps) {
  const [solved, setSolved] = useState(false);
  const [sliderPos, setSliderPos] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useState<HTMLDivElement | null>(null);

  const handleDrag = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!trackRef[0] || solved) return;
    const rect = trackRef[0].getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const pos = Math.max(0, Math.min(clientX - rect.left, rect.width - 48));
    setSliderPos(pos);
  }, [solved, trackRef]);

  const handleEnd = useCallback(() => {
    setIsDragging(false);
    if (!trackRef[0]) return;
    const rect = trackRef[0].getBoundingClientRect();
    const percent = sliderPos / (rect.width - 48);
    if (percent > 0.85) {
      setSolved(true);
      onAnswer(1);
    }
  }, [sliderPos, onAnswer, trackRef]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex-1 rounded-xl border border-graphite-700/50 bg-graphite-850/50 p-3 text-center">
          <div className="text-xs text-graphite-400 mb-1">Перетащите вправо</div>
          <div className="font-display text-lg font-bold text-white">{question}</div>
        </div>
        <button type="button" onClick={onRefresh}
          className="shrink-0 w-10 h-10 rounded-xl border border-graphite-700/50 bg-graphite-850/50 flex items-center justify-center text-graphite-400 hover:text-lime hover:border-lime/30 transition-all">
          ↻
        </button>
      </div>

      <div ref={trackRef[0] as any}
        className="relative h-12 rounded-xl border border-graphite-700/30 bg-graphite-850/80 overflow-hidden cursor-pointer"
        onMouseMove={(e) => isDragging && handleDrag(e)}
        onMouseDown={(e) => { setIsDragging(true); handleDrag(e); }}
        onMouseUp={handleEnd}
        onMouseLeave={() => setIsDragging(false)}
        onTouchMove={handleDrag}
        onTouchEnd={handleEnd}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs text-graphite-500 select-none">
            {solved ? '✓ Проверено' : '← Перетащите →'}
          </span>
        </div>
        <div
          className={`absolute top-1 left-1 h-10 w-12 rounded-lg flex items-center justify-center text-sm font-bold select-none transition-colors ${
            solved ? 'bg-lime text-graphite-950' : 'bg-graphite-700 text-white hover:bg-graphite-600'
          } ${isDragging ? 'transition-none' : 'transition-all duration-200'}`}
          style={{ transform: `translateX(${sliderPos}px)` }}
          onTouchStart={() => setIsDragging(true)}
        >
          {solved ? '✓' : '→'}
        </div>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

function PuzzleCaptcha({ onAnswer, onRefresh }: { onAnswer: (n: number) => void; onRefresh: () => void }) {
  const [pieces] = useState(() => {
    return Array.from({ length: 9 }, (_, i) => ({
      id: i,
      shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rotation: Math.floor(Math.random() * 360),
    }));
  });
  const [selected, setSelected] = useState<number | null>(null);
  const target = pieces[4];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex-1 rounded-xl border border-graphite-700/50 bg-graphite-850/50 p-3 text-center">
          <div className="text-xs text-graphite-400 mb-1">Найдите одинаковую фигуру</div>
          <div className="flex items-center justify-center gap-1 mt-2">
            <span className="text-sm font-bold text-white">Какая фигура</span>
            <span className="mx-1 p-1 rounded-lg" style={{ background: `${target.color}20` }}>
              <ShapeIcon shape={target.shape} color={target.color} size={20} />
            </span>
            <span className="text-sm font-bold text-white">здесь одна?</span>
          </div>
        </div>
        <button type="button" onClick={onRefresh}
          className="shrink-0 w-10 h-10 rounded-xl border border-graphite-700/50 bg-graphite-850/50 flex items-center justify-center text-graphite-400 hover:text-lime hover:border-lime/30 transition-all">
          ↻
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {pieces.map((p, i) => {
          const isTarget = p.shape === target.shape && p.color === target.color && i !== 4;
          const isSelected = selected === i;
          return (
            <button key={i} type="button"
              onClick={() => {
                setSelected(i);
                if (isTarget) onAnswer(1);
              }}
              className={`aspect-square rounded-xl border flex items-center justify-center transition-all duration-200 ${
                isSelected
                  ? isTarget ? 'border-lime bg-lime/10 scale-95' : 'border-red-400 bg-red-400/10'
                  : 'border-graphite-700/50 bg-graphite-850/50 hover:border-graphite-600'
              }`}
            >
              <div style={{ transform: `rotate(${p.rotation}deg)` }}>
                <ShapeIcon shape={p.shape} color={p.color} size={28} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function CreativeCaptcha({ question, id, onAnswer, onRefresh, error }: CaptchaProps) {
  const type = (id?.charCodeAt(0) ?? 0) % 2 === 0 ? 'slider' : 'puzzle';

  if (type === 'slider') {
    return <DragCaptcha question={question} id={id} onAnswer={onAnswer} onRefresh={onRefresh} error={error} />;
  }

  return <PuzzleCaptcha onAnswer={onAnswer} onRefresh={onRefresh} />;
}
