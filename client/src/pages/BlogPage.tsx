import { Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';

const POSTS = [
  {
    slug: 'update-june-18',
    date: '18 июня 2026',
    title: 'Обновление: восстановление пароля, исправление багов и 78 тестов',
    excerpt: 'Добавили сброс пароля по email, исправили 6 багов (retry backoff, sendMediaGroup, XSS в email), написали 58 unit-тестов. Домен переехал на neonix.online.',
    tag: 'Обновления',
    image: '🔐',
    color: '#1a1f2e',
  },
  {
    slug: 'update-may',
    date: '17 июня 2026',
    title: 'Обновление: WYSIWYG-редактор, хранилище медиа и Telegram-превью',
    excerpt: 'Добавили редактор постов с форматированием прямо в поле ввода, загрузку медиафайлов и предпросмотр в стиле Telegram.',
    tag: 'Обновления',
    image: '✏️',
    color: '#1a2e1a',
  },
  {
    slug: 'launch',
    date: '16 июня 2026',
    title: 'Neonix запущен! Планируйте посты в Telegram автоматически',
    excerpt: 'Мы запустили бета-версию Neonix — инструмента для планирования и автоматической публикации постов в Telegram-каналы. Рассказываем, как начать.',
    tag: 'Новости',
    image: '🚀',
    color: '#2e1a2e',
  },
  {
    slug: 'telegram-bots-101',
    date: '16 июня 2026',
    title: 'Telegram-боты для SMM: полное руководство',
    excerpt: 'Как создать бота, добавить его в канал и настроить автоматическую публикацию. Пошаговая инструкция для начинающих.',
    tag: 'Гайд',
    image: '🤖',
    color: '#1a2e2e',
  },
  {
    slug: 'best-time-to-post',
    date: '16 июня 2026',
    title: 'Когда публиковать посты: анализ лучших времени для Telegram',
    excerpt: 'Мы проанализировали данные тысяч публикаций и выяснили, в какое время посты получают максимальный охват.',
    tag: 'Аналитика',
    image: '📊',
    color: '#2e2e1a',
  },
];

export function BlogPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container-app py-16">
        <div className="mx-auto max-w-3xl">
          <h1 className="font-display text-3xl font-bold text-white sm:text-4xl">Блог</h1>
          <p className="mt-4 text-graphite-300">
            Гайды, новости и советы по автоматизации SMM. Без сухости — обещаем.
          </p>

          <div className="mt-10 space-y-6">
            {POSTS.map((post) => (
              <Link to={`/blog/${post.slug}`} key={post.slug} className="block card overflow-hidden transition hover:border-graphite-600">
                <div
                  className="flex h-40 items-center justify-center text-6xl"
                  style={{ background: post.color }}
                >
                  {post.image}
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="chip text-[10px]">{post.tag}</span>
                    <span className="text-xs text-graphite-400">{post.date}</span>
                  </div>
                  <h2 className="font-display text-lg font-bold text-white">{post.title}</h2>
                  <p className="mt-2 text-sm text-graphite-300 leading-relaxed">{post.excerpt}</p>
                  <div className="mt-4">
                    <span className="text-sm font-semibold text-lime hover:underline">
                      Читать далее →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
