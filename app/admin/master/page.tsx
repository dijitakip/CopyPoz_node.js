'use client';

import { useEffect, useState } from 'react';

interface Position {
  ticket: number;
  symbol: string;
  type: string;
  volume: number;
  price: number;
  sl: number;
  tp: number;
  profit: number;
}

interface MasterState {
  total_positions: number;
  positions: Position[];
  updated_at: string;
}

export default function MasterPage() {
  const [state, setState] = useState<MasterState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMasterState = async () => {
      try {
        const token = localStorage.getItem('master_token') || process.env.NEXT_PUBLIC_MASTER_TOKEN;
        const res = await fetch('/api/master/positions', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error('Failed to fetch master state');
        }

        const data = await res.json();
        setState(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchMasterState();
    const interval = setInterval(fetchMasterState, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="container"><p>Yükleniyor...</p></div>;
  if (error) return <div className="container"><p className="text-red-600">Hata: {error}</p></div>;

  return (
    <main className="container">
      <div className="card">
        <h1>Master Pozisyonları</h1>
        
        <div className="grid grid-cols-3 gap-4 mt-4 mb-6">
          <div className="bg-blue-50 p-4 rounded">
            <p className="text-sm text-gray-600">Toplam Pozisyon</p>
            <p className="text-2xl font-bold">{state?.total_positions || 0}</p>
          </div>
          <div className="bg-green-50 p-4 rounded">
            <p className="text-sm text-gray-600">Son Güncelleme</p>
            <p className="text-sm font-mono">
              {state?.updated_at ? new Date(state.updated_at).toLocaleString('tr-TR') : '-'}
            </p>
          </div>
          <div className="bg-purple-50 p-4 rounded">
            <p className="text-sm text-gray-600">Durum</p>
            <p className="text-lg font-bold text-green-600">Aktif</p>
          </div>
        </div>

        {state?.positions && state.positions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th className="px-6 py-3">Ticket</th>
                  <th className="px-6 py-3">Sembol</th>
                  <th className="px-6 py-3">Tip</th>
                  <th className="px-6 py-3">Hacim</th>
                  <th className="px-6 py-3">Fiyat</th>
                  <th className="px-6 py-3">SL</th>
                  <th className="px-6 py-3">TP</th>
                  <th className="px-6 py-3">Kar/Zarar</th>
                </tr>
              </thead>
              <tbody>
                {state.positions.map((pos) => (
                  <tr key={pos.ticket} className="bg-white border-b hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">{pos.ticket}</td>
                    <td className="px-6 py-4">{pos.symbol}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        pos.type === 'BUY' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {pos.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">{pos.volume}</td>
                    <td className="px-6 py-4">{pos.price.toFixed(5)}</td>
                    <td className="px-6 py-4">{pos.sl.toFixed(5)}</td>
                    <td className="px-6 py-4">{pos.tp.toFixed(5)}</td>
                    <td className="px-6 py-4">
                      <span className={pos.profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                        ${pos.profit.toFixed(2)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 mt-4">Açık pozisyon yok</p>
        )}
      </div>
    </main>
  );
}
