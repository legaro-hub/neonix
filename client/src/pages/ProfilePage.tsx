import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { Sidebar } from '../components/Sidebar';
import { api, HttpError } from '../lib/api';

export function ProfilePage() {
  const { user, setUser } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [timezone, setTimezone] = useState(user?.timezone ?? 'Europe/Moscow');
  const [lang, setLang] = useState(user?.language ?? 'ru');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name ?? '');
      setEmail(user.email);
      setTimezone(user.timezone);
      setLang(user.language);
    }
  }, [user]);

  const onSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    setErr(null);
    try {
      const updated = await api.updateProfile({ name, email, timezone, language: lang });
      setUser(updated);
      setMsg('Профиль обновлён');
    } catch (e) {
      setErr(e instanceof HttpError ? e.message : 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-10">
        <h1 className="font-display text-2xl font-bold text-white mb-6">Профиль</h1>

        <div className="max-w-2xl">
          <form onSubmit={onSave} className="card p-6 space-y-5">
            {msg && <div className="rounded-xl border border-lime/40 bg-lime/10 px-4 py-3 text-sm text-lime">{msg}</div>}
            {err && <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">{err}</div>}

            <div>
              <label className="label">Имя</label>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ваше имя" />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Часовой пояс</label>
                <select className="input" value={timezone} onChange={(e) => setTimezone(e.target.value)}>
                  <optgroup label="Россия">
                    <option value="Europe/Kaliningrad">Калининград (UTC+2)</option>
                    <option value="Europe/Moscow">Москва (UTC+3)</option>
                    <option value="Europe/Samara">Самара (UTC+4)</option>
                    <option value="Asia/Yekaterinburg">Екатеринбург (UTC+5)</option>
                    <option value="Asia/Omsk">Омск (UTC+6)</option>
                    <option value="Asia/Novosibirsk">Новосибирск (UTC+7)</option>
                    <option value="Asia/Krasnoyarsk">Красноярск (UTC+7)</option>
                    <option value="Asia/Irkutsk">Иркутск (UTC+8)</option>
                    <option value="Asia/Yakutsk">Якутск (UTC+9)</option>
                    <option value="Asia/Vladivostok">Владивосток (UTC+10)</option>
                    <option value="Asia/Magadan">Магадан (UTC+11)</option>
                    <option value="Asia/Kamchatka">Камчатка (UTC+12)</option>
                  </optgroup>
                  <optgroup label="СНГ">
                    <option value="Europe/Kiev">Киев (UTC+2/+3)</option>
                    <option value="Europe/Minsk">Минск (UTC+3)</option>
                    <option value="Asia/Almaty">Алматы (UTC+6)</option>
                    <option value="Asia/Tashkent">Ташкент (UTC+5)</option>
                    <option value="Asia/Bishkek">Бишкек (UTC+6)</option>
                    <option value="Asia/Dushanbe">Душанбе (UTC+5)</option>
                    <option value="Asia/Ashgabat">Ашхабад (UTC+5)</option>
                    <option value="Asia/Baku">Баку (UTC+4)</option>
                    <option value="Asia/Yerevan">Ереван (UTC+4)</option>
                    <option value="Asia/Tbilisi">Тбилиси (UTC+4)</option>
                  </optgroup>
                  <optgroup label="Европа">
                    <option value="Europe/London">Лондон (UTC+0/+1)</option>
                    <option value="Europe/Berlin">Берлин (UTC+1/+2)</option>
                    <option value="Europe/Paris">Париж (UTC+1/+2)</option>
                    <option value="Europe/Madrid">Мадрид (UTC+1/+2)</option>
                    <option value="Europe/Rome">Рим (UTC+1/+2)</option>
                    <option value="Europe/Amsterdam">Амстердам (UTC+1/+2)</option>
                    <option value="Europe/Warsaw">Варшава (UTC+1/+2)</option>
                    <option value="Europe/Bucharest">Бухарест (UTC+2/+3)</option>
                    <option value="Europe/Athens">Афины (UTC+2/+3)</option>
                    <option value="Europe/Istanbul">Стамбул (UTC+3)</option>
                  </optgroup>
                  <optgroup label="Америка">
                    <option value="America/New_York">Нью-Йорк (UTC-5/-4)</option>
                    <option value="America/Chicago">Чикаго (UTC-6/-5)</option>
                    <option value="America/Denver">Денвер (UTC-7/-6)</option>
                    <option value="America/Los_Angeles">Лос-Анджелес (UTC-8/-7)</option>
                    <option value="America/Sao_Paulo">Сан-Паулу (UTC-3)</option>
                  </optgroup>
                  <optgroup label="Азия">
                    <option value="Asia/Dubai">Дубай (UTC+4)</option>
                    <option value="Asia/Kolkata">Индия (UTC+5:30)</option>
                    <option value="Asia/Bangkok">Бангкок (UTC+7)</option>
                    <option value="Asia/Ho_Chi_Minh">Хо Ши Мин (UTC+7)</option>
                    <option value="Asia/Jakarta">Джакарта (UTC+7)</option>
                    <option value="Asia/Singapore">Сингапур (UTC+8)</option>
                    <option value="Asia/Shanghai">Шанхай (UTC+8)</option>
                    <option value="Asia/Tokyo">Токио (UTC+9)</option>
                    <option value="Asia/Seoul">Сеул (UTC+9)</option>
                  </optgroup>
                  <optgroup label="Прочее">
                    <option value="Australia/Sydney">Сидней (UTC+10/+11)</option>
                    <option value="Pacific/Auckland">Окленд (UTC+12/+13)</option>
                    <option value="UTC">UTC</option>
                  </optgroup>
                </select>
              </div>
              <div>
                <label className="label">Язык</label>
                <select className="input" value={lang} onChange={(e) => setLang(e.target.value)}>
                  <option value="ru">Русский</option>
                  <option value="en">English</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </form>

          <div className="card mt-6 p-6">
            <h2 className="font-display text-lg font-semibold text-white mb-2">Смена пароля</h2>
            <ChangePasswordForm />
          </div>

          <div className="card mt-6 p-6 border-red-500/20">
            <h2 className="font-display text-lg font-semibold text-red-400 mb-2">Опасная зона</h2>
            <p className="text-sm text-graphite-400 mb-4">Удаление аккаунта необратимо. Все данные будут утеряны.</p>
            <DeleteAccountForm />
          </div>
        </div>
      </main>
    </div>
  );
}

function ChangePasswordForm() {
  const [current, setCurrent] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    setErr(null);
    try {
      await api.changePassword({ currentPassword: current, newPassword: newPwd });
      setMsg('Пароль изменён');
      setCurrent('');
      setNewPwd('');
    } catch (e) {
      setErr(e instanceof HttpError ? e.message : 'Ошибка');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {msg && <div className="rounded-xl border border-lime/40 bg-lime/10 px-4 py-3 text-sm text-lime">{msg}</div>}
      {err && <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">{err}</div>}
      <div>
        <label className="label">Текущий пароль</label>
        <input className="input" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} required />
      </div>
      <div>
        <label className="label">Новый пароль</label>
        <input className="input" type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} required minLength={8} />
      </div>
      <button type="submit" disabled={saving} className="btn-primary">
        {saving ? '...' : 'Изменить пароль'}
      </button>
    </form>
  );
}

function DeleteAccountForm() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);

  const onDelete = async () => {
    if (confirm !== 'УДАЛИТЬ') return;
    setSaving(true);
    try {
      await api.deleteAccount();
      await logout();
      navigate('/', { replace: true });
    } catch {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <input
        className="input"
        placeholder='Введите "УДАЛИТЬ" для подтверждения'
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
      />
      <button
        onClick={onDelete}
        disabled={confirm !== 'УДАЛИТЬ' || saving}
        className="rounded-xl bg-red-500/20 px-5 py-3 text-sm font-semibold text-red-400 transition hover:bg-red-500/30 disabled:opacity-40"
      >
        {saving ? 'Удаление...' : 'Удалить аккаунт'}
      </button>
    </div>
  );
}
