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

  const Toggle = ({ enabled, onClick }: { enabled: boolean; onClick: () => void }) => (
    <div
      onClick={onClick}
      className={`relative h-6 w-11 rounded-full transition-colors duration-200 cursor-pointer flex-shrink-0 ${
        enabled ? 'bg-[#d4ff3a]' : 'bg-white/10'
      }`}
    >
      <div
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-[#0a0b0d] shadow-md transition-transform duration-200 ${
          enabled ? 'translate-x-[22px]' : 'translate-x-0.5'
        }`}
      />
    </div>
  );

  const SectionHeader = ({ icon, title }: { icon: string; title: string }) => (
    <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2.5">
      <span className="text-lg">{icon}</span> {title}
    </h2>
  );

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#0a0b0d]">
        <Sidebar />
        <main className="flex-1 p-6 pb-20 lg:pb-10 lg:p-10">
          <div className="h-8 w-48 animate-pulse rounded-2xl bg-white/5" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#0a0b0d]">
      <Sidebar />
      <main className="flex-1 p-6 pb-20 lg:pb-10 lg:p-10">
        <h1
          onClick={handleTitleClick}
          className="text-2xl font-bold text-white mb-8 cursor-default select-none"
        >
          Настройки
        </h1>

        <div className="max-w-2xl space-y-6">
          <form onSubmit={onSave} className="bg-white/[0.02] backdrop-blur-xl border border-white/5 rounded-2xl p-6 space-y-8">

            {/* Email Notifications */}
            <div>
              <SectionHeader icon="📧" title="Уведомления по email" />
              <div className="space-y-4">
                {[
                  { key: 'emailOnPublish' as const, label: 'Пост опубликован' },
                  { key: 'emailOnFailure' as const, label: 'Ошибка публикации' },
                  { key: 'emailOnBilling' as const, label: 'Биллинг и платежи' },
                ].map((item) => (
                  <label key={item.key} className="flex items-center gap-3 cursor-pointer group">
                    <Toggle enabled={!!settings?.[item.key]} onClick={() => toggle(item.key)} />
                    <span className="text-sm text-white/60 group-hover:text-white/80 transition-colors">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="border-t border-white/5" />

            {/* In-app Notifications */}
            <div>
              <SectionHeader icon="🔔" title="In-app уведомления" />
              <div className="space-y-4">
                {[
                  { key: 'inAppOnPublish' as const, label: 'Пост опубликован' },
                  { key: 'inAppOnFailure' as const, label: 'Ошибка публикации' },
                ].map((item) => (
                  <label key={item.key} className="flex items-center gap-3 cursor-pointer group">
                    <Toggle enabled={!!settings?.[item.key]} onClick={() => toggle(item.key)} />
                    <span className="text-sm text-white/60 group-hover:text-white/80 transition-colors">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="border-t border-white/5" />

            {/* Digest */}
            <div>
              <SectionHeader icon="📰" title="Дайджест" />
              <label className="flex items-center gap-3 cursor-pointer mb-5">
                <Toggle enabled={!!settings?.digestEnabled} onClick={() => toggle('digestEnabled')} />
                <span className="text-sm text-white/60">Включить еженедельный дайджест</span>
              </label>
              {settings?.digestEnabled && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium text-white/40 mb-1.5">День недели</label>
                    <select
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white/80 focus:outline-none focus:border-[#d4ff3a]/40 focus:ring-1 focus:ring-[#d4ff3a]/20 transition-colors appearance-none cursor-pointer"
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
                    <label className="block text-xs font-medium text-white/40 mb-1.5">Час</label>
                    <select
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white/80 focus:outline-none focus:border-[#d4ff3a]/40 focus:ring-1 focus:ring-[#d4ff3a]/20 transition-colors appearance-none cursor-pointer"
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
        </div>

        <Modal open={showPostpinConfig} onClose={() => setShowPostpinConfig(false)}>
          <div className="bg-white/[0.02] backdrop-blur-xl border border-white/5 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">PostPin Email</h3>
            <div>
              <label className="block text-xs font-medium text-white/40 mb-1.5">Email</label>
              <input
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white/80 placeholder-white/20 focus:outline-none focus:border-[#d4ff3a]/40 focus:ring-1 focus:ring-[#d4ff3a]/20 transition-colors"
                value={postpinEmail}
                onChange={(e) => setPostpinEmail(e.target.value)}
                placeholder="your@email.com"
              />
              <p className="text-[10px] text-white/20 mt-1">Email от аккаунта PostPin</p>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleSavePostpin}
                disabled={postpinSaving}
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#d4ff3a] text-[#0a0b0d] text-sm font-semibold hover:bg-[#d4ff3a]/90 active:scale-[0.98] transition-all disabled:opacity-40"
              >
                {postpinSaving ? 'Сохранение...' : 'Сохранить'}
              </button>
              <button
                onClick={() => setShowPostpinConfig(false)}
                className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/5 text-sm text-white/50 hover:text-white/70 hover:bg-white/10 transition-all"
              >
                Закрыть
              </button>
            </div>
          </div>
        </Modal>
      </main>
    </div>
  );
}
