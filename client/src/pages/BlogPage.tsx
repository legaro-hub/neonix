import { Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';

const POSTS = [
  {
    slug: 'multi-platform',
    date: '22 июня 2026',
    title: 'Один календарь — четыре платформы: Telegram, Pinterest, YouTube, Instagram',
    excerpt: 'Теперь Neonix поддерживает все популярные площадки. Планируйте и публикуйте посты в одной системе.',
    tag: 'Новости',
    image: '🌐',
    color: '#1a1f2e',
  },
  {
    slug: 'smart-editor',
    date: '21 июня 2026',
    title: 'Шаблоны постов, Telegram-кнопки и карусели Pinterest',
    excerpt: 'Редактор стал умнее: шаблоны для быстрого старта, Telegram-кнопки одной кнопкой, карусели изображений для Pinterest.',
    tag: 'Фичи',
    image: '⚡',
    color: '#1a2e1a',
  },
  {
    slug: 'deep-analytics',
    date: '21 июня 2026',
    title: 'Аналитика каждого канала: демография, охват, время публикаций',
    excerpt: 'Кликните на любой канал — и увидите всё: подписчиков, просмотры, лучшие часы, устройство аудитории.',
    tag: 'Аналитика',
    image: '📊',
    color: '#2e2e1a',
  },
  {
    slug: 'launch',
    date: '16 июня 2026',
    title: 'Neonix запущен! Планируйте посты автоматически',
    excerpt: 'Бета-версия готова. Один календарь, несколько каналов, бот публикует за вас. Регистрация бесплатная.',
    tag: 'Новости',
    image: '🚀',
    color: '#2e1a2e',
  },
  {
    slug: 'best-time-to-post',
    date: '16 июня 2026',
    title: 'Когда постить: лучшие временные слоты для максимального охвата',
    excerpt: 'Мы проанализировали тысячи публикаций и выяснили, когда посты получают больше всего внимания.',
    tag: 'Аналитика',
    image: '⏰',
    color: '#2e2e1a',
  },
  {
    slug: 'promo-codes',
    date: '20 июня 2026',
    title: 'Промокоды и тарифы: как получить Pro бесплатно',
    excerpt: 'Используйте промокод при регистрации и получите Pro-план в подарок. Шаблоны, аналитика и безлимитные посты.',
    tag: 'Тарифы',
    image: '🎁',
    color: '#2e1a1a',
  },
];

export function BlogPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container-app py-16">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-bold text-white sm:text-4xl">Блог</h1>
          <p className="mt-4 text-graphite-400">
            Новости, советы и гайды по автоматизации контента.
          </p>

          <div className="mt-10 space-y-6">
            {POSTS.map((post) => (
              <Link to={`/blog/${post.slug}`} key={post.slug} className="block card overflow-hidden transition hover:border-graphite-600">
                <div className="flex h-36 items-center justify-center text-5xl" style={{ background: post.color }}>
                  {post.image}
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="chip text-[10px]">{post.tag}</span>
                    <span className="text-xs text-graphite-400">{post.date}</span>
                  </div>
                  <h2 className="text-lg font-bold text-white">{post.title}</h2>
                  <p className="mt-2 text-sm text-graphite-400 leading-relaxed">{post.excerpt}</p>
                  <span className="inline-block mt-4 text-sm font-semibold text-lime hover:underline">Читать далее →</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
