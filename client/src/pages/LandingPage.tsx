import { Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Logo } from '../components/Logo';
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
  {
    icon: CalendarIcon,
    title: 'Единый календарь',
    text: 'Планируйте посты для всех каналов в одном окне. Перетаскивайте, дублируйте, ставьте тайминги на неделю вперёд.',
  },
  {
    icon: BoltIcon,
    title: 'Автопостинг',
    text: 'Публикуйте точно в срок — вручную или по расписанию. Надёжная очередь с повторами при сбоях.',
  },
  {
    icon: LayersIcon,
    title: 'Несколько каналов',
    text: 'Подключайте любое число Telegram-каналов и публикуйте один пост сразу в несколько из них.',
  },
  {
    icon: ChartIcon,
    title: 'Аналитика',
    text: 'Просмотры, реакции и охваты по каждому посту — в одном сводном отчёте.',
  },
  {
    icon: ShieldIcon,
    title: 'Безопасно',
    text: 'Токены шифруются, доступ — только ваш. Отключайте каналы одной кнопкой, токен отзывается мгновенно.',
  },
  {
    icon: ClockIcon,
    title: 'Часовые пояса',
    text: 'Указывайте время в своём поясе — публикация уходит в нужный момент независимо от сервера.',
  },
];

const STEPS = [
  { n: '01', title: 'Подключите каналы', text: 'Добавьте бота в админы ваших Telegram-каналов за минуту.' },
  { n: '02', title: 'Создайте пост', text: 'Текст, фото, видео — и выберите каналы для публикации.' },
  { n: '03', title: 'Поставьте расписание', text: 'Выберите дату и время или опубликуйте сразу.' },
  { n: '04', title: 'Готово', text: 'Neonix публикует за вас и считает результаты.' },
];

const PLANS = [
  {
    name: 'Free',
    desc: 'Для пробы инструмента',
    features: ['3 аккаунта на платформу', '30 постов / мес', 'Календарь', 'Базовая аналитика', 'Шаблоны постов'],
    cta: 'Начать бесплатно',
    highlight: false,
  },
  {
    name: 'Pro',
    desc: 'Для активных авторов',
    features: ['15 аккаунтов на платформу', 'Безлимит постов', 'Массовая загрузка (до 50)', 'Полная аналитика', 'Приоритетная очередь', 'Приоритетная поддержка'],
    cta: 'Получить Pro',
    highlight: true,
  },
  {
    name: 'Business',
    desc: 'Для команд и агентств',
    features: ['До 30 каналов', 'Команда и роли', 'Шаблоны и каскадная публикация', 'Экспорт отчётов', 'Персональная поддержка'],
    cta: 'Обсудить',
    highlight: false,
  },
];

