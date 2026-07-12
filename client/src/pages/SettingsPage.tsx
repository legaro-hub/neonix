import { useState, useEffect, type FormEvent } from 'react';
import { Sidebar } from '../components/Sidebar';
import { api } from '../lib/api';
import type { NotificationSettings } from '../lib/types';
import Modal from '../components/Modal';
import { useToast } from '../lib/toast';

export function SettingsPage() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [titleClicks, setTitleClicks] = useState(0);
  const [titleTimer, setTitleTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [showPostpinConfig, setShowPostpinConfig] = useState(false);
  const [postpinEmail, setPostpinEmail] = useState('');
  const [postpinSaving, setPostpinSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const s = await api.getNotifications();
        setSettings(s);
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const onSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    try {
      await api.updateNotifications(settings as unknown as Record<string, unknown>);
      toast('success', 'Настройки сохранены');
    } catch {
      toast('error', 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const toggle = (key: keyof NotificationSettings) => {
    if (!settings) return;
    setSettings({ ...settings, [key]: !settings[key] });
  };

  const handleTitleClick = () => {
    if (titleTimer) clearTimeout(titleTimer);
    const next = titleClicks + 1;
    setTitleClicks(next);
    setTitleTimer(setTimeout(() => { setTitleClicks(0); }, 2000));
    if (next >= 5) {
      setTitleClicks(0);
      setShowPostpinConfig(true);
      api.getPostpinEmail().then((d) => setPostpinEmail(d.email)).catch(() => {});
    }
  };

  const handleSavePostpin = async () => {
    setPostpinSaving(true);
    try {
      await api.setPostpinEmail(postpinEmail);
      setShowPostpinConfig(false);
    } catch {}
    setPostpinSaving(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 p-6 pb-20 lg:pb-10 lg:p-10">
          <div className="h-8 w-48 animate-pulse rounded bg-graphite-800" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-6 pb-20 lg:pb-10 lg:p-10">
        <h1 onClick={handleTitleClick} className="font-display text-2xl font-bold text-white mb-6 cursor-default select-none">Настройки</h1>

        <div className="max-w-2xl space-y-6">
          <form onSubmit={onSave} className="card p-6 space-y-6">

            <div>
              <h2 className="font-display text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <span className="text-lg">📧</span> Уведомления по email
              </h2>
              <div className="space-y-3">
                {[
                  { key: 'emailOnPublish' as const, label: 'Пост опубликован' },
                  { key: 'emailOnFailure' as const, label: 'Ошибка публикации' },
                  { key: 'emailOnBilling' as const, label: 'Биллинг и платежи' },
                ].map((item) => (
                  <label key={item.key} className="flex items-center gap-3 cursor-pointer">
                    <div
                      onClick={() => toggle(item.key)}
                      className={`relative h-6 w-11 rounded-full transition ${
                        settings?.[item.key] ? 'bg-lime' : 'bg-graphite-700'
                      }`}
                    >
                      <div
                        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${
                          settings?.[item.key] ? 'translate-x-5' : 'translate-x-0.5'
                        }`}
                      />
                    </div>
                    <span className="text-sm text-graphite-200">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h2 className="font-display text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <span className="text-lg">🔔</span> In-app уведомления
              </h2>
              <div className="space-y-3">
                {[
                  { key: 'inAppOnPublish' as const, label: 'Пост опубликован' },
                  { key: 'inAppOnFailure' as const, label: 'Ошибка публикации' },
                ].map((item) => (
                  <label key={item.key} className="flex items-center gap-3 cursor-pointer">
                    <div
                      onClick={() => toggle(item.key)}
                      className={`relative h-6 w-11 rounded-full transition ${
                        settings?.[item.key] ? 'bg-lime' : 'bg-graphite-700'
                      }`}
                    >
                      <div
                        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${
                          settings?.[item.key] ? 'translate-x-5' : 'translate-x-0.5'
                        }`}
                      />
                    </div>
                    <span className="text-sm text-graphite-200">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h2 className="font-display text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <span className="text-lg">📰</span> Дайджест
              </h2>
              <label className="flex items-center gap-3 cursor-pointer mb-4">
                <div
                  onClick={() => toggle('digestEnabled')}
                  className={`relative h-6 w-11 rounded-full transition ${
                    settings?.digestEnabled ? 'bg-lime' : 'bg-graphite-700'
                  }`}
                >
                  <div
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${
                      settings?.digestEnabled ? 'translate-x-5' : 'translate-x-0.5'
                    }`}
                  />
                </div>
                <span className="text-sm text-graphite-200">Включить еженедельный дайджест</span>
              </label>
              {settings?.digestEnabled && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="label">День недели</label>
                    <select
                      className="input"
                      value={settings.digestDay}
                      onChange={(e) => setSettings({ ...settings!, digestDay: e.target.value })}
                    >
                      <option value="mon">Понедельник</option>
                      <option value="tue">Вторник</option>
                      <option value="wed">Среда</option>
                      <option value="thu">Четверг</option>
                      <option value="fri">Пятница</option>
                      <option value="sat">Суббота</option>
                      <option value="sun">Воскресенье</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Час</label>
                    <select
                      className="input"
                      value={settings.digestHour}
                      onChange={(e) => setSettings({ ...settings!, digestHour: Number(e.target.value) })}
                    >
                      {Array.from({ length: 24 }, (_, i) => (
                        <option key={i} value={i}>{String(i).padStart(2, '0')}:00</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </form>
        </div>

        <Modal open={showPostpinConfig} onClose={() => setShowPostpinConfig(false)}>
          <div className="card p-6">
            <h3 className="font-display text-lg font-bold text-white mb-4">PostPin Email</h3>
            <div>
              <label className="label">Email</label>
              <input className="input text-sm" value={postpinEmail} onChange={(e) => setPostpinEmail(e.target.value)} placeholder="your@email.com" />
              <p className="text-[10px] text-graphite-500 mt-1">Email от аккаунта PostPin</p>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={handleSavePostpin} disabled={postpinSaving} className="btn-primary text-sm flex-1">{postpinSaving ? 'Сохранение...' : 'Сохранить'}</button>
              <button onClick={() => setShowPostpinConfig(false)} className="btn-ghost text-sm">Закрыть</button>
            </div>
          </div>
        </Modal>
      </main>
    </div>
  );
}
