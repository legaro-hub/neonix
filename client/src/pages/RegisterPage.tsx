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
  const [captchaAnswer, setCaptchaAnswer] = useState(0);
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
      await register(email, password, name || undefined, captcha.id, captchaAnswer, promoCode || undefined);
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

  const inputClass = "w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-4 py-3 text-sm text-white/80 placeholder-white/20 focus:outline-none focus:border-[#d4ff3a]/40 focus:ring-1 focus:ring-[#d4ff3a]/20 transition-colors";

  return (
    <AuthLayout
      title="Создайте аккаунт"
      subtitle="Бесплатный тариф навсегда — без карты."
      footer={
        <span className="text-white/30">
          Уже есть аккаунт?{' '}
          <Link to="/login" className="font-semibold text-[#d4ff3a] hover:underline">
            Войти
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
          <label className="block text-xs font-medium text-white/40 mb-1.5" htmlFor="name">Имя</label>
          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
              placeholder="Как к вам обращаться"
            />
          </div>
        </div>

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
              className={inputClass}
              placeholder="you@example.com"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-white/40 mb-1.5" htmlFor="password">Пароль</label>
          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
            </div>
            <input
              id="password"
              type={showPwd ? 'text' : 'password'}
              autoComplete="new-password"
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
          {password.length > 0 && (
            <div className="mt-2.5 flex items-center gap-2">
              <div className="flex h-1.5 flex-1 overflow-hidden rounded-full bg-white/5">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${(strength.score / 4) * 100}%`,
                    background: ['rgba(255,255,255,0.1)', '#ef4444', '#fbbf24', '#4ade80', '#d4ff3a'][strength.score],
                  }}
                />
              </div>
              <span className="text-xs text-white/30 min-w-[70px]">{strength.label}</span>
            </div>
          )}
        </div>

        {/* Creative Captcha */}
        <div>
          <label className="block text-xs font-medium text-white/40 mb-1.5">Проверка: вы не робот?</label>
          {captchaLoading ? (
            <div className="w-full bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-white/20 h-12">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/10 border-t-[#d4ff3a]" />
            </div>
          ) : captcha ? (
            <CreativeCaptcha
              question={captcha.question}
              id={captcha.id}
              onAnswer={(ans) => { setCaptchaSolved(true); setCaptchaAnswer(ans); }}
              onRefresh={loadCaptcha}
            />
          ) : (
            <button type="button" onClick={loadCaptcha} className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/5 text-sm text-white/40 hover:text-white/60 hover:bg-white/10 transition-all">
              Загрузить проверку
            </button>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-white/40 mb-1.5" htmlFor="promo">Промокод</label>
          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
            </div>
            <input
              id="promo"
              type="text"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              className={inputClass}
              placeholder="Введите промокод (необязательно)"
            />
          </div>
        </div>

        <MagneticButton className="w-full">
          <button
            type="submit"
            disabled={loading || captchaLoading}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-[#d4ff3a] text-[#0a0b0d] text-sm font-semibold hover:bg-[#d4ff3a]/90 active:scale-[0.98] transition-all disabled:opacity-40"
          >
            {loading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#0a0b0d] border-t-transparent" />
                Создаём...
              </>
            ) : (
              'Создать аккаунт'
            )}
          </button>
        </MagneticButton>
      </form>

      <p className="mt-5 text-center text-xs text-white/20">
        Регистрируясь, вы соглашаетесь с{' '}
        <Link to="/terms" className="text-white/30 hover:text-[#d4ff3a] transition-colors">условиями</Link>
        {' '}и{' '}
        <Link to="/privacy" className="text-white/30 hover:text-[#d4ff3a] transition-colors">политикой конфиденциальности</Link>.
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
