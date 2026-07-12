import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthLayout } from '../components/AuthLayout';
import { useAuth } from '../lib/auth';
import { HttpError } from '../lib/api';
import { MagneticButton } from '../components/MagneticButton';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string })?.from ?? '/app';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(
        err instanceof HttpError && err.status === 401
          ? 'Неверный email или пароль'
          : err instanceof Error
            ? err.message
            : 'Не удалось войти. Попробуйте позже.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="С возвращением"
      subtitle="Войдите, чтобы продолжить планирование постов."
      footer={
        <span className="text-white/30">
          Нет аккаунта?{' '}
          <Link to="/register" className="font-semibold text-[#d4ff3a] hover:underline">
            Создать бесплатно
          </Link>
        </span>
      }
    >
      <form onSubmit={onSubmit} className="space-y-5">
        {error && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300 flex items-center gap-2 animate-scale-in">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-white/40 mb-1.5" htmlFor="email">Email</label>
          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
            </div>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-4 py-3 text-sm text-white/80 placeholder-white/20 focus:outline-none focus:border-[#d4ff3a]/40 focus:ring-1 focus:ring-[#d4ff3a]/20 transition-colors"
              placeholder="you@example.com"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium text-white/40" htmlFor="password">Пароль</label>
            <Link to="/forgot-password" className="text-xs text-white/20 hover:text-[#d4ff3a] transition-colors">
              Забыли пароль?
            </Link>
          </div>
          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
            </div>
            <input
              id="password"
              type={showPwd ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-14 py-3 text-sm text-white/80 placeholder-white/20 focus:outline-none focus:border-[#d4ff3a]/40 focus:ring-1 focus:ring-[#d4ff3a]/20 transition-colors"
              placeholder="Минимум 8 символов"
            />
            <button
              type="button"
              onClick={() => setShowPwd((v) => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-white/30 hover:text-white/60 transition-colors"
            >
              {showPwd ? 'Скрыть' : 'Показать'}
            </button>
          </div>
        </div>

        <MagneticButton className="w-full">
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-[#d4ff3a] text-[#0a0b0d] text-sm font-semibold hover:bg-[#d4ff3a]/90 active:scale-[0.98] transition-all disabled:opacity-40"
          >
            {loading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#0a0b0d] border-t-transparent" />
                Входим...
              </>
            ) : (
              'Войти'
            )}
          </button>
        </MagneticButton>
      </form>
    </AuthLayout>
  );
}
