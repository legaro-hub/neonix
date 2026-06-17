import { Link } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';

export function ChannelsPage() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-10">
        <h1 className="font-display text-2xl font-bold text-white mb-6">Каналы</h1>
        <div className="card p-8 text-center">
          <div className="text-4xl mb-4">📡</div>
          <h2 className="font-display text-xl font-bold text-white">Управление каналами</h2>
          <p className="mt-2 text-sm text-graphite-300 max-w-md mx-auto">
            Подключайте Telegram-каналы, проверяйте статус привязки и управляйте доступом бота.
          </p>
          <Link to="/app" className="btn-primary mt-6 inline-flex">
            Вернуться на главную
          </Link>
        </div>
      </main>
    </div>
  );
}
