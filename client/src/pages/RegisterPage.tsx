import { useState, useEffect, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../components/AuthLayout';
import { useAuth } from '../lib/auth';
import { api, HttpError } from '../lib/api';

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [captcha, setCaptcha] = useState<{ id: string; question: string } | null>(null);
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [captchaLoading, setCaptchaLoading] = useState(true);

  const loadCaptcha = async () => {
    setCaptchaLoading(true);
    try {
      const c = await api.getCaptcha();
      setCaptcha(c);
      setCaptchaAnswer('');
    } catch {
      /* ignore */
    } finally {
      setCaptchaLoading(false);
    }
  };

  useEffect(() => {
    loadCaptcha();
  }, []);

  const strength = passwordStrength(password);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError('Пароль должен содержать не менее 8 символов');
      return;
    }
    if (!captcha || !captchaAnswer) {
      setError('Решите пример');
      return;
    }
    setLoading(true);
    try {
      await register(email, password, name || undefined, captcha.id, Number(captchaAnswer));
      navigate('/app', { replace: true });
    } catch (err) {
      if (err instanceof HttpError && err.status === 400) {
        const msg = typeof err.data === 'object' && err.data !== null
          ? (err.data as { message?: string | string[] }).message
          : err.message;
        const text = Array.isArray(msg) ? msg[0] : msg;
        if (text?.includes('капч')) {
          setError(text);
          loadCaptcha();
        } else {
          setError(text || err.message);
        }
      } else if (err instanceof HttpError && err.status === 409) {
        setError('Пользователь с таким email уже существует');
      } else {
        setError(err instanceof Error ? err.message : 'Не удалось зарегистрироваться. Попробуйте позже.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Создайте аккаунт"
      subtitle="Бесплатный тариф навсегда — без карты."
      footer={
        <>
          Уже есть аккаунт?{' '}
          <Link to="/login" className="font-semibold text-lime hover:underline">
            Войти
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
          <label className="label" htmlFor="name">Имя (необязательно)</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input"
            placeholder="Как к вам обращаться"
          />
        </div>
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
              autoComplete="new-password"
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
          {password.length > 0 && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex h-1.5 flex-1 overflow-hidden rounded-full bg-graphite-800">
                <div
                  className="h-full transition-all"
                  style={{
                    width: `${(strength.score / 4) * 100}%`,
                    background: ['#525b68', '#d4ff3a', '#b8e62b', '#94b81f'][strength.score - 1] ?? '#525b68',
                  }}
                />
              </div>
              <span className="text-xs text-graphite-400">{strength.label}</span>
            </div>
          )}
        </div>
        <div>
          <label className="label">Проверка: вы не робот?</label>
          {captchaLoading ? (
            <div className="input flex items-center justify-center text-graphite-400">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-graphite-600 border-t-lime" />
            </div>
          ) : captcha ? (
            <div className="flex items-center gap-3">
              <div className="flex-1 rounded-xl border border-graphite-700 bg-graphite-850 px-4 py-3 text-center font-display text-lg font-bold text-white">
                {captcha.question}
              </div>
              <input
                type="number"
                value={captchaAnswer}
                onChange={(e) => setCaptchaAnswer(e.target.value)}
                className="input w-24 text-center"
                placeholder="?"
                required
              />
              <button
                type="button"
                onClick={loadCaptcha}
                className="shrink-0 rounded-xl border border-graphite-700 bg-graphite-850 px-3 py-3 text-graphite-400 transition hover:text-graphite-200"
                title="Обновить"
              >
                ↻
              </button>
            </div>
          ) : (
            <button type="button" onClick={loadCaptcha} className="btn-ghost w-full text-sm">
              Загрузить капчу
            </button>
          )}
        </div>
        <button type="submit" disabled={loading || captchaLoading} className="btn-primary w-full">
          {loading ? 'Создаём...' : 'Создать аккаунт'}
        </button>
      </form>
      <p className="mt-4 text-center text-xs text-graphite-500">
        Регистрируясь, вы соглашаетесь с условиями и политикой конфиденциальности.
      </p>
    </AuthLayout>
  );
}

function passwordStrength(pwd: string): { score: 0 | 1 | 2 | 3 | 4; label: string } {
  if (!pwd) return { score: 0, label: '' };
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-ZА-Я]/.test(pwd) && /[a-zа-я]/.test(pwd)) score++;
  if (/\d/.test(pwd)) score++;
  if (/[^A-Za-zА-Яа-я0-9]/.test(pwd)) score++;
  const labels = ['Очень слабый', 'Слабый', 'Средний', 'Хороший', 'Надёжный'];
  const clamped = Math.max(1, Math.min(4, score)) as 1 | 2 | 3 | 4;
  return { score: clamped, label: labels[clamped - 1] };
}
