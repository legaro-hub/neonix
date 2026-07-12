import { Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Logo } from '../components/Logo';
import { Particles } from '../components/Particles';
import { AuroraHero } from '../components/Aurora';

const FEATURES = [
  { icon: '📅', title: 'Единый календарь', text: 'Планируйте посты для всех каналов в одном окне.' },
  { icon: '⚡', title: 'Автопостинг', text: 'Публикуйте точно в срок — вручную или по расписанию.' },
  { icon: '🔗', title: 'Несколько каналов', text: 'Telegram, Pinterest, YouTube и Instagram.' },
  { icon: '📊', title: 'Аналитика', text: 'Просмотры, реакции и охваты в одном отчёте.' },
  { icon: '🛡', title: 'Безопасно', text: 'Токены шифруются, доступ — только ваш.' },
  { icon: '🌍', title: 'Часовые пояса', text: 'Публикация уходит в нужный момент.' },
];

const STEPS = [
  { n: '01', title: 'Подключите каналы', text: 'Добавьте бота в админы ваших каналов за минуту.' },
  { n: '02', title: 'Создайте пост', text: 'Текст, фото, видео — выберите каналы.' },
  { n: '03', title: 'Поставьте расписание', text: 'Выберите дату и время или публикуйте сразу.' },
  { n: '04', title: 'Готово', text: 'Neonix публикует и считает результаты.' },
];

const PLANS = [
  { name: 'Free', price: '0', period: 'навсегда', features: ['3 аккаунта', '30 постов/мес', 'Календарь', 'Базовая аналитика'], cta: 'Начать бесплатно', highlight: false },
  { name: 'Pro', price: '790', period: '/мес', features: ['15 аккаунтов', 'Безлимит постов', 'Массовая загрузка', 'Полная аналитика', 'Приоритетная поддержка'], cta: 'Получить Pro', highlight: true },
  { name: 'Business', price: '2490', period: '/мес', features: ['До 30 каналов', 'Команда и роли', 'Шаблоны', 'Экспорт отчётов', 'Персональная поддержка'], cta: 'Обсудить', highlight: false },
];

const PLATFORMS = [
  { name: 'Telegram', icon: '✈', color: '#38bdf8' },
  { name: 'Pinterest', icon: '📌', color: '#f87171' },
  { name: 'YouTube', icon: '▶', color: '#ef4444' },
  { name: 'Instagram', icon: '📷', color: '#f472b6' },
];

