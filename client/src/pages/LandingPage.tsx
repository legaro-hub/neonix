import { Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Logo } from '../components/Logo';
import { Particles } from '../components/Particles';
import { AuroraHero } from '../components/Aurora';
import { Card3D } from '../components/Card3D';
import { MagneticButton } from '../components/MagneticButton';
import { GradientText } from '../components/GradientText';
import { GlowOrb } from '../components/GlowOrb';
import {
  BoltIcon,
  CalendarIcon,
  ChartIcon,
  ClockIcon,
  LayersIcon,
  ShieldIcon,
  CheckIcon,
  ArrowRightIcon,
  TgIcon,
  BoostyIcon,
} from '../components/icons';

const FEATURES = [
  { icon: CalendarIcon, title: 'Единый календарь', text: 'Планируйте посты для всех каналов в одном окне. Перетаскивайте, дублируйте, ставьте тайминги.', color: '#d4ff3a' },
  { icon: BoltIcon, title: 'Автопостинг', text: 'Публикуйте точно в срок — вручную или по расписанию. Надёжная очередь с повторами.', color: '#00e5ff' },
  { icon: LayersIcon, title: 'Несколько каналов', text: 'Подключайте Telegram, Pinterest, YouTube и Instagram. Один пост — все платформы.', color: '#8b5cf6' },
  { icon: ChartIcon, title: 'Аналитика', text: 'Просмотры, реакции и охваты по каждому посту — в одном сводном отчёте.', color: '#f472b6' },
  { icon: ShieldIcon, title: 'Безопасно', text: 'Токены шифруются, доступ — только ваш. Отключайте каналы одной кнопкой.', color: '#4ade80' },
  { icon: ClockIcon, title: 'Часовые пояса', text: 'Указывайте время в своём поясе — публикация уходит в нужный момент.', color: '#fbbf24' },
];

const STEPS = [
  { n: '01', title: 'Подключите каналы', text: 'Добавьте бота в админы ваших Telegram-каналов за минуту.' },
  { n: '02', title: 'Создайте пост', text: 'Текст, фото, видео — и выберите каналы для публикации.' },
  { n: '03', title: 'Поставьте расписание', text: 'Выберите дату и время или опубликуйте сразу.' },
  { n: '04', title: 'Готово', text: 'Neonix публикует за вас и считает результаты.' },
];

const PLANS = [
  { name: 'Free', price: '0', period: 'навсегда', desc: 'Для пробы инструмента', features: ['3 аккаунта на платформу', '30 постов / мес', 'Календарь', 'Базовая аналитика', 'Шаблоны постов'], cta: 'Начать бесплатно', highlight: false },
  { name: 'Pro', price: '790', period: '/мес', desc: 'Для активных авторов', features: ['15 аккаунтов на платформу', 'Безлимит постов', 'Массовая загрузка (до 50)', 'Полная аналитика', 'Приоритетная очередь', 'Приоритетная поддержка'], cta: 'Получить Pro', highlight: true },
  { name: 'Business', price: '2490', period: '/мес', desc: 'Для команд и агентств', features: ['До 30 каналов', 'Команда и роли', 'Шаблоны и каскадная публикация', 'Экспорт отчётов', 'Персональная поддержка'], cta: 'Обсудить', highlight: false },
];

const PLATFORMS = [
  { name: 'Telegram', icon: '✈', color: '#38bdf8' },
  { name: 'Pinterest', icon: '📌', color: '#f87171' },
  { name: 'YouTube', icon: '▶', color: '#ef4444' },
  { name: 'Instagram', icon: '📷', color: '#f472b6' },
];

