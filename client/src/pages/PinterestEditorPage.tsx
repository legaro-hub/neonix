import { useState, useEffect, type FormEvent } from 'react';
import { Sidebar } from '../components/Sidebar';
import { api, HttpError } from '../lib/api';
import type { SocialAccount } from '../lib/types';

export function PinterestEditorPage() {
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [boards, setBoards] = useState<any[]>([]);
  const [loadingBoards, setLoadingBoards] = useState(false);
  const [selectedBoard, setSelectedBoard] = useState<string | null>(null);

  // Pin creation
  const [pinTitle, setPinTitle] = useState('');
  const [pinDescription, setPinDescription] = useState('');
  const [pinLink, setPinLink] = useState('');
  const [pinAltText, setPinAltText] = useState('');
  const [pinImageUrl, setPinImageUrl] = useState('');
  const [creating, setCreating] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  // Bulk upload
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkPins, setBulkPins] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState<any[]>([]);

  // Connect modal
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [cookies, setCookies] = useState('');
  const [proxy, setProxy] = useState('');
  const [connectUsername, setConnectUsername] = useState('');
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    setLoading(true);
    try {
      const ch = await api.getChannels();
      setAccounts(ch.filter((c) => c.platform === 'pinterest' && c.status === 'active'));
    } catch {}
    setLoading(false);
  };

  const loadBoards = async (accountId: string) => {
    setSelectedAccount(accountId);
    setLoadingBoards(true);
    try {
      const data = await api.pinterestBoards(accountId);
      setBoards(data.boards || data || []);
    } catch (err) {
      alert(err instanceof HttpError ? err.message : 'Ошибка загрузки досок');
    }
    setLoadingBoards(false);
  };

  const handleCreatePin = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedAccount || !selectedBoard || !pinImageUrl) {
      alert('Выберите аккаунт, доску и укажите URL изображения');
      return;
    }
    setCreating(true);
    try {
      const data = await api.pinterestCreatePin(selectedAccount, {
        board_id: selectedBoard,
        title: pinTitle,
        description: pinDescription,
        link: pinLink,
        alt_text: pinAltText,
        image_url: pinImageUrl,
      });
      setResult(`Пин создан: ${data.id || 'успешно'}`);
      setPinTitle('');
      setPinDescription('');
      setPinLink('');
      setPinAltText('');
      setPinImageUrl('');
    } catch (err) {
      alert(err instanceof HttpError ? err.message : 'Ошибка создания пина');
    }
    setCreating(false);
  };

  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBulkFile(file);

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = reader.result as string;
        const lines = text.split('\n').filter((l) => l.trim());
        if (lines.length < 2) return;

        const headers = lines[0].split('\t').map((h) => h.trim());
        const pins: any[] = [];

        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split('\t');
          const pin: Record<string, string> = {};
          headers.forEach((h, idx) => { pin[h] = (values[idx] || '').trim(); });
          if (pin.Title || pin.Description) pins.push(pin);
        }
        setBulkPins(pins);
      } catch {}
    };
    reader.readAsText(file);
  };

  const handleBulkSubmit = async () => {
    if (!selectedAccount || !selectedBoard || bulkPins.length === 0) return;
    setUploading(true);
    setUploadResults([]);
    const results: any[] = [];

    for (let i = 0; i < bulkPins.length; i++) {
      const pin = bulkPins[i];
      try {
        const data = await api.pinterestCreatePin(selectedAccount, {
          board_id: selectedBoard,
          title: pin.Title || '',
          description: pin.Description || '',
          link: pin.Link || '',
          alt_text: pin.AltText || '',
          image_url: pin.ImageURL || '',
        });
        results.push({ index: i + 1, success: true, id: data.id });
      } catch (err: any) {
        results.push({ index: i + 1, success: false, error: err.message });
      }
      // Rate limit: 1 pin per 500ms
      if (i < bulkPins.length - 1) await new Promise((r) => setTimeout(r, 500));
    }
    setUploadResults(results);
    setUploading(false);
  };

  const handleConnect = async (e: FormEvent) => {
    e.preventDefault();
    if (!cookies.trim()) { alert('Вставьте cookies'); return; }
    setConnecting(true);
    try {
      const parsed = JSON.parse(cookies);
      await api.connectPostpin(parsed, proxy, connectUsername);
      await loadAccounts();
      setShowConnectModal(false);
      setCookies('');
      setProxy('');
      setConnectUsername('');
    } catch (err) {
      alert(err instanceof HttpError ? err.message : 'Ошибка подключения');
    }
    setConnecting(false);
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-6 pb-20 lg:pb-10 lg:p-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Pinterest</h1>
            <p className="text-xs text-graphite-500">Управление досками и пинами</p>
          </div>
          <button onClick={() => setShowConnectModal(true)} className="btn-primary text-sm">+ Аккаунт</button>
        </div>

        {loading ? (
          <div className="card p-8 text-center text-graphite-400">Загрузка...</div>
        ) : accounts.length === 0 ? (
          <div className="card p-10 text-center">
            <div className="text-3xl mb-3">📌</div>
            <h2 className="text-lg font-semibold text-white mb-2">Нет Pinterest аккаунтов</h2>
            <p className="text-sm text-graphite-400 mb-4">Подключите аккаунт для создания пинов</p>
            <button onClick={() => setShowConnectModal(true)} className="btn-primary">Подключить</button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Accounts */}
            <div>
              <h3 className="text-xs text-graphite-500 uppercase tracking-wider font-medium mb-2">Аккаунты</h3>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {accounts.map((acc) => (
                  <button key={acc.id} onClick={() => loadBoards(acc.id)}
                    className={`card p-3 text-left transition ${selectedAccount === acc.id ? 'border-red-400/40 bg-red-400/5' : ''}`}>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-red-400 bg-red-400/10 rounded px-1.5 py-0.5">PI</span>
                      <span className="text-sm font-medium text-white truncate">{acc.title}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Boards */}
            {selectedAccount && (
              <div>
                <h3 className="text-xs text-graphite-500 uppercase tracking-wider font-medium mb-2">Доски</h3>
                {loadingBoards ? (
                  <div className="card p-4 text-center text-graphite-400 text-sm">Загрузка досок...</div>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {boards.map((b: any) => (
                      <button key={b.id} onClick={() => setSelectedBoard(b.id)}
                        className={`card p-3 text-left transition ${selectedBoard === b.id ? 'border-lime/40 bg-lime/5' : ''}`}>
                        <div className="text-sm font-medium text-white truncate">{b.name}</div>
                        <div className="text-[11px] text-graphite-500">{b.pin_count ?? 0} пинов</div>
                      </button>
                    ))}
                    {boards.length === 0 && (
                      <div className="card p-4 text-center text-graphite-400 text-sm">Нет досок</div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Create Pin */}
            {selectedAccount && selectedBoard && (
              <div className="card p-5">
                <h3 className="text-sm font-semibold text-white mb-3">Создать пин</h3>
                {result && <div className="mb-3 rounded-lg bg-lime/10 border border-lime/30 px-3 py-2 text-xs text-lime">{result}</div>}
                <form onSubmit={handleCreatePin} className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="label">URL изображения *</label>
                      <input className="input text-xs py-2" value={pinImageUrl} onChange={(e) => setPinImageUrl(e.target.value)} placeholder="https://example.com/image.jpg" />
                    </div>
                    <div>
                      <label className="label">Название</label>
                      <input className="input text-xs py-2" value={pinTitle} onChange={(e) => setPinTitle(e.target.value.slice(0, 100))} placeholder="Название пина" />
                    </div>
                  </div>
                  <div>
                    <label className="label">Описание</label>
                    <textarea className="input text-xs py-2 min-h-[60px] resize-none" value={pinDescription} onChange={(e) => setPinDescription(e.target.value.slice(0, 800))} placeholder="Описание пина" />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="label">Ссылка</label>
                      <input className="input text-xs py-2" value={pinLink} onChange={(e) => setPinLink(e.target.value)} placeholder="https://..." />
                    </div>
                    <div>
                      <label className="label">Alt текст</label>
                      <input className="input text-xs py-2" value={pinAltText} onChange={(e) => setPinAltText(e.target.value.slice(0, 300))} placeholder="Описание для доступности" />
                    </div>
                  </div>
                  <button type="submit" disabled={creating} className="btn-primary text-sm">{creating ? 'Создание...' : 'Создать пин'}</button>
                </form>
              </div>
            )}

            {/* Bulk Upload */}
            {selectedAccount && selectedBoard && (
              <div className="card p-5">
                <h3 className="text-sm font-semibold text-white mb-3">Массовая загрузка</h3>
                <p className="text-xs text-graphite-500 mb-3">TSV файл: Title, Description, ImageURL, Link, AltText</p>
                <div className="flex items-center gap-3 mb-3">
                  <label className="btn-ghost text-xs cursor-pointer">
                    📤 Выбрать файл
                    <input type="file" accept=".tsv,.csv,.txt" className="hidden" onChange={handleBulkUpload} />
                  </label>
                  {bulkFile && <span className="text-xs text-graphite-400">{bulkFile.name} ({bulkPins.length} пинов)</span>}
                </div>
                {bulkPins.length > 0 && (
                  <>
                    <div className="text-xs text-graphite-400 mb-2">Превью: {bulkPins.slice(0, 3).map((p: any) => p.Title || p.title || 'Без названия').join(', ')}{bulkPins.length > 3 ? `... +${bulkPins.length - 3}` : ''}</div>
                    <button onClick={handleBulkSubmit} disabled={uploading} className="btn-primary text-sm">
                      {uploading ? 'Загрузка...' : `Загрузить ${bulkPins.length} пинов`}
                    </button>
                  </>
                )}
                {uploadResults.length > 0 && (
                  <div className="mt-3 text-xs">
                    <span className="text-lime">{uploadResults.filter((r) => r.success).length} успешно</span>
                    <span className="text-graphite-500 mx-1">·</span>
                    <span className="text-red-400">{uploadResults.filter((r) => !r.success).length} ошибок</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Connect Modal */}
        {showConnectModal && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-black/50" onClick={() => setShowConnectModal(false)}>
            <div className="card w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-bold text-white mb-4">Подключить Pinterest</h3>
              <form onSubmit={handleConnect} className="space-y-3">
                <div>
                  <label className="label">Cookies Pinterest</label>
                  <textarea className="input text-xs py-2 min-h-[80px] resize-none font-mono" value={cookies} onChange={(e) => setCookies(e.target.value)} placeholder='[{"name":"_auth","value":"...","domain":".pinterest.com"}]' />
                  <p className="text-[10px] text-graphite-500 mt-1">Извлеките из браузера через расширение «Cookie Editor» или DevTools</p>
                </div>
                <div>
                  <label className="label">Username</label>
                  <input className="input text-xs py-2" value={connectUsername} onChange={(e) => setConnectUsername(e.target.value)} placeholder="pinterest_username" />
                </div>
                <div>
                  <label className="label">Proxy (необязательно)</label>
                  <input className="input text-xs py-2" value={proxy} onChange={(e) => setProxy(e.target.value)} placeholder="http://user:pass@host:port" />
                </div>
                <div className="flex gap-2">
                  <button type="submit" disabled={connecting} className="btn-primary text-sm flex-1">{connecting ? 'Подключение...' : 'Подключить'}</button>
                  <button type="button" onClick={() => setShowConnectModal(false)} className="btn-ghost text-sm">Закрыть</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
