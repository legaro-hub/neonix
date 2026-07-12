import type { ReactNode } from 'react';
import { Logo } from './Logo';
import { AuroraHero } from './Aurora';
import { Particles } from './Particles';
import { GlowOrb } from './GlowOrb';

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
      <div className="relative hidden overflow-hidden lg:flex lg:w-[45%] lg:flex-col lg:justify-between lg:border-r lg:border-white/5">
        <AuroraHero />
        <div className="absolute inset-0 cyber-grid opacity-30" />
        <Particles count={30} className="opacity-30" />
        <GlowOrb color="#d4ff3a" size={400} blur={200} className="top-1/4 left-1/4" />
        <GlowOrb color="#00e5ff" size={300} blur={150} className="bottom-1/4 right-1/4" />

        <div className="relative z-10 p-12">
          <Logo size="lg" />
        </div>

        <div className="relative z-10 p-12">
          <h2 className="font-display text-4xl font-bold leading-tight text-white tracking-tight">
            Один календарь.
            <br />
            <span className="neon-glow-strong" style={{ color: '#d4ff3a' }}>Все ваши каналы.</span>
          </h2>
          <p className="mt-5 max-w-sm text-graphite-400 leading-relaxed text-lg">
            Планируйте и публикуйте контент автоматически.
          </p>

          {/* Animated shapes */}
          <div className="mt-10 flex items-center gap-4">
            {['✈', '📌', '▶', '📷'].map((icon, i) => (
              <div key={i} className="h-12 w-12 rounded-xl border border-white/5 bg-white/[0.03] backdrop-blur-sm flex items-center justify-center text-lg animate-float"
                   style={{ animationDelay: `${i * 0.5}s` }}>
                {icon}
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 p-12">
          <div className="space-y-3 text-sm text-graphite-400">
            <div className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d4ff3a" strokeWidth="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              Шифрование данных
            </div>
            <div className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d4ff3a" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              Безопасная авторизация
            </div>
            <div className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d4ff3a" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              99.9% аптайм
            </div>
          </div>
        </div>
      </div>

      {/* Right form */}
      <div className="flex flex-1 items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-md animate-fade-in-up">
          <div className="mb-10 lg:hidden">
            <Logo />
          </div>
          <h1 className="font-display text-3xl font-bold text-white tracking-tight">{title}</h1>
          <p className="mt-2 text-sm text-graphite-400">{subtitle}</p>
          <div className="mt-8">{children}</div>
          <div className="mt-8 text-center text-sm text-graphite-400">{footer}</div>
        </div>
      </div>
    </div>
  );
}