export function LandingPage() {
  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-grid-faint bg-[size:48px_48px] [mask-image:radial-gradient(60%_60%_at_50%_0%,black,transparent)]" />
        <div className="container-app relative py-20 sm:py-28">
          {/* Floating orbs */}
          <div className="absolute top-20 left-10 h-32 w-32 rounded-full bg-lime/5 orb" style={{ animationDelay: '0s' }} />
          <div className="absolute top-40 right-20 h-24 w-24 rounded-full bg-cyan-500/5 orb" style={{ animationDelay: '2s' }} />
          <div className="absolute bottom-20 left-1/3 h-20 w-20 rounded-full bg-violet-500/5 orb" style={{ animationDelay: '4s' }} />

          <div className="mx-auto max-w-3xl text-center relative z-10">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-lime/20 bg-lime/5 px-4 py-1.5 text-xs font-medium text-lime backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-lime pulse-dot" />
              Telegram · Pinterest · YouTube · Instagram
            </div>
            <h1 className="font-display text-4xl font-bold leading-tight tracking-tight text-white sm:text-6xl lg:text-7xl">
              <span className="inline-block">Планируйте посты.</span>
              <br />
              <span className="holo-text">Публикуйте автоматически.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg text-graphite-400 leading-relaxed">
              Один календарь для всех каналов. Создавайте контент,
              назначайте время и публикуйте в Telegram, Pinterest, YouTube и Instagram разом.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to="/register" className="btn-primary btn-ripple w-full sm:w-auto">
                Начать бесплатно <ArrowRightIcon className="h-4 w-4" />
              </Link>
              <a href="#how" className="btn-ghost w-full sm:w-auto">
                Как это работает
              </a>
            </div>
            <p className="mt-5 text-xs text-graphite-500">
              Без карты · 3 аккаунта бесплатно · Pro от 7 дней по промокоду
            </p>
          </div>

          {/* App mockup */}
          <div className="relative mx-auto mt-20 max-w-5xl" style={{ animation: 'float 6s ease-in-out infinite' }}>
            <div className="absolute -inset-x-12 -top-8 h-72 bg-lime/8 blur-[100px] rounded-full" />
            <div className="absolute -inset-x-8 top-1/2 h-48 bg-cyan-500/5 blur-[80px] rounded-full" />
            <div className="card glass-card relative overflow-hidden p-1 glow-border">
              <div className="rounded-2xl bg-graphite-950 p-5 noise relative">
                <CalendarMockup />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="relative border-y border-graphite-800/50 overflow-hidden">
        <div className="absolute inset-0 data-grid opacity-50" />
        <div className="container-app relative grid grid-cols-2 gap-6 py-12 text-center sm:grid-cols-4">
          {[
            { v: '98%', l: 'успешных публикаций', icon: '⚡', color: '#4fae4e' },
            { v: '< 5 с', l: 'до отправки', icon: '⏱', color: '#00e5ff' },
            { v: '4', l: 'платформы', icon: '🚀', color: '#d4ff3a' },
            { v: '24/7', l: 'очередь публикаций', icon: '🔄', color: '#8b5cf6' },
          ].map((s) => (
            <div key={s.l} className="group relative">
              <div className="mb-3 text-2xl transition-transform duration-300 group-hover:scale-110">{s.icon}</div>
              <div className="font-display text-3xl font-bold tracking-tight" style={{ color: s.color, textShadow: `0 0 20px ${s.color}40` }}>{s.v}</div>
              <div className="mt-1 text-xs text-graphite-500 font-medium">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="container-app py-20 sm:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-lime/20 bg-lime/5 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-lime">
            Возможности
          </div>
          <h2 className="font-display text-3xl font-bold text-white sm:text-4xl tracking-tight">
            Всё для регулярного контента
          </h2>
          <p className="mt-4 text-graphite-400">
            Перестаньте публиковать руками. Neonix берёт рутину на себя.
          </p>
        </div>
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 stagger">
          {FEATURES.map((f) => (
            <div key={f.title} className="card card-glow hover-lift p-6 group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-lime/3 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative">
                <div className="mb-4 inline-grid h-11 w-11 place-items-center rounded-xl bg-lime/10 text-lime ring-1 ring-lime/20 group-hover:ring-lime/40 group-hover:shadow-lg group-hover:shadow-lime/10 transition-all duration-300">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="font-display text-lg font-semibold text-white group-hover:text-lime transition-colors">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-graphite-400">{f.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-y border-graphite-800 bg-graphite-900/30 cyber-grid">
        <div className="container-app py-20 sm:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">
              <span className="glitch-text inline-block">Четыре шага</span> до первого запланированного поста
            </h2>
          </div>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s) => (
              <div key={s.n} className="relative group">
                <div className="font-display text-4xl font-bold text-lime/20 group-hover:text-lime/40 transition">{s.n}</div>
                <div className="cyber-line my-3" />
                <h3 className="mt-3 font-display text-lg font-semibold text-graphite-100 group-hover:text-lime transition">{s.title}</h3>
                <p className="mt-2 text-sm text-graphite-300">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="container-app py-20 sm:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">Тарифы</h2>
          <p className="mt-4 text-graphite-300">Начните бесплатно. Переходите на Pro когда вырастете.</p>
        </div>
        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {PLANS.map((p) => (
            <div
              key={p.name}
              className={`card relative flex flex-col p-7 transition-all duration-300 ${
                p.highlight ? 'border-lime/40 shadow-glow-sm pulse-glow' : 'hover:border-graphite-600'
              }`}
            >
              {p.highlight && (
                <span className="absolute -top-3 left-7 rounded-full bg-lime px-3 py-1 text-xs font-bold text-graphite-950 cyber-flicker">
                  Популярный
                </span>
              )}
              <h3 className="font-display text-xl font-bold text-white">{p.name}</h3>
              <p className="mt-1 text-sm text-graphite-400">{p.desc}</p>
              <ul className="mt-5 flex-1 space-y-3">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-graphite-200">
                    <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-lime" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                to="/register"
                className={`mt-7 ${p.highlight ? 'btn-primary' : 'btn-ghost'}`}
              >
                {p.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container-app pb-24">
        <div className="card relative overflow-hidden p-10 text-center sm:p-16 cyber-grid">
          <div className="pointer-events-none absolute inset-0 bg-grid-faint bg-[size:40px_40px] opacity-50" />
          <div className="relative mx-auto max-w-2xl">
            <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">
              <span className="glitch-text inline-block">Готовы делегировать</span>
              <br />
              <span className="text-lime neon-glow">автопостинг?</span>
            </h2>
            <p className="mt-4 text-graphite-300">
              Создайте аккаунт за полминуты и запланируйте первый пост сегодня.
            </p>
            <Link to="/register" className="btn-primary mt-8 pulse-glow">
              Начать бесплатно <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function CalendarMockup() {
  const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  const posts = [
    { day: 0, time: '10:00', title: 'Анонс вебинара', color: 'bg-lime/20 text-lime border-lime/40' },
    { day: 1, time: '14:30', title: 'Гайд по продукту', color: 'bg-graphite-700/60 text-graphite-100 border-graphite-600' },
    { day: 2, time: '09:00', title: 'Новость недели', color: 'bg-graphite-700/60 text-graphite-100 border-graphite-600' },
    { day: 4, time: '18:00', title: 'Дайджест', color: 'bg-lime/20 text-lime border-lime/40' },
  ];
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-lime" />
          <span className="font-display font-semibold text-graphite-100">Июнь 2026</span>
        </div>
        <div className="flex gap-2">
          <span className="chip"><TgIcon className="h-3 w-3 text-lime" /> 3 канала</span>
          <span className="chip">12 постов</span>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-medium text-graphite-400">
        {days.map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-7 gap-2">
        {Array.from({ length: 28 }).map((_, i) => {
          const post = posts.find((p) => p.day === i % 7);
          return (
            <div
              key={i}
              className="min-h-[64px] rounded-lg border border-graphite-800 bg-graphite-900/50 p-1.5"
            >
              <div className="text-[10px] text-graphite-500">{i + 1}</div>
              {post && (
                <div className={`mt-1 rounded-md border px-1.5 py-1 text-[9px] ${post.color}`}>
                  <div className="font-semibold">{post.time}</div>
                  <div className="truncate opacity-80">{post.title}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="border-t border-graphite-800/50 bg-graphite-950">
      <div className="container-app grid gap-8 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-1">
          <Logo />
          <p className="mt-3 max-w-xs text-sm text-graphite-400 leading-relaxed">
            Планирование и автопостинг для контент-мейкеров и команд.
          </p>
          <div className="mt-4 flex items-center gap-3">
            <a
              href="https://boosty.to/eb4soft"
              target="_blank"
              rel="noopener noreferrer"
              className="grid h-9 w-9 place-items-center rounded-xl border border-graphite-700 bg-graphite-850 text-graphite-300 transition hover:border-lime/40 hover:text-lime"
              title="Блог на Boosty"
            >
              <BoostyIcon className="h-4 w-4" />
            </a>
            <a
              href="https://t.me/eb4soft"
              target="_blank"
              rel="noopener noreferrer"
              className="grid h-9 w-9 place-items-center rounded-xl border border-graphite-700 bg-graphite-850 text-graphite-300 transition hover:border-lime/40 hover:text-lime"
              title="Telegram-канал"
            >
              <TgIcon className="h-4 w-4" />
            </a>
          </div>
        </div>
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-graphite-300">Продукт</h4>
          <ul className="mt-3 space-y-2">
            <li><a href="#features" className="text-sm text-graphite-400 transition hover:text-lime">Возможности</a></li>
            <li><a href="#pricing" className="text-sm text-graphite-400 transition hover:text-lime">Тарифы</a></li>
            <li><Link to="/blog" className="text-sm text-graphite-400 transition hover:text-lime">Блог</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-graphite-300">Ресурсы</h4>
          <ul className="mt-3 space-y-2">
            <li><Link to="/help" className="text-sm text-graphite-400 transition hover:text-lime">База знаний</Link></li>
            <li><Link to="/help" className="text-sm text-graphite-400 transition hover:text-lime">Поддержка</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-graphite-300">Правовое</h4>
          <ul className="mt-3 space-y-2">
            <li><Link to="/terms" className="text-sm text-graphite-400 transition hover:text-lime">Условия</Link></li>
            <li><Link to="/privacy" className="text-sm text-graphite-400 transition hover:text-lime">Конфиденциальность</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-graphite-800">
        <div className="container-app flex flex-col items-center justify-between gap-2 py-6 text-xs text-graphite-500 sm:flex-row">
          <span>© 2026 Neonix. Все права защищены.</span>
          <span>Сделано для тех, кто публикует регулярно.</span>
        </div>
      </div>
    </footer>
  );
}
