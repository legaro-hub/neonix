import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const COOKIE_KEY = 'neonix_cookie_consent';

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_KEY);
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = () => {
    localStorage.setItem(COOKIE_KEY, 'accepted');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-3 sm:p-4 pointer-events-none">
      <div className="pointer-events-auto mx-auto max-w-4xl overflow-hidden rounded-2xl border border-graphite-700/60 bg-graphite-950/95 backdrop-blur-xl shadow-2xl shadow-black/50">
        {/* Accent glow bar */}
        <div className="h-[2px] bg-gradient-to-r from-transparent via-lime/60 to-transparent" />

        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:gap-6">
          {/* Icon */}
          <div className="hidden sm:flex shrink-0 h-10 w-10 items-center justify-center rounded-xl bg-lime/10 border border-lime/20">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-lime">
              <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5" />
              <path d="M8.5 8.5v.01" />
              <path d="M16 15.5v.01" />
              <path d="M12 12v.01" />
              <path d="M11 17v.01" />
              <path d="M7 14v.01" />
            </svg>
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-graphite-200 leading-relaxed">
              Мы используем <span className="font-semibold text-white">только технические cookie</span>, необходимые для работы сервиса (аутентификация). Мы не используем трекеры, аналитику или рекламные cookie.
            </p>
            <p className="mt-1 text-xs text-graphite-500">
              Подробнее —{' '}
              <Link to="/privacy" className="text-lime/70 hover:text-lime transition-colors underline underline-offset-2">
                Политика конфиденциальности
              </Link>
            </p>
          </div>

          {/* Button */}
          <button
            onClick={accept}
            className="shrink-0 rounded-xl bg-lime px-6 py-2.5 text-sm font-bold text-graphite-950 transition-all hover:bg-lime/90 hover:shadow-lg hover:shadow-lime/20 active:scale-95"
          >
            Понятно
          </button>
        </div>
      </div>
    </div>
  );
}
