import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';

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
      <div className="relative hidden overflow-hidden border-b border-graphite-800 lg:block lg:w-1/2 lg:border-b-0 lg:border-r">
        <div className="absolute inset-0 bg-grid-faint bg-[size:48px_48px] [mask-image:radial-gradient(60%_60%_at_30%_30%,black,transparent)]" />
        <div className="absolute -left-20 top-1/3 h-72 w-72 rounded-full bg-lime/15 blur-3xl" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <Link to="/" className="font-display text-xl font-bold text-graphite-100">
            Neon<span className="text-lime">ix</span>
          </Link>
          <div>
            <h2 className="font-display text-3xl font-bold leading-tight text-white">
              Один календарь.
              <br />
              <span className="text-lime">Все ваши каналы.</span>
            </h2>
            <p className="mt-4 max-w-sm text-graphite-300">
              Планируйте и публикуйте контент автоматически. Без будильников и ручной работы.
            </p>
          </div>
          <div className="flex items-center gap-3 text-sm text-graphite-400">
            <div className="flex -space-x-2">
              {['#d4ff3a', '#94b81f', '#525b68'].map((c) => (
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
            <Link to="/" className="font-display text-xl font-bold text-graphite-100">
              Neon<span className="text-lime">ix</span>
            </Link>
          </div>
          <h1 className="font-display text-2xl font-bold text-white">{title}</h1>
          <p className="mt-2 text-sm text-graphite-400">{subtitle}</p>
          <div className="mt-8">{children}</div>
          <div className="mt-6 text-center text-sm text-graphite-400">{footer}</div>
        </div>
      </div>
    </div>
  );
}
