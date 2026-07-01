import { Link } from 'react-router-dom';

export function Logo({ className = '' }: { className?: string }) {
  return (
    <Link to="/" className={`group inline-flex items-center gap-3 ${className}`}>
      {/* Premium monogram icon */}
      <div className="relative grid h-10 w-10 place-items-center rounded-2xl overflow-hidden transition-all duration-300 group-hover:shadow-lg group-hover:shadow-lime/10">
        <div className="absolute inset-0 bg-gradient-to-br from-graphite-800 to-graphite-900 ring-1 ring-graphite-700/50 group-hover:ring-lime/30 transition-all duration-300 rounded-2xl" />
        <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
             style={{ background: 'radial-gradient(circle at center, rgba(212,255,58,0.15) 0%, transparent 70%)' }} />
        <svg viewBox="0 0 32 32" className="relative h-5 w-5 transition-transform duration-300 group-hover:scale-110">
          <defs>
            <linearGradient id="nGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#d4ff3a" />
              <stop offset="100%" stopColor="#94b81f" />
            </linearGradient>
          </defs>
          <path d="M8 24V8h2.5l7 11V8h2.5v16h-2.5l-7-11v11z" fill="url(#nGrad)" />
        </svg>
      </div>

      {/* Wordmark */}
      <div className="flex items-center gap-2">
        <div className="flex items-baseline gap-0.5">
          <span className="font-display text-[22px] font-black tracking-[-0.03em] text-white transition-colors duration-300 group-hover:text-graphite-50">
            neon
          </span>
          <span className="font-display text-[22px] font-black tracking-[-0.03em] neon-glow-strong transition-all duration-300"
                style={{ color: '#d4ff3a' }}>
            ix
          </span>
        </div>
        <span className="text-[10px] font-extralight tracking-widest text-graphite-500 uppercase select-none">
          beta
        </span>
      </div>
    </Link>
  );
}
