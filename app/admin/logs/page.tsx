'use client';

import { useEffect, useState } from 'react';

interface Log {
  id: number;
  action: string;
  details?: string;
  level: string;
  created_at: string;
}

export default function LogsPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  const fetchLogs = async () => {
    try {
      const token = localStorage.getItem('master_token') || 'master-local-123';
      const url = filter
        ? `/api/logs?level=${filter}`
        : '/api/logs';
      
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filter]);

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'ERROR':
        return 'bg-red-100 text-red-800';
      case 'WARNING':
        return 'bg-yellow-100 text-yellow-800';
      case 'INFO':
        return 'bg-blue-100 text-blue-800';
      case 'DEBUG':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Sistem Logları</h1>
        <p className="text-gray-600 mt-1">Sistem aktivitelerini izleyin</p>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter('')}
          className={`px-4 py-2 rounded-lg transition ${
            filter === ''
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          Tümü
        </button>
        <button
          onClick={() => setFilter('INFO')}
          className={`px-4 py-2 rounded-lg transition ${
            filter === 'INFO'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          Info
        </button>
        <button
          onClick={() => setFilter('WARNING')}
          className={`px-4 py-2 rounded-lg transition ${
            filter === 'WARNING'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          Uyarı
        </button>
        <button
          onClick={() => setFilter('ERROR')}
          className={`px-4 py-2 rounded-lg transition ${
            filter === 'ERROR'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          Hata
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-6 text-center text-gray-500">Yükleniyor...</div>
        ) : logs.length === 0 ? (
          <div className="p-6 text-center text-gray-500">Log bulunamadı</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Seviye</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">İşlem</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Detaylar</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Zaman</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getLevelColor(log.level)}`}>
                        {log.level}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-800">{log.action}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{log.details || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(log.created_at).toLocaleString('tr-TR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
