import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { Logo } from './Logo';

const NAV_ITEMS = [
  { href: '/app', label: 'Главная', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { href: '/app/channels', label: 'Каналы', icon: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1' },
  { href: '/app/posts', label: 'Посты', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
  { href: '/app/calendar', label: 'Календарь', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { href: '/app/analytics', label: 'Аналитика', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
];

const BOTTOM_ITEMS = [
  { href: '/app/profile', label: 'Профиль', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
  { href: '/app/settings', label: 'Настройки', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
  { href: '/help', label: 'Помощь', icon: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
];

function NavIcon({ d, active }: { d: string; active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.7} strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('neonix_sidebar_collapsed') === 'true');
  const w = collapsed ? 'w-[64px]' : 'w-56';

  const toggleCollapse = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem('neonix_sidebar_collapsed', String(next));
  };

  const onLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  return (
    <aside className={`hidden shrink-0 lg:flex lg:flex-col lg:sticky lg:top-0 lg:h-screen transition-all duration-200 ${w} border-r border-graphite-800/30`}>
      {/* Header */}
      <div className="flex h-14 items-center border-b border-graphite-800/30 px-4">
        {!collapsed && (
          <div className="flex-1">
            <Logo />
          </div>
        )}
        <button
          onClick={toggleCollapse}
          className="p-1 rounded-lg text-graphite-500 hover:text-graphite-200 transition"
          title={collapsed ? 'Развернуть' : 'Свернуть'}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            {collapsed ? <path d="M4 6h16M4 12h16M4 18h16" /> : <path d="M6 18L18 6M6 6l12 12" />}
          </svg>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 px-2 py-3 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const active = item.href === '/app'
            ? location.pathname === '/app'
            : location.pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              to={item.href}
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors ${
                active
                  ? 'bg-graphite-800/60 text-white'
                  : 'text-graphite-400 hover:text-graphite-200 hover:bg-graphite-800/30'
              } ${collapsed ? 'justify-center' : ''}`}
            >
              <NavIcon d={item.icon} active={active} />
              {!collapsed && item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="mt-auto border-t border-graphite-800/30 px-2 py-2 space-y-0.5">
        {BOTTOM_ITEMS.map((item) => {
          const active = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors ${
                active
                  ? 'bg-graphite-800/60 text-white'
                  : 'text-graphite-500 hover:text-graphite-300 hover:bg-graphite-800/30'
              } ${collapsed ? 'justify-center' : ''}`}
            >
              <NavIcon d={item.icon} active={active} />
              {!collapsed && item.label}
            </Link>
          );
        })}
      </div>

      {/* User */}
      <div className="border-t border-graphite-800/30 p-2">
        <div className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 hover:bg-graphite-800/30 transition-colors ${collapsed ? 'justify-center' : ''}`}>
          <div className="h-7 w-7 shrink-0 rounded-lg bg-graphite-800 flex items-center justify-center text-[11px] font-semibold text-graphite-300">
            {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-medium text-graphite-200">{user?.name || 'Пользователь'}</div>
              <div className="truncate text-[11px] text-graphite-500">{user?.email}</div>
            </div>
          )}
          {!collapsed && (
            <button onClick={onLogout} className="p-1 rounded text-graphite-600 hover:text-red-400 transition" title="Выйти">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4m7 14l5-5-5-5m5 5H9" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
