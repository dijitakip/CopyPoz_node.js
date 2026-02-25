'use client';

import { useEffect, useState } from 'react';

export default function MasterPage() {
  const [masterState, setMasterState] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMasterState = async () => {
      try {
        const token = localStorage.getItem('master_token') || 'master-local-123';
        const res = await fetch('/api/master/state', {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          setMasterState(data);
        }
      } catch (err) {
        console.error('Failed to fetch master state:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMasterState();
    const interval = setInterval(fetchMasterState, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Master EA Yönetimi</h1>
        <p className="text-gray-600 mt-1">Master EA durumunu izleyin ve kontrol edin</p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <p className="text-gray-600 text-sm font-medium">Master Durumu</p>
          <p className="text-3xl font-bold text-gray-800 mt-2">
            {masterState?.total_positions > 0 ? 'Aktif' : 'Idle'}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <p className="text-gray-600 text-sm font-medium">Açık Pozisyonlar</p>
          <p className="text-3xl font-bold text-gray-800 mt-2">{masterState?.total_positions || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
          <p className="text-gray-600 text-sm font-medium">Son Güncelleme</p>
          <p className="text-sm text-gray-600 mt-2">
            {masterState?.updated_at
              ? new Date(masterState.updated_at).toLocaleString('tr-TR')
              : 'Henüz güncellenmedi'}
          </p>
        </div>
      </div>

      {/* Master Controls */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Master Kontrolleri</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="p-4 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition font-medium">
            ⏸ Durdur
          </button>
          <button className="p-4 bg-green-500 hover:bg-green-600 text-white rounded-lg transition font-medium">
            ▶ Devam Et
          </button>
          <button className="p-4 bg-red-500 hover:bg-red-600 text-white rounded-lg transition font-medium">
            🔴 Tümünü Kapat
          </button>
          <button className="p-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition font-medium">
            🔄 Yenile
          </button>
        </div>
      </div>

      {/* Positions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Açık Pozisyonlar</h2>
        {masterState?.positions && masterState.positions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Sembol</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Tip</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Lot</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Açılış Fiyatı</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Kar/Zarar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {masterState.positions.map((pos: any, idx: number) => (
                  <tr key={idx} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm font-medium text-gray-800">{pos.symbol}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        pos.type === 'BUY'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {pos.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{pos.volume}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{pos.open_price}</td>
                    <td className="px-6 py-4 text-sm font-medium">
                      <span className={pos.profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                        ${pos.profit?.toFixed(2) || '0.00'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8">Açık pozisyon yok</div>
        )}
      </div>
    </div>
  );
}
