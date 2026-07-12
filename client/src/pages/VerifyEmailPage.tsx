import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AuthLayout } from '../components/AuthLayout';

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMsg('Ссылка подтверждения недействительна.');
      return;
    }

    fetch(`/api/auth/verify-email?token=${token}`)
      .then((res) => {
        if (!res.ok) return res.json().then((d) => { throw new Error(d.message || 'Ошибка'); });
        return res.json();
      })
      .then((data) => {
        if (data.success) {
          setStatus('success');
        } else {
          throw new Error('Не удалось подтвердить email');
        }
      })
      .catch((err) => {
        setStatus('error');
        setErrorMsg(err.message || 'Не удалось подтвердить email.');
      });
  }, [token]);

  if (!token) {
    return (
      <AuthLayout
        title="Неверная ссылка"
        subtitle="Ссылка подтверждения недействительна."
        footer={
          <Link to="/login" className="font-semibold text-lime hover:underline">
            Вернуться ко входу
          </Link>
        }
      >
        <div className="card-glass rounded-2xl p-8 text-center animate-scale-in">
          <div className="mb-4 text-5xl">🔗</div>
          <p className="text-sm text-red-300">Отсутствует токен подтверждения.</p>
        </div>
      </AuthLayout>
    );
  }

  if (status === 'loading') {
    return (
      <AuthLayout
        title="Подтверждение email"
        subtitle="Проверяем вашу ссылку..."
        footer={<span className="text-sm text-graphite-500">Пожалуйста, подождите</span>}
      >
        <div className="card-glass rounded-2xl p-8 text-center">
          <div className="mb-4 flex justify-center">
            <div className="h-12 w-12 rounded-full border-2 border-graphite-700 border-t-lime animate-spin" />
          </div>
          <p className="text-sm text-graphite-300">Проверка ссылки подтверждения...</p>
        </div>
      </AuthLayout>
    );
  }

  if (status === 'success') {
    return (
      <AuthLayout
        title="Email подтверждён"
        subtitle="Ваш аккаунт активирован."
        footer={
          <Link to="/login" className="font-semibold text-lime hover:underline">
            Войти в кабинет
          </Link>
        }
      >
        <div className="card-glass rounded-2xl p-8 text-center animate-scale-in">
          <div className="mb-4 text-5xl">✅</div>
          <p className="text-sm text-graphite-300 leading-relaxed">
            Email подтверждён! Теперь вы можете войти и начать использовать Neonix.
          </p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Ошибка подтверждения"
      subtitle="Не удалось подтвердить email."
      footer={
        <Link to="/login" className="font-semibold text-lime hover:underline">
          Вернуться ко входу
        </Link>
      }
    >
      <div className="card-glass rounded-2xl p-8 text-center animate-scale-in">
        <div className="mb-4 text-5xl">❌</div>
        <p className="text-sm text-red-300">{errorMsg}</p>
      </div>
    </AuthLayout>
  );
}
