'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

interface SystemLog {
  id: number;
  action: string;
  details: string | null;
  ip_address: string | null;
  user_id: number | null;
  level: string;
  created_at: string;
  user?: {
    username: string;
    email: string;
  } | null;
}

export default function SystemLogsPage() {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  
  const [filterLevel, setFilterLevel] = useState('ALL');
  const [filterAction, setFilterAction] = useState('');

  useEffect(() => {
    fetchLogs();
  }, [filterLevel, filterAction]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      
      let url = '/api/logs';
      const params = new URLSearchParams();
      if (filterLevel !== 'ALL') params.append('level', filterLevel);
      if (filterAction) params.append('action', filterAction);
      
      const res = await fetch(`${url}?${params.toString()}`);

      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs);
      } else {
        setError('Loglar alınamadı');
      }
    } catch (err) {
      console.error('Failed to fetch logs:', err);
      setError('Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Sistem Logları</h1>
          <p className="text-gray-600 mt-1">Sistem eylemlerini ve hataları izleyin</p>
        </div>
        <button 
          onClick={fetchLogs}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition font-medium shadow-sm"
        >
          Yenile
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 flex flex-wrap gap-4 items-end">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-500 uppercase px-1">Seviye</label>
          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value)}
            className="w-40 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition bg-white text-sm"
          >
            <option value="ALL">Tümü</option>
            <option value="INFO">Bilgi (INFO)</option>
            <option value="WARNING">Uyarı (WARNING)</option>
            <option value="ERROR">Hata (ERROR)</option>
          </select>
        </div>
        <div className="space-y-1 flex-1 min-w-[200px]">
          <label className="text-xs font-semibold text-gray-500 uppercase px-1">İşlem Ara</label>
          <input
            type="text"
            placeholder="İşlem adı yazın..."
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition text-sm"
          />
        </div>
      </div>

      {error && <div className="bg-red-100 text-red-700 p-4 rounded-lg border border-red-200">{error}</div>}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 w-10"></th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-700">Zaman</th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-700">İşlem</th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-700">Kullanıcı</th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-700">Seviye</th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-700">Özet</th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-700">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-500 italic">Yükleniyor...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-500 italic">Log bulunamadı.</td></tr>
              ) : (
                logs.map((log) => (
                  <React.Fragment key={log.id}>
                    <tr 
                      className={`hover:bg-blue-50/30 transition cursor-pointer ${expandedId === log.id ? 'bg-blue-50/50' : ''}`}
                      onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                    >
                      <td className="px-4 py-3 text-center">
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          className={`h-4 w-4 text-gray-400 transition-transform ${expandedId === log.id ? 'rotate-90' : ''}`} 
                          fill="none" viewBox="0 0 24 24" stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">
                        {new Date(log.created_at).toLocaleString('tr-TR')}
                      </td>
                      <td className="px-4 py-3 font-semibold text-blue-700">{log.action}</td>
                      <td className="px-4 py-3">
                        {log.user ? (
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-800">{log.user.username}</span>
                            <span className="text-[10px] text-gray-400">{log.user.email}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs italic">Sistem / Misafir</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.level === 'ERROR' ? 'bg-red-100 text-red-700' :
                          log.level === 'WARNING' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {log.level}
                        </span>
                      </td>
                      <td className="px-4 py-3 max-w-xs overflow-hidden">
                        <div className="truncate text-gray-600 text-xs">
                          {log.details}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-400 font-mono text-[10px]">{log.ip_address || '-'}</td>
                    </tr>
                    {expandedId === log.id && (
                      <tr className="bg-gray-50/80 animate-in slide-in-from-top-1 duration-200">
                        <td colSpan={7} className="px-8 py-4">
                          <div className="bg-white p-4 rounded border border-gray-200 shadow-inner">
                            <h4 className="text-xs font-bold text-gray-400 uppercase mb-3 border-b pb-1">İşlem Detayları</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-3">
                                <div>
                                  <label className="text-[10px] text-gray-400 uppercase font-bold block">İşlem:</label>
                                  <span className="text-sm font-semibold text-blue-700">{log.action}</span>
                                </div>
                                <div>
                                  <label className="text-[10px] text-gray-400 uppercase font-bold block">Kullanıcı:</label>
                                  <span className="text-sm text-gray-700">{log.user?.username || 'Sistem'} ({log.user?.email || 'N/A'})</span>
                                </div>
                                <div>
                                  <label className="text-[10px] text-gray-400 uppercase font-bold block">Zaman:</label>
                                  <span className="text-sm text-gray-700">{new Date(log.created_at).toLocaleString('tr-TR', { dateStyle: 'full', timeStyle: 'medium' })}</span>
                                </div>
                                <div>
                                  <label className="text-[10px] text-gray-400 uppercase font-bold block">IP Adresi:</label>
                                  <code className="text-xs bg-gray-100 px-1 rounded">{log.ip_address || 'Bilinmiyor'}</code>
                                </div>
                              </div>
                              <div>
                                <label className="text-[10px] text-gray-400 uppercase font-bold block mb-1">Ham Veri / Detay:</label>
                                <div className="bg-gray-900 text-green-400 p-3 rounded text-xs font-mono overflow-auto max-h-40 whitespace-pre-wrap">
                                  {log.details || 'Detay bilgisi bulunamadı.'}
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
