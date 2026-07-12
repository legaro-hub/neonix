import { Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Logo } from '../components/Logo';
import { Particles } from '../components/Particles';
import { AuroraHero } from '../components/Aurora';

const FEATURES = [
  { icon: '📅', title: 'Единый календарь', desc: 'Все посты в одном окне. Перетаскивайте, дублируйте, планируйте на неделю.' },
  { icon: '⚡', title: 'Автопостинг', desc: 'Публикация точно по расписанию. Очередь с повторами при сбоях.' },
  { icon: '🔗', title: '4 платформы', desc: 'Telegram, Pinterest, YouTube, Instagram — один пост, все каналы.' },
  { icon: '📊', title: 'Аналитика', desc: 'Просмотры, реакции, охваты — всё в одном отчёте.' },
  { icon: '🛡', title: 'Безопасность', desc: 'Токены зашифрованы. Доступ только у вас.' },
  { icon: '🌍', title: 'Часовые пояса', desc: 'Публикация в вашем поясе — сервер не важен.' },
];

const STEPS = [
  { n: '1', title: 'Подключите', desc: 'Добавьте бота в канал' },
  { n: '2', title: 'Создайте', desc: 'Напишите пост' },
  { n: '3', title: 'Запланируйте', desc: 'Выберите время' },
  { n: '4', title: 'Готово', desc: 'Neonix опубликует' },
];

const PRICING = [
  { name: 'Free', price: '0', period: '/навсегда', features: ['3 аккаунта', '30 постов/мес', 'Календарь', 'Аналитика'], accent: false },
  { name: 'Pro', price: '790', period: '/мес', features: ['15 аккаунтов', 'Безлимит постов', 'Массовая загрузка', 'Полная аналитика', 'Приоритет'], accent: true },
  { name: 'Business', price: '2 490', period: '/мес', features: ['30 каналов', 'Команда', 'Шаблоны', 'Экспорт', 'Поддержка'], accent: false },
];

