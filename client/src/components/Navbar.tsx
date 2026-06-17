import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Logo } from './Logo';
import { useAuth } from '../lib/auth';

const NAV_LINKS = [
  { href: '#features', label: 'Возможности' },
  { href: '#how', label: 'Как это работает' },
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
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'border-b border-graphite-800 bg-graphite-950/80 backdrop-blur-xl'
          : 'border-b border-transparent'
      }`}
    >
      <div className="container-app flex h-16 items-center justify-between">
        <Logo />

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-graphite-300 transition hover:text-graphite-100"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <Link to="/app" className="btn-primary">
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

        {/* Mobile toggle */}
        <button
          className="grid h-10 w-10 place-items-center rounded-lg border border-graphite-700 md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Меню"
        >
          <span className="text-graphite-200">
            {open ? '✕' : '☰'}
          </span>
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-graphite-800 bg-graphite-950/95 md:hidden">
          <div className="container-app flex flex-col gap-2 py-4">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-sm text-graphite-200 hover:bg-graphite-850"
              >
                {l.label}
              </a>
            ))}
            <div className="mt-2 flex flex-col gap-2">
              {user ? (
                <Link to="/app" className="btn-primary" onClick={() => setOpen(false)}>
                  В кабинет
                </Link>
              ) : (
                <>
                  <Link to="/login" className="btn-ghost" onClick={() => setOpen(false)}>
                    Войти
                  </Link>
                  <Link to="/register" className="btn-primary" onClick={() => setOpen(false)}>
                    Начать бесплатно
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
