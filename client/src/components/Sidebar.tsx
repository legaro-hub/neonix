import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';

const NAV_ITEMS = [
  { href: '/app', label: 'Главная', icon: '🏠' },
  { href: '/app/channels', label: 'Каналы', icon: '📡' },
  { href: '/app/posts', label: 'Посты', icon: '📝' },
  { href: '/app/calendar', label: 'Календарь', icon: '📅' },
  { href: '/app/analytics', label: 'Аналитика', icon: '📊' },
];

const BOTTOM_ITEMS = [
  { href: '/app/profile', label: 'Профиль', icon: '👤' },
  { href: '/app/settings', label: 'Настройки', icon: '⚙️' },
  { href: '/help', label: 'Помощь', icon: '❓' },
];

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const onLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  return (
    <aside className="hidden w-64 shrink-0 border-r border-graphite-800 bg-graphite-900/50 lg:flex lg:flex-col">
      <div className="flex h-16 items-center gap-2 border-b border-graphite-800 px-5">
        <Link to="/app" className="font-display text-lg font-bold text-graphite-100">
          Neon<span className="text-lime">ix</span>
        </Link>
        <span className="chip ml-1 text-[10px]">Beta</span>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const active = item.href === '/app'
            ? location.pathname === '/app'
            : location.pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              to={item.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? 'bg-lime/10 text-lime'
                  : 'text-graphite-300 hover:bg-graphite-800 hover:text-graphite-100'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-graphite-800 px-3 py-3 space-y-1">
        {BOTTOM_ITEMS.map((item) => {
          const active = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${
                active
                  ? 'bg-lime/10 text-lime'
                  : 'text-graphite-300 hover:bg-graphite-800 hover:text-graphite-100'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </div>

      <div className="border-t border-graphite-800 p-3">
        <div className="flex items-center gap-3 rounded-xl px-3 py-2">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-lime/15 text-xs font-bold text-lime ring-1 ring-lime/30">
            {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-graphite-100">{user?.name || 'Пользователь'}</div>
            <div className="truncate text-xs text-graphite-400">{user?.email}</div>
          </div>
          <button onClick={onLogout} className="shrink-0 text-xs text-graphite-500 hover:text-red-400" title="Выйти">
            ↗
          </button>
        </div>
      </div>
    </aside>
  );
}
