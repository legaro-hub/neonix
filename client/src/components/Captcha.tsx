import { useState } from 'react';

interface CaptchaProps {
  question: string;
  id: string;
  onAnswer: (answer: number) => void;
  onRefresh: () => void;
  error?: string;
}

function parseMath(q: string): number | null {
  const m = q.match(/(\d+)\s*([+\-×*÷/])\s*(\d+)/);
  if (!m) return null;
  const a = parseInt(m[1]), b = parseInt(m[3]);
  switch (m[2]) {
    case '+': return a + b;
    case '-': return a - b;
    case '×': case '*': return a * b;
    case '÷': case '/': return b !== 0 ? a / b : null;
    default: return null;
  }
}

export function CreativeCaptcha({ question, onAnswer, onRefresh, error }: CaptchaProps) {
  const [value, setValue] = useState('');
  const [solved, setSolved] = useState(false);
  const [wrong, setWrong] = useState(false);

  const expected = parseMath(question);

  const handleSubmit = () => {
    if (!value.trim() || solved) return;
    const num = parseFloat(value);
    if (expected !== null && num === expected) {
      setSolved(true);
      setWrong(false);
      onAnswer(expected);
    } else {
      setWrong(true);
      setTimeout(() => setWrong(false), 1500);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex-1 rounded-xl border border-graphite-700/50 bg-graphite-850/50 p-4 text-center">
          <div className="text-xs text-graphite-400 mb-2">Решите пример</div>
          <div className="font-mono text-2xl font-bold text-lime tracking-wider">{question}</div>
        </div>
        <button type="button" onClick={() => { setValue(''); setSolved(false); setWrong(false); onRefresh(); }}
          className="shrink-0 w-12 h-12 rounded-xl border border-graphite-700/50 bg-graphite-850/50 flex items-center justify-center text-graphite-400 hover:text-lime hover:border-lime/30 transition-all text-lg">
          ↻
        </button>
      </div>

      <div className="flex gap-2">
        <input
          type="number"
          value={value}
          onChange={(e) => { setValue(e.target.value); setWrong(false); }}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder="Ответ"
          disabled={solved}
          className={`flex-1 rounded-xl border px-4 py-3 text-center font-mono text-lg font-bold bg-graphite-900/60 text-white placeholder:text-graphite-600 transition-all ${
            solved ? 'border-lime/50 bg-lime/5' : wrong ? 'border-red-400/60 bg-red-400/5 animate-shake' : 'border-graphite-700/40 focus:border-lime/40 focus:ring-2 focus:ring-lime/10'
          }`}
        />
        <button type="button" onClick={handleSubmit} disabled={solved || !value.trim()}
          className={`px-6 rounded-xl font-bold text-sm transition-all ${
            solved ? 'bg-lime/20 text-lime border border-lime/30' : 'bg-lime text-graphite-950 hover:bg-lime-400 active:scale-95'
          }`}>
          {solved ? '✓' : 'ОК'}
        </button>
      </div>

      {solved && <p className="text-xs text-lime text-center">✓ Проверка пройдена</p>}
      {wrong && <p className="text-xs text-red-400 text-center">Неверный ответ, попробуйте ещё раз</p>}
      {error && <p className="text-xs text-red-400 text-center">{error}</p>}
    </div>
  );
}
