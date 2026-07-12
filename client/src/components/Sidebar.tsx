import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { Logo } from './Logo';

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

const MAIN_ITEMS: NavItem[] = [
  { href: '/app', label: 'Главная', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { href: '/app/channels', label: 'Каналы', icon: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1' },
  { href: '/app/posts', label: 'Посты', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
  { href: '/app/calendar', label: 'Календарь', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { href: '/app/analytics', label: 'Аналитика', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
];

const BOTTOM_ITEMS: NavItem[] = [
  { href: '/app/profile', label: 'Профиль', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
  { href: '/app/settings', label: 'Настройки', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
  { href: '/help', label: 'Помощь', icon: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
];

function NavIcon({ d, active }: { d: string; active: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={active ? 2 : 1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={d} />
    </svg>
  );
}

function NavItemComponent({ item, active, collapsed }: { item: NavItem; active: boolean; collapsed: boolean }) {
  return (
    <Link
      to={item.href}
      title={collapsed ? item.label : undefined}
      className={`group flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] font-medium transition-all duration-200 relative ${
        active
          ? 'bg-white/[0.06] text-white'
          : 'text-graphite-400 hover:text-graphite-200 hover:bg-white/[0.03]'
      } ${collapsed ? 'justify-center' : ''}`}
    >
      {active && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[60%] rounded-full bg-lime shadow-[0_0_8px_rgba(212,255,58,0.3)]" />
      )}
      <span className={active ? 'text-white' : 'text-graphite-400 group-hover:text-graphite-200'}>
        <NavIcon d={item.icon} active={active} />
      </span>
      {!collapsed && <span>{item.label}</span>}
    </Link>
  );
}

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('neonix_sidebar_collapsed') === 'true');
  const [showUserMenu, setShowUserMenu] = useState(false);
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

  const isActive = (href: string) =>
    href === '/app' ? location.pathname === '/app' : location.pathname.startsWith(href);

  return (
    <aside className={`hidden shrink-0 lg:flex lg:flex-col lg:sticky lg:top-0 lg:h-screen transition-all duration-300 ${w} bg-graphite-950/80 backdrop-blur-xl border-r border-white/5`}>
      {/* Header */}
      <div className="flex h-14 items-center border-b border-white/5 px-4">
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <Logo />
          </div>
        )}
        <button
          onClick={toggleCollapse}
          className={`p-1.5 rounded-xl text-graphite-500 hover:text-graphite-200 hover:bg-white/[0.05] transition-all duration-200 ${collapsed ? 'w-full flex items-center justify-center' : ''}`}
          title={collapsed ? 'Развернуть' : 'Свернуть'}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            {collapsed ? (
              <path d="M4 6h16M4 12h16M4 18h16" />
            ) : (
              <path d="M18 6L6 18M6 6l12 12" />
            )}
          </svg>
        </button>
      </div>

      {/* Main nav */}
      <nav className="flex-1 space-y-0.5 px-2 py-3 overflow-y-auto">
        {!collapsed && (
          <div className="px-2.5 py-1.5 mb-1">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-graphite-600">Основное</span>
          </div>
        )}
        {MAIN_ITEMS.map((item) => (
          <NavItemComponent key={item.href} item={item} active={isActive(item.href)} collapsed={collapsed} />
        ))}
      </nav>

      {/* Bottom section */}
      <div className="mt-auto border-t border-white/5 px-2 py-3 space-y-0.5">
        {!collapsed && (
          <div className="px-2.5 py-1.5 mb-1">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-graphite-600">Ещё</span>
          </div>
        )}
        {BOTTOM_ITEMS.map((item) => (
          <NavItemComponent key={item.href} item={item} active={isActive(item.href)} collapsed={collapsed} />
        ))}
      </div>

      {/* User section */}
      <div className="border-t border-white/5 p-2 relative">
        <div
          className={`flex items-center gap-2.5 rounded-xl px-2.5 py-2 hover:bg-white/[0.04] transition-all duration-200 cursor-pointer ${collapsed ? 'justify-center' : ''}`}
          onClick={() => !collapsed && setShowUserMenu(!showUserMenu)}
        >
          <div className="h-7 w-7 shrink-0 rounded-lg bg-gradient-to-br from-lime/20 to-lime/5 flex items-center justify-center text-[11px] font-bold text-lime">
            {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-medium text-graphite-200">{user?.name || 'Пользователь'}</div>
              <div className="truncate text-[11px] text-graphite-500">{user?.email}</div>
            </div>
          )}
        </div>

        {/* User dropdown */}
        {showUserMenu && !collapsed && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
            <div className="absolute bottom-full left-2 right-2 mb-1 rounded-xl border border-white/10 bg-graphite-900/95 backdrop-blur-xl p-1 shadow-2xl z-50">
              <Link
                to="/app/profile"
                onClick={() => setShowUserMenu(false)}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] text-graphite-300 hover:bg-white/[0.06] hover:text-white transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Профиль
              </Link>
              <Link
                to="/app/settings"
                onClick={() => setShowUserMenu(false)}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] text-graphite-300 hover:bg-white/[0.06] hover:text-white transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                </svg>
                Настройки
              </Link>
              <div className="border-t border-white/5 my-1" />
              <button
                onClick={() => { setShowUserMenu(false); onLogout(); }}
                className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4m7 14l5-5-5-5m5 5H9" />
                </svg>
                Выйти
              </button>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
