import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthLayout } from '../components/AuthLayout';
import { useAuth } from '../lib/auth';
import { HttpError } from '../lib/api';

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
      title="С возвращением 👋"
      subtitle="Войдите, чтобы продолжить планирование постов."
      footer={
        <>
          Нет аккаунта?{' '}
          <Link to="/register" className="font-semibold text-lime hover:underline">
            Создать
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        {error && (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className="label" htmlFor="password">Пароль</label>
          <div className="relative">
            <input
              id="password"
              type={showPwd ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input pr-12"
              placeholder="Минимум 8 символов"
            />
            <button
              type="button"
              onClick={() => setShowPwd((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-graphite-400 hover:text-graphite-200"
            >
              {showPwd ? 'Скрыть' : 'Показать'}
            </button>
          </div>
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Входим...' : 'Войти'}
        </button>
        <div className="text-center">
          <Link to="/forgot-password" className="text-sm text-graphite-400 hover:text-lime transition">
            Забыли пароль?
          </Link>
        </div>
      </form>
      <p className="mt-6 text-center text-xs text-graphite-500">
        Демо: введите любые email и пароль (≥ 8 символов) — данные хранятся локально.
      </p>
    </AuthLayout>
  );
}
