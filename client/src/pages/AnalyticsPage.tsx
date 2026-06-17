import { Sidebar } from '../components/Sidebar';

export function AnalyticsPage() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-10">
        <h1 className="font-display text-2xl font-bold text-white mb-6">Аналитика</h1>
        <div className="card p-8 text-center">
          <div className="text-4xl mb-4">📊</div>
          <h2 className="font-display text-xl font-bold text-white">Аналитика публикаций</h2>
          <p className="mt-2 text-sm text-graphite-300 max-w-md mx-auto">
            Просмотры, реакции, охваты — по каждому посту и каналу.
          </p>
          <p className="mt-4 text-xs text-graphite-500">🚧 Скоро будет доступно</p>
        </div>
      </main>
    </div>
  );
}