export function LandingPage() {
  return (
    <div className="min-h-screen overflow-hidden">
      <Navbar />

      {/* Hero */}
      <section className="relative min-h-screen flex items-center">
        <AuroraHero />
        <div className="absolute inset-0 cyber-grid opacity-40" />
        <Particles count={40} className="opacity-40" />
        <div className="absolute scan-line" />

        <div className="container-app relative z-10 py-20 sm:py-28">
          <div className="mx-auto max-w-4xl text-center">
            {/* Platform pills */}
            <div className="mb-8 flex flex-wrap items-center justify-center gap-3">
              {PLATFORMS.map((p) => (
                <div key={p.name} className="flex items-center gap-2 rounded-full border border-white/5 bg-white/[0.02] backdrop-blur-sm px-4 py-2 text-xs font-medium text-graphite-300 hover:border-white/10 transition-all duration-300">
                  <span style={{ color: p.color }}>{p.icon}</span>
                  {p.name}
                </div>
              ))}
            </div>

            {/* Title */}
            <h1 className="font-display text-5xl font-bold leading-[1.1] tracking-tight text-white sm:text-7xl lg:text-8xl">
              <span className="inline-block">Планируйте посты.</span>
              <br />
              <GradientText variant="rainbow" className="text-5xl sm:text-7xl lg:text-8xl">
                Публикуйте автоматически.
              </GradientText>
            </h1>

            <p className="mx-auto mt-8 max-w-2xl text-lg text-graphite-400 leading-relaxed">
              Один календарь для всех каналов. Создавайте контент,
              назначайте время и публикуйте в Telegram, Pinterest, YouTube и Instagram разом.
            </p>

            {/* CTA */}
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <MagneticButton className="btn-primary btn-xl btn-ripple">
                <Link to="/register" className="flex items-center gap-2">
                  Начать бесплатно <ArrowRightIcon className="h-5 w-5" />
                </Link>
              </MagneticButton>
              <Link to="/login" className="btn-ghost btn-lg">
                Войти в кабинет
              </Link>
            </div>

            <p className="mt-6 text-sm text-graphite-500">
              Без карты · 3 аккаунта бесплатно · Pro от 7 дней по промокоду
            </p>
          </div>

          {/* Orbiting platforms */}
          <div className="relative mx-auto mt-20 h-80 w-80 sm:h-96 sm:w-96">
            <GlowOrb color="#d4ff3a" size={300} blur={120} className="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-2xl bg-gradient-to-br from-graphite-800 to-graphite-900 border border-graphite-700/50 flex items-center justify-center shadow-neon-strong animate-morph">
              <span className="text-3xl font-display font-black text-lime">N</span>
            </div>
            {/* Orbiting icons */}
            {PLATFORMS.map((p, i) => (
              <div
                key={p.name}
                className="absolute top-1/2 left-1/2"
                style={{
                  animation: `orbit ${15 + i * 3}s linear infinite`,
                  animationDelay: `${-i * 3}s`,
                }}
              >
                <div
                  className="w-12 h-12 -ml-6 -mt-6 rounded-xl flex items-center justify-center text-lg backdrop-blur-sm border border-white/10 bg-white/[0.03]"
                  style={{ boxShadow: `0 0 20px ${p.color}30` }}
                >
                  {p.icon}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-graphite-500 animate-bounce">
          <span className="text-xs font-medium tracking-wider uppercase">Скролльте вниз</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14m-7-7l7 7 7-7"/></svg>
        </div>
      </section>

      {/* Stats */}
      <section className="relative border-y border-graphite-800/50 overflow-hidden">
        <div className="absolute inset-0 data-grid opacity-30" />
        <div className="container-app relative grid grid-cols-2 gap-6 py-16 text-center sm:grid-cols-4">
          {[
            { v: '98%', l: 'успешных публикаций', icon: '⚡', color: '#4ade80' },
            { v: '< 5 с', l: 'до отправки', icon: '⏱', color: '#00e5ff' },
            { v: '4', l: 'платформы', icon: '🚀', color: '#d4ff3a' },
            { v: '24/7', l: 'очередь публикаций', icon: '🔄', color: '#8b5cf6' },
          ].map((s) => (
            <div key={s.l} className="group relative">
              <div className="mb-4 text-3xl transition-transform duration-500 group-hover:scale-125 group-hover:rotate-12">{s.icon}</div>
              <div className="font-display text-4xl font-bold tracking-tight" style={{ color: s.color, textShadow: `0 0 30px ${s.color}30` }}>{s.v}</div>
              <div className="mt-2 text-sm text-graphite-500 font-medium">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative py-24 sm:py-32">
        <GlowOrb color="#00e5ff" size={400} blur={150} className="top-0 right-0 opacity-30" />
        <div className="container-app relative z-10">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-lime/20 bg-lime/5 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-lime">
              <span className="h-1.5 w-1.5 rounded-full bg-lime animate-pulse" />
              Возможности
            </div>
            <h2 className="font-display text-4xl font-bold text-white sm:text-5xl tracking-tight">
              Всё для регулярного <GradientText variant="lime">контента</GradientText>
            </h2>
            <p className="mt-5 text-graphite-400 text-lg">
              Перестаньте публиковать руками. Neonix берёт рутину на себя.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 stagger">
            {FEATURES.map((f) => (
              <Card3D key={f.title} glowColor={`${f.color}15`}>
                <div className="card-glass p-8 group relative overflow-hidden h-full">
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                       style={{ background: `radial-gradient(400px circle at 50% 0%, ${f.color}08, transparent 60%)` }} />
                  <div className="relative">
                    <div className="mb-5 inline-grid h-14 w-14 place-items-center rounded-2xl transition-all duration-500 group-hover:shadow-lg group-hover:scale-110 group-hover:rotate-3"
                         style={{ background: `${f.color}10`, boxShadow: `0 0 0 1px ${f.color}30` }}>
                      <f.icon className="h-6 w-6" style={{ color: f.color }} />
                    </div>
                    <h3 className="font-display text-xl font-bold text-white group-hover:text-lime transition-colors duration-300">{f.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-graphite-400">{f.text}</p>
                  </div>
                </div>
              </Card3D>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="relative border-y border-graphite-800/50 overflow-hidden">
        <div className="absolute inset-0 mesh-gradient opacity-50" />
        <div className="container-app relative z-10 py-24 sm:py-32">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="font-display text-4xl font-bold text-white sm:text-5xl">
              <span className="glitch-text inline-block">Четыре шага</span> до первого поста
            </h2>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <div key={s.n} className="relative group">
                <div className="font-display text-6xl font-black text-graphite-800 group-hover:text-graphite-700 transition-colors duration-500">{s.n}</div>
                <div className="gradient-line my-4 opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
                <h3 className="font-display text-xl font-bold text-graphite-100 group-hover:text-lime transition-colors duration-300">{s.title}</h3>
                <p className="mt-3 text-sm text-graphite-400 leading-relaxed">{s.text}</p>
                {/* Step connector */}
                {i < STEPS.length - 1 && (
                  <div className="hidden lg:block absolute top-8 -right-4 w-8 text-graphite-700">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M5 12h14m-7-7l7 7-7 7"/></svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="relative py-24 sm:py-32">
        <div className="container-app">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="font-display text-4xl font-bold text-white sm:text-5xl">Нам доверяют</h2>
            <p className="mt-4 text-graphite-400 text-lg">Контент-мейкеры и команды по всему миру</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              { name: 'Алексей К.', role: 'Блогер, 50K подписчиков', text: 'Наконец-то могу планировать посты на неделю вперёд. Экономлю по 3 часа в день.', rating: 5 },
              { name: 'Мария В.', role: 'SMM-агентство', text: 'Управляем 30+ каналами клиентов из одного интерфейса. Календарь — спасение.', rating: 5 },
              { name: 'Дмитрий С.', role: 'YouTube + Telegram', text: 'Кросспостинг между платформами работает безупречно. Рекомендую.', rating: 5 },
            ].map((review) => (
              <Card3D key={review.name} glowColor="rgba(212,255,58,0.08)">
                <div className="card-glass p-8 h-full">
                  <div className="flex items-center gap-1 mb-4">
                    {Array.from({ length: review.rating }).map((_, i) => (
                      <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill="#d4ff3a"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                    ))}
                  </div>
                  <p className="text-sm text-graphite-300 leading-relaxed mb-6">"{review.text}"</p>
                  <div>
                    <div className="text-sm font-bold text-white">{review.name}</div>
                    <div className="text-xs text-graphite-500 mt-0.5">{review.role}</div>
                  </div>
                </div>
              </Card3D>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="relative py-24 sm:py-32 overflow-hidden">
        <GlowOrb color="#8b5cf6" size={400} blur={150} className="top-1/2 left-0 -translate-y-1/2 opacity-20" />
        <div className="container-app relative z-10">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="font-display text-4xl font-bold text-white sm:text-5xl">Тарифы</h2>
            <p className="mt-4 text-graphite-300 text-lg">Начните бесплатно. Переходите на Pro когда вырастете.</p>
          </div>
          <div className="grid gap-8 lg:grid-cols-3">
            {PLANS.map((p) => (
              <Card3D key={p.name} glowColor={p.highlight ? 'rgba(212,255,58,0.15)' : 'rgba(255,255,255,0.03)'}>
                <div className={`card-glass relative flex flex-col p-8 transition-all duration-500 h-full ${
                  p.highlight ? 'border-lime/30 shadow-neon-strong ring-1 ring-lime/20' : ''
                }`}>
                  {p.highlight && (
                    <span className="absolute -top-3 left-8 rounded-full bg-lime px-4 py-1 text-xs font-bold text-graphite-950 animate-pulse-glow">
                      Популярный
                    </span>
                  )}
                  <h3 className="font-display text-2xl font-bold text-white">{p.name}</h3>
                  <p className="mt-1 text-sm text-graphite-400">{p.desc}</p>
                  <div className="mt-6 flex items-baseline gap-1">
                    <span className="font-display text-4xl font-black text-white">{p.price}₽</span>
                    <span className="text-sm text-graphite-500">{p.period}</span>
                  </div>
                  <ul className="mt-6 flex-1 space-y-3">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-3 text-sm text-graphite-200">
                        <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-lime" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <MagneticButton className={`mt-8 ${p.highlight ? 'btn-primary btn-lg w-full' : 'btn-ghost btn-lg w-full'}`}>
                    <Link to="/register" className="w-full flex items-center justify-center">
                      {p.cta}
                    </Link>
                  </MagneticButton>
                </div>
              </Card3D>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container-app pb-24">
        <div className="relative overflow-hidden rounded-3xl border border-white/5 p-12 text-center sm:p-20">
          <div className="absolute inset-0 mesh-gradient" />
          <div className="absolute inset-0 cyber-grid opacity-30" />
          <Particles count={20} className="opacity-20" />
          <div className="relative mx-auto max-w-2xl z-10">
            <h2 className="font-display text-4xl font-bold text-white sm:text-5xl">
              <span className="glitch-text inline-block">Готовы делегировать</span>
              <br />
              <GradientText variant="neon" className="text-4xl sm:text-5xl">автопостинг?</GradientText>
            </h2>
            <p className="mt-5 text-graphite-300 text-lg">
              Создайте аккаунт за полминуты и запланируйте первый пост сегодня.
            </p>
            <MagneticButton className="btn-primary btn-xl mt-8 pulse-glow">
              <Link to="/register" className="flex items-center gap-2">
                Начать бесплатно <ArrowRightIcon className="h-5 w-5" />
              </Link>
            </MagneticButton>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function Footer() {
  return (
    <footer className="border-t border-graphite-800/50 bg-graphite-950">
      <div className="container-app grid gap-8 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-1">
          <Logo />
          <p className="mt-4 max-w-xs text-sm text-graphite-400 leading-relaxed">
            Планирование и автопостинг для контент-мейкеров и команд.
          </p>
          <div className="mt-5 flex items-center gap-3">
            <a href="https://boosty.to/eb4soft" target="_blank" rel="noopener noreferrer"
               className="grid h-10 w-10 place-items-center rounded-xl border border-graphite-700 bg-graphite-850 text-graphite-300 transition hover:border-lime/40 hover:text-lime hover:shadow-glow-sm"
               title="Блог на Boosty">
              <BoostyIcon className="h-4 w-4" />
            </a>
            <a href="https://t.me/eb4soft" target="_blank" rel="noopener noreferrer"
               className="grid h-10 w-10 place-items-center rounded-xl border border-graphite-700 bg-graphite-850 text-graphite-300 transition hover:border-lime/40 hover:text-lime hover:shadow-glow-sm"
               title="Telegram-канал">
              <TgIcon className="h-4 w-4" />
            </a>
          </div>
        </div>
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-graphite-300">Продукт</h4>
          <ul className="mt-4 space-y-2.5">
            <li><a href="#features" className="text-sm text-graphite-400 transition hover:text-lime">Возможности</a></li>
            <li><a href="#pricing" className="text-sm text-graphite-400 transition hover:text-lime">Тарифы</a></li>
            <li><Link to="/blog" className="text-sm text-graphite-400 transition hover:text-lime">Блог</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-graphite-300">Ресурсы</h4>
          <ul className="mt-4 space-y-2.5">
            <li><Link to="/help" className="text-sm text-graphite-400 transition hover:text-lime">База знаний</Link></li>
            <li><Link to="/help" className="text-sm text-graphite-400 transition hover:text-lime">Поддержка</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-graphite-300">Правовое</h4>
          <ul className="mt-4 space-y-2.5">
            <li><Link to="/terms" className="text-sm text-graphite-400 transition hover:text-lime">Условия</Link></li>
            <li><Link to="/privacy" className="text-sm text-graphite-400 transition hover:text-lime">Конфиденциальность</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-graphite-800">
        <div className="container-app flex flex-col items-center justify-between gap-2 py-6 text-xs text-graphite-500 sm:flex-row">
          <span>© 2026 Neonix. Все права защищены.</span>
          <span className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-lime animate-pulse" />
            Сделано для тех, кто публикует регулярно.
          </span>
        </div>
      </div>
    </footer>
  );
}