export function LandingPage() {
  return (
    <div className="min-h-screen">
      <Navbar />

      {/* ═══════════ HERO ═══════════ */}
      <section className="relative overflow-hidden min-h-screen flex items-center">
        <AuroraHero />
        <Particles count={30} className="opacity-40" />
        {/* grid overlay */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'linear-gradient(rgba(212,255,58,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(212,255,58,0.02) 1px, transparent 1px)',
          backgroundSize: '64px 64px'
        }} />

        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 py-32 lg:py-0">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* left */}
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-lime/20 bg-lime/5 px-4 py-1.5 mb-8">
                <span className="w-2 h-2 rounded-full bg-lime animate-pulse" />
                <span className="text-xs font-semibold text-lime tracking-wide">БЕТА · ВСЁ ЕЩЁ БЕСПЛАТНО</span>
              </div>

              <h1 className="text-5xl lg:text-7xl font-bold text-white leading-[1.05] tracking-tight font-display">
                Планируйте посты.
                <br />
                <span style={{
                  background: 'linear-gradient(90deg, #d4ff3a 0%, #00e5ff 50%, #8b5cf6 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>
                  Автопубликация.
                </span>
              </h1>

              <p className="mt-6 text-lg text-graphite-400 max-w-lg leading-relaxed">
                Один календарь для Telegram, Pinterest, YouTube и Instagram.
                Создавайте контент — Neonix опубликует за вас.
              </p>

              <div className="mt-10 flex flex-wrap gap-4">
                <Link to="/register" className="inline-flex items-center gap-2 bg-lime text-graphite-950 font-bold px-8 py-4 rounded-2xl text-base hover:bg-lime-400 transition-all active:scale-[0.97]">
                  Начать бесплатно
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14m-7-7l7 7-7 7"/></svg>
                </Link>
                <Link to="/login" className="inline-flex items-center gap-2 border border-graphite-700 text-graphite-300 font-medium px-8 py-4 rounded-2xl text-base hover:border-graphite-500 hover:text-white transition-all">
                  Войти
                </Link>
              </div>

              <p className="mt-5 text-sm text-graphite-500">Без карты · Регистрация за 30 секунд</p>
            </div>

            {/* right — mockup */}
            <div className="hidden lg:block relative">
              <div className="relative rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-xl p-6" style={{ boxShadow: '0 25px 80px rgba(0,0,0,0.4)' }}>
                {/* calendar mockup */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-3 h-3 rounded-full bg-red-400/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400/80" />
                  <div className="w-3 h-3 rounded-full bg-green-400/80" />
                  <span className="ml-3 text-xs text-graphite-500 font-mono">neonix.online/calendar</span>
                </div>
                <div className="grid grid-cols-7 gap-1 mb-3">
                  {['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].map(d => (
                    <div key={d} className="text-center text-[10px] text-graphite-500 py-1">{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({length: 28}).map((_, i) => {
                    const hasPost = [2,5,8,12,15,19,22,26].includes(i);
                    const isToday = i === 11;
                    return (
                      <div key={i} className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs ${isToday ? 'bg-lime/10 border border-lime/30 text-lime' : 'bg-graphite-800/50 text-graphite-400'}`}>
                        <span className="text-[10px]">{i + 1}</span>
                        {hasPost && <div className="w-1 h-1 rounded-full bg-lime mt-0.5" />}
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 flex gap-2">
                  {['✈ TG','📌 PI','▶ YT','📷 IG'].map(p => (
                    <div key={p} className="flex-1 rounded-lg bg-graphite-800/60 border border-graphite-700/30 p-2 text-center">
                      <div className="text-[10px] text-graphite-400">{p}</div>
                    </div>
                  ))}
                </div>
              </div>
              {/* floating badges */}
              <div className="absolute -top-4 -right-4 bg-lime/10 border border-lime/20 rounded-xl px-3 py-2 backdrop-blur-sm">
                <div className="text-xs font-bold text-lime">98% ✓</div>
                <div className="text-[9px] text-graphite-400">успешных</div>
              </div>
              <div className="absolute -bottom-3 -left-3 bg-graphite-800/80 border border-graphite-700/50 rounded-xl px-3 py-2 backdrop-blur-sm">
                <div className="text-xs font-bold text-white">12 постов</div>
                <div className="text-[9px] text-graphite-400">на этой неделе</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ PLATFORMS ═══════════ */}
      <section className="py-20 border-y border-graphite-800/50">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-sm text-graphite-500 mb-10 uppercase tracking-widest font-semibold">Поддерживаемые платформы</p>
          <div className="flex flex-wrap items-center justify-center gap-8 lg:gap-16">
            {[
              { name: 'Telegram', icon: '✈', color: '#38bdf8' },
              { name: 'Pinterest', icon: '📌', color: '#f87171' },
              { name: 'YouTube', icon: '▶', color: '#ef4444' },
              { name: 'Instagram', icon: '📷', color: '#f472b6' },
            ].map(p => (
              <div key={p.name} className="flex items-center gap-3 text-graphite-300 hover:text-white transition-colors">
                <span className="text-2xl" style={{ color: p.color }}>{p.icon}</span>
                <span className="text-lg font-semibold">{p.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ FEATURES ═══════════ */}
      <section id="features" className="py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-block text-xs font-bold text-lime uppercase tracking-widest mb-4">Возможности</span>
            <h2 className="text-4xl lg:text-5xl font-bold text-white font-display">Всё что нужно</h2>
            <p className="mt-4 text-graphite-400 text-lg max-w-xl mx-auto">От планирования до аналитики — один инструмент</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(f => (
              <div key={f.title} className="group rounded-2xl border border-graphite-800/50 bg-graphite-900/30 p-7 hover:border-graphite-700/60 transition-all duration-300 hover:-translate-y-1">
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-lime transition-colors">{f.title}</h3>
                <p className="text-sm text-graphite-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ STEPS ═══════════ */}
      <section id="how" className="py-24 lg:py-32 border-y border-graphite-800/50" style={{ background: 'linear-gradient(180deg, rgba(212,255,58,0.02) 0%, transparent 100%)' }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-white font-display">Как это работает</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {STEPS.map((s, i) => (
              <div key={s.n} className="text-center relative">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-lime/10 border border-lime/20 text-lime font-display text-xl font-bold mb-4">{s.n}</div>
                {i < 3 && <div className="hidden md:block absolute top-7 left-[calc(50%+2rem)] w-[calc(100%-4rem)] h-px bg-gradient-to-r from-graphite-700 to-transparent" />}
                <h3 className="text-lg font-bold text-white mb-1">{s.title}</h3>
                <p className="text-sm text-graphite-400">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ REVIEWS ═══════════ */}
      <section className="py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-white font-display">Отзывы</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: 'Алексей', role: 'Блогер · 50K', text: 'Планирую посты на неделю за 10 минут. Раньше тратил 3 часа каждый день.' },
              { name: 'Мария', role: 'SMM-агентство', text: 'Управляем 30 каналами клиентов. Календарь — спасение.' },
              { name: 'Дмитрий', role: 'YouTube + Telegram', text: 'Кросспостинг работает идеально. Рекомендую всем.' },
            ].map(r => (
              <div key={r.name} className="rounded-2xl border border-graphite-800/50 bg-graphite-900/30 p-7">
                <div className="flex items-center gap-1 mb-4">
                  {[1,2,3,4,5].map(i => <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="#d4ff3a"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>)}
                </div>
                <p className="text-sm text-graphite-300 mb-5 leading-relaxed">"{r.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-graphite-800 flex items-center justify-center text-sm font-bold text-graphite-300">{r.name[0]}</div>
                  <div>
                    <div className="text-sm font-semibold text-white">{r.name}</div>
                    <div className="text-xs text-graphite-500">{r.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ PRICING ═══════════ */}
      <section id="pricing" className="py-24 lg:py-32 border-y border-graphite-800/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-white font-display">Тарифы</h2>
            <p className="mt-4 text-graphite-400 text-lg">Начните бесплатно</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {PRICING.map(p => (
              <div key={p.name} className={`relative rounded-2xl border p-8 flex flex-col ${p.accent ? 'border-lime/30 bg-lime/[0.03]' : 'border-graphite-800/50 bg-graphite-900/30'}`}>
                {p.accent && <span className="absolute -top-3 left-8 bg-lime text-graphite-950 text-xs font-bold px-3 py-1 rounded-full">Популярный</span>}
                <h3 className="text-xl font-bold text-white">{p.name}</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-white">{p.price}₽</span>
                  <span className="text-sm text-graphite-500">{p.period}</span>
                </div>
                <ul className="mt-6 space-y-3 flex-1">
                  {p.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-graphite-300">
                      <span className="text-lime text-xs">✓</span> {f}
                    </li>
                  ))}
                </ul>
                <Link to="/register" className={`mt-8 block text-center py-3 rounded-xl font-semibold text-sm transition-all ${
                  p.accent ? 'bg-lime text-graphite-950 hover:bg-lime-400' : 'border border-graphite-700 text-graphite-300 hover:border-graphite-500 hover:text-white'
                }`}>
                  {p.accent ? 'Получить Pro' : 'Начать'}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ CTA ═══════════ */}
      <section className="py-24 lg:py-32">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="relative rounded-3xl border border-white/5 p-12 lg:p-20 overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(18,19,26,0.8) 0%, rgba(13,15,18,0.9) 100%)' }}>
            <div className="absolute inset-0 pointer-events-none" style={{
              backgroundImage: 'linear-gradient(rgba(212,255,58,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(212,255,58,0.015) 1px, transparent 1px)',
              backgroundSize: '32px 32px'
            }} />
            <div className="relative z-10">
              <h2 className="text-4xl lg:text-5xl font-bold text-white font-display mb-4">Готовы начать?</h2>
              <p className="text-graphite-400 text-lg mb-8">Создайте аккаунт и запланируйте первый пост за минуту</p>
              <Link to="/register" className="inline-flex items-center gap-2 bg-lime text-graphite-950 font-bold px-10 py-4 rounded-2xl text-lg hover:bg-lime-400 transition-all active:scale-[0.97]">
                Начать бесплатно →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer className="border-t border-graphite-800/50 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
            <div className="lg:col-span-1">
              <Logo />
              <p className="mt-4 text-sm text-graphite-500 max-w-xs">Планирование и автопостинг для контент-мейкеров.</p>
            </div>
            <div>
              <h4 className="text-xs font-bold text-graphite-300 uppercase tracking-wider mb-3">Продукт</h4>
              <ul className="space-y-2">
                <li><a href="#features" className="text-sm text-graphite-500 hover:text-lime transition">Возможности</a></li>
                <li><a href="#pricing" className="text-sm text-graphite-500 hover:text-lime transition">Тарифы</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-bold text-graphite-300 uppercase tracking-wider mb-3">Поддержка</h4>
              <ul className="space-y-2">
                <li><Link to="/help" className="text-sm text-graphite-500 hover:text-lime transition">База знаний</Link></li>
                <li><a href="mailto:support@neonix.online" className="text-sm text-graphite-500 hover:text-lime transition">support@neonix.online</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-bold text-graphite-300 uppercase tracking-wider mb-3">Правовое</h4>
              <ul className="space-y-2">
                <li><Link to="/terms" className="text-sm text-graphite-500 hover:text-lime transition">Условия</Link></li>
                <li><Link to="/privacy" className="text-sm text-graphite-500 hover:text-lime transition">Конфиденциальность</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-graphite-800/50 pt-6 text-center text-xs text-graphite-600">
            © 2026 Neonix
          </div>
        </div>
      </footer>
    </div>
  );
}
