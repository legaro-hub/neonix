import { useState, useEffect } from 'react';
import { Sidebar } from '../components/Sidebar';
import { api } from '../lib/api';

interface PostStat {
  id: number;
  date: string;
  text: string;
  views: number;
  forwards: number;
  replies: number;
  reactions: Record<string, number>;
}

export function MtprotoPage() {
  const [status, setStatus] = useState<{ authorized: boolean; configured: boolean; pendingStep: string | null } | null>(null);
  const [authStep, setAuthStep] = useState<'phone' | 'code' | 'password' | null>(null);
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [authMessage, setAuthMessage] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const [username, setUsername] = useState('');
  const [stats, setStats] = useState<PostStat[]>([]);
  const [loading, setLoading] = useState(false);
  const [collecting, setCollecting] = useState(false);
  const [collectResult, setCollectResult] = useState<string | null>(null);

  const loadStatus = async () => {
    try {
      const s = await api.getMtprotoStatus();
      setStatus(s);
      if (s.pendingStep) setAuthStep(s.pendingStep as any);
    } catch {
      setStatus({ authorized: false, configured: false, pendingStep: null });
    }
  };

  useEffect(() => { loadStatus(); }, []);

  const sendPhone = async () => {
    if (!phone.trim()) return;
    setAuthLoading(true);
    setAuthError('');
    setAuthMessage('');
    try {
      const res = await api.mtprotoAuthPhone(phone);
      if (res.error) { setAuthError(res.error); }
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
      if (res.error) { setAuthError(res.error); }
      else if (res.step === 'password') { setAuthStep('password'); setAuthMessage(res.message || ''); }
      else if (res.step === 'done') { setAuthStep(null); setAuthMessage(res.message || ''); loadStatus(); }
      else { setAuthError('Неожиданный ответ'); }
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
      if (res.error) { setAuthError(res.error); }
      else if (res.step === 'done') { setAuthStep(null); setAuthMessage(res.message || ''); loadStatus(); setPassword(''); }
      else { setAuthError('Неожиданный ответ'); }
    } catch (e: any) { setAuthError(e.message || 'Ошибка'); }
    setAuthLoading(false);
  };

  const doLogout = async () => {
    try {
      await api.mtprotoLogout();
      setAuthStep(null);
      setStatus({ authorized: false, configured: true, pendingStep: null });
    } catch {}
  };

  const loadStats = async () => {
    if (!username.trim()) return;
    setLoading(true);
    try {
      const data = await api.getMtprotoChannelStats(username.replace('@', ''));
      setStats(data);
    } catch { setStats([]); }
    setLoading(false);
  };

  const collectAll = async () => {
    setCollecting(true);
    setCollectResult(null);
    try {
      const res = await api.collectMtprotoStats();
      if (res.error) setCollectResult(`Ошибка: ${res.error}`);
      else if (res.results) {
        setCollectResult(res.results.map((r) => `${r.channel}: ${r.totalViews} просмотров`).join(', ') || 'Нет данных');
      }
    } catch { setCollectResult('Ошибка сбора'); }
    setCollecting(false);
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-10">
        <h1 className="font-display text-2xl font-bold text-white mb-2">MTProto Аналитика</h1>
        <p className="text-sm text-graphite-400 mb-6">Просмотры, реакции, репосты — полная статистика через Telegram API</p>

        <div className="card p-6 mb-6">
          <h2 className="font-display text-lg font-bold text-white mb-3">Авторизация</h2>
          {status === null ? (
            <div className="animate-pulse h-6 w-48 rounded bg-graphite-800" />
          ) : (
            <div className="flex items-center gap-4 mb-4">
              <div className={`h-3 w-3 rounded-full ${status.authorized ? 'bg-green-400' : status.configured ? 'bg-yellow-400' : 'bg-red-400'}`} />
              <span className="text-sm text-graphite-300">
                {status.authorized ? 'MTProto подключён' : status.configured ? 'API ключи настроены' : 'Не настроен'}
              </span>
              {status.authorized && (
                <button onClick={doLogout} className="text-xs text-red-400 hover:text-red-300 ml-auto">Выйти</button>
              )}
            </div>
          )}

          {!status?.authorized && (
            <div className="space-y-4">
              {authStep === null && (
                <div className="flex gap-3">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+79001234567"
                    className="input flex-1"
                    onKeyDown={(e) => e.key === 'Enter' && sendPhone()}
                  />
                  <button onClick={sendPhone} disabled={authLoading || !phone.trim()} className="btn-primary">
                    {authLoading ? '...' : 'Отправить код'}
                  </button>
                </div>
              )}

              {authStep === 'code' && (
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Код из Telegram"
                    className="input flex-1"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && sendCode()}
                  />
                  <button onClick={sendCode} disabled={authLoading || !code.trim()} className="btn-primary">
                    {authLoading ? '...' : 'Подтвердить'}
                  </button>
                </div>
              )}

              {authStep === 'password' && (
                <div className="flex gap-3">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Пароль 2FA"
                    className="input flex-1"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && sendPassword()}
                  />
                  <button onClick={sendPassword} disabled={authLoading || !password.trim()} className="btn-primary">
                    {authLoading ? '...' : 'Подтвердить'}
                  </button>
                </div>
              )}

              {authMessage && <p className="text-sm text-green-400">{authMessage}</p>}
              {authError && <p className="text-sm text-red-400">{authError}</p>}
            </div>
          )}

          {!status?.configured && (
            <div className="mt-4 p-4 rounded-xl bg-graphite-850 border border-graphite-700">
              <p className="text-sm text-graphite-300 mb-2">Добавьте в <code className="text-lime">.env</code>:</p>
              <pre className="p-2 rounded bg-graphite-900 text-xs text-lime overflow-x-auto">
{`TG_API_ID=12345678
TG_API_HASH=abcdef1234567890abcdef`}
              </pre>
            </div>
          )}
        </div>

        {status?.authorized && (
          <>
            <div className="card p-6 mb-6">
              <h2 className="font-display text-lg font-bold text-white mb-3">Статистика поста</h2>
              <div className="flex gap-3 mb-4">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="username канала (без @)"
                  className="input flex-1"
                  onKeyDown={(e) => e.key === 'Enter' && loadStats()}
                />
                <button onClick={loadStats} disabled={loading || !username.trim()} className="btn-primary">
                  {loading ? 'Загрузка...' : 'Получить'}
                </button>
              </div>

              {stats.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-graphite-700 text-graphite-400 text-left">
                        <th className="pb-2 font-medium">ID</th>
                        <th className="pb-2 font-medium">Дата</th>
                        <th className="pb-2 font-medium">Текст</th>
                        <th className="pb-2 font-medium text-right">👁</th>
                        <th className="pb-2 font-medium text-right">↩</th>
                        <th className="pb-2 font-medium text-right">💬</th>
                        <th className="pb-2 font-medium">Реакции</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.map((s) => (
                        <tr key={s.id} className="border-b border-graphite-800 hover:bg-graphite-850">
                          <td className="py-2 text-graphite-400">{s.id}</td>
                          <td className="py-2 text-graphite-400 text-xs">
                            {s.date ? new Date(s.date).toLocaleDateString('ru-RU') : '—'}
                          </td>
                          <td className="py-2 text-graphite-200 max-w-xs truncate">{s.text || '—'}</td>
                          <td className="py-2 text-right font-medium text-graphite-100">{s.views.toLocaleString()}</td>
                          <td className="py-2 text-right text-blue-400">{s.forwards}</td>
                          <td className="py-2 text-right text-green-400">{s.replies}</td>
                          <td className="py-2">
                            <div className="flex gap-1 flex-wrap">
                              {Object.entries(s.reactions).map(([emoji, count]) => (
                                <span key={emoji} className="text-xs bg-graphite-800 rounded px-1.5 py-0.5">
                                  {emoji} {count}
                                </span>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="card p-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-display text-lg font-bold text-white">Массовый сбор</h2>
                <button onClick={collectAll} disabled={collecting} className="btn-ghost text-sm">
                  {collecting ? 'Сбор...' : '🔄 Собрать со всех каналов'}
                </button>
              </div>
              <p className="text-xs text-graphite-400">
                Собирает просмотры и реакции для последних 30 постов на всех подключённых каналах.
              </p>
              {collectResult && (
                <div className="mt-3 p-3 rounded-xl bg-graphite-850 text-sm text-graphite-300">{collectResult}</div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
