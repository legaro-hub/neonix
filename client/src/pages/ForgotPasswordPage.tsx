import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { AuthLayout } from '../components/AuthLayout';
import { api, HttpError } from '../lib/api';
import { MagneticButton } from '../components/MagneticButton';

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
        subtitle={`Мы отправили инструкции на ${email}`}
        footer={
          <Link to="/login" className="font-semibold text-lime hover:underline">
            Вернуться ко входу
          </Link>
        }
      >
        <div className="card-glass rounded-2xl p-8 text-center animate-scale-in">
          <div className="mb-4 text-5xl">📬</div>
          <p className="text-sm text-graphite-300 leading-relaxed">
            Проверьте почту и перейдите по ссылке в письме.
            Ссылка действительна в течение 1 часа.
          </p>
          <p className="mt-3 text-xs text-graphite-500">
            Не收到 письмо? Проверьте папку «Спам».
          </p>
          <button onClick={() => { setSent(false); setEmail(''); }} className="btn-ghost mt-6 w-full">
            Отправить заново
          </button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Сброс пароля"
      subtitle="Введите email, указанный при регистрации."
      footer={
        <span className="text-graphite-500">
          Вспомнили пароль?{' '}
          <Link to="/login" className="font-semibold text-lime hover:underline">Войти</Link>
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

        <MagneticButton className="btn-primary btn-lg w-full">
          <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2">
            {loading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-graphite-950 border-t-transparent" />
                Отправляем...
              </>
            ) : (
              'Отправить ссылку'
            )}
          </button>
        </MagneticButton>
      </form>
    </AuthLayout>
  );
}
