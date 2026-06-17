import { Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';

const POSTS = [
  {
    slug: 'launch',
    date: '16 июня 2026',
    title: 'Neonix запущен! Планируйте посты в Telegram автоматически',
    excerpt: 'Мы запустили бета-версию Neonix — инструмента для планирования и автоматической публикации постов в Telegram-каналы. Рассказываем, как начать.',
    tag: 'Новости',
  },
  {
    slug: 'telegram-bots-101',
    date: '16 июня 2026',
    title: 'Telegram-боты для SMM: полное руководство',
    excerpt: 'Как создать бота, добавить его в канал и настроить автоматическую публикацию. Пошаговая инструкция для начинающих.',
    tag: 'Гайд',
  },
  {
    slug: 'best-time-to-post',
    date: '16 июня 2026',
    title: 'Когда публиковать посты: анализ лучших времени для Telegram',
    excerpt: 'Мы проанализировали данные тысяч публикаций и выяснили, в какое время посты получают максимальный охват.',
    tag: 'Аналитика',
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
              <Link to={`/blog/${post.slug}`} key={post.slug} className="block card p-6 transition hover:border-graphite-600">
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
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
