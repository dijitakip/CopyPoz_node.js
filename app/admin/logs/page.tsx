'use client';

import { useEffect, useState } from 'react';

interface SystemLog {
  id: number;
  action: string;
  details: string | null;
  ip_address: string | null;
  user_id: number | null;
  level: string;
  created_at: string;
}

export default function LogsPage() {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterLevel, setFilterLevel] = useState('');
  const [filterAction, setFilterAction] = useState('');

  const fetchLogs = async () => {
    try {
      const token = localStorage.getItem('master_token') || process.env.NEXT_PUBLIC_MASTER_TOKEN;
      const params = new URLSearchParams();
      if (filterLevel) params.append('level', filterLevel);
      if (filterAction) params.append('action', filterAction);

      const res = await fetch(`/api/logs?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error('Failed to fetch logs');
      const data = await res.json();
      setLogs(data.logs || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 10000);
    return () => clearInterval(interval);
  }, [filterLevel, filterAction]);

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'INFO':
        return 'bg-blue-100 text-blue-800';
      case 'WARNING':
        return 'bg-yellow-100 text-yellow-800';
      case 'ERROR':
        return 'bg-red-100 text-red-800';
      case 'DEBUG':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) return <div className="container"><p>Yükleniyor...</p></div>;

  return (
    <main className="container">
      <div className="card">
        <h1>Sistem Logları</h1>

        <div className="bg-gray-50 p-4 rounded mt-4 mb-6 grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-bold mb-2">Seviye Filtresi</label>
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">Tümü</option>
              <option value="INFO">Info</option>
              <option value="WARNING">Warning</option>
              <option value="ERROR">Error</option>
              <option value="DEBUG">Debug</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold mb-2">İşlem Filtresi</label>
            <input
              type="text"
              placeholder="İşlem adı"
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setFilterLevel('');
                setFilterAction('');
              }}
              className="w-full bg-gray-600 text-white rounded px-4 py-2 hover:bg-gray-700"
            >
              Filtreleri Temizle
            </button>
          </div>
        </div>

        {error && <p className="text-red-600 mb-4">Hata: {error}</p>}

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th className="px-6 py-3">Zaman</th>
                <th className="px-6 py-3">Seviye</th>
                <th className="px-6 py-3">İşlem</th>
                <th className="px-6 py-3">Detaylar</th>
                <th className="px-6 py-3">IP Adresi</th>
                <th className="px-6 py-3">User ID</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-6 py-4 text-xs">
                    {new Date(log.created_at).toLocaleString('tr-TR')}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${getLevelColor(log.level)}`}>
                      {log.level}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs">{log.action}</td>
                  <td className="px-6 py-4 text-xs max-w-xs truncate" title={log.details || ''}>
                    {log.details || '-'}
                  </td>
                  <td className="px-6 py-4 text-xs">{log.ip_address || '-'}</td>
                  <td className="px-6 py-4 text-xs">{log.user_id || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {logs.length === 0 && (
          <p className="text-gray-500 mt-4">Log yok</p>
        )}
      </div>
    </main>
  );
}
