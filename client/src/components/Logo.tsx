import { Link } from 'react-router-dom';

export function Logo({ className = '', size = 'md' }: { className?: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: { icon: 'h-8 w-8', svg: 'h-4 w-4', text: 'text-lg' },
    md: { icon: 'h-10 w-10', svg: 'h-5 w-5', text: 'text-[22px]' },
    lg: { icon: 'h-14 w-14', svg: 'h-7 w-7', text: 'text-3xl' },
  };
  const s = sizes[size];

  return (
    <Link to="/" className={`group inline-flex items-center gap-3 ${className}`}>
      <div className={`relative grid ${s.icon} place-items-center rounded-2xl overflow-hidden`}>
        {/* Animated gradient bg */}
        <div className="absolute inset-0 bg-gradient-to-br from-graphite-800 to-graphite-900 ring-1 ring-graphite-700/50 group-hover:ring-lime/40 group-hover:shadow-neon transition-all duration-500 rounded-2xl" />
        <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
             style={{ background: 'radial-gradient(circle at center, rgba(212,255,58,0.2) 0%, transparent 70%)' }} />

        {/* Orbiting dot */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="w-1.5 h-1.5 rounded-full bg-lime animate-orbit" style={{ animationDuration: '3s' }} />
          </div>
        </div>

        <svg viewBox="0 0 32 32" className={`relative ${s.svg} transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3`}>
          <defs>
            <linearGradient id="nGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#d4ff3a" />
              <stop offset="50%" stopColor="#00e5ff" />
              <stop offset="100%" stopColor="#d4ff3a" />
            </linearGradient>
          </defs>
          <path d="M8 24V8h2.5l7 11V8h2.5v16h-2.5l-7-11v11z" fill="url(#nGrad)" />
        </svg>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-baseline gap-0.5">
          <span className={`font-display ${s.text} font-black tracking-[-0.03em] text-white transition-colors duration-300 group-hover:text-graphite-50`}>
            neon
          </span>
          <span className={`font-display ${s.text} font-black tracking-[-0.03em] neon-glow-strong transition-all duration-300`}
                style={{ color: '#d4ff3a' }}>
            ix
          </span>
        </div>
        <span className="text-[9px] font-bold tracking-[0.2em] text-graphite-600 uppercase select-none border border-graphite-700/50 rounded-full px-2 py-0.5">
          2.0
        </span>
      </div>
    </Link>
  );
}
