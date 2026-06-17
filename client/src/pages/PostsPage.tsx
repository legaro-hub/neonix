import { Sidebar } from '../components/Sidebar';

export function PostsPage() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-10">
        <h1 className="font-display text-2xl font-bold text-white mb-6">Посты</h1>
        <div className="card p-8 text-center">
          <div className="text-4xl mb-4">📝</div>
          <h2 className="font-display text-xl font-bold text-white">Редактор постов</h2>
          <p className="mt-2 text-sm text-graphite-300 max-w-md mx-auto">
            Создавайте посты с текстом и медиа, выбирайте каналы для публикации.
          </p>
          <p className="mt-4 text-xs text-graphite-500">🚧 Скоро будет доступно</p>
        </div>
      </main>
    </div>
  );
}
