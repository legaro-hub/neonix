import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Logo } from './Logo';
import { useAuth } from '../lib/auth';

const NAV_LINKS = [
  { href: '#features', label: 'Возможности' },
  { href: '#how', label: 'Как работает' },
  { href: '#pricing', label: 'Тарифы' },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'border-b border-graphite-800/50 glass'
          : 'border-b border-transparent'
      }`}
    >
      <div className="container-app flex h-16 items-center justify-between">
        <Logo />

        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="relative px-4 py-2 text-sm font-medium text-graphite-400 transition-all duration-200 hover:text-white rounded-xl hover:bg-graphite-800/30"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <Link to="/app" className="btn-primary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              В кабинет
            </Link>
          ) : (
            <>
              <Link to="/login" className="btn-ghost">
                Войти
              </Link>
              <Link to="/register" className="btn-primary">
                Начать бесплатно
              </Link>
            </>
          )}
        </div>

        <button
          className="grid h-10 w-10 place-items-center rounded-xl border border-graphite-700/50 hover:border-graphite-600 transition-all duration-200 md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Меню"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-graphite-300">
            {open ? <path d="M6 18L18 6M6 6l12 12" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
          </svg>
        </button>
      </div>

      {open && (
        <div className="border-t border-graphite-800/50 glass md:hidden">
          <div className="container-app flex flex-col gap-1 py-4">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-4 py-3 text-sm font-medium text-graphite-300 hover:bg-graphite-800/40 hover:text-white transition"
              >
                {l.label}
              </a>
            ))}
            <div className="mt-3 flex flex-col gap-2">
              {user ? (
                <Link to="/app" className="btn-primary" onClick={() => setOpen(false)}>В кабинет</Link>
              ) : (
                <>
                  <Link to="/login" className="btn-ghost" onClick={() => setOpen(false)}>Войти</Link>
                  <Link to="/register" className="btn-primary" onClick={() => setOpen(false)}>Начать бесплатно</Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
