import { useState, useEffect, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../components/AuthLayout';
import { useAuth } from '../lib/auth';
import { api, HttpError } from '../lib/api';
import { MagneticButton } from '../components/MagneticButton';
import { CreativeCaptcha } from '../components/Captcha';

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [captcha, setCaptcha] = useState<{ id: string; question: string } | null>(null);
  const [captchaSolved, setCaptchaSolved] = useState(false);
  const [captchaLoading, setCaptchaLoading] = useState(true);

  const loadCaptcha = async () => {
    setCaptchaLoading(true);
    setCaptchaSolved(false);
    try {
      const c = await api.getCaptcha();
      setCaptcha(c);
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
    if (!captcha || !captchaSolved) {
      setError('Пожалуйста, решите проверку');
      return;
    }
    setLoading(true);
    try {
      await register(email, password, name || undefined, captcha.id, 1, promoCode || undefined);
      navigate('/app', { replace: true });
    } catch (err) {
      if (err instanceof HttpError && err.status === 400) {
        const msg = typeof err.data === 'object' && err.data !== null
          ? (err.data as { message?: string | string[] }).message
          : err.data;
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
        setError(err instanceof Error ? err.message : 'Не удалось зарегистрироваться.');
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
        <span className="text-graphite-500">
          Уже есть аккаунт?{' '}
          <Link to="/login" className="font-semibold text-lime hover:underline">
            Войти
          </Link>
        </span>
      }
    >
      <form onSubmit={onSubmit} className="space-y-5">
        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300 flex items-center gap-2 animate-scale-in">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            {error}
          </div>
        )}

        <div>
          <label className="label" htmlFor="name">Имя</label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-graphite-500">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input pl-10"
              placeholder="Как к вам обращаться"
            />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="email">Email</label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-graphite-500">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
            </div>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input pl-10"
              placeholder="you@example.com"
            />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="password">Пароль</label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-graphite-500">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
            </div>
            <input
              id="password"
              type={showPwd ? 'text' : 'password'}
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input pl-10 pr-12"
              placeholder="Минимум 8 символов"
            />
            <button
              type="button"
              onClick={() => setShowPwd((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-graphite-400 hover:text-graphite-200 transition"
            >
              {showPwd ? 'Скрыть' : 'Показать'}
            </button>
          </div>
          {password.length > 0 && (
            <div className="mt-2.5 flex items-center gap-2">
              <div className="flex h-1.5 flex-1 overflow-hidden rounded-full bg-graphite-800">
                <div
                  className="h-full transition-all duration-300"
                  style={{
                    width: `${(strength.score / 4) * 100}%`,
                    background: ['#525b68', '#ef4444', '#fbbf24', '#4ade80', '#d4ff3a'][strength.score],
                  }}
                />
              </div>
              <span className="text-xs text-graphite-400 min-w-[70px]">{strength.label}</span>
            </div>
          )}
        </div>

        {/* Creative Captcha */}
        <div>
          <label className="label">Проверка: вы не робот?</label>
          {captchaLoading ? (
            <div className="input flex items-center justify-center text-graphite-400 h-12">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-graphite-600 border-t-lime" />
            </div>
          ) : captcha ? (
            <CreativeCaptcha
              question={captcha.question}
              id={captcha.id}
              onAnswer={() => setCaptchaSolved(true)}
              onRefresh={loadCaptcha}
            />
          ) : (
            <button type="button" onClick={loadCaptcha} className="btn-ghost w-full text-sm">
              Загрузить проверку
            </button>
          )}
        </div>

        <div>
          <label className="label" htmlFor="promo">Промокод</label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-graphite-500">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
            </div>
            <input
              id="promo"
              type="text"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              className="input pl-10"
              placeholder="Введите промокод (необязательно)"
            />
          </div>
        </div>

        <MagneticButton className="btn-primary btn-lg w-full">
          <button type="submit" disabled={loading || captchaLoading} className="w-full flex items-center justify-center gap-2">
            {loading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-graphite-950 border-t-transparent" />
                Создаём...
              </>
            ) : (
              'Создать аккаунт'
            )}
          </button>
        </MagneticButton>
      </form>

      <p className="mt-5 text-center text-xs text-graphite-500">
        Регистрируясь, вы соглашаетесь с{' '}
        <Link to="/terms" className="text-graphite-400 hover:text-lime transition">условиями</Link>
        {' '}и{' '}
        <Link to="/privacy" className="text-graphite-400 hover:text-lime transition">политикой конфиденциальности</Link>.
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
  const labels = ['', 'Очень слабый', 'Слабый', 'Средний', 'Надёжный'];
  const clamped = Math.max(1, Math.min(4, score)) as 1 | 2 | 3 | 4;
  return { score: clamped, label: labels[clamped - 1] };
}
