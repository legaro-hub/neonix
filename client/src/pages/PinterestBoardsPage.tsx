import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api, HttpError } from '../lib/api';

export function PinterestBoardsPage() {
  const [searchParams] = useSearchParams();
  const linked = searchParams.get('pinterest') === 'linked';

  const [boards, setBoards] = useState<Array<{ id: string; name: string; url: string; pinCount: number }>>([]);
  const [selectedBoard, setSelectedBoard] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pinterestAccountId, setPinterestAccountId] = useState<string | null>(null);

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      const accounts = await api.getChannels();
      const pa = accounts.find((a) => a.platform === 'pinterest');
      if (pa) {
        setPinterestAccountId(pa.id);
        await loadBoards(pa.id);
      }
    } catch {
      setPinterestAccountId(null);
    } finally {
      setLoading(false);
    }
  };

  const loadBoards = async (accountId: string) => {
    try {
      const data = await api.pinterestBoards(accountId);
      setBoards(data);
    } catch (err) {
      if (err instanceof HttpError) {
        setError(err.message);
      }
    }
  };

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const { url } = await api.pinterestAuthUrl();
      window.location.href = url;
    } catch (err) {
      if (err instanceof HttpError) {
        setError(err.message);
      }
      setConnecting(false);
    }
  };

  const handleSelectBoard = async (boardId: string) => {
    if (!pinterestAccountId) return;
    setSelectedBoard(boardId);
    try {
      await api.pinterestSelectBoard(pinterestAccountId, boardId);
    } catch (err) {
      if (err instanceof HttpError) {
        setError(err.message);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-graphite-400">Загрузка...</div>
      </div>
    );
  }

  if (!pinterestAccountId) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4">
        <h1 className="text-2xl font-bold text-white mb-4">Pinterest</h1>
        <p className="text-graphite-400 mb-6">
          Подключите Pinterest, чтобы публиковать пины автоматически.
        </p>

        {error && (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300 mb-4">
            {error}
          </div>
        )}

        {linked && (
          <div className="rounded-xl border border-lime/20 bg-lime/5 px-4 py-3 text-sm text-lime mb-4">
            Pinterest успешно подключён! Теперь выберите доску.
          </div>
        )}

        <button
          onClick={handleConnect}
          disabled={connecting}
          className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors disabled:opacity-50"
        >
          {connecting ? 'Подключение...' : 'Подключить Pinterest'}
        </button>

        <Link to="/app/channels" className="block mt-4 text-sm text-graphite-400 hover:text-white">
          ← Назад к каналам
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto py-12 px-4">
      <h1 className="text-2xl font-bold text-white mb-2">Pinterest — Доски</h1>
      <p className="text-graphite-400 mb-6">
        Выберите доску, на которую будут публиковаться пины.
      </p>

      {error && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300 mb-4">
          {error}
        </div>
      )}

      {boards.length === 0 ? (
        <div className="text-graphite-400 py-8 text-center">
          Нет досок. Создайте доску в Pinterest и обновите страницу.
        </div>
      ) : (
        <div className="space-y-2">
          {boards.map((board) => (
            <button
              key={board.id}
              onClick={() => handleSelectBoard(board.id)}
              className={`w-full text-left p-4 rounded-xl border transition-colors ${
                selectedBoard === board.id
                  ? 'border-lime bg-lime/10 text-white'
                  : 'border-graphite-700 bg-graphite-900 text-graphite-300 hover:border-graphite-500'
              }`}
            >
              <div className="font-semibold">{board.name}</div>
              <div className="text-sm text-graphite-400 mt-1">
                {board.pinCount} пинов
              </div>
            </button>
          ))}
        </div>
      )}

      {selectedBoard && (
        <div className="mt-4 rounded-xl border border-lime/20 bg-lime/5 px-4 py-3 text-sm text-lime">
          Доска выбрана! Теперь вы можете создавать посты для публикации в Pinterest.
        </div>
      )}

      <Link to="/app/channels" className="block mt-6 text-sm text-graphite-400 hover:text-white">
        ← Назад к каналам
      </Link>
    </div>
  );
}
