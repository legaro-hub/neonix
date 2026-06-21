import { Link } from 'react-router-dom';

export function Logo({ className = '' }: { className?: string }) {
  return (
    <Link to="/" className={`group inline-flex items-center gap-2 ${className}`}>
      <span className="relative grid h-9 w-9 place-items-center rounded-xl bg-graphite-900 ring-1 ring-graphite-700 group-hover:ring-lime/40 transition scanline">
        <svg viewBox="0 0 64 64" className="h-5 w-5 glitch-skew">
          <path d="M20 16h6v22l14-22h7l-16 24 16 8h-8L20 36v12h-6z" fill="#d4ff3a" />
        </svg>
        <span className="absolute inset-0 rounded-xl bg-lime/0 transition group-hover:bg-lime/10" />
      </span>
      <span className="font-display text-lg font-bold tracking-tight text-graphite-100 group-hover:text-white transition">
        <span className="glitch-text">Neon</span><span className="text-lime neon-glow">ix</span>
      </span>
    </Link>
  );
}
