import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AuthLayout } from '../components/AuthLayout';
import { api, HttpError } from '../lib/api';
import { MagneticButton } from '../components/MagneticButton';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!token) {
    return (
      <AuthLayout
        title="Неверная ссылка"
        subtitle="Ссылка для сброса пароля недействительна."
        footer={
          <Link to="/forgot-password" className="font-semibold text-lime hover:underline">
            Запросить новую ссылку
          </Link>
        }
      >
        <div className="card-glass rounded-2xl p-8 text-center animate-scale-in">
          <div className="mb-4 text-5xl">🔗</div>
          <p className="text-sm text-red-300">
            Отсутствует токен сброса. Запросите новую ссылку.
          </p>
        </div>
      </AuthLayout>
    );
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError('Пароль должен содержать не менее 8 символов');
      return;
    }
    setLoading(true);
    try {
      await api.resetPassword(token, password);
      setSuccess(true);
    } catch (err) {
      if (err instanceof HttpError) {
        setError(err.message);
      } else {
        setError('Не удалось сбросить пароль. Попробуйте позже.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <AuthLayout
        title="Пароль изменён"
        subtitle="Теперь вы можете войти с новым паролем."
        footer={
          <Link to="/login" className="font-semibold text-lime hover:underline">
            Войти
          </Link>
        }
      >
        <div className="card-glass rounded-2xl p-8 text-center animate-scale-in">
          <div className="mb-4 text-5xl">✅</div>
          <p className="text-sm text-graphite-300 leading-relaxed">
            Пароль успешно обновлён. Все предыдущие сессии завершены.
          </p>
        </div>
      </AuthLayout>
    );
  }

  const strength = passwordStrength(password);

  return (
    <AuthLayout
      title="Новый пароль"
      subtitle="Введите новый пароль для вашего аккаунта."
      footer={
        <Link to="/login" className="font-semibold text-lime hover:underline">
          Вернуться ко входу
        </Link>
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
          <label className="label" htmlFor="password">Новый пароль</label>
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

        <MagneticButton className="btn-primary btn-lg w-full">
          <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2">
            {loading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-graphite-950 border-t-transparent" />
                Сохраняем...
              </>
            ) : (
              'Сохранить пароль'
            )}
          </button>
        </MagneticButton>
      </form>
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
