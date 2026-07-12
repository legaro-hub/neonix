import { useState, useRef, useCallback } from 'react';

interface CaptchaProps {
  question: string;
  id: string;
  onAnswer: (answer: number) => void;
  onRefresh: () => void;
  error?: string;
}

function MathCaptcha({ question, onAnswer, onRefresh, error }: CaptchaProps) {
  const [solved, setSolved] = useState(false);
  const [pos, setPos] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const onMove = useCallback((clientX: number) => {
    const el = trackRef.current;
    if (!el || solved) return;
    const rect = el.getBoundingClientRect();
    const maxW = rect.width - 48;
    const x = Math.max(0, Math.min(clientX - rect.left, maxW));
    setPos(x);
  }, [solved]);

  const onEnd = useCallback(() => {
    dragging.current = false;
    const el = trackRef.current;
    if (!el) return;
    const maxW = el.getBoundingClientRect().width - 48;
    if (pos / maxW > 0.8) {
      setSolved(true);
      onAnswer(1);
    }
  }, [pos, onAnswer]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex-1 rounded-xl border border-graphite-700/50 bg-graphite-850/50 p-3 text-center">
          <div className="text-xs text-graphite-400 mb-1">Решите пример</div>
          <div className="font-mono text-xl font-bold text-lime">{question}</div>
        </div>
        <button type="button" onClick={onRefresh}
          className="shrink-0 w-10 h-10 rounded-xl border border-graphite-700/50 bg-graphite-850/50 flex items-center justify-center text-graphite-400 hover:text-lime hover:border-lime/30 transition-all">
          ↻
        </button>
      </div>
      <div ref={trackRef}
        className="relative h-12 rounded-xl border border-graphite-700/30 bg-graphite-850/80 overflow-hidden cursor-pointer select-none"
        onMouseMove={(e) => dragging.current && onMove(e.clientX)}
        onMouseDown={(e) => { dragging.current = true; onMove(e.clientX); }}
        onMouseUp={onEnd}
        onMouseLeave={() => { dragging.current = false; }}
        onTouchMove={(e) => onMove(e.touches[0].clientX)}
        onTouchEnd={onEnd}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs text-graphite-500">{solved ? '✓ Готово' : 'Перетащите вправо →'}</span>
        </div>
        <div className={`absolute top-1 left-1 h-10 w-12 rounded-lg flex items-center justify-center text-sm font-bold transition-colors ${solved ? 'bg-lime text-graphite-950' : 'bg-graphite-600 text-white'}`}
          style={{ transform: `translateX(${pos}px)`, transition: dragging.current ? 'none' : 'transform 0.15s ease-out' }}>
          {solved ? '✓' : '→'}
        </div>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

function ShapeIcon({ shape, color, size = 24 }: { shape: string; color: string; size?: number }) {
  if (shape === 'circle') return <div className="rounded-full" style={{ width: size, height: size, background: color }} />;
  if (shape === 'square') return <div className="rounded-sm" style={{ width: size, height: size, background: color }} />;
  if (shape === 'triangle') return <div style={{ width: 0, height: 0, borderLeft: `${size/2}px solid transparent`, borderRight: `${size/2}px solid transparent`, borderBottom: `${size}px solid ${color}` }} />;
  if (shape === 'star') return <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>;
  return <svg width={size} height={size} viewBox="0 0 24 24"><polygon points="12,2 22,8.5 22,15.5 12,22 2,15.5 2,8.5" fill={color} /></svg>;
}

const SHAPES = ['circle', 'square', 'triangle', 'hexagon', 'star'];
const COLORS = ['#d4ff3a', '#00e5ff', '#8b5cf6', '#f472b6', '#4ade80', '#fbbf24'];

function ShapeCaptcha({ onAnswer, onRefresh }: { onAnswer: (n: number) => void; onRefresh: () => void }) {
  const [pieces] = useState(() => Array.from({ length: 9 }, () => ({
    shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    rot: Math.floor(Math.random() * 360),
  })));
  const [sel, setSel] = useState<number | null>(null);
  const target = pieces[4];
  const [solved, setSolved] = useState(false);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex-1 rounded-xl border border-graphite-700/50 bg-graphite-850/50 p-3 text-center">
          <div className="text-xs text-graphite-400 mb-1">Найдите одинаковую фигуру</div>
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="text-sm font-bold text-white">Какая</span>
            <span className="p-1 rounded-lg" style={{ background: `${target.color}20` }}>
              <ShapeIcon shape={target.shape} color={target.color} size={20} />
            </span>
            <span className="text-sm font-bold text-white">ещё здесь?</span>
          </div>
        </div>
        <button type="button" onClick={onRefresh}
          className="shrink-0 w-10 h-10 rounded-xl border border-graphite-700/50 bg-graphite-850/50 flex items-center justify-center text-graphite-400 hover:text-lime hover:border-lime/30 transition-all">
          ↻
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {pieces.map((p, idx) => {
          const match = !solved && p.shape === target.shape && p.color === target.color && idx !== 4;
          const wrong = sel === idx && !match;
          return (
            <button key={idx} type="button" disabled={solved}
              onClick={() => { setSel(idx); if (match) { setSolved(true); onAnswer(1); } }}
              className={`aspect-square rounded-xl border-2 flex items-center justify-center transition-all duration-200 ${
                solved && match ? 'border-lime bg-lime/10 scale-95' :
                wrong ? 'border-red-400 bg-red-400/10' :
                'border-graphite-700/50 bg-graphite-850/50 hover:border-graphite-500 active:scale-95'
              }`}>
              <div style={{ transform: `rotate(${p.rot}deg)` }}>
                <ShapeIcon shape={p.shape} color={p.color} size={28} />
              </div>
            </button>
          );
        })}
      </div>
      {solved && <div className="text-center text-sm text-lime font-medium animate-fade-in">✓ Верно!</div>}
    </div>
  );
}

export function CreativeCaptcha({ question, id, onAnswer, onRefresh, error }: CaptchaProps) {
  const type = (id?.charCodeAt(0) ?? 0) % 2 === 0 ? 'math' : 'shape';
  if (type === 'math') return <MathCaptcha question={question} id={id} onAnswer={onAnswer} onRefresh={onRefresh} error={error} />;
  return <ShapeCaptcha onAnswer={onAnswer} onRefresh={onRefresh} />;
}
