import type { ReactNode } from 'react';
import { Logo } from './Logo';

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* Left visual */}
      <div className="relative hidden overflow-hidden border-b border-graphite-800/50 lg:block lg:w-1/2 lg:border-b-0 lg:border-r lg:border-graphite-800/50">
        <div className="absolute inset-0 cyber-grid opacity-30" />
        <div className="absolute -left-20 top-1/3 h-72 w-72 rounded-full bg-lime/5 blur-3xl" />
        <div className="absolute -right-20 bottom-1/3 h-48 w-48 rounded-full bg-cyan-500/3 blur-3xl" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <Logo />
          <div>
            <h2 className="font-display text-3xl font-bold leading-tight text-white tracking-tight">
              Один календарь.
              <br />
              <span className="neon-glow" style={{ color: '#d4ff3a' }}>Все ваши каналы.</span>
            </h2>
            <p className="mt-4 max-w-sm text-graphite-400 leading-relaxed">
              Планируйте и публикуйте контент автоматически. Без будильников и ручной работы.
            </p>
          </div>
          <div className="flex items-center gap-3 text-sm text-graphite-400">
            <div className="flex -space-x-2">
              {['linear-gradient(135deg, #d4ff3a, #94b81f)', 'linear-gradient(135deg, #00e5ff, #0097a7)', 'linear-gradient(135deg, #ff6d00, #e65100)'].map((c) => (
                <span
                  key={c}
                  className="h-7 w-7 rounded-full border-2 border-graphite-950"
                  style={{ background: c }}
                />
              ))}
            </div>
            Уже используют сотни авторов
          </div>
        </div>
      </div>

      {/* Right form */}
      <div className="flex flex-1 items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          <h1 className="font-display text-2xl font-bold text-white tracking-tight">{title}</h1>
          <p className="mt-2 text-sm text-graphite-400">{subtitle}</p>
          <div className="mt-8">{children}</div>
          <div className="mt-6 text-center text-sm text-graphite-400">{footer}</div>
        </div>
      </div>
    </div>
  );
}