export function LandingPage() {
  return (
    <div className="scroll-snap-container">
      <Navbar />

      {/* HERO */}
      <section className="scroll-snap-section relative flex items-center overflow-hidden">
        <AuroraHero />
        <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(212,255,58,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(212,255,58,0.015) 1px, transparent 1px)', backgroundSize: '48px 48px', opacity: 0.4 }} />
        <Particles count={35} className="opacity-50" />

        <div className="container-app relative z-10 py-20 sm:py-28">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-8 flex flex-wrap items-center justify-center gap-3">
              {PLATFORMS.map((p) => (
                <div key={p.name} className="flex items-center gap-2 rounded-full border border-white/5 bg-white/[0.02] backdrop-blur-sm px-4 py-2 text-xs font-medium text-graphite-300 hover:border-white/10 transition-all">
                  <span style={{ color: p.color }}>{p.icon}</span> {p.name}
                </div>
              ))}
            </div>

            <h1 className="font-display text-5xl font-bold leading-[1.1] text-white sm:text-7xl lg:text-8xl">
              Планируйте посты.
              <br />
              <span className="inline-block" style={{ backgroundImage: 'linear-gradient(90deg, #d4ff3a, #00e5ff, #8b5cf6, #d4ff3a)', backgroundSize: '300% 100%', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', animation: 'holo 4s ease infinite' }}>
                Публикуйте автоматически.
              </span>
            </h1>

            <p className="mx-auto mt-8 max-w-2xl text-lg text-graphite-400 leading-relaxed">
              Один календарь для всех каналов. Создавайте контент,
              назначайте время и публикуйте в Telegram, Pinterest, YouTube и Instagram разом.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link to="/register" className="inline-flex items-center gap-2 rounded-xl bg-lime text-graphite-950 font-bold px-8 py-4 text-lg hover:bg-lime-400 transition-all hover:shadow-glow-sm active:scale-[0.97]">
                Начать бесплатно →
              </Link>
              <Link to="/login" className="inline-flex items-center gap-2 rounded-xl border border-graphite-700/40 text-graphite-300 px-8 py-4 text-lg hover:border-graphite-600 hover:bg-graphite-800/40 hover:text-white transition-all">
                Войти
              </Link>
            </div>

            <p className="mt-6 text-sm text-graphite-500">Без карты · 3 аккаунта бесплатно</p>
          </div>

          {/* Orbiting platforms */}
          <div className="relative mx-auto mt-20 h-80 w-80 sm:h-96 sm:w-96">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-3xl bg-gradient-to-br from-graphite-800 to-graphite-900 border border-graphite-700/50 flex items-center justify-center" style={{ boxShadow: '0 0 60px rgba(212,255,58,0.15), 0 0 120px rgba(212,255,58,0.05)' }}>
              <span className="text-4xl font-display font-black text-lime">N</span>
            </div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full border border-graphite-800/50" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full border border-graphite-800/30" />
            {PLATFORMS.map((p, i) => (
              <div key={p.name} className="absolute top-1/2 left-1/2"
                style={{ animation: `orbit ${18 + i * 4}s linear infinite`, animationDelay: `${-i * 4}s` }}>
                <div className="w-14 h-14 -ml-7 -mt-7 rounded-2xl flex items-center justify-center text-xl backdrop-blur-sm border border-white/10 bg-white/[0.03]"
                  style={{ boxShadow: `0 0 30px ${p.color}25` }}>
                  {p.icon}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="scroll-snap-section relative border-y border-graphite-800/50 overflow-hidden flex items-center">
        <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(212,255,58,0.01) 1px, transparent 1px), linear-gradient(90deg, rgba(212,255,58,0.01) 1px, transparent 1px)', backgroundSize: '32px 32px', opacity: 0.3 }} />
        <div className="container-app relative grid grid-cols-2 gap-6 py-16 text-center sm:grid-cols-4 w-full">
          {[
            { v: '98%', l: 'успешных публикаций', icon: '⚡', c: '#4ade80' },
            { v: '< 5с', l: 'до отправки', icon: '⏱', c: '#00e5ff' },
            { v: '4', l: 'платформы', icon: '🚀', c: '#d4ff3a' },
            { v: '24/7', l: 'очередь', icon: '🔄', c: '#8b5cf6' },
          ].map((s) => (
            <div key={s.l} className="group">
              <div className="mb-4 text-3xl group-hover:scale-125 transition-transform duration-300">{s.icon}</div>
              <div className="font-display text-4xl font-bold" style={{ color: s.c, textShadow: `0 0 30px ${s.c}30` }}>{s.v}</div>
              <div className="mt-2 text-sm text-graphite-500">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="scroll-snap-section relative py-24 sm:py-32 flex items-center">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full opacity-20" style={{ background: 'radial-gradient(circle, rgba(0,229,255,0.15) 0%, transparent 60%)', filter: 'blur(80px)' }} />
        <div className="container-app relative z-10 w-full">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-lime/20 bg-lime/5 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-lime">
              <span className="h-1.5 w-1.5 rounded-full bg-lime animate-pulse" /> Возможности
            </div>
            <h2 className="font-display text-4xl font-bold text-white sm:text-5xl">Всё для <span style={{ color: '#d4ff3a' }}>контента</span></h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 stagger">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-xl p-8 group hover:border-white/10 transition-all duration-300 hover:-translate-y-1" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.2)' }}>
                <div className="text-3xl mb-4 group-hover:scale-110 transition-transform duration-300">{f.icon}</div>
                <h3 className="font-display text-xl font-bold text-white group-hover:text-lime transition-colors">{f.title}</h3>
                <p className="mt-3 text-sm text-graphite-400 leading-relaxed">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STEPS */}
      <section id="how" className="scroll-snap-section relative border-y border-graphite-800/50 overflow-hidden flex items-center">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(at 40% 20%, rgba(212,255,58,0.04) 0px, transparent 50%), radial-gradient(at 80% 0%, rgba(0,229,255,0.03) 0px, transparent 50%)', backgroundColor: '#0a0b0d' }} />
        <div className="container-app relative z-10 py-24 sm:py-32 w-full">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="font-display text-4xl font-bold text-white sm:text-5xl">
              <span style={{ textShadow: '2px 0 #d4ff3a, -2px 0 #00e5ff' }}>Четыре шага</span> до поста
            </h2>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s) => (
              <div key={s.n} className="group">
                <div className="font-display text-6xl font-black text-graphite-800 group-hover:text-graphite-700 transition-colors">{s.n}</div>
                <div className="h-px my-4" style={{ background: 'linear-gradient(90deg, transparent, rgba(212,255,58,0.4), transparent)' }} />
                <h3 className="font-display text-xl font-bold text-graphite-100 group-hover:text-lime transition-colors">{s.title}</h3>
                <p className="mt-3 text-sm text-graphite-400">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* REVIEWS */}
      <section className="scroll-snap-section relative py-24 sm:py-32 flex items-center">
        <div className="container-app w-full">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="font-display text-4xl font-bold text-white sm:text-5xl">Нам доверяют</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              { name: 'Алексей К.', role: 'Блогер, 50K', text: 'Экономлю 3 часа в день. Планирую посты на неделю.' },
              { name: 'Мария В.', role: 'SMM-агентство', text: 'Управляем 30+ каналами из одного интерфейса.' },
              { name: 'Дмитрий С.', role: 'YouTube + TG', text: 'Кросспостинг работает безупречно. Рекомендую.' },
            ].map((r) => (
              <div key={r.name} className="rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-xl p-8 hover:border-white/10 transition-all">
                <div className="flex items-center gap-1 mb-4">
                  {[1,2,3,4,5].map((s) => <svg key={s} width="16" height="16" viewBox="0 0 24 24" fill="#d4ff3a"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>)}
                </div>
                <p className="text-sm text-graphite-300 mb-6">"{r.text}"</p>
                <div className="text-sm font-bold text-white">{r.name}</div>
                <div className="text-xs text-graphite-500">{r.role}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="scroll-snap-section relative py-24 sm:py-32 overflow-hidden flex items-center">
        <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[400px] h-[400px] rounded-full opacity-15" style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 60%)', filter: 'blur(80px)' }} />
        <div className="container-app relative z-10 w-full">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="font-display text-4xl font-bold text-white sm:text-5xl">Тарифы</h2>
            <p className="mt-4 text-graphite-300 text-lg">Начните бесплатно.</p>
          </div>
          <div className="grid gap-8 lg:grid-cols-3">
            {PLANS.map((p) => (
              <div key={p.name} className={`rounded-2xl border backdrop-blur-xl p-8 flex flex-col transition-all hover:-translate-y-1 relative ${
                p.highlight ? 'border-lime/30 bg-lime/[0.03]' : 'border-white/5 bg-white/[0.02]'
              }`} style={p.highlight ? { boxShadow: '0 0 40px rgba(212,255,58,0.08), 0 0 80px rgba(212,255,58,0.04)' } : { boxShadow: '0 4px 24px rgba(0,0,0,0.2)' }}>
                {p.highlight && <span className="absolute -top-3 left-8 rounded-full bg-lime px-4 py-1 text-xs font-bold text-graphite-950">Популярный</span>}
                <h3 className="font-display text-2xl font-bold text-white">{p.name}</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="font-display text-5xl font-black text-white">{p.price}₽</span>
                  <span className="text-sm text-graphite-500">{p.period}</span>
                </div>
                <ul className="mt-6 flex-1 space-y-3">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-graphite-200">
                      <span className="text-lime">✓</span> {f}
                    </li>
                  ))}
                </ul>
                <Link to="/register" className={`mt-8 inline-flex items-center justify-center rounded-xl px-6 py-3 text-sm font-bold transition-all ${
                  p.highlight ? 'bg-lime text-graphite-950 hover:bg-lime-400' : 'border border-graphite-700/40 text-graphite-300 hover:border-graphite-600 hover:bg-graphite-800/40 hover:text-white'
                }`}>
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="scroll-snap-section container-app py-24 flex items-center">
        <div className="relative overflow-hidden rounded-3xl border border-white/5 p-12 text-center sm:p-20 w-full" style={{ background: 'radial-gradient(at 40% 20%, rgba(212,255,58,0.04) 0px, transparent 50%), radial-gradient(at 80% 0%, rgba(0,229,255,0.03) 0px, transparent 50%), #0d0f12' }}>
          <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(212,255,58,0.01) 1px, transparent 1px), linear-gradient(90deg, rgba(212,255,58,0.01) 1px, transparent 1px)', backgroundSize: '40px 40px', opacity: 0.3 }} />
          <Particles count={15} className="opacity-30" />
          <div className="relative mx-auto max-w-2xl z-10">
            <h2 className="font-display text-4xl font-bold text-white sm:text-5xl">
              <span style={{ textShadow: '2px 0 #d4ff3a, -2px 0 #00e5ff' }}>Готовы делегировать</span>
              <br />
              <span style={{ color: '#00e5ff', textShadow: '0 0 20px rgba(0,229,255,0.3)' }}>автопостинг?</span>
            </h2>
            <p className="mt-5 text-graphite-300 text-lg">Создайте аккаунт за полминуты.</p>
            <Link to="/register" className="inline-flex items-center gap-2 rounded-xl bg-lime text-graphite-950 font-bold px-8 py-4 text-lg mt-8 hover:bg-lime-400 transition-all active:scale-[0.97]" style={{ boxShadow: '0 0 20px rgba(212,255,58,0.2)' }}>
              Начать бесплатно →
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-graphite-800/50 bg-graphite-950">
        <div className="container-app grid gap-8 py-12 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <Logo />
            <p className="mt-4 max-w-xs text-sm text-graphite-400">Планирование и автопостинг для контент-мейкеров.</p>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-graphite-300">Продукт</h4>
            <ul className="mt-3 space-y-2">
              <li><a href="#features" className="text-sm text-graphite-400 hover:text-lime transition">Возможности</a></li>
              <li><a href="#pricing" className="text-sm text-graphite-400 hover:text-lime transition">Тарифы</a></li>
              <li><Link to="/blog" className="text-sm text-graphite-400 hover:text-lime transition">Блог</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-graphite-300">Ресурсы</h4>
            <ul className="mt-3 space-y-2">
              <li><Link to="/help" className="text-sm text-graphite-400 hover:text-lime transition">Помощь</Link></li>
              <li><a href="mailto:support@neonix.online" className="text-sm text-graphite-400 hover:text-lime transition">Поддержка</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-graphite-300">Правовое</h4>
            <ul className="mt-3 space-y-2">
              <li><Link to="/terms" className="text-sm text-graphite-400 hover:text-lime transition">Условия</Link></li>
              <li><Link to="/privacy" className="text-sm text-graphite-400 hover:text-lime transition">Конфиденциальность</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-graphite-800">
          <div className="container-app py-6 text-center text-xs text-graphite-500">© 2026 Neonix. Все права защищены.</div>
        </div>
      </footer>
    </div>
  );
}
