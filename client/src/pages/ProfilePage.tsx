import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { Sidebar } from '../components/Sidebar';
import { api, HttpError } from '../lib/api';
import { useToast } from '../lib/toast';

export function ProfilePage() {
  const { user, setUser } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [timezone, setTimezone] = useState(user?.timezone ?? 'Europe/Moscow');
  const [lang, setLang] = useState(user?.language ?? 'ru');
  const [saving, setSaving] = useState(false);

  // MTProto state
  const [mtprotoStatus, setMtprotoStatus] = useState<{ authorized: boolean; configured: boolean; pendingStep: string | null } | null>(null);
  const [authStep, setAuthStep] = useState<'phone' | 'code' | 'password' | null>(null);
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [authMessage, setAuthMessage] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name ?? '');
      setEmail(user.email);
      setTimezone(user.timezone);
      setLang(user.language);
    }
    loadMtprotoStatus();
  }, [user]);

  const loadMtprotoStatus = async () => {
    try {
      const s = await api.getMtprotoStatus();
      setMtprotoStatus(s);
      if (s.pendingStep) setAuthStep(s.pendingStep as any);
    } catch {
      setMtprotoStatus({ authorized: false, configured: false, pendingStep: null });
    }
  };

  const sendPhone = async () => {
    if (!phone.trim()) return;
    setAuthLoading(true);
    setAuthError('');
    setAuthMessage('');
    try {
      const res = await api.mtprotoAuthPhone(phone);
      if (res.error) setAuthError(res.error);
      else { setAuthStep('code'); setAuthMessage(res.message || ''); }
    } catch (e: any) { setAuthError(e.message || 'Ошибка'); }
    setAuthLoading(false);
  };

  const sendCode = async () => {
    if (!code.trim()) return;
    setAuthLoading(true);
    setAuthError('');
    setAuthMessage('');
    try {
      const res = await api.mtprotoAuthCode(code);
      if (res.error) setAuthError(res.error);
      else if (res.step === 'password') { setAuthStep('password'); setAuthMessage(res.message || ''); }
      else if (res.step === 'done') { setAuthStep(null); setAuthMessage(res.message || ''); loadMtprotoStatus(); }
      else setAuthError('Неожиданный ответ');
    } catch (e: any) { setAuthError(e.message || 'Ошибка'); }
    setAuthLoading(false);
  };

  const sendPassword = async () => {
    if (!password.trim()) return;
    setAuthLoading(true);
    setAuthError('');
    setAuthMessage('');
    try {
      const res = await api.mtprotoAuthPassword(password);
      if (res.error) setAuthError(res.error);
      else if (res.step === 'done') { setAuthStep(null); setAuthMessage(res.message || ''); loadMtprotoStatus(); setPassword(''); }
      else setAuthError('Неожиданный ответ');
    } catch (e: any) { setAuthError(e.message || 'Ошибка'); }
    setAuthLoading(false);
  };

  const doMtprotoLogout = async () => {
    try {
      await api.mtprotoLogout();
      setAuthStep(null);
      setMtprotoStatus({ authorized: false, configured: true, pendingStep: null });
    } catch {}
  };

  const onSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await api.updateProfile({ name, email, timezone, language: lang });
      setUser(updated);
      toast('success', 'Профиль обновлён');
    } catch (e) {
      toast('error', e instanceof HttpError ? e.message : 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const selectClass = "w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white/80 focus:outline-none focus:border-[#d4ff3a]/40 focus:ring-1 focus:ring-[#d4ff3a]/20 transition-colors appearance-none cursor-pointer";
  const inputClass = "w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white/80 placeholder-white/20 focus:outline-none focus:border-[#d4ff3a]/40 focus:ring-1 focus:ring-[#d4ff3a]/20 transition-colors";

  return (
    <div className="flex min-h-screen bg-[#0a0b0d]">
      <Sidebar />
      <main className="flex-1 p-6 pb-20 lg:pb-10 lg:p-10">
        <h1 className="text-2xl font-bold text-white mb-8">Профиль</h1>

        <div className="max-w-2xl space-y-6">
          {/* Profile Form */}
          <form onSubmit={onSave} className="bg-white/[0.02] backdrop-blur-xl border border-white/5 rounded-2xl p-6 space-y-5">
            <div>
              <label className="block text-xs font-medium text-white/40 mb-1.5">Имя</label>
              <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ваше имя" />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/40 mb-1.5">Email</label>
              <input className={inputClass} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-white/40 mb-1.5">Часовой пояс</label>
                <select className={selectClass} value={timezone} onChange={(e) => setTimezone(e.target.value)}>
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
                <label className="block text-xs font-medium text-white/40 mb-1.5">Язык</label>
                <select className={selectClass} value={lang} onChange={(e) => setLang(e.target.value)}>
                  <option value="ru">Русский</option>
                  <option value="en">English</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-[#d4ff3a] text-[#0a0b0d] text-sm font-semibold hover:bg-[#d4ff3a]/90 active:scale-[0.98] transition-all disabled:opacity-40 disabled:pointer-events-none"
              >
                {saving ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </form>

          {/* Change Password */}
          <div className="bg-white/[0.02] backdrop-blur-xl border border-white/5 rounded-2xl p-6">
            <h2 className="text-base font-semibold text-white mb-4">Смена пароля</h2>
            <ChangePasswordForm />
          </div>

          {/* MTProto Section */}
          <div className="bg-white/[0.02] backdrop-blur-xl border border-white/5 rounded-2xl p-6">
            <h2 className="text-base font-semibold text-white mb-1">MTProto Аналитика</h2>
            <p className="text-xs text-white/30 mb-4">Подключение для сбора просмотров, реакций и репостов</p>
            {mtprotoStatus === null ? (
              <div className="animate-pulse h-6 w-48 rounded-xl bg-white/5" />
            ) : (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`h-3 w-3 rounded-full ${mtprotoStatus.authorized ? 'bg-emerald-400' : mtprotoStatus.configured ? 'bg-amber-400' : 'bg-red-400'}`} />
                  <span className="text-sm text-white/60">
                    {mtprotoStatus.authorized ? 'MTProto подключён' : mtprotoStatus.configured ? 'API ключи настроены' : 'Не настроен'}
                  </span>
                  {mtprotoStatus.authorized && (
                    <button onClick={doMtprotoLogout} className="text-xs text-red-400 hover:text-red-300 ml-auto transition-colors">Выйти</button>
                  )}
                </div>
                {!mtprotoStatus.authorized && (
                  <div className="space-y-3">
                    {authStep === null && (
                      <div className="flex gap-2">
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+79001234567"
                          className={`${inputClass} flex-1`}
                          onKeyDown={(e) => e.key === 'Enter' && sendPhone()}
                        />
                        <button
                          onClick={sendPhone}
                          disabled={authLoading || !phone.trim()}
                          className="px-4 py-2.5 rounded-xl bg-[#d4ff3a] text-[#0a0b0d] text-sm font-semibold hover:bg-[#d4ff3a]/90 active:scale-[0.98] transition-all disabled:opacity-40 flex-shrink-0"
                        >
                          {authLoading ? '...' : 'Код'}
                        </button>
                      </div>
                    )}
                    {authStep === 'code' && (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={code}
                          onChange={(e) => setCode(e.target.value)}
                          placeholder="Код из Telegram"
                          className={`${inputClass} flex-1`}
                          autoFocus
                          onKeyDown={(e) => e.key === 'Enter' && sendCode()}
                        />
                        <button
                          onClick={sendCode}
                          disabled={authLoading || !code.trim()}
                          className="px-4 py-2.5 rounded-xl bg-[#d4ff3a] text-[#0a0b0d] text-sm font-semibold hover:bg-[#d4ff3a]/90 active:scale-[0.98] transition-all disabled:opacity-40 flex-shrink-0"
                        >
                          {authLoading ? '...' : 'ОК'}
                        </button>
                      </div>
                    )}
                    {authStep === 'password' && (
                      <div className="flex gap-2">
                        <input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Пароль 2FA"
                          className={`${inputClass} flex-1`}
                          autoFocus
                          onKeyDown={(e) => e.key === 'Enter' && sendPassword()}
                        />
                        <button
                          onClick={sendPassword}
                          disabled={authLoading || !password.trim()}
                          className="px-4 py-2.5 rounded-xl bg-[#d4ff3a] text-[#0a0b0d] text-sm font-semibold hover:bg-[#d4ff3a]/90 active:scale-[0.98] transition-all disabled:opacity-40 flex-shrink-0"
                        >
                          {authLoading ? '...' : 'ОК'}
                        </button>
                      </div>
                    )}
                    {authMessage && <p className="text-xs text-emerald-400">{authMessage}</p>}
                    {authError && <p className="text-xs text-red-400">{authError}</p>}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Danger Zone */}
          <div className="bg-white/[0.02] backdrop-blur-xl border border-red-500/10 rounded-2xl p-6">
            <h2 className="text-base font-semibold text-red-400 mb-1">Опасная зона</h2>
            <p className="text-sm text-white/30 mb-4">Удаление аккаунта необратимо. Все данные будут утеряны.</p>
            <DeleteAccountForm />
          </div>
        </div>
      </main>
    </div>
  );
}

function ChangePasswordForm() {
  const { toast } = useToast();
  const [current, setCurrent] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [saving, setSaving] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.changePassword({ currentPassword: current, newPassword: newPwd });
      toast('success', 'Пароль изменён');
      setCurrent('');
      setNewPwd('');
    } catch (e) {
      toast('error', e instanceof HttpError ? e.message : 'Ошибка');
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white/80 placeholder-white/20 focus:outline-none focus:border-[#d4ff3a]/40 focus:ring-1 focus:ring-[#d4ff3a]/20 transition-colors";

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-white/40 mb-1.5">Текущий пароль</label>
        <input className={inputClass} type="password" value={current} onChange={(e) => setCurrent(e.target.value)} required />
      </div>
      <div>
        <label className="block text-xs font-medium text-white/40 mb-1.5">Новый пароль</label>
        <input className={inputClass} type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} required minLength={8} />
      </div>
      <button
        type="submit"
        disabled={saving}
        className="px-6 py-2.5 rounded-xl bg-[#d4ff3a] text-[#0a0b0d] text-sm font-semibold hover:bg-[#d4ff3a]/90 active:scale-[0.98] transition-all disabled:opacity-40"
      >
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

  const inputClass = "w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white/80 placeholder-white/20 focus:outline-none focus:border-red-500/40 focus:ring-1 focus:ring-red-500/20 transition-colors";

  return (
    <div className="space-y-3">
      <input
        className={inputClass}
        placeholder='Введите "УДАЛИТЬ" для подтверждения'
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
      />
      <button
        onClick={onDelete}
        disabled={confirm !== 'УДАЛИТЬ' || saving}
        className="px-5 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm font-semibold text-red-400 transition-all hover:bg-red-500/20 disabled:opacity-40 disabled:pointer-events-none"
      >
        {saving ? 'Удаление...' : 'Удалить аккаунт'}
      </button>
    </div>
  );
}
