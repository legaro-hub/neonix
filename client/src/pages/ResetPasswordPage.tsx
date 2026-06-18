import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AuthLayout } from '../components/AuthLayout';
import { api, HttpError } from '../lib/api';

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
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-6 text-center">
          <p className="text-sm text-red-300">
            Отсутствует токен сброса. Запросите новую ссылку для восстановления пароля.
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
        <div className="rounded-xl border border-graphite-700 bg-graphite-900 p-6 text-center">
          <div className="mb-4 text-4xl">✅</div>
          <p className="text-sm text-graphite-300">
            Пароль успешно обновлён. Все предыдущие сессии были завершены.
          </p>
        </div>
      </AuthLayout>
    );
  }

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
      <form onSubmit={onSubmit} className="space-y-4">
        {error && (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}
        <div>
          <label className="label" htmlFor="password">Новый пароль</label>
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
                    width: `${(strengthCheck(password).score / 4) * 100}%`,
                    background: ['#525b68', '#d4ff3a', '#b8e62b', '#94b81f'][strengthCheck(password).score - 1] ?? '#525b68',
                  }}
                />
              </div>
              <span className="text-xs text-graphite-400">{strengthCheck(password).label}</span>
            </div>
          )}
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Сохраняем...' : 'Сохранить пароль'}
        </button>
      </form>
    </AuthLayout>
  );
}

function strengthCheck(pwd: string): { score: 1 | 2 | 3 | 4; label: string } {
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-ZА-Я]/.test(pwd) && /[a-zа-я]/.test(pwd)) score++;
  if (/\d/.test(pwd)) score++;
  if (/[^A-Za-zА-Яа-я0-9]/.test(pwd)) score++;
  const labels = ['Очень слабый', 'Слабый', 'Средний', 'Хороший', 'Надёжный'];
  const clamped = Math.max(1, Math.min(4, score)) as 1 | 2 | 3 | 4;
  return { score: clamped, label: labels[clamped - 1] };
}
