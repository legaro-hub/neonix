import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { AuthLayout } from '../components/AuthLayout';
import { api, HttpError } from '../lib/api';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.forgotPassword(email);
      setSent(true);
    } catch (err) {
      if (err instanceof HttpError) {
        setError(err.message);
      } else {
        setError('Не удалось отправить письмо. Попробуйте позже.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <AuthLayout
        title="Письмо отправлено"
        subtitle={`Мы отправили инструкции по сбросу пароля на ${email}`}
        footer={
          <Link to="/login" className="font-semibold text-lime hover:underline">
            Вернуться ко входу
          </Link>
        }
      >
        <div className="rounded-xl border border-graphite-700 bg-graphite-900 p-6 text-center">
          <div className="mb-4 text-4xl">📬</div>
          <p className="text-sm text-graphite-300">
            Проверьте почту и перейдите по ссылке в письме. Ссылка действительна в течение 1 часа.
          </p>
          <p className="mt-3 text-xs text-graphite-500">
            Не收到 письмо? Проверьте папку «Спам».
          </p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Сброс пароля"
      subtitle="Введите email, указанный при регистрации."
      footer={
        <>
          Вспомнили пароль?{' '}
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
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Отправляем...' : 'Отправить ссылку'}
        </button>
      </form>
    </AuthLayout>
  );
}
